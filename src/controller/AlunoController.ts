// Importa a classe Aluno do model — é daqui que vêm os métodos de acesso ao banco de dados
import Aluno from "../model/Aluno.js";

// Importa os tipos Request e Response do Express — representam a requisição e a resposta HTTP
// "type" indica que é uma importação apenas de tipo (só existe em tempo de compilação, não gera código JS)
import { type Request, type Response } from "express";

// Importa o tipo AlunoDTO para tipar os dados recebidos do front-end no body das requisições
import type AlunoDTO from "../dto/AlunoDTO.js";

// Define a classe AlunoController que HERDA da classe Aluno (extends)
// A herança permite que o controller acesse os métodos estáticos do model sem precisar importá-los separadamente
// A arquitetura MVC separa responsabilidades:
//   - Model (Aluno): cuida da comunicação com o banco de dados
//   - Controller (AlunoController): cuida do recebimento das requisições HTTP e envio das respostas
class AlunoController extends Aluno {

    /**
     * Lista todos os alunos ativos cadastrados no sistema.
     * Retorna 204 se não houver alunos cadastrados, 200 com a lista caso contrário.
     *
     * @param req Objeto de requisição HTTP (não utiliza parâmetros neste método).
     * @param res Objeto de resposta HTTP.
     * @returns 200 com array de AlunoDTO | 204 sem conteúdo | 500 em caso de erro interno.
     */
    static async todos(req: Request, res: Response) {
        try {
            // Chama o método do model que busca todos os alunos ativos no banco de dados
            const listaDeAlunos = await Aluno.listarAlunos();

            // Se o array estiver vazio, não há alunos cadastrados — retorna 204 (No Content)
            // 204 indica que a requisição foi bem-sucedida, mas não há conteúdo para retornar
            // É diferente de um erro — a consulta funcionou, simplesmente não há dados
            if (listaDeAlunos.length === 0) {
                res.status(204).send();
                return; // "return" encerra o método para não executar o código abaixo
            }

            // Retorna a lista de alunos em formato JSON com status 200 (OK)
            res.status(200).json(listaDeAlunos);

        } catch (error) {
            // Se ocorrer qualquer erro inesperado, exibe no console e retorna status 500
            console.error(`[AlunoController] Erro ao listar alunos:`, error);
            res.status(500).json({ mensagem: "Erro interno ao recuperar a lista de alunos." });
        }
    }

    /**
     * Busca e retorna os dados de um aluno específico pelo ID informado na URL.
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL (ex: /api/alunos/3).
     * @param res Objeto de resposta HTTP.
     * @returns 200 com AlunoDTO | 400 se o ID for inválido | 404 se não encontrado | 500 em caso de erro interno.
     */
    static async aluno(req: Request, res: Response) {
        try {
            // Lê o parâmetro "id" da URL e converte de string para número inteiro
            // "as string" garante ao TypeScript que o valor existe e é uma string antes do parseInt
            const idAluno = parseInt(req.params.id as string);

            // parseInt retorna NaN se o valor não for um número válido (ex: /api/alunos/abc)
            // isNaN() detecta isso e retorna 400 (Bad Request) antes de chegar no banco
            if (isNaN(idAluno) || idAluno <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Chama o método do model passando o ID para buscar o aluno específico no banco
            const aluno = await Aluno.listarAluno(idAluno);

            // Se chegou aqui, o aluno foi encontrado — retorna os dados com status 200 (OK)
            res.status(200).json(aluno);

        } catch (error: any) {
            // "error: any" permite inspecionar a mensagem do erro para diferenciar os casos
            console.error(`[AlunoController] Erro ao buscar aluno (id: ${req.params.id}):`, error);

            // O model lança um erro com "não encontrado" quando o ID não existe no banco
            // Aqui diferenciamos esse caso (404) de um erro inesperado de banco (500)
            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao recuperar o aluno." });
        }
    }

    /**
     * Cadastra um novo aluno no sistema com os dados recebidos no corpo da requisição.
     * Valida campos obrigatórios antes de persistir no banco de dados.
     *
     * @param req Objeto de requisição HTTP. Espera no body: nome, sobrenome, celular (obrigatórios)
     *            e data_nascimento, endereco, email (opcionais).
     * @param res Objeto de resposta HTTP.
     * @returns 201 se cadastrado com sucesso | 400 se campos obrigatórios ausentes ou falha no cadastro | 500 em caso de erro interno.
     */
    static async cadastrar(req: Request, res: Response) {
        try {
            // Lê o corpo da requisição e tipifica como AlunoDTO
            // O front-end envia os dados do novo aluno em formato JSON no corpo da requisição
            const dadosRecebidos: AlunoDTO = req.body;

            // Valida se os campos obrigatórios foram enviados pelo front-end
            // Se qualquer um deles estiver ausente (undefined, null ou string vazia), retorna 400
            // Isso evita criar um objeto Aluno incompleto e só descobrir o erro no banco
            if (!dadosRecebidos.nome || !dadosRecebidos.sobrenome || !dadosRecebidos.celular) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: nome, sobrenome e celular." });
                return;
            }

            // Cria um novo objeto Aluno com os dados recebidos
            // O operador "??" define valores padrão para campos opcionais não informados
            const novoAluno = new Aluno(
                dadosRecebidos.nome,
                dadosRecebidos.sobrenome,
                dadosRecebidos.data_nascimento ?? new Date("1900-01-01"), // Padrão: 01/01/1900
                dadosRecebidos.endereco ?? '',                            // Padrão: string vazia
                dadosRecebidos.email ?? '',                               // Padrão: string vazia
                dadosRecebidos.celular
            );

            // Chama o método do model para persistir o novo aluno no banco de dados
            const result = await Aluno.cadastrarAluno(novoAluno);

            // O model retorna true se o INSERT foi bem-sucedido, false caso contrário
            if (result) {
                // 201 Created — recurso criado com sucesso (semântica correta para POST)
                res.status(201).json({ mensagem: "Aluno cadastrado com sucesso." });
            } else {
                // 400 Bad Request — falha de negócio, não erro de servidor
                res.status(400).json({ mensagem: "Não foi possível cadastrar o aluno." });
            }

        } catch (error) {
            console.error(`[AlunoController] Erro ao cadastrar aluno:`, error);
            res.status(500).json({ mensagem: "Erro interno ao cadastrar o aluno." });
        }
    }

    /**
     * Remove logicamente um aluno do sistema pelo ID informado na URL.
     * Também desativa todos os empréstimos relacionados ao aluno.
     * O registro não é apagado do banco — apenas desativado (status_aluno = FALSE).
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL (ex: /api/alunos/3).
     * @param res Objeto de resposta HTTP.
     * @returns 200 se removido com sucesso | 400 se o ID for inválido | 404 se não encontrado ou já inativo | 500 em caso de erro interno.
     */
    static async remover(req: Request, res: Response) {
        try {
            // Lê e converte o ID da URL para número inteiro
            const idAluno = parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo antes de consultar o banco
            if (isNaN(idAluno) || idAluno <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Chama o método do model que realiza a remoção lógica do aluno e seus empréstimos
            const result = await Aluno.removerAluno(idAluno);

            // O model retorna true se o aluno foi desativado, false se já estava inativo
            if (result) {
                res.status(200).json({ mensagem: "Aluno removido com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Aluno não encontrado ou já está inativo." });
            }

        } catch (error: any) {
            console.error(`[AlunoController] Erro ao remover aluno (id: ${req.params.id}):`, error);

            // O model lança "não encontrado" quando o ID não existe — diferencia do erro de banco
            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao remover o aluno." });
        }
    }

    /**
     * Atualiza os dados cadastrais de um aluno existente no sistema.
     * Valida o ID na URL e os campos obrigatórios no body antes de persistir no banco.
     *
     * @param req Objeto de requisição HTTP. Espera o parâmetro "id" na URL e no body: nome,
     *            sobrenome, celular (obrigatórios) e data_nascimento, endereco, email (opcionais).
     * @param res Objeto de resposta HTTP.
     * @returns 200 se atualizado com sucesso | 400 se o ID ou campos forem inválidos | 404 se não encontrado ou inativo | 500 em caso de erro interno.
     */
    static async atualizar(req: Request, res: Response) {
        try {
            // Lê e converte o ID da URL para número inteiro
            const idAluno = parseInt(req.params.id as string);

            // Valida se o ID é um número válido e positivo antes de qualquer operação
            if (isNaN(idAluno) || idAluno <= 0) {
                res.status(400).json({ mensagem: "ID inválido. Informe um número inteiro positivo." });
                return;
            }

            // Lê os dados enviados pelo front-end no corpo da requisição
            const dadosRecebidos: AlunoDTO = req.body;

            // Valida campos obrigatórios — mesma lógica do método cadastrar
            if (!dadosRecebidos.nome || !dadosRecebidos.sobrenome || !dadosRecebidos.celular) {
                res.status(400).json({ mensagem: "Campos obrigatórios ausentes: nome, sobrenome e celular." });
                return;
            }

            // Cria um objeto Aluno com os novos dados recebidos do front-end
            const aluno = new Aluno(
                dadosRecebidos.nome,
                dadosRecebidos.sobrenome,
                dadosRecebidos.data_nascimento ?? new Date("1900-01-01"),
                dadosRecebidos.endereco ?? '',
                dadosRecebidos.email ?? '',
                dadosRecebidos.celular
            );

            // Define o ID do aluno no objeto — necessário para o model saber qual registro atualizar no banco
            // O ID vem da URL (req.params.id), não do body, por segurança
            aluno.setIdAluno(idAluno);

            // Chama o método do model para persistir as atualizações no banco de dados
            const result = await Aluno.atualizarAluno(aluno);

            // O model retorna true se o UPDATE afetou alguma linha, false se o aluno estava inativo
            if (result) {
                res.status(200).json({ mensagem: "Cadastro atualizado com sucesso." });
            } else {
                res.status(404).json({ mensagem: "Aluno não encontrado ou já está inativo." });
            }

        } catch (error: any) {
            console.error(`[AlunoController] Erro ao atualizar aluno (id: ${req.params.id}):`, error);

            // O model lança "não encontrado" quando o ID não existe — diferencia do erro de banco
            if (error.message?.includes("não encontrado")) {
                res.status(404).json({ mensagem: error.message });
                return;
            }

            res.status(500).json({ mensagem: "Erro interno ao atualizar o aluno." });
        }
    }
}

// Exporta a classe para que possa ser importada e usada no arquivo de rotas (routes.ts)
// "export default" permite importar com qualquer nome: import AlunoController from "./AlunoController.js"
export default AlunoController;