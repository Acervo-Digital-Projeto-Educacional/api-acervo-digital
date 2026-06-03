// Importa a classe Livro do model — é daqui que vêm os métodos de acesso ao banco de dados
import Livro from "../model/Livro.js";

// Importa os tipos Request e Response do Express — representam a requisição e a resposta HTTP
// "type" indica que é uma importação apenas de tipo (só existe em tempo de compilação, não gera código JS)
import { type Request, type Response } from "express";

// Importa o tipo LivroDTO para tipar os dados recebidos do front-end no body das requisições
import type LivroDTO from "../dto/LivroDTO.js";

// Define a classe LivroController que HERDA da classe Livro (extends)
// A herança permite que o controller acesse os métodos estáticos do model sem precisar importá-los separadamente
// A arquitetura MVC separa responsabilidades:
//   - Model (Livro): cuida da comunicação com o banco de dados
//   - Controller (LivroController): cuida do recebimento das requisições HTTP e envio das respostas
class LivroController extends Livro {

    /**
     * Lista todos os livros ativos cadastrados no sistema.
     * Retorna 204 se não houver livros cadastrados, 200 com a lista caso contrário.
     *
     * @param req Objeto de requisição HTTP (não utiliza parâmetros neste método).
     * @param res Objeto de resposta HTTP.
     * @returns 200 com array de LivroDTO | 204 sem conteúdo | 500 em caso de erro interno.
     */
    static async todos(req: Request, res: Response) {
        try {
            // Chama o método do model que busca todos os livros ativos no banco de dados
            const listaDeLivros = await Livro.listarLivros();

            // Se o array estiver vazio, não há livros cadastrados — retorna 204 (No Content)
            // 204 indica que a requisição foi bem-sucedida, mas não há conteúdo para retornar
            // É diferente de um erro — a consulta funcionou, simplesmente não há dados
            if (listaDeLivros.length === 0) {
                res.status(204).send();
                return; // "return" encerra o método para não executar o código abaixo
            }

            // Retorna a lista de livros em formato JSON com status 200 (OK)
            res.status(200).json(listaDeLivros);

        } catch (error) {
            // Se ocorrer qualquer erro inesperado, exibe no console e retorna status 500
            console.error(`[LivroController] Erro ao listar livros:`, error);
            res.status(500).json({ mensagem: "Erro interno ao recuperar a lista de livros." });
        }
    }

    /**
     * Busca e retorna os dados de um livro específico pelo ID informado na URL.
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL (ex: /api/livros/5).
     * @param res Objeto de resposta HTTP.
     * @returns 200 com LivroDTO | 400 se o ID for inválido | 404 se não encontrado | 500 em caso de erro interno.
     */
    static async livro(req: Request, res: Response) {
        try {
            // Lê o parâmetro "id" da URL e converte de string para número inteiro
            // "as string" garante ao TypeScript que o valor existe e é uma string antes do parseInt
            const idLivro = parseInt(req.params.id as string);

            // parseInt retorna NaN se o valor não for um número válido (ex: /api/livros/abc)
            // idLivro <= 0 rejeita valores como 0 ou negativos que não fazem sentido como ID
            if (isNaN(idLivro) || idLivro <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Chama o método do model passando o ID para buscar o livro específico no banco
            const livro = await Livro.listarLivro(idLivro);

            // Se chegou aqui, o livro foi encontrado — retorna os dados com status 200 (OK)
            res.status(200).json(livro);

        } catch (error: any) {
            // "error: any" permite inspecionar a mensagem do erro para diferenciar os casos
            console.error(`[LivroController] Erro ao buscar livro (id: ${req.params.id}):`, error);

            // O model lança um erro com "não encontrado" quando o ID não existe no banco
            // Aqui diferenciamos esse caso (404) de um erro inesperado de banco (500)
            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao recuperar o livro." });
        }
    }

    /**
     * Cadastra um novo livro no sistema com os dados recebidos no corpo da requisição.
     * Valida campos obrigatórios antes de persistir no banco de dados.
     *
     * @param req Objeto de requisição HTTP. Espera no body: titulo, autor, editora, isbn (obrigatórios)
     *            e ano_publicacao, quant_total, quant_disponivel, quant_aquisicao, valor_aquisicao (opcionais).
     * @param res Objeto de resposta HTTP.
     * @returns 201 se cadastrado com sucesso | 400 se campos obrigatórios ausentes ou falha no cadastro | 500 em caso de erro interno.
     */
    static async cadastrar(req: Request, res: Response) {
        try {
            // Lê o corpo da requisição e tipifica como LivroDTO
            // O front-end envia os dados do novo livro em formato JSON no corpo da requisição
            const dadosRecebidos: LivroDTO = req.body;

            // Valida se os campos obrigatórios foram enviados pelo front-end
            // Se qualquer um deles estiver ausente (undefined, null ou string vazia), retorna 400
            // Isso evita criar um objeto Livro incompleto e só descobrir o erro no banco
            if (!dadosRecebidos.titulo || !dadosRecebidos.autor || !dadosRecebidos.editora || !dadosRecebidos.isbn) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: titulo, autor, editora e isbn." });
                return;
            }

            // Cria um novo objeto Livro com os dados recebidos
            // O operador "??" define valores padrão para campos opcionais não informados
            // "(dadosRecebidos.ano_publicacao ?? 0).toString()" converte o número para string,
            // pois o construtor de Livro espera uma string para o ano de publicação
            const novoLivro = new Livro(
                dadosRecebidos.titulo,
                dadosRecebidos.autor,
                dadosRecebidos.editora,
                (dadosRecebidos.ano_publicacao ?? 0).toString(), // Converte para string — padrão "0" se não informado
                dadosRecebidos.isbn,
                dadosRecebidos.quant_total,
                dadosRecebidos.quant_disponivel,
                dadosRecebidos.quant_aquisicao,
                dadosRecebidos.valor_aquisicao ?? 0              // Padrão: 0 se não informado
            );

            // Chama o método do model para persistir o novo livro no banco de dados
            const result = await Livro.cadastrarLivro(novoLivro);

            // O model retorna true se o INSERT foi bem-sucedido, false caso contrário
            if (result) {
                // 201 Created — recurso criado com sucesso (semântica correta para POST)
                res.status(201).json({ mensagem: "Livro cadastrado com sucesso." });
            } else {
                // 400 Bad Request — falha de negócio, não erro de servidor
                res.status(400).json({ mensagem: "Não foi possível cadastrar o livro." });
            }

        } catch (error) {
            console.error(`[LivroController] Erro ao cadastrar livro:`, error);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar o livro." });
        }
    }

    /**
     * Remove logicamente um livro do sistema pelo ID informado na URL.
     * Também desativa todos os empréstimos relacionados ao livro.
     * O registro não é apagado do banco — apenas desativado (status_livro = FALSE).
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL (ex: /api/livros/5).
     * @param res Objeto de resposta HTTP.
     * @returns 200 se removido com sucesso | 400 se o ID for inválido | 404 se não encontrado ou já inativo | 500 em caso de erro interno.
     */
    static async remover(req: Request, res: Response) {
        try {
            // Lê e converte o ID da URL para número inteiro
            const idLivro = parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo antes de consultar o banco
            if (isNaN(idLivro) || idLivro <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Chama o método do model que realiza a remoção lógica do livro e seus empréstimos
            const result = await Livro.removerLivro(idLivro);

            // O model retorna true se o livro foi desativado, false se já estava inativo
            if (result) {
                res.status(200).json({ mensagem: "Livro removido com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Livro não encontrado ou já está inativo." });
            }

        } catch (error: any) {
            console.error(`[LivroController] Erro ao remover livro (id: ${req.params.id}):`, error);

            // O model lança "não encontrado" quando o ID não existe — diferencia do erro de banco
            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao remover o livro." });
        }
    }

    /**
     * Atualiza os dados cadastrais de um livro existente no sistema.
     * Valida o ID na URL e os campos obrigatórios no body antes de persistir no banco.
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL e no body: titulo, autor,
     *            editora, isbn (obrigatórios) e ano_publicacao, quant_total, quant_disponivel,
     *            quant_aquisicao, valor_aquisicao (opcionais).
     * @param res Objeto de resposta HTTP.
     * @returns 200 se atualizado com sucesso | 400 se o ID ou campos forem inválidos | 404 se não encontrado ou inativo | 500 em caso de erro interno.
     */
    static async atualizar(req: Request, res: Response) {
        try {
            // Lê e converte o ID da URL para número inteiro
            const idLivro = parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo antes de qualquer operação
            if (isNaN(idLivro) || idLivro <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Lê os dados enviados pelo front-end no corpo da requisição
            const dadosRecebidos: LivroDTO = req.body;

            // Valida campos obrigatórios — mesma lógica do método cadastrar
            if (!dadosRecebidos.titulo || !dadosRecebidos.autor || !dadosRecebidos.editora || !dadosRecebidos.isbn) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: titulo, autor, editora e isbn." });
                return;
            }

            // Cria um objeto Livro com os novos dados recebidos do front-end
            const livro = new Livro(
                dadosRecebidos.titulo,
                dadosRecebidos.autor,
                dadosRecebidos.editora,
                (dadosRecebidos.ano_publicacao ?? 0).toString(),
                dadosRecebidos.isbn,
                dadosRecebidos.quant_total,
                dadosRecebidos.quant_disponivel,
                dadosRecebidos.quant_aquisicao,
                dadosRecebidos.valor_aquisicao ?? 0
            );

            // Define o ID do livro no objeto — necessário para o model saber qual registro atualizar no banco
            // O ID vem da URL (req.params.id), não do body, por segurança
            livro.setIdLivro(idLivro);

            // Chama o método do model para persistir as atualizações no banco de dados
            const result = await Livro.atualizarLivro(livro);

            // O model retorna true se o UPDATE afetou alguma linha, false se o livro estava inativo
            if (result) {
                res.status(200).json({ mensagem: "Cadastro atualizado com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Livro não encontrado ou já está inativo." });
            }

        } catch (error: any) {
            console.error(`[LivroController] Erro ao atualizar livro (id: ${req.params.id}):`, error);

            // O model lança "não encontrado" quando o ID não existe — diferencia do erro de banco
            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao atualizar o livro." });
        }
    }
}

// Exporta a classe para que possa ser importada e usada no arquivo de rotas (routes.ts)
// "export default" permite importar com qualquer nome: import LivroController from "./LivroController.js"
export default LivroController;