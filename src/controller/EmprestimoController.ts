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
    static async todos(req: Request, res: Response): Promise<Response> {
        try {
            // Chama o método do model para buscar todos os empréstimos ativos no banco
            // O resultado já vem com os dados de aluno e livro embutidos (graças ao JOIN da query)
            const listaDeEmprestimos = await Emprestimo.listarEmprestimos();

            // Retorna a lista em formato JSON com status HTTP 200 (OK — requisição bem-sucedida)
            return res.status(200).json(listaDeEmprestimos);
        } catch (error) {
            // Exibe os detalhes do erro no console do servidor para facilitar o debug
            console.error('Erro ao listar empréstimos:', error);
            // Retorna mensagem de erro com status HTTP 500 (Internal Server Error)
            return res.status(500).json({ mensagem: 'Erro ao listar os empréstimos.' });
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
            // Lê o parâmetro "id" da URL, converte de string para número inteiro e já tipifica como number
            // O "as string" garante ao TypeScript que o valor existe e é uma string antes do parseInt
            const idEmprestimo: number = parseInt(req.params.id as string);
            
            if (isNaN(idEmprestimo)) {
                return res.status(400).json({ mensagem: "ID inválido." });
            }

            // Chama o método do model passando o ID para buscar o empréstimo específico no banco
            const emprestimo = await Emprestimo.listarEmprestimo(idEmprestimo);

            // Verifica se o empréstimo foi encontrado
            if (!emprestimo || (Array.isArray(emprestimo) && emprestimo.length === 0)) {
                return res.status(404).json({ mensagem: "Empréstimo não encontrado." });
            }

            // Retorna o objeto do empréstimo em JSON com status HTTP 200 (OK)
            res.status(200).json(emprestimo);
        } catch (error) {
            // Exibe o erro no console do servidor
            console.log(`Erro ao acessar método herdado: ${error}`);
            // Retorna mensagem de erro com status HTTP 500
            res.status(500).json({ mensagem: "Erro ao recuperar as informações do empréstimo." });
        }
    }

    /**
     * Cadastra um novo empréstimo.
     * Recebe os dados do empréstimo a partir da requisição e passa para o serviço.
     */
    // Método que recebe os dados do front-end e cria um novo empréstimo no banco de dados
    static async cadastrar(req: Request, res: Response): Promise<Response> {
        try {
            // Lê o corpo da requisição HTTP e tipifica como EmprestimoDTO
            // O front-end envia os dados do novo empréstimo no corpo da requisição em formato JSON
            const dadosRecebidos: EmprestimoDTO = req.body;

            if (!dadosRecebidos.aluno || !dadosRecebidos.livro) {
                return res.status(400).json({ mensagem: "Dados de aluno ou livro ausentes." });
            }

            // Cria um novo objeto Emprestimo com os dados recebidos do front-end
            const emprestimo = new Emprestimo(
                dadosRecebidos.aluno.id_aluno,    // ID do aluno — vem do objeto aninhado "aluno" do DTO
                dadosRecebidos.livro.id_livro,    // ID do livro — vem do objeto aninhado "livro" do DTO
                new Date(dadosRecebidos.data_emprestimo), // Converte a data recebida (string) para objeto Date
                dadosRecebidos.status_emprestimo ?? "", // Se não informado, usa string vazia como padrão
                // Se data_devolucao foi informada, converte para Date; senão passa undefined
                // Quando undefined, o construtor de Emprestimo calcula automaticamente (data_emprestimo + 7 dias)
                dadosRecebidos.data_devolucao ? new Date(dadosRecebidos.data_devolucao) : undefined
            );

            // Chama o método do model para persistir o novo empréstimo no banco de dados
            const result = await Emprestimo.cadastrarEmprestimo(emprestimo);

            // Verifica o retorno do model: true = cadastro bem-sucedido, false = falha
            if (result) {
                // Retorna mensagem de sucesso com status HTTP 201 (Created — recurso criado com sucesso)
                return res.status(201).json({ mensagem: 'Empréstimo cadastrado com sucesso.' });
            } else {
                // Retorna mensagem de erro com status HTTP 500 se o banco não conseguiu salvar
                return res.status(500).json({ mensagem: 'Não foi possível cadastrar o empréstimo no banco de dados.' });
            }
        } catch (error) {
            // Exibe o erro no console e retorna status HTTP 500 em caso de exceção inesperada
            console.error('Erro ao cadastrar empréstimo:', error);
            return res.status(500).json({ mensagem: 'Erro ao cadastrar o empréstimo.' });
        }
    }

    /**
     * Atualiza um empréstimo existente.
     * Recebe os dados do empréstimo a partir da requisição e passa para o serviço.
     */
    // Método que recebe os novos dados do front-end e atualiza o empréstimo no banco
    static async atualizar(req: Request, res: Response): Promise<Response> {
        try {
            // Lê o corpo da requisição e tipifica como EmprestimoDTO
            const dadosRecebidos: EmprestimoDTO = req.body;
            // Lê o parâmetro "id" da URL e converte para número inteiro
            // Exemplo de URL: PUT /emprestimo/4  →  idEmprestimo = 4
            const idEmprestimo = parseInt(req.params.id as string);

            if (isNaN(idEmprestimo)) {
                return res.status(400).json({ mensagem: "ID inválido." });
            }
            if (!dadosRecebidos.aluno || !dadosRecebidos.livro) {
                return res.status(400).json({ mensagem: "Dados de aluno ou livro ausentes." });
            }

            // Chama o método do model passando cada campo individualmente como parâmetro
            // Diferente do cadastrar, o atualizarEmprestimo recebe os dados separados (não um objeto Emprestimo)
            const result = await Emprestimo.atualizarEmprestimo(
                idEmprestimo,                              // ID do empréstimo a ser atualizado (usado no WHERE da query)
                dadosRecebidos.aluno.id_aluno,             // Novo ID do aluno
                dadosRecebidos.livro.id_livro,             // Novo ID do livro
                new Date(dadosRecebidos.data_emprestimo),  // Nova data de empréstimo convertida para Date
                // Se data_devolucao foi informada, converte para Date; senão usa a data atual como fallback
                // ⚠️ Diferença do cadastrar: aqui usa new Date() (data atual) ao invés de undefined
                dadosRecebidos.data_devolucao ? new Date(dadosRecebidos.data_devolucao) : new Date(),
                dadosRecebidos.status_emprestimo ?? ""     // Novo status — usa string vazia se não informado
            );

            // Verifica o retorno do model: true = atualização bem-sucedida, false = falha
            if (result) {
                // Retorna mensagem de sucesso com status HTTP 200 (OK)
                return res.status(200).json({ mensagem: 'Empréstimo atualizado com sucesso.' });
            } else {
                // Retorna mensagem de erro com status HTTP 500
                return res.status(500).json({ mensagem: 'Não foi possível atualizar o empréstimo no banco de dados.' });
            }
        } catch (error) {
            // Exibe o erro no console e retorna status HTTP 500 em caso de exceção
            console.error('Erro ao atualizar empréstimo:', error);
            return res.status(500).json({ mensagem: 'Erro ao atualizar o empréstimo.' });
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
    static async remover(req: Request, res: Response): Promise<Response> {
        try {
            // Lê o parâmetro "id" da URL e converte para número inteiro
            // Exemplo de URL: DELETE /emprestimo/2  →  idEmprestimo = 2
            const idEmprestimo = parseInt(req.params.id as string);
            if (isNaN(idEmprestimo)) {
                return res.status(400).json({ mensagem: "ID inválido." });
            }
            // Chama o método do model para remover (logicamente) o empréstimo com o ID informado
            // O resultado é um booleano: true = removido com sucesso, false = não encontrado ou já inativo
            const resultado = await Emprestimo.removerEmprestimo(idEmprestimo);

            // Verifica se a remoção foi bem-sucedida
            if (resultado) {
                // Retorna mensagem de sucesso com status HTTP 200 (OK)
                return res.status(200).json({ mensagem: 'Empréstimo removido com sucesso!' });
            } else {
                // Retorna status HTTP 404 se o empréstimo não foi encontrado para remoção
                return res.status(404).json({ mensagem: 'Empréstimo não encontrado para exclusão.' });
            }

        } catch (error) {
            // Exibe os detalhes do erro no console do servidor
            console.log(`Erro ao remover o Empréstimo ${error}`);
            // Retorna mensagem de erro com status HTTP 500 em caso de exceção inesperada
            return res.status(500).json({ mensagem: "Erro ao remover empréstimo." });
        }
    }
}

// Exporta a classe EmprestimoController para que possa ser importada e usada nas rotas da aplicação
export default EmprestimoController;