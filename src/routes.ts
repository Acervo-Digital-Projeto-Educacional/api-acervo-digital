// Importa o Router do Express — é ele quem permite criar e organizar as rotas da aplicação
// Request e Response são os tipos que representam a requisição e a resposta HTTP
import { Router, type Request, type Response } from "express";
// Importa o controller de Aluno — é ele quem possui os métodos chamados em cada rota
import AlunoController from "./controller/AlunoController.js";
// Importa o controller de Livro
import LivroController from "./controller/LivroController.js";
// Importa o controller de Emprestimo
import EmprestimoController from "./controller/EmprestimoController.js";

// Cria uma instância do Router — é neste objeto que todas as rotas serão registradas
// O router é depois exportado e conectado ao servidor principal (geralmente no app.ts ou server.ts)
const router = Router();

/**
 * Endpoint padrão
 */
// Rota GET na raiz "/" — serve para verificar se a API está no ar (chamada de "health check")
// Quando acessada, retorna uma mensagem simples confirmando que o servidor está funcionando
router.get('/', (req: Request, res: Response) => {
    return res
        .status(200) // Status HTTP 200 (OK)
        // Retorna um objeto estruturado em JSON com a data e hora atual do servidor
        // Isso ajuda a confirmar não só que está no ar, mas também quando foi acessado
        .json({ mensagem: "Aplicação online", timestamp: new Date() });
});

// ==================== ENDPOINTS DE ALUNO ====================
// Cada rota combina: MÉTODO HTTP + CAMINHO + MÉTODO DO CONTROLLER responsável por tratar a requisição

// GET /api/alunos — busca e retorna a lista completa de alunos ativos
// Chama o método AlunoController.todos quando essa rota é acessada
router.get('/api/alunos', AlunoController.todos);

// GET /api/alunos/:id — busca e retorna os dados de um aluno específico pelo ID
// O ":id" é um parâmetro dinâmico na URL — ex: /api/alunos/3 busca o aluno de ID 3
router.get('/api/alunos/:id', AlunoController.aluno);

// POST /api/alunos — cadastra um novo aluno no banco de dados
// Os dados do novo aluno chegam no corpo (body) da requisição, não na URL
router.post('/api/alunos', AlunoController.cadastrar);

// DELETE /api/alunos/:id — realiza a remoção lógica do aluno com o ID informado
// Ex: DELETE /api/alunos/3 desativa o aluno de ID 3 (não apaga do banco)
router.delete('/api/alunos/:id', AlunoController.remover);

// PUT /api/alunos/:id — atualiza os dados do aluno com o ID informado
// O ID vem pela URL e os novos dados vêm no corpo da requisição
router.put('/api/alunos/:id', AlunoController.atualizar);

// ==================== ENDPOINTS DE LIVRO ====================

// GET /api/livros — busca e retorna a lista completa de livros ativos
router.get('/api/livros', LivroController.todos);

// GET /api/livros/:id — busca e retorna os dados de um livro específico pelo ID
// Ex: /api/livros/5 retorna os dados do livro de ID 5
router.get('/api/livros/:id', LivroController.livro);

// POST /api/livros — cadastra um novo livro no banco de dados
// Os dados do novo livro chegam no corpo da requisição
router.post('/api/livros', LivroController.cadastrar);

// DELETE /api/livros/:id — realiza a remoção lógica do livro com o ID informado
// O model também desativa os empréstimos relacionados ao livro antes de desativá-lo
router.delete('/api/livros/:id', LivroController.remover);

// PUT /api/livros/:id — atualiza os dados do livro com o ID informado
router.put('/api/livros/:id', LivroController.atualizar);

// ==================== ENDPOINTS DE EMPRÉSTIMO ====================

// GET /api/emprestimos — busca e retorna a lista completa de empréstimos ativos
// Os dados já vêm com as informações do aluno e do livro embutidas (graças ao JOIN da query)
router.get('/api/emprestimos', EmprestimoController.todos);

// GET /api/emprestimos/:id — busca e retorna os dados de um empréstimo específico pelo ID
// Ex: /api/emprestimos/2 retorna o empréstimo de ID 2 com dados do aluno e do livro
router.get('/api/emprestimos/:id', EmprestimoController.emprestimo);

// POST /api/emprestimos — cadastra um novo empréstimo no banco de dados
// Os dados chegam no corpo da requisição com os IDs do aluno e do livro dentro de objetos aninhados
router.post('/api/emprestimos', EmprestimoController.cadastrar);

// DELETE /api/emprestimos/:id — realiza a remoção lógica do empréstimo com o ID informado
router.delete('/api/emprestimos/:id', EmprestimoController.remover);

// PUT /api/emprestimos/:id — atualiza os dados do empréstimo com o ID informado
router.put('/api/emprestimos/:id', EmprestimoController.atualizar);

// Exporta o router para que possa ser registrado no servidor principal da aplicação
// O uso de "export { router }" (exportação nomeada) ao invés de "export default" permite
// importar com um nome explícito: import { router } from "./routes.js"
export { router }