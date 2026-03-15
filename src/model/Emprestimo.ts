// Importa o tipo EmprestimoDTO, que define a "forma" dos dados de um empréstimo (como um molde/contrato)
// DTO (Data Transfer Object) é um objeto simples usado para trafegar dados entre camadas da aplicação
// O EmprestimoDTO possui objetos aninhados: "aluno" e "livro" dentro do empréstimo
import type EmprestimoDTO from "../dto/EmprestimoDTO.js";

// Importa a classe DatabaseModel, responsável por gerenciar a conexão com o banco de dados
import { DatabaseModel } from "./DatabaseModel.js";

// Cria uma instância do DatabaseModel e acessa o pool de conexões com o banco de dados
// O "pool" é um conjunto de conexões reutilizáveis — mais eficiente que abrir e fechar uma conexão a cada query
// Ex: em vez de conectar ao banco 100 vezes para 100 requisições, o pool mantém conexões abertas e as reutiliza
const database = new DatabaseModel().pool;

// Define a classe Emprestimo, que representa a entidade empréstimo no sistema de biblioteca
// É aqui que ficam tanto os atributos do empréstimo quanto os métodos que acessam o banco de dados
class Emprestimo {

    // ==================== ATRIBUTOS PRIVADOS ====================
    // Atributos privados só podem ser acessados dentro da própria classe
    // Para lê-los ou alterá-los de fora, usamos os getters e setters definidos abaixo

    private id_emprestimo: number = 0;               // ID único gerado pelo banco — começa em 0 pois ainda não foi salvo
    private id_aluno: number;                        // Chave estrangeira — referencia o ID do aluno na tabela Aluno
    private id_livro: number;                        // Chave estrangeira — referencia o ID do livro na tabela Livro
    private data_emprestimo: Date;                   // Data em que o empréstimo foi realizado
    private data_devolucao: Date;                    // Data prevista para devolução do livro
    private status_emprestimo: string;               // Situação atual: "Em Andamento", "Devolvido", "Atrasado"
    private status_emprestimo_registro: boolean = true; // true = ativo no sistema, false = removido logicamente

    // ==================== CONSTRUTOR ====================
    // O construtor é chamado automaticamente ao criar um novo objeto com "new Emprestimo(...)"
    // Os parâmetros com "_" na frente são uma convenção para não conflitar com os nomes dos atributos
    constructor(
        _id_aluno: number,
        _id_livro: number,
        _data_emprestimo: Date,
        _status_emprestimo?: string, // O "?" torna o parâmetro opcional — pode ser omitido na criação do objeto
        _data_devolucao?: Date       // Também opcional — se não informado, é calculado automaticamente
    ) {
        // Cria uma cópia da data de empréstimo para calcular a data de devolução padrão
        // Usamos "new Date(_data_emprestimo)" para não modificar o objeto original recebido como parâmetro
        const dataDevolucaoPadrao = new Date(_data_emprestimo);

        // Adiciona 7 dias à data de empréstimo para definir o prazo padrão de devolução
        // getDate() retorna o dia atual do mês; setDate() define um novo dia — somando +7 avança uma semana
        dataDevolucaoPadrao.setDate(dataDevolucaoPadrao.getDate() + 7);

        // Atribui os valores recebidos aos atributos internos da classe
        this.id_aluno = _id_aluno;
        this.id_livro = _id_livro;
        this.data_emprestimo = _data_emprestimo;

        // "??" é o operador "nullish coalescing": retorna o valor da direita se o da esquerda for null/undefined
        // Se _status_emprestimo não foi informado (undefined), usa "Em Andamento" como padrão
        this.status_emprestimo = _status_emprestimo ?? "Em Andamento";

        // Se _data_devolucao não foi informada, usa a data calculada automaticamente (empréstimo + 7 dias)
        this.data_devolucao = _data_devolucao ?? dataDevolucaoPadrao;
    }

    // ==================== GETTERS E SETTERS ====================
    // Getters permitem ler atributos privados de fora da classe
    // Setters permitem alterar atributos privados de fora da classe
    // Essa separação é um princípio de encapsulamento — protege os dados de alterações acidentais

    public getIdEmprestimo(): number { return this.id_emprestimo; }
    public setIdEmprestimo(value: number): void { this.id_emprestimo = value; }

    public getIdAluno(): number { return this.id_aluno; }
    public setIdAluno(value: number): void { this.id_aluno = value; }

    public getIdLivro(): number { return this.id_livro; }
    public setIdLivro(value: number): void { this.id_livro = value; }

    public getDataEmprestimo(): Date { return this.data_emprestimo; }
    public setDataEmprestimo(value: Date): void { this.data_emprestimo = value; }

    public getDataDevolucao(): Date { return this.data_devolucao; }
    public setDataDevolucao(value: Date): void { this.data_devolucao = value; }

    public getStatusEmprestimo(): string { return this.status_emprestimo; }
    public setStatusEmprestimo(value: string): void { this.status_emprestimo = value; }

    public getStatusEmprestimoRegistro(): boolean { return this.status_emprestimo_registro; }
    public setStatusEmprestimoRegistro(value: boolean): void { this.status_emprestimo_registro = value; }

    // ==================== MÉTODO PRIVADO: toDTO ====================
    /**
     * Converte uma linha bruta retornada pelo banco de dados em um objeto EmprestimoDTO estruturado.
     * Como a query usa JOIN com Aluno e Livro, a linha contém campos das três tabelas —
     * este método organiza esses campos nos objetos aninhados "aluno" e "livro" do DTO.
     *
     * @param linha Linha retornada pelo banco de dados (tipagem any pois vem do driver do PostgreSQL)
     * @returns Objeto EmprestimoDTO com os campos mapeados, incluindo os objetos aninhados aluno e livro
     */
    // É "private static" pois só é usado internamente nesta classe, sem precisar de um objeto instanciado
    // Centralizar o mapeamento aqui evita repetição de código nos métodos de consulta
    private static toDTO(linha: any): EmprestimoDTO {
        return {
            id_emprestimo: linha.id_emprestimo,
            data_emprestimo: linha.data_emprestimo,
            data_devolucao: linha.data_devolucao,
            status_emprestimo: linha.status_emprestimo,
            status_emprestimo_registro: linha.status_emprestimo_registro,

            // Objeto aninhado com os dados do aluno — campos vindos do JOIN com a tabela Aluno
            aluno: {
                id_aluno: linha.id_aluno,
                ra: linha.ra,
                nome: linha.nome,
                sobrenome: linha.sobrenome,
                celular: linha.celular,
                email: linha.email
            },

            // Objeto aninhado com os dados do livro — campos vindos do JOIN com a tabela Livro
            livro: {
                id_livro: linha.id_livro,
                titulo: linha.titulo,
                autor: linha.autor,
                editora: linha.editora,
                isbn: linha.isbn
            }
        };
    }

    // ==================== MÉTODOS ESTÁTICOS (acesso ao banco de dados) ====================
    // Métodos "static" pertencem à classe, não a um objeto específico
    // São chamados diretamente na classe: Emprestimo.listarEmprestimos() — sem precisar de "new Emprestimo()"
    // Isso faz sentido aqui pois as operações de banco não dependem de um empréstimo específico instanciado

    /**
     * Busca e retorna todos os empréstimos com registro ativo no banco de dados.
     * Utiliza JOIN com as tabelas Aluno e Livro para retornar os dados completos em uma única consulta.
     * Empréstimos removidos logicamente (status_emprestimo_registro = FALSE) não são incluídos.
     *
     * @returns Promise com array de EmprestimoDTO contendo todos os empréstimos ativos.
     *          Retorna array vazio se não houver empréstimos cadastrados.
     * @throws Error se ocorrer falha na consulta ao banco de dados.
     */
    static async listarEmprestimos(): Promise<EmprestimoDTO[]> {
        try {
            // Query com JOIN: une três tabelas em uma única consulta para evitar múltiplas idas ao banco
            // "e", "a" e "l" são aliases (apelidos) para as tabelas Emprestimo, Aluno e Livro respectivamente
            // JOIN Aluno ON e.id_aluno = a.id_aluno: conecta cada empréstimo ao seu aluno correspondente
            // JOIN Livro ON e.id_livro = l.id_livro: conecta cada empréstimo ao seu livro correspondente
            // WHERE status_emprestimo_registro = TRUE: filtra apenas registros ativos (não removidos)
            const querySelectEmprestimo = `
                SELECT e.id_emprestimo, e.id_aluno, e.id_livro,
                       e.data_emprestimo, e.data_devolucao, e.status_emprestimo, e.status_emprestimo_registro,
                       a.ra, a.nome, a.sobrenome, a.celular, a.email,
                       l.titulo, l.autor, l.editora, l.isbn
                FROM Emprestimo e
                JOIN Aluno a ON e.id_aluno = a.id_aluno
                JOIN Livro l ON e.id_livro = l.id_livro
                WHERE e.status_emprestimo_registro = TRUE;
            `;

            // Executa a query no banco de dados e aguarda o resultado
            // "await" pausa a execução aqui até o banco responder
            const respostaBD = await database.query(querySelectEmprestimo);

            // .map() percorre cada linha retornada e transforma em EmprestimoDTO usando o método toDTO
            // É equivalente a um forEach que cria um array novo — mais idiomático e sem variável mutável
            return respostaBD.rows.map(Emprestimo.toDTO);

        } catch (error) {
            // Exibe o erro no console com o prefixo do model para facilitar a identificação nos logs
            console.error(`[EmprestimoModel] Erro ao listar empréstimos:`, error);
            // Relança o erro para que o controller possa tratá-lo e retornar o status HTTP correto
            throw error;
        }
    }

    /**
     * Busca e retorna os dados de um empréstimo específico pelo seu ID.
     * Utiliza JOIN com as tabelas Aluno e Livro para retornar os dados completos em uma única consulta.
     *
     * @param id_emprestimo Identificador único do empréstimo no banco de dados.
     * @returns Promise com EmprestimoDTO contendo os dados do empréstimo, aluno e livro relacionados.
     * @throws Error com mensagem "não encontrado" se nenhum empréstimo com o ID informado existir.
     * @throws Error se ocorrer falha na consulta ao banco de dados.
     */
    static async listarEmprestimo(id_emprestimo: number): Promise<EmprestimoDTO> {
        try {
            // Mesma estrutura de JOIN do listarEmprestimos, mas com filtro pelo ID específico no WHERE
            // "$1" é um placeholder de prepared statement — o valor real é passado no array abaixo
            // Isso protege contra SQL Injection: o banco trata o valor como dado, nunca como código SQL
            const querySelectEmprestimo = `
                SELECT e.id_emprestimo, e.id_aluno, e.id_livro,
                       e.data_emprestimo, e.data_devolucao, e.status_emprestimo, e.status_emprestimo_registro,
                       a.ra, a.nome, a.sobrenome, a.celular, a.email,
                       l.titulo, l.autor, l.editora, l.isbn
                FROM Emprestimo e
                JOIN Aluno a ON e.id_aluno = a.id_aluno
                JOIN Livro l ON e.id_livro = l.id_livro
                WHERE e.id_emprestimo = $1;
            `;

            // Executa a query passando o id_emprestimo como parâmetro (substitui o $1)
            const respostaBD = await database.query(querySelectEmprestimo, [id_emprestimo]);

            // rows.length === 0 significa que nenhuma linha foi retornada — o ID não existe no banco
            // Sem esta verificação, acessar rows[0] abaixo causaria um TypeError silencioso
            if (respostaBD.rows.length === 0) {
                throw new Error(`Empréstimo com ID ${id_emprestimo} não encontrado.`);
            }

            // rows[0] acessa a primeira (e única) linha retornada pela query
            // O resultado é passado para toDTO() que monta o objeto EmprestimoDTO estruturado
            return Emprestimo.toDTO(respostaBD.rows[0]);

        } catch (error) {
            console.error(`[EmprestimoModel] Erro ao buscar empréstimo (id: ${id_emprestimo}):`, error);
            // "throw error" relança o erro para que o controller possa tratá-lo
            // Isso permite diferenciar "não encontrado" (404) de "erro de banco" (500) no controller
            throw error;
        }
    }

    /**
     * Cadastra um novo empréstimo no banco de dados.
     * A data de devolução é calculada automaticamente pelo construtor (data_emprestimo + 7 dias)
     * caso não seja informada explicitamente.
     *
     * @param emprestimo Objeto Emprestimo contendo os dados a serem cadastrados.
     * @returns Promise com true se o cadastro foi realizado com sucesso.
     * @throws Error se o INSERT não retornar o ID gerado ou ocorrer falha no banco.
     */
    static async cadastrarEmprestimo(emprestimo: Emprestimo): Promise<boolean> {
        try {
            // "RETURNING id_emprestimo" faz o banco retornar o ID gerado automaticamente após o INSERT
            // Isso confirma que o registro foi criado e nos dá o ID para exibir no log
            const queryInsertEmprestimo = `
                INSERT INTO Emprestimo (id_aluno, id_livro, data_emprestimo, data_devolucao, status_emprestimo)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id_emprestimo;
            `;

            // Organiza os valores em um array na mesma ordem dos placeholders ($1, $2...) da query
            // Os atributos são acessados diretamente (sem getter) pois estamos dentro da própria classe
            const valores = [
                emprestimo.id_aluno,         // $1 — ID do aluno
                emprestimo.id_livro,         // $2 — ID do livro
                emprestimo.data_emprestimo,  // $3 — Data do empréstimo
                emprestimo.data_devolucao,   // $4 — Data de devolução (calculada no construtor se não informada)
                emprestimo.status_emprestimo // $5 — Status (padrão: "Em Andamento")
            ];

            // Executa a query passando o array de valores e armazena o resultado
            const resultado = await database.query(queryInsertEmprestimo, valores);

            // Se o RETURNING não retornou nenhuma linha, o INSERT falhou silenciosamente
            if (resultado.rows.length === 0) {
                throw new Error("INSERT não retornou ID — cadastro pode ter falhado silenciosamente.");
            }

            // Exibe o ID do empréstimo recém-criado no console para facilitar o rastreamento
            console.info(`[EmprestimoModel] Empréstimo cadastrado com sucesso. ID: ${resultado.rows[0].id_emprestimo}`);
            return true;

        } catch (error) {
            console.error(`[EmprestimoModel] Erro ao cadastrar empréstimo:`, error);
            throw error;
        }
    }

    /**
     * Atualiza os dados de um empréstimo existente no banco de dados.
     * Diferente dos outros métodos de atualização, recebe os campos individualmente
     * em vez de um objeto Emprestimo — isso permite atualizar campos específicos com mais flexibilidade.
     *
     * @param id_emprestimo ID do empréstimo a ser atualizado (usado no WHERE da query).
     * @param id_aluno Novo ID do aluno vinculado ao empréstimo.
     * @param id_livro Novo ID do livro vinculado ao empréstimo.
     * @param data_emprestimo Nova data de empréstimo.
     * @param data_devolucao Nova data prevista de devolução.
     * @param status_emprestimo Novo status do empréstimo (ex: "Devolvido", "Atrasado").
     * @returns Promise com true se a atualização foi bem-sucedida.
     * @throws Error com mensagem "não encontrado" se nenhum empréstimo com o ID informado existir.
     * @throws Error se ocorrer falha no banco de dados.
     */
    static async atualizarEmprestimo(
        id_emprestimo: number,
        id_aluno: number,
        id_livro: number,
        data_emprestimo: Date,
        data_devolucao: Date,
        status_emprestimo: string
    ): Promise<boolean> {
        try {
            // Cada $n corresponde ao valor na mesma posição do array "valores" abaixo
            // O $6 no WHERE garante que apenas o empréstimo com o ID correto seja atualizado
            // "RETURNING id_emprestimo" confirma que o registro existia e foi de fato alterado
            const queryUpdateEmprestimo = `
                UPDATE Emprestimo
                SET id_aluno          = $1,
                    id_livro          = $2,
                    data_emprestimo   = $3,
                    data_devolucao    = $4,
                    status_emprestimo = $5
                WHERE id_emprestimo = $6
                RETURNING id_emprestimo;
            `;

            // id_emprestimo vai por último ($6) pois é usado no WHERE, não no SET
            const valores = [
                id_aluno,          // $1
                id_livro,          // $2
                data_emprestimo,   // $3
                data_devolucao,    // $4
                status_emprestimo, // $5
                id_emprestimo      // $6 — usado no WHERE para identificar o registro a ser atualizado
            ];

            // Executa a query de atualização e armazena o resultado
            const resultado = await database.query(queryUpdateEmprestimo, valores);

            // rowCount === 0 significa que nenhuma linha foi alterada — o ID não existe no banco
            if (resultado.rowCount === 0) {
                throw new Error(`Empréstimo com ID ${id_emprestimo} não encontrado.`);
            }

            // Se chegou aqui, a atualização foi bem-sucedida
            return true;

        } catch (error) {
            console.error(`[EmprestimoModel] Erro ao atualizar empréstimo (id: ${id_emprestimo}):`, error);
            throw error;
        }
    }

    /**
     * Remove logicamente um empréstimo do sistema.
     * Não apaga o registro do banco — apenas define status_emprestimo_registro = FALSE.
     * Isso preserva o histórico de empréstimos para fins de auditoria e relatórios.
     *
     * @param id_emprestimo ID do empréstimo a ser removido.
     * @returns Promise com true se a remoção foi bem-sucedida.
     * @throws Error com mensagem "não encontrado" se nenhum empréstimo com o ID informado existir.
     * @throws Error se ocorrer falha no banco de dados.
     */
    static async removerEmprestimo(id_emprestimo: number): Promise<boolean> {
        try {
            // UPDATE com status = FALSE em vez de DELETE — preserva o histórico no banco
            // Assim os dados do empréstimo continuam existindo para consultas e relatórios futuros
            const queryDeleteEmprestimo = `
                UPDATE emprestimo
                SET status_emprestimo_registro = FALSE
                WHERE id_emprestimo = $1;
            `;

            // Executa a query passando o ID do empréstimo como parâmetro (substitui o $1)
            const respostaBD = await database.query(queryDeleteEmprestimo, [id_emprestimo]);

            // rowCount indica quantas linhas foram afetadas pelo UPDATE
            // rowCount === 0 significa que nenhuma linha foi encontrada com esse ID
            if (respostaBD.rowCount === 0) {
                throw new Error(`Empréstimo com ID ${id_emprestimo} não encontrado.`);
            }

            // Exibe o ID do empréstimo removido no console para facilitar o rastreamento
            console.info(`[EmprestimoModel] Empréstimo removido com sucesso. ID: ${id_emprestimo}`);
            return true;

        } catch (error) {
            console.error(`[EmprestimoModel] Erro ao remover empréstimo (id: ${id_emprestimo}):`, error);
            throw error;
        }
    }
}

// Exporta a classe para que possa ser importada nos controllers e outros arquivos do projeto
// "export default" permite importar com qualquer nome: import Emprestimo from "./Emprestimo.js"
export default Emprestimo;