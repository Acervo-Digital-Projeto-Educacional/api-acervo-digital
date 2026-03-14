import type AlunoDTO from "../dto/AlunoDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Aluno {

    private id_aluno: number = 0;
    private ra: string = "";
    private nome: string;
    private sobrenome: string;
    private data_nascimento: Date;
    private endereco: string;
    private email: string;
    private celular: string;
    private status_aluno: boolean = true;

    constructor(
        _nome: string,
        _sobrenome: string,
        _data_nascimento: Date,
        _endereco: string,
        _email: string,
        _celular?: string
    ) {
        this.nome = _nome;
        this.sobrenome = _sobrenome;
        this.data_nascimento = _data_nascimento;
        this.endereco = _endereco;
        this.email = _email;
        this.celular = _celular ?? "";
    }

    // id_aluno
    public getIdAluno(): number {
        return this.id_aluno;
    }

    public setIdAluno(id_aluno: number): void {
        this.id_aluno = id_aluno;
    }

    // ra
    public getRa(): string {
        return this.ra;
    }

    public setRa(ra: string): void {
        this.ra = ra;
    }

    // nome
    public getNome(): string {
        return this.nome;
    }

    public setNome(nome: string): void {
        this.nome = nome;
    }

    // sobrenome
    public getSobrenome(): string {
        return this.sobrenome;
    }

    public setSobrenome(sobrenome: string): void {
        this.sobrenome = sobrenome;
    }

    // data_nascimento
    public getDataNascimento(): Date {
        return this.data_nascimento;
    }

    public setDataNascimento(data_nascimento: Date): void {
        this.data_nascimento = data_nascimento;
    }

    // endereco
    public getEndereco(): string {
        return this.endereco;
    }

    public setEndereco(endereco: string): void {
        this.endereco = endereco;
    }

    // email
    public getEmail(): string {
        return this.email;
    }

    public setEmail(email: string): void {
        this.email = email;
    }

    // celular
    public getCelular(): string {
        return this.celular;
    }

    public setCelular(celular: string): void {
        this.celular = celular;
    }

    // ra
    public getRA(): string {
        return this.ra;
    }

    public setRA(ra: string): void {
        this.ra = ra;
    }

    // status_aluno
    public getStatusAluno(): boolean {
        return this.status_aluno;
    }

    public setStatusAluno(status_aluno: boolean): void {
        this.status_aluno = status_aluno;
    }

    /**
     * Retorna uma lista com todos os alunos cadastrados no banco de dados
     * 
     * @returns Lista com todos os alunos cadastrados no banco de dados
     */
    static async listarAlunos(): Promise<Array<AlunoDTO> | null> {
        // Criando lista vazia para armazenar os alunos
        let listaDeAlunos: Array<AlunoDTO> = [];

        try {
            // Query para consulta no banco de dados
            const querySelectAluno = `SELECT * FROM Aluno WHERE status_aluno = TRUE;`;

            // executa a query no banco de dados
            const respostaBD = await database.query(querySelectAluno);

            // percorre cada resultado retornado pelo banco de dados
            // aluno é o apelido que demos para cada linha retornada do banco de dados
            respostaBD.rows.forEach((aluno: any) => {

                // criando objeto aluno
                const alunoDTO: AlunoDTO = {
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

                listaDeAlunos.push(alunoDTO);
            });

            // retornado a lista de pessoas para quem chamou a função
            return listaDeAlunos;
        } catch (error) {
            // exibe detalhes do erro no console
            console.log(`Erro ao acessar o modelo: ${error}`);
            // retorna nulo
            return null;
        }
    }

    /**
     * Retorna as informações de um aluno informado pelo ID
     * 
     * @param idAluno Identificador único do aluno
     * @returns Objeto com informações do aluno
     */
    static async listarAluno(idAluno: number): Promise<AlunoDTO | null> {
        try {
            // Bloco try: aqui tentamos executar o código que pode gerar um erro.
            // Se ocorrer algum erro dentro deste bloco, ele será capturado pelo catch.

            // Define a query SQL para selecionar um aluno com base no ID fornecido
            const querySelectAluno = `SELECT * FROM aluno WHERE id_aluno = ${idAluno}`;

            // Executa a consulta no banco de dados e aguarda o resultado
            const respostaBD = await database.query(querySelectAluno);

            // Cria um novo objeto da classe Aluno com os dados retornados do banco
            const alunoDTO: AlunoDTO = {
                id_aluno: respostaBD.rows[0].id_aluno,      // ID do aluno
                nome: respostaBD.rows[0].nome,             // Nome do aluno
                sobrenome: respostaBD.rows[0].sobrenome,        // Sobrenome do aluno
                data_nascimento: respostaBD.rows[0].data_nascimento,  // Data de nascimento do aluno
                endereco: respostaBD.rows[0].endereco,         // Endereço do aluno
                email: respostaBD.rows[0].email,            // E-mail do aluno
                celular: respostaBD.rows[0].celular,           // Celular do aluno
                ra: respostaBD.rows[0].ra,
                status_aluno: respostaBD.rows[0].status_aluno
            };

            // Retorna o objeto aluno preenchido com os dados do banco
            return alunoDTO;
        } catch (error) {
            // Bloco catch: se algum erro ocorrer no bloco try, ele será capturado aqui.
            // Isso evita que o erro interrompa a execução do programa.

            // Exibe uma mensagem de erro no console para facilitar o debug
            console.log(`Erro ao realizar a consulta: ${error}`);

            // Retorna null para indicar que não foi possível buscar o aluno
            return null;
        }
    }

    /**
    * Cadastra um novo aluno no banco de dados
    * @param aluno Objeto Aluno contendo as informações a serem cadastradas
    * @returns Boolean indicando se o cadastro foi bem-sucedido
    */
    static async cadastrarAluno(aluno: Aluno): Promise<boolean> {
        try {
            // Cria a consulta (query) para inserir o registro de um aluno no banco de dados, retorna o ID do aluno que foi criado no final
            const queryInsertAluno = `INSERT INTO Aluno (nome, sobrenome, data_nascimento, endereco, email, celular)
                                            VALUES (
                                                '${aluno.getNome().toUpperCase()}',
                                                '${aluno.getSobrenome().toUpperCase()}',
                                                '${aluno.getDataNascimento()}',
                                                '${aluno.getEndereco().toUpperCase()}',
                                                '${aluno.getEmail().toLowerCase()}',
                                                '${aluno.getCelular()}'
                                            )
                                            RETURNING id_aluno;`;

            // Executa a query no banco de dados e armazena o resultado
            const result = await database.query(queryInsertAluno);

            // verifica se a quantidade de linhas que foram alteradas é maior que 0
            if (result.rows.length > 0) {
                // Exibe a mensagem de sucesso
                console.log(`Aluno cadastrado com sucesso. ID: ${result.rows[0].id_aluno}`);
                // retorna verdadeiro
                return true;
            }

            // caso a consulta não tenha tido sucesso, retorna falso
            return false;
            // captura erro
        } catch (error) {
            // Exibe mensagem com detalhes do erro no console
            console.error(`Erro ao cadastrar aluno: ${error}`);
            // retorna falso
            return false;
        }
    }

    /**
    * Remove um aluno do banco de dados
    * @param id_aluno ID do aluno a ser removido
    * @returns Boolean indicando se a remoção foi bem-sucedida
   */
    static async removerAluno(id_aluno: number): Promise<boolean> {
        try {
            const aluno: AlunoDTO | null = await this.listarAluno(id_aluno);

            if (aluno && aluno.status_aluno) {
                const queryDeleteEmprestimoAluno = `UPDATE emprestimo 
                                                    SET status_emprestimo_registro = FALSE
                                                    WHERE id_aluno=${id_aluno};`;
                await database.query(queryDeleteEmprestimoAluno);

                const queryDeleteAluno = `UPDATE aluno 
                                        SET status_aluno = FALSE
                                        WHERE id_aluno=${id_aluno};`;

                // Captura o resultado e usa await ao invés de .then()
                const result = await database.query(queryDeleteAluno);

                // Retorna true ou false baseado no rowCount
                return result.rowCount != 0;
            }

            return false;

        } catch (error) {
            console.log(`Erro na consulta: ${error}`);
            return false;
        }
    }

    /**
    * Atualiza os dados de um aluno no banco de dados.
    * @param aluno Objeto do tipo Aluno com os novos dados
    * @returns true caso sucesso, false caso erro
    */
    static async atualizarAluno(aluno: Aluno): Promise<boolean> {
        try {
            // recupera o objeto do aluno a ser atualizado
            const alunoConsulta: AlunoDTO | null = await this.listarAluno(aluno.id_aluno);

            if (alunoConsulta && alunoConsulta.status_aluno) {
                // Construção da query SQL para atualizar os dados do aluno no banco de dados.
                const queryAtualizarAluno = `UPDATE Aluno SET 
                                                nome = '${aluno.getNome().toUpperCase()}', 
                                                sobrenome = '${aluno.getSobrenome().toUpperCase()}',
                                                data_nascimento = '${aluno.getDataNascimento()}', 
                                                endereco = '${aluno.getEndereco().toUpperCase()}',
                                                celular = '${aluno.getCelular()}', 
                                                email = '${aluno.getEmail().toLowerCase()}'                                            
                                                WHERE id_aluno = ${aluno.id_aluno}`;

                // Executa a query de atualização e verifica se a operação foi bem-sucedida.
                const respostaBD = await database.query(queryAtualizarAluno)

                if (respostaBD.rowCount != 0) {
                    return true;
                }
            }

            // Retorna o resultado da operação para quem chamou a função.
            return false;
        } catch (error) {
            // Em caso de erro na consulta, exibe o erro no console e retorna false.
            console.log(`Erro na consulta: ${error}`);
            return false;
        }
    }

}

export default Aluno;