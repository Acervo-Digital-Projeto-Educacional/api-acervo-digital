// Importa o Router do Express — é ele quem permite criar e organizar as rotas da aplicação
// Request e Response são os tipos TypeScript que representam a requisição e a resposta HTTP
// O "type" antes de Request e Response indica que são importações apenas de tipo (não geram código JS)
import { Router, type Request, type Response } from "express";

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

// ==================== ENDPOINTS DE ALUNO ====================
// Padrão REST: cada operação usa um método HTTP diferente no mesmo recurso (/api/alunos)
// GET    → leitura       POST → criação
// PUT    → atualização   DELETE → remoção

// Lista todos os alunos ativos — o controller chama o model e retorna o array em JSON
router.get('/api/alunos', AlunoController.todos);

// Busca um aluno específico pelo ID informado na URL
// ":id" é um parâmetro dinâmico — ex: GET /api/alunos/3 busca o aluno de ID 3
// O valor é lido no controller via req.params.id
router.get('/api/alunos/:id', AlunoController.aluno);

// Cadastra um novo aluno — os dados chegam no corpo (body) da requisição em formato JSON
// O body é lido no controller via req.body
router.post('/api/alunos', AlunoController.cadastrar);

// Remove logicamente o aluno com o ID informado — não apaga do banco, apenas desativa (status = FALSE)
// Também desativa todos os empréstimos relacionados ao aluno
router.delete('/api/alunos/:id', AlunoController.remover);

// Atualiza os dados do aluno com o ID informado
// O ID vem pela URL (req.params.id) e os novos dados vêm no body (req.body)
router.put('/api/alunos/:id', AlunoController.atualizar);

// ==================== ENDPOINTS DE LIVRO ====================

// Lista todos os livros ativos
router.get('/api/livros', LivroController.todos);

// Busca um livro específico pelo ID informado na URL
// Ex: GET /api/livros/5 retorna os dados do livro de ID 5
router.get('/api/livros/:id', LivroController.livro);

// Cadastra um novo livro — os dados chegam no body da requisição
router.post('/api/livros', LivroController.cadastrar);

// Remove logicamente o livro com o ID informado
// Antes de desativar o livro, o model desativa todos os empréstimos relacionados a ele
router.delete('/api/livros/:id', LivroController.remover);

// Atualiza os dados do livro com o ID informado
router.put('/api/livros/:id', LivroController.atualizar);

// ==================== ENDPOINTS DE EMPRÉSTIMO ====================

// Lista todos os empréstimos ativos
// Os dados já vêm com as informações completas do aluno e do livro embutidas
// Isso é possível porque a query do model usa JOIN entre as tabelas Emprestimo, Aluno e Livro
router.get('/api/emprestimos', EmprestimoController.todos);

// Busca um empréstimo específico pelo ID informado na URL
// Ex: GET /api/emprestimos/2 retorna o empréstimo de ID 2 com os dados do aluno e do livro
router.get('/api/emprestimos/:id', EmprestimoController.emprestimo);

// Cadastra um novo empréstimo — os dados chegam no body com os objetos "aluno" e "livro" aninhados
// Ex: { aluno: { id_aluno: 1 }, livro: { id_livro: 3 }, data_emprestimo: "2024-01-15" }
router.post('/api/emprestimos', EmprestimoController.cadastrar);

// Remove logicamente o empréstimo com o ID informado (status_emprestimo_registro = FALSE)
router.delete('/api/emprestimos/:id', EmprestimoController.remover);

// Atualiza os dados do empréstimo com o ID informado
router.put('/api/emprestimos/:id', EmprestimoController.atualizar);

// Exporta o router para ser registrado no server.ts via server.use(router)
// Exportação nomeada { router } permite importar com nome explícito: import { router } from "./routes.js"
export { router };