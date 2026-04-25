// Importa a classe Emprestimo do model — é daqui que vêm os métodos de acesso ao banco de dados
import Emprestimo from "../model/Emprestimo.js";

// Importa os tipos Request e Response do Express — representam a requisição e a resposta HTTP
// "type" indica que é uma importação apenas de tipo (só existe em tempo de compilação, não gera código JS)
import { type Request, type Response } from "express";

// Importa o tipo EmprestimoDTO para tipar os dados recebidos do front-end no body das requisições
// O EmprestimoDTO possui objetos aninhados: "aluno" e "livro" dentro do empréstimo
import type EmprestimoDTO from "../dto/EmprestimoDTO.js";

// Define a classe EmprestimoController que HERDA da classe Emprestimo (extends)
// A herança permite que o controller acesse os métodos estáticos do model sem precisar importá-los separadamente
// A arquitetura MVC separa responsabilidades:
//   - Model (Emprestimo): cuida da comunicação com o banco de dados
//   - Controller (EmprestimoController): cuida do recebimento das requisições HTTP e envio das respostas
class EmprestimoController extends Emprestimo {

    /**
     * Lista todos os empréstimos ativos cadastrados no sistema.
     * Os dados já vêm com as informações completas do aluno e do livro embutidas (via JOIN no model).
     * Retorna 204 se não houver empréstimos cadastrados, 200 com a lista caso contrário.
     *
     * @param req Objeto de requisição HTTP (não utiliza parâmetros neste método).
     * @param res Objeto de resposta HTTP.
     * @returns 200 com array de EmprestimoDTO | 204 sem conteúdo | 500 em caso de erro interno.
     */
    static async todos(req: Request, res: Response) {
        try {
            // Lê o id do aluno vinculado ao usuário logado (null = admin sem filtro)
            const idAluno: number | null = res.locals.idAluno;

            // Se idAluno for null, o usuário é admin — busca todos os empréstimos ativos
            // Se idAluno tiver um valor, é um 'user' — busca apenas os próprios empréstimos
            const listaDeEmprestimos = idAluno !== null
                ? await Emprestimo.listarEmprestimosPorAluno(idAluno)  // filtrado pelo aluno
                : await Emprestimo.listarEmprestimos();                 // todos (admin)

            // Se o array estiver vazio, não há empréstimos cadastrados — retorna 204 (No Content)
            if (listaDeEmprestimos.length === 0) {
                res.status(204).send();
                return;
            }

            // Retorna a lista de empréstimos em formato JSON com status 200 (OK)
            res.status(200).json(listaDeEmprestimos);

        } catch (error) {
            console.error(`[EmprestimoController] Erro ao listar empréstimos:`, error);
            res.status(500).json({ mensagem: "Erro interno ao recuperar a lista de empréstimos." });
        }
    }

    /**
     * Busca e retorna os dados de um empréstimo específico pelo ID informado na URL.
     * Os dados retornados incluem as informações completas do aluno e do livro relacionados.
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL (ex: /api/emprestimos/2).
     * @param res Objeto de resposta HTTP.
     * @returns 200 com EmprestimoDTO | 400 se o ID for inválido | 404 se não encontrado | 500 em caso de erro interno.
     */
    static async emprestimo(req: Request, res: Response) {
        try {
            // Lê o parâmetro "id" da URL e converte de string para número inteiro
            const idEmprestimo = parseInt(req.params.id as string);

            if (isNaN(idEmprestimo) || idEmprestimo <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Chama o método do model para buscar o empréstimo específico
            const emprestimo = await Emprestimo.listarEmprestimo(idEmprestimo);

            // Controle de acesso: usuários com role 'user' só podem ver os próprios empréstimos
            // Verifica se o empréstimo buscado pertence ao aluno logado
            const idAlunoDaSessao: number | null = res.locals.idAluno;
            if (idAlunoDaSessao !== null && emprestimo.aluno.id_aluno !== idAlunoDaSessao) {
                return res.status(403).json({
                    mensagem: "Acesso negado. Você só pode visualizar seus próprios empréstimos."
                });
            }

            // Se chegou aqui, o empréstimo foi encontrado e o acesso é válido
            res.status(200).json(emprestimo);

        } catch (error: any) {
            console.error(`[EmprestimoController] Erro ao buscar empréstimo (id: ${req.params.id}):`, error);

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao recuperar o empréstimo." });
        }
    }

    /**
     * Cadastra um novo empréstimo no sistema com os dados recebidos no corpo da requisição.
     * Se a data de devolução não for informada, o model calcula automaticamente (data_emprestimo + 7 dias).
     * Valida campos obrigatórios antes de persistir no banco de dados.
     *
     * @param req Objeto de requisição HTTP. Espera no body um objeto com:
     *            aluno.id_aluno, livro.id_livro e data_emprestimo (obrigatórios),
     *            status_emprestimo e data_devolucao (opcionais).
     * @param res Objeto de resposta HTTP.
     * @returns 201 se cadastrado com sucesso | 400 se campos obrigatórios ausentes ou falha no cadastro | 500 em caso de erro interno.
     */
    static async cadastrar(req: Request, res: Response) {
        try {
            // Lê o corpo da requisição e tipifica como EmprestimoDTO
            // O front-end envia os dados do novo empréstimo em formato JSON no corpo da requisição
            const dadosRecebidos: EmprestimoDTO = req.body;

            // Valida se os campos obrigatórios foram enviados pelo front-end
            // O operador "?." (optional chaining) acessa a propriedade com segurança mesmo se o objeto pai for undefined
            // Ex: se dadosRecebidos.aluno for undefined, "dadosRecebidos.aluno?.id_aluno" retorna undefined em vez de lançar erro
            if (!dadosRecebidos.aluno?.id_aluno || !dadosRecebidos.livro?.id_livro || !dadosRecebidos.data_emprestimo) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: id_aluno, id_livro e data_emprestimo." });
                return;
            }

            // Cria um novo objeto Emprestimo com os dados recebidos
            // "new Date(...)" converte a string de data recebida do JSON em um objeto Date do JavaScript
            // Se data_devolucao não foi informada, passa undefined — o construtor calculará automaticamente (+7 dias)
            const emprestimo = new Emprestimo(
                dadosRecebidos.aluno.id_aluno,                                                    // ID do aluno
                dadosRecebidos.livro.id_livro,                                                    // ID do livro
                new Date(dadosRecebidos.data_emprestimo),                                         // Converte string para Date
                dadosRecebidos.status_emprestimo ?? "",                                           // Padrão: string vazia (construtor define "Em Andamento")
                dadosRecebidos.data_devolucao ? new Date(dadosRecebidos.data_devolucao) : undefined // undefined = calcular automaticamente
            );

            // Chama o método do model para persistir o novo empréstimo no banco de dados
            const result = await Emprestimo.cadastrarEmprestimo(emprestimo);

            // O model retorna true se o INSERT foi bem-sucedido, false caso contrário
            if (result) {
                // 201 Created — recurso criado com sucesso (semântica correta para POST)
                res.status(201).json({ mensagem: "Empréstimo cadastrado com sucesso." });
            } else {
                // 400 Bad Request — falha de negócio, não erro de servidor
                res.status(400).json({ mensagem: "Não foi possível cadastrar o empréstimo." });
            }

        } catch (error) {
            console.error(`[EmprestimoController] Erro ao cadastrar empréstimo:`, error);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar o empréstimo." });
        }
    }

    /**
     * Atualiza os dados de um empréstimo existente no sistema.
     * Valida o ID na URL e os campos obrigatórios no body antes de persistir no banco.
     * Se a data de devolução não for informada, usa a data atual como fallback.
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL e no body um objeto com:
     *            aluno.id_aluno, livro.id_livro e data_emprestimo (obrigatórios),
     *            status_emprestimo e data_devolucao (opcionais).
     * @param res Objeto de resposta HTTP.
     * @returns 200 se atualizado com sucesso | 400 se o ID ou campos forem inválidos | 404 se não encontrado | 500 em caso de erro interno.
     */
    static async atualizar(req: Request, res: Response) {
        try {
            // Lê e converte o ID da URL para número inteiro
            const idEmprestimo = parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo antes de qualquer operação
            if (isNaN(idEmprestimo) || idEmprestimo <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Lê os dados enviados pelo front-end no corpo da requisição
            const dadosRecebidos: EmprestimoDTO = req.body;

            // Valida campos obrigatórios — mesma lógica do método cadastrar
            // O "?." protege o acesso a propriedades de objetos que podem ser undefined
            if (!dadosRecebidos.aluno?.id_aluno || !dadosRecebidos.livro?.id_livro || !dadosRecebidos.data_emprestimo) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: id_aluno, id_livro e data_emprestimo." });
                return;
            }

            // Chama o método do model passando cada campo individualmente
            // Diferente do cadastrar, o atualizarEmprestimo recebe os dados separados (não um objeto Emprestimo)
            // Se data_devolucao não foi informada, usa new Date() (data/hora atual) como fallback
            const result = await Emprestimo.atualizarEmprestimo(
                idEmprestimo,                                                                         // ID do empréstimo (usado no WHERE da query)
                dadosRecebidos.aluno.id_aluno,                                                        // Novo ID do aluno
                dadosRecebidos.livro.id_livro,                                                        // Novo ID do livro
                new Date(dadosRecebidos.data_emprestimo),                                             // Nova data de empréstimo
                dadosRecebidos.data_devolucao ? new Date(dadosRecebidos.data_devolucao) : new Date(), // Nova data de devolução (ou hoje)
                dadosRecebidos.status_emprestimo ?? ""                                                // Novo status (padrão: string vazia)
            );

            // O model retorna true se o UPDATE afetou alguma linha, false se o empréstimo não existia
            if (result) {
                res.status(200).json({ mensagem: "Empréstimo atualizado com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Empréstimo não encontrado." });
            }

        } catch (error: any) {
            console.error(`[EmprestimoController] Erro ao atualizar empréstimo (id: ${req.params.id}):`, error);

            // O model lança "não encontrado" quando o ID não existe — diferencia do erro de banco
            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao atualizar o empréstimo." });
        }
    }

    /**
     * Remove logicamente um empréstimo do sistema pelo ID informado na URL.
     * O registro não é apagado do banco — apenas desativado (status_emprestimo_registro = FALSE).
     * Isso preserva o histórico de empréstimos para fins de auditoria e relatórios.
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL (ex: /api/emprestimos/2).
     * @param res Objeto de resposta HTTP.
     * @returns 200 se removido com sucesso | 400 se o ID for inválido | 404 se não encontrado | 500 em caso de erro interno.
     */
    static async remover(req: Request, res: Response) {
        try {
            // Lê e converte o ID da URL para número inteiro
            const idEmprestimo = parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo antes de consultar o banco
            if (isNaN(idEmprestimo) || idEmprestimo <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Chama o método do model que realiza a remoção lógica do empréstimo no banco
            const resultado = await Emprestimo.removerEmprestimo(idEmprestimo);

            // O model retorna true se o empréstimo foi desativado, false se não foi encontrado
            if (resultado) {
                res.status(200).json({ mensagem: "Empréstimo removido com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Empréstimo não encontrado." });
            }

        } catch (error: any) {
            console.error(`[EmprestimoController] Erro ao remover empréstimo (id: ${req.params.id}):`, error);

            // O model lança "não encontrado" quando o ID não existe — diferencia do erro de banco
            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao remover o empréstimo." });
        }
    }
}

// Exporta a classe para que possa ser importada e usada no arquivo de rotas (routes.ts)
// "export default" permite importar com qualquer nome: import EmprestimoController from "./EmprestimoController.js"
export default EmprestimoController;