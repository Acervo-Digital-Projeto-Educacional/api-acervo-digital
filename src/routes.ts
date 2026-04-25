// Importa o Router do Express — é ele quem permite criar e organizar as rotas da aplicação
// Request e Response são os tipos TypeScript que representam a requisição e a resposta HTTP
// O "type" antes de Request e Response indica que são importações apenas de tipo (não geram código JS)
import { Router, type Request, type Response } from "express";
import { Auth } from "./middleware/Auth.js";
import { Authorize } from "./middleware/Authorize.js";

// Importa os controllers — cada um é responsável por tratar as requisições de sua entidade
// É o controller quem recebe os dados da requisição, chama o model e devolve a resposta ao cliente
import AlunoController from "./controller/AlunoController.js";
import LivroController from "./controller/LivroController.js";
import EmprestimoController from "./controller/EmprestimoController.js";

// Cria uma instância do Router — é neste objeto que todas as rotas serão registradas
// Cada rota associa um método HTTP + caminho de URL a um método do controller
// O router é exportado e registrado no server.ts com server.use(router)
const router = Router();

// ==================== HEALTH CHECK ====================

// Rota GET na raiz "/" — usada para verificar se a API está no ar ("health check")
// Retorna uma mensagem de confirmação e o timestamp atual do servidor
// Útil para monitoramento: ferramentas de infraestrutura acessam essa rota para saber se o servidor está vivo
router.get('/', (req: Request, res: Response) => {
    res.status(200).json({ mensagem: "Aplicação online.", timestamp: new Date() });
});

// ==================== ENDPOINTS DE LOGIN ====================
// Rota pública — não exige autenticação
router.post('/api/login', Auth.validacaoUsuario);

// ==================== ENDPOINTS DE ALUNO ====================
// Convenção de acesso:
//   verifyToken  → autentica (quem é você?)
//   requireSelf  → leitura: admin livre; user filtrado pelo próprio id_aluno
//   requireAdmin → escrita: somente admin pode criar, editar ou remover

// Lista alunos: admin vê todos; user vê apenas si mesmo
router.get('/api/alunos',        Auth.verifyToken, Authorize.requireSelf,  AlunoController.todos);

// Busca aluno por ID: admin qualquer; user somente o próprio (validação extra no controller)
router.get('/api/alunos/:id',    Auth.verifyToken, Authorize.requireSelf,  AlunoController.aluno);

// Cadastra aluno: somente admin — cria também o usuário vinculado automaticamente
router.post('/api/alunos',       Auth.verifyToken, Authorize.requireAdmin, AlunoController.cadastrar);

// Remove aluno: somente admin
router.delete('/api/alunos/:id', Auth.verifyToken, Authorize.requireAdmin, AlunoController.remover);

// Atualiza aluno: admin atualiza qualquer um; user atualiza apenas o próprio
router.put('/api/alunos/:id',    Auth.verifyToken, Authorize.requireSelf,  AlunoController.atualizar);

// ==================== ENDPOINTS DE LIVRO ====================
// Livros são recursos de consulta pública (qualquer usuário autenticado pode listar/ver)
// Somente admin pode criar, editar ou remover livros do acervo

// Lista todos os livros: qualquer usuário autenticado
router.get('/api/livros',        Auth.verifyToken, LivroController.todos);

// Busca livro por ID: qualquer usuário autenticado
router.get('/api/livros/:id',    Auth.verifyToken, LivroController.livro);

// Cadastra livro: somente admin
router.post('/api/livros',       Auth.verifyToken, Authorize.requireAdmin, LivroController.cadastrar);

// Remove livro: somente admin
router.delete('/api/livros/:id', Auth.verifyToken, Authorize.requireAdmin, LivroController.remover);

// Atualiza livro: somente admin
router.put('/api/livros/:id',    Auth.verifyToken, Authorize.requireAdmin, LivroController.atualizar);

// ==================== ENDPOINTS DE EMPRÉSTIMO ====================
// Lista empréstimos: admin vê todos; user vê apenas os seus
router.get('/api/emprestimos',        Auth.verifyToken, Authorize.requireSelf,  EmprestimoController.todos);

// Busca empréstimo por ID: admin qualquer; user somente os seus (validação extra no controller)
router.get('/api/emprestimos/:id',    Auth.verifyToken, Authorize.requireSelf,  EmprestimoController.emprestimo);

// Cadastra empréstimo: somente admin
router.post('/api/emprestimos',       Auth.verifyToken, Authorize.requireAdmin, EmprestimoController.cadastrar);

// Remove empréstimo: somente admin
router.delete('/api/emprestimos/:id', Auth.verifyToken, Authorize.requireAdmin, EmprestimoController.remover);

// Atualiza empréstimo: somente admin
router.put('/api/emprestimos/:id',    Auth.verifyToken, Authorize.requireAdmin, EmprestimoController.atualizar);

// Exporta o router para ser registrado no server.ts via server.use(router)
// Exportação nomeada { router } permite importar com nome explícito: import { router } from "./routes.js"
export { router };