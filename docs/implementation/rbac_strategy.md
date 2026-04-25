# Estratégia: Controle de Acesso por Role (RBAC)

## Diagnóstico do Estado Atual

### O que já existe ✅
- A tabela `usuario` já tem coluna `role`
- O `generateToken` já embute `role` no payload JWT (`{ id, nome, email, role }`)
- A interface `JwtPayload` já declara `role: string`
- O `verifyToken` já extrai `id` do token e passa via `req.headers['userId']`

### O que está faltando ❌
- `verifyToken` não repassa a `role` para as rotas
- Não existe middleware de autorização (só de autenticação)
- Os controllers não filtram dados por usuário
- Não há vínculo explícito entre `usuario.id_usuario` e `aluno.id_aluno`

---

## Ponto Crítico: Relação usuario ↔ aluno

Antes de qualquer código, há uma decisão de modelagem fundamental:

> Um `usuario` com `role = 'user'` **é** o próprio `aluno` no sistema?

Se sim, precisa existir uma coluna `id_aluno` na tabela `usuario` (FK),  
ou o vínculo é feito pelo `email` (ambas as tabelas têm email).

### Recomendação: FK na tabela `usuario`

```sql
ALTER TABLE usuario ADD COLUMN id_aluno INT REFERENCES aluno(id_aluno);
```

Isso permite a pergunta direta: *"Qual aluno está logado?"*  
A linkagem por email funciona, mas é frágil (email pode mudar).

---

## Arquitetura da Solução

```
Requisição HTTP
      │
      ▼
┌─────────────┐
│ verifyToken │  → valida o JWT, extrai id + role → salva em res.locals
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  requireAdmin    │  → bloqueia se role ≠ 'admin'  (rotas exclusivas de admin)
│  ou              │
│  requireSelf     │  → permite admin livre; para 'user', injeta filtro de ID
└──────┬───────────┘
       │
       ▼
┌─────────────┐
│  Controller │  → lê res.locals.userRole e res.locals.userId para filtrar dados
└─────────────┘
```

---

## Plano de Implementação (passo a passo)

### Passo 1 — Estender o tipo `Request` do Express

Criar um arquivo de declaração de tipo para adicionar `userRole` e `userId`  
ao objeto `res.locals` de forma tipada.

**Arquivo:** `src/types/express.d.ts`

```typescript
declare namespace Express {
    interface Locals {
        userId: number;
        userRole: string;
        // ID do aluno vinculado ao usuário logado (null se for admin puro)
        idAluno: number | null;
    }
}
```

> **Por que `res.locals` e não `req.headers`?**  
> `req.headers` é para dados HTTP da requisição original (cliente → servidor).  
> `res.locals` é o lugar correto do Express para dados gerados por middlewares durante o ciclo de vida da requisição. É tipado, seguro e não polui os headers.

---

### Passo 2 — Atualizar `verifyToken` em `Auth.ts`

Após validar o token, além de `userId`, salvar também a `role`:

```typescript
// Trecho a adicionar/substituir no verifyToken:
const { exp, id, role } = decoded as JwtPayload;

req.headers['userId'] = String(id);   // mantém compatibilidade atual
res.locals.userId   = id;             // forma correta para middlewares
res.locals.userRole = role;

next();
```

---

### Passo 3 — Criar dois middlewares de autorização

**Arquivo:** `src/middleware/Authorize.ts`

```typescript
import { type Request, type Response, type NextFunction } from 'express';

export class Authorize {

    /**
     * Permite acesso apenas para administradores.
     * Usado em rotas como: cadastrar, remover, atualizar livros/alunos.
     */
    static requireAdmin(req: Request, res: Response, next: NextFunction) {
        if (res.locals.userRole !== 'admin') {
            return res.status(403).json({
                message: "Acesso negado. Apenas administradores podem realizar esta ação."
            });
        }
        next();
    }

    /**
     * Permite acesso irrestrito para admin.
     * Para 'user', injeta o id_aluno em res.locals para que o controller filtre os dados.
     * Usado em rotas de leitura: GET /api/alunos, GET /api/emprestimos, etc.
     */
    static requireSelf(req: Request, res: Response, next: NextFunction) {
        // Admin passa direto — sem restrições
        if (res.locals.userRole === 'admin') {
            res.locals.idAluno = null; // null = sem filtro
            return next();
        }

        // 'user' só pode ver os próprios dados
        // res.locals.idAluno será preenchido com o id_aluno vinculado ao usuário logado
        // Esse valor vem da query de login (validacaoUsuario) e é embebido no token
        const idAluno = res.locals.idAluno;
        if (!idAluno) {
            return res.status(403).json({
                message: "Usuário não vinculado a um aluno no sistema."
            });
        }
        next();
    }
}
```

---

### Passo 4 — Ajustar o token JWT para incluir `idAluno`

Em `Auth.ts`, na query de login, buscar também o `id_aluno` vinculado:

```typescript
// Query ajustada em validacaoUsuario:
const querySelectUser = `
    SELECT u.id_usuario, u.nome, u.email, u.role, u.id_aluno
    FROM usuario u
    WHERE u.email = $1 AND u.senha = $2;
`;

// No token, adicionar idAluno:
const tokenUsuario = Auth.generateToken(
    parseInt(usuario.id_usuario),
    usuario.nome,
    usuario.email,
    usuario.role,
    usuario.id_aluno ?? null   // null para admins que não são alunos
);
```

```typescript
// generateToken ajustado:
static generateToken(id: number, nome: string, email: string, role: string, idAluno: number | null) {
    return jwt.sign({ id, nome, email, role, idAluno }, SECRET, { expiresIn: '1h' });
}
```

```typescript
// JwtPayload ajustado:
interface JwtPayload {
    id: number;
    nome: string;
    email: string;
    role: string;
    idAluno: number | null;  // <-- novo campo
    exp: number;
}
```

E em `verifyToken`, extrair e salvar:

```typescript
const { exp, id, role, idAluno } = decoded as JwtPayload;
res.locals.userId   = id;
res.locals.userRole = role;
res.locals.idAluno  = idAluno;
```

---

### Passo 5 — Atualizar as rotas com os middlewares corretos

**Arquivo:** `src/routes.ts`

```typescript
// Padrão de uso:
// verifyToken        → autentica (quem é você?)
// requireAdmin       → autoriza somente admins
// requireSelf        → admin livre; user filtrado pelo próprio ID

// ===== ALUNOS =====
router.get('/api/alunos',       Auth.verifyToken, Authorize.requireSelf,  AlunoController.todos);
router.get('/api/alunos/:id',   Auth.verifyToken, Authorize.requireSelf,  AlunoController.aluno);
router.post('/api/alunos',      Auth.verifyToken, Authorize.requireAdmin, AlunoController.cadastrar);
router.delete('/api/alunos/:id',Auth.verifyToken, Authorize.requireAdmin, AlunoController.remover);
router.put('/api/alunos/:id',   Auth.verifyToken, Authorize.requireAdmin, AlunoController.atualizar);

// ===== LIVROS =====
// Livros: qualquer usuário autenticado pode listar/ver
// Somente admin pode criar, editar ou remover
router.get('/api/livros',       Auth.verifyToken,                         LivroController.todos);
router.get('/api/livros/:id',   Auth.verifyToken,                         LivroController.livro);
router.post('/api/livros',      Auth.verifyToken, Authorize.requireAdmin, LivroController.cadastrar);
router.delete('/api/livros/:id',Auth.verifyToken, Authorize.requireAdmin, LivroController.remover);
router.put('/api/livros/:id',   Auth.verifyToken, Authorize.requireAdmin, LivroController.atualizar);

// ===== EMPRÉSTIMOS =====
// user só vê seus próprios empréstimos
router.get('/api/emprestimos',        Auth.verifyToken, Authorize.requireSelf,  EmprestimoController.todos);
router.get('/api/emprestimos/:id',    Auth.verifyToken, Authorize.requireSelf,  EmprestimoController.emprestimo);
router.post('/api/emprestimos',       Auth.verifyToken, Authorize.requireAdmin, EmprestimoController.cadastrar);
router.delete('/api/emprestimos/:id', Auth.verifyToken, Authorize.requireAdmin, EmprestimoController.remover);
router.put('/api/emprestimos/:id',    Auth.verifyToken, Authorize.requireAdmin, EmprestimoController.atualizar);
```

---

### Passo 6 — Adaptar os controllers para filtrar por usuário

Nos controllers que usam `requireSelf`, o controller precisa ler `res.locals.idAluno`  
e passá-lo para o model:

#### `AlunoController.todos`
```typescript
static async todos(req: Request, res: Response) {
    const idAluno: number | null = res.locals.idAluno;

    // Se idAluno for null → admin → busca todos
    // Se idAluno for um número → user → busca só o aluno dele
    const listaDeAlunos = idAluno
        ? await Aluno.listarAluno(idAluno)   // retorna só o próprio aluno
        : await Aluno.listarAlunos();         // retorna todos (admin)

    // ... resto do tratamento
}
```

#### `AlunoController.aluno` (GET /api/alunos/:id)
```typescript
static async aluno(req: Request, res: Response) {
    const idAluno = parseInt(req.params.id);
    const idAlunoDaSession: number | null = res.locals.idAluno;

    // user tentando ver dados de outro aluno → 403
    if (idAlunoDaSession !== null && idAlunoDaSession !== idAluno) {
        return res.status(403).json({ mensagem: "Acesso negado. Você só pode visualizar seus próprios dados." });
    }

    // Admin ou próprio aluno → prossegue normalmente
    // ...
}
```

#### `EmprestimoController.todos`
```typescript
static async todos(req: Request, res: Response) {
    const idAluno: number | null = res.locals.idAluno;
    const listaDeEmprestimos = idAluno
        ? await Emprestimo.listarEmprestimosPorAluno(idAluno)  // método novo no model
        : await Emprestimo.listarEmprestimos();
    // ...
}
```

---

### Passo 7 — Adicionar método no Model `Emprestimo`

```typescript
// Novo método em Emprestimo.ts:
static async listarEmprestimosPorAluno(id_aluno: number): Promise<EmprestimoDTO[]> {
    const query = `
        SELECT e.id_emprestimo, e.id_aluno, e.id_livro,
               e.data_emprestimo, e.data_devolucao, e.status_emprestimo, e.status_emprestimo_registro,
               a.ra, a.nome, a.sobrenome, a.celular, a.email,
               l.titulo, l.autor, l.editora, l.isbn
        FROM Emprestimo e
        JOIN Aluno a ON e.id_aluno = a.id_aluno
        JOIN Livro l ON e.id_livro = l.id_livro
        WHERE e.status_emprestimo_registro = TRUE
          AND e.id_aluno = $1;
    `;
    const respostaBD = await database.query(query, [id_aluno]);
    return respostaBD.rows.map(Emprestimo.toDTO);
}
```

---

## Tabela de Permissões (resumo)

| Rota                    | admin | user                            |
|-------------------------|-------|---------------------------------|
| `GET /api/alunos`       | ✅ todos | ✅ só o próprio aluno          |
| `GET /api/alunos/:id`   | ✅ qualquer | ✅ só se for o próprio ID  |
| `POST /api/alunos`      | ✅    | ❌ 403                          |
| `PUT /api/alunos/:id`   | ✅    | ❌ 403                          |
| `DELETE /api/alunos/:id`| ✅    | ❌ 403                          |
| `GET /api/livros`       | ✅    | ✅ todos os livros              |
| `GET /api/livros/:id`   | ✅    | ✅ qualquer livro               |
| `POST /api/livros`      | ✅    | ❌ 403                          |
| `PUT /api/livros/:id`   | ✅    | ❌ 403                          |
| `DELETE /api/livros/:id`| ✅    | ❌ 403                          |
| `GET /api/emprestimos`  | ✅ todos | ✅ só os próprios empréstimos |
| `GET /api/emprestimos/:id`| ✅  | ✅ só se for o próprio          |
| `POST /api/emprestimos` | ✅    | ❌ 403                          |
| `PUT /api/emprestimos/:id`| ✅  | ❌ 403                          |
| `DELETE /api/emprestimos/:id`| ✅| ❌ 403                        |

---

## Ordem de execução sugerida

1. 🗄️ **Banco de dados** — adicionar coluna `id_aluno` na tabela `usuario`
2. 📄 **`src/types/express.d.ts`** — criar declaração de tipos
3. 🔐 **`src/middleware/Auth.ts`** — atualizar `JwtPayload`, `generateToken`, `verifyToken` e `validacaoUsuario`
4. 🛡️ **`src/middleware/Authorize.ts`** — criar o novo middleware
5. 🛣️ **`src/routes.ts`** — aplicar os middlewares nas rotas
6. 🎮 **Controllers** — adaptar `todos` e `aluno`/`emprestimo` para filtrar por `res.locals.idAluno`
7. 🗃️ **`Emprestimo.ts`** — adicionar `listarEmprestimosPorAluno`
