// Importa o tipo AlunoDTO, que define a "forma" dos dados de um aluno (como um molde/contrato)
import type AlunoDTO from "../dto/AlunoDTO.js";
// Importa a classe DatabaseModel, responsável por gerenciar a conexão com o banco de dados
import { DatabaseModel } from "./DatabaseModel.js";

// Cria uma instância do DatabaseModel e acessa o pool de conexões com o banco de dados
// O "pool" é um conjunto de conexões reutilizáveis, mais eficiente que abrir/fechar uma por vez
const database = new DatabaseModel().pool;

// Define a classe Aluno, que representa um aluno no sistema
class Aluno {

    // Atributo privado: ID único do aluno no banco de dados (começa em 0, pois ainda não foi salvo)
    private id_aluno: number = 0;
    // Atributo privado: Registro Acadêmico do aluno (começa vazio)
    private ra: string = "";
    // Atributo privado: Primeiro nome do aluno
    private nome: string;
    // Atributo privado: Sobrenome do aluno
    private sobrenome: string;
    // Atributo privado: Data de nascimento do aluno
    private data_nascimento: Date;
    // Atributo privado: Endereço residencial do aluno
    private endereco: string;
    // Atributo privado: E-mail do aluno
    private email: string;
    // Atributo privado: Número de celular do aluno
    private celular: string;
    // Atributo privado: Status do aluno (true = ativo, false = inativo/removido)
    private status_aluno: boolean = true;

    // Construtor: método especial chamado automaticamente ao criar um novo objeto Aluno
    // Os parâmetros com "_" na frente são uma convenção para diferenciar dos atributos da classe
    constructor(
        _nome: string,           // Nome obrigatório
        _sobrenome: string,      // Sobrenome obrigatório
        _data_nascimento: Date,  // Data de nascimento obrigatória
        _endereco: string,       // Endereço obrigatório
        _email: string,          // E-mail obrigatório
        _celular?: string        // Celular opcional (o "?" indica que pode ser omitido)
    ) {
        // Atribui o valor recebido ao atributo interno da classe
        this.nome = _nome;
        this.sobrenome = _sobrenome;
        this.data_nascimento = _data_nascimento;
        this.endereco = _endereco;
        this.email = _email;
        // Se _celular foi informado, usa esse valor; senão, usa string vazia ("")
        // O operador "??" é chamado de "nullish coalescing" — retorna o lado direito se o esquerdo for null/undefined
        this.celular = _celular ?? "";
    }

    // ==================== GETTERS E SETTERS ====================
    // Getters e setters são métodos públicos que permitem ler/alterar atributos privados com segurança

    // Getter: retorna o ID do aluno
    public getIdAluno(): number {
        return this.id_aluno;
    }

    // Setter: define um novo valor para o ID do aluno
    public setIdAluno(id_aluno: number): void {
        this.id_aluno = id_aluno;
    }

    // Getter: retorna o RA do aluno
    public getRa(): string {
        return this.ra;
    }

    // Setter: define um novo valor para o RA do aluno
    public setRa(ra: string): void {
        this.ra = ra;
    }

    // Getter: retorna o nome do aluno
    public getNome(): string {
        return this.nome;
    }

    // Setter: define um novo valor para o nome do aluno
    public setNome(nome: string): void {
        this.nome = nome;
    }

    // Getter: retorna o sobrenome do aluno
    public getSobrenome(): string {
        return this.sobrenome;
    }

    // Setter: define um novo valor para o sobrenome do aluno
    public setSobrenome(sobrenome: string): void {
        this.sobrenome = sobrenome;
    }

    // Getter: retorna a data de nascimento do aluno
    public getDataNascimento(): Date {
        return this.data_nascimento;
    }

    // Setter: define uma nova data de nascimento para o aluno
    public setDataNascimento(data_nascimento: Date): void {
        this.data_nascimento = data_nascimento;
    }

    // Getter: retorna o endereço do aluno
    public getEndereco(): string {
        return this.endereco;
    }

    // Setter: define um novo endereço para o aluno
    public setEndereco(endereco: string): void {
        this.endereco = endereco;
    }

    // Getter: retorna o e-mail do aluno
    public getEmail(): string {
        return this.email;
    }

    // Setter: define um novo e-mail para o aluno
    public setEmail(email: string): void {
        this.email = email;
    }

    // Getter: retorna o celular do aluno
    public getCelular(): string {
        return this.celular;
    }

    // Setter: define um novo número de celular para o aluno
    public setCelular(celular: string): void {
        this.celular = celular;
    }

    // Getter duplicado do RA (mesma função que getRa acima — provavelmente um erro de duplicidade no código original)
    public getRA(): string {
        return this.ra;
    }

    // Setter duplicado do RA (mesma função que setRa acima)
    public setRA(ra: string): void {
        this.ra = ra;
    }

    // Getter: retorna o status do aluno (true = ativo, false = inativo)
    public getStatusAluno(): boolean {
        return this.status_aluno;
    }

    // Setter: define um novo status para o aluno
    public setStatusAluno(status_aluno: boolean): void {
        this.status_aluno = status_aluno;
    }

    private static toDTO(aluno: any): AlunoDTO {
        return {
            id_aluno: aluno.id_aluno,
            ra: aluno.ra,
            nome: aluno.nome,
            sobrenome: aluno.sobrenome,
            data_nascimento: aluno.data_nascimento,
            endereco: aluno.endereco,
            email: aluno.email,
            celular: aluno.celular,
            status_aluno: aluno.status_aluno
        };
    }

    // ==================== MÉTODOS ESTÁTICOS (operações no banco de dados) ====================
    // Métodos "static" pertencem à classe, não ao objeto — são chamados como Aluno.listarAlunos()

    /**
     * Retorna uma lista com todos os alunos cadastrados no banco de dados
     * 
     * @returns Lista com todos os alunos cadastrados no banco de dados
     */
    // "async" indica que este método é assíncrono — ele pode "esperar" por operações demoradas (como banco de dados)
    // Retorna uma Promise que, quando resolvida, contém um Array de AlunoDTO ou null
    static async listarAlunos(): Promise<AlunoDTO[]> {
        try {
            const query = `SELECT * FROM Aluno WHERE status_aluno = TRUE;`;
            const respostaBD = await database.query(query);

            return respostaBD.rows.map(Aluno.toDTO);
        } catch (error) {
            console.error(`[AlunoModel] Erro ao listar alunos:`, error);
            throw new Error("Não foi possível recuperar a lista de alunos.");
        }
    }

    /**
     * Retorna as informações de um aluno informado pelo ID
     * 
     * @param idAluno Identificador único do aluno
     * @returns Objeto com informações do aluno
     */
    // Recebe o ID do aluno como parâmetro e retorna um AlunoDTO ou null
    static async listarAluno(id_aluno: number): Promise<AlunoDTO> {
        try {
            const querySelectAluno = `SELECT * FROM aluno WHERE id_aluno = $1`;
            const respostaBD = await database.query(querySelectAluno, [id_aluno]);

            // Verifica se o aluno foi encontrado antes de tentar acessar rows[0]
            if (respostaBD.rows.length === 0) {
                throw new Error(`Aluno com ID ${id_aluno} não encontrado.`);
            }

            return Aluno.toDTO(respostaBD.rows[0]);
        } catch (error) {
            console.error(`[AlunoModel] Erro ao buscar aluno (id: ${id_aluno}):`, error);
            throw error;
        }
    }

    /**
    * Cadastra um novo aluno no banco de dados
    * @param aluno Objeto Aluno contendo as informações a serem cadastradas
    * @returns Boolean indicando se o cadastro foi bem-sucedido
    */
    // Recebe um objeto Aluno completo e tenta inseri-lo no banco de dados
    static async cadastrarAluno(aluno: Aluno): Promise<boolean> {
        try {
            const queryInsertAluno = `
            INSERT INTO Aluno (nome, sobrenome, data_nascimento, endereco, email, celular)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_aluno;
        `;

            const valores = [
                aluno.getNome().toUpperCase(),
                aluno.getSobrenome().toUpperCase(),
                aluno.getDataNascimento(),
                aluno.getEndereco().toUpperCase(),
                aluno.getEmail().toLowerCase(),
                aluno.getCelular()
            ];

            const result = await database.query(queryInsertAluno, valores);

            if (result.rows.length === 0) {
                throw new Error("INSERT não retornou ID — cadastro pode ter falhado silenciosamente.");
            }

            console.info(`[AlunoModel] Aluno cadastrado com sucesso. ID: ${result.rows[0].id_aluno}`);
            return true;
        } catch (error) {
            console.error(`[AlunoModel] Erro ao cadastrar aluno:`, error);
            throw error;
        }
    }

    /**
    * Remove um aluno do banco de dados
    * @param id_aluno ID do aluno a ser removido
    * @returns Boolean indicando se a remoção foi bem-sucedida
   */
    // Recebe o ID do aluno e realiza uma "remoção lógica" (não apaga do banco, apenas desativa)
    static async removerAluno(id_aluno: number): Promise<boolean> {
        const client = await database.connect(); // Obtém conexão dedicada para a transação

        try {
            const aluno: AlunoDTO = await Aluno.listarAluno(id_aluno);

            // Aluno existe mas já está inativo — não há nada a fazer
            if (!aluno.status_aluno) {
                return false;
            }

            await client.query("BEGIN"); // Inicia a transação

            await client.query(
                `UPDATE emprestimo SET status_emprestimo_registro = FALSE WHERE id_aluno = $1`,
                [id_aluno]
            );

            const result = await client.query(
                `UPDATE aluno SET status_aluno = FALSE WHERE id_aluno = $1`,
                [id_aluno]
            );

            await client.query("COMMIT"); // Confirma as duas operações juntas

            // rowCount === 0 significa que nenhuma linha foi afetada (não deveria acontecer aqui,
            // mas é uma rede de segurança extra)
            return (result.rowCount ?? 0) > 0;

        } catch (error) {
            await client.query("ROLLBACK"); // Desfaz tudo se qualquer etapa falhar
            console.error(`[AlunoModel] Erro ao remover aluno (id: ${id_aluno}):`, error);
            throw error;
        } finally {
            client.release(); // Devolve a conexão ao pool — SEMPRE executado
        }
    }

    /**
    * Atualiza os dados de um aluno no banco de dados.
    * @param aluno Objeto do tipo Aluno com os novos dados
    * @returns true caso sucesso, false caso erro
    */
    // Recebe um objeto Aluno com os dados atualizados e os salva no banco
    static async atualizarAluno(aluno: Aluno): Promise<boolean> {
        try {
            const alunoConsulta: AlunoDTO = await Aluno.listarAluno(aluno.id_aluno);

            if (!alunoConsulta.status_aluno) {
                return false;
            }

            const queryAtualizarAluno = `
            UPDATE Aluno SET
                nome            = $1,
                sobrenome       = $2,
                data_nascimento = $3,
                endereco        = $4,
                celular         = $5,
                email           = $6
            WHERE id_aluno = $7
        `;

            const valores = [
                aluno.getNome().toUpperCase(),
                aluno.getSobrenome().toUpperCase(),
                aluno.getDataNascimento(),
                aluno.getEndereco().toUpperCase(),
                aluno.getCelular(),
                aluno.getEmail().toLowerCase(),
                aluno.id_aluno
            ];

            const respostaBD = await database.query(queryAtualizarAluno, valores);

            return (respostaBD.rowCount ?? 0) > 0;

        } catch (error) {
            console.error(`[AlunoModel] Erro ao atualizar aluno (id: ${aluno.id_aluno}):`, error);
            throw error;
        }
    }

}

// Exporta a classe Aluno para que possa ser importada e usada em outros arquivos do projeto
export default Aluno;