// Importa a classe Emprestimo do model — é daqui que vêm os métodos de acesso ao banco de dados
import Emprestimo from "../model/Emprestimo.js";
// Importa os tipos Request e Response do Express — representam a requisição e a resposta HTTP
import { type Request, type Response } from "express";
// Importa o tipo EmprestimoDTO para tipar os dados recebidos do front-end
import type EmprestimoDTO from "../dto/EmprestimoDTO.js";

// Define a classe EmprestimoController que HERDA da classe Emprestimo
// A herança permite acessar os métodos estáticos do model diretamente
// O controller é responsável por receber as requisições HTTP e devolver as respostas — nunca acessa o banco diretamente
class EmprestimoController extends Emprestimo {

    /**
    * Método para listar todos os empréstimos.
    * Retorna um array de empréstimos com informações dos alunos e dos livros.
    */
    // Método estático e assíncrono que busca todos os empréstimos ativos e os retorna em JSON
    // "Promise<Response>" indica que este método sempre retorna uma resposta HTTP ao final
    static async todos(req: Request, res: Response) {
        try {
            const listaDeEmprestimos = await Emprestimo.listarEmprestimos();

            if (listaDeEmprestimos.length === 0) {
                res.status(204).send();
                return;
            }

            res.status(200).json(listaDeEmprestimos);

        } catch (error) {
            console.error(`[EmprestimoController] Erro ao listar empréstimos:`, error);
            res.status(500).json({ mensagem: "Erro interno ao recuperar a lista de empréstimos." });
        }
    }

    /**
     * Retorna informações de um empréstimo
     * @param req Objeto de requisição HTTP
     * @param res Objeto de resposta HTTP.
     * @returns Informações de empréstimo em formato JSON.
     */
    // Método que busca um único empréstimo com base no ID informado na URL (ex: GET /emprestimo/5)
    static async emprestimo(req: Request, res: Response) {
        try {
            const idEmprestimo = parseInt(req.params.id as string);

            if (isNaN(idEmprestimo) || idEmprestimo <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const emprestimo = await Emprestimo.listarEmprestimo(idEmprestimo);
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
     * Cadastra um novo empréstimo.
     * Recebe os dados do empréstimo a partir da requisição e passa para o serviço.
     */
    // Método que recebe os dados do front-end e cria um novo empréstimo no banco de dados
    static async cadastrar(req: Request, res: Response) {
        try {
            const dadosRecebidos: EmprestimoDTO = req.body;

            if (!dadosRecebidos.aluno?.id_aluno || !dadosRecebidos.livro?.id_livro || !dadosRecebidos.data_emprestimo) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: id_aluno, id_livro e data_emprestimo." });
                return;
            }

            const emprestimo = new Emprestimo(
                dadosRecebidos.aluno.id_aluno,
                dadosRecebidos.livro.id_livro,
                new Date(dadosRecebidos.data_emprestimo),
                dadosRecebidos.status_emprestimo ?? "",
                dadosRecebidos.data_devolucao ? new Date(dadosRecebidos.data_devolucao) : undefined
            );

            const result = await Emprestimo.cadastrarEmprestimo(emprestimo);

            if (result) {
                res.status(201).json({ mensagem: "Empréstimo cadastrado com sucesso." });
            } else {
                res.status(400).json({ mensagem: "Não foi possível cadastrar o empréstimo." });
            }

        } catch (error) {
            console.error(`[EmprestimoController] Erro ao cadastrar empréstimo:`, error);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar o empréstimo." });
        }
    }

    /**
     * Atualiza um empréstimo existente.
     * Recebe os dados do empréstimo a partir da requisição e passa para o serviço.
     */
    // Método que recebe os novos dados do front-end e atualiza o empréstimo no banco
    static async atualizar(req: Request, res: Response) {
        try {
            const idEmprestimo = parseInt(req.params.id as string);

            if (isNaN(idEmprestimo) || idEmprestimo <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const dadosRecebidos: EmprestimoDTO = req.body;

            if (!dadosRecebidos.aluno?.id_aluno || !dadosRecebidos.livro?.id_livro || !dadosRecebidos.data_emprestimo) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: id_aluno, id_livro e data_emprestimo." });
                return;
            }

            const result = await Emprestimo.atualizarEmprestimo(
                idEmprestimo,
                dadosRecebidos.aluno.id_aluno,
                dadosRecebidos.livro.id_livro,
                new Date(dadosRecebidos.data_emprestimo),
                dadosRecebidos.data_devolucao ? new Date(dadosRecebidos.data_devolucao) : new Date(),
                dadosRecebidos.status_emprestimo ?? ""
            );

            if (result) {
                res.status(200).json({ mensagem: "Empréstimo atualizado com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Empréstimo não encontrado." });
            }

        } catch (error: any) {
            console.error(`[EmprestimoController] Erro ao atualizar empréstimo (id: ${req.params.id}):`, error);

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao atualizar o empréstimo." });
        }
    }

    /**
    * Método para remover um empréstimo do banco de dados
    * 
    * @param req Objeto de requisição HTTP com o ID do empréstimo a ser removido.
    * @param res Objeto de resposta HTTP.
    * @returns Mensagem de sucesso ou erro em formato JSON.
    */
    // Método que recebe um ID pela URL e realiza a remoção lógica do empréstimo no banco
    static async remover(req: Request, res: Response) {
        try {
            const idEmprestimo = parseInt(req.params.id as string);

            if (isNaN(idEmprestimo) || idEmprestimo <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            const resultado = await Emprestimo.removerEmprestimo(idEmprestimo);

            if (resultado) {
                res.status(200).json({ mensagem: "Empréstimo removido com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Empréstimo não encontrado." });
            }

        } catch (error: any) {
            console.error(`[EmprestimoController] Erro ao remover empréstimo (id: ${req.params.id}):`, error);

            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao remover o empréstimo." });
        }
    }
}

// Exporta a classe EmprestimoController para que possa ser importada e usada nas rotas da aplicação
export default EmprestimoController;