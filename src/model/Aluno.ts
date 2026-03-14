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
    static async listarAlunos(): Promise<Array<Aluno> | null> {
        // Criando lista vazia para armazenar os alunos
        let listaDeAlunos: Array<Aluno> = [];

        try {
            // Query para consulta no banco de dados
            const querySelectAluno = `SELECT * FROM Aluno WHERE status_aluno = TRUE;`;

            // executa a query no banco de dados
            const respostaBD = await database.query(querySelectAluno);

            // percorre cada resultado retornado pelo banco de dados
            // aluno é o apelido que demos para cada linha retornada do banco de dados
            respostaBD.rows.forEach((aluno: any) => {

                // criando objeto aluno
                let novoAluno = new Aluno(
                    aluno.nome,
                    aluno.sobrenome,
                    aluno.data_nascimento,
                    aluno.endereco,
                    aluno.email,
                    aluno.celular
                );
                // adicionando o ID ao objeto
                novoAluno.setIdAluno(aluno.id_aluno);
                novoAluno.setRA(aluno.ra);
                novoAluno.setStatusAluno(aluno.status_aluno);

                // adicionando a pessoa na lista
                listaDeAlunos.push(novoAluno);
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
    static async listarAluno(idAluno: number): Promise<Aluno | null> {
        try {
            // Bloco try: aqui tentamos executar o código que pode gerar um erro.
            // Se ocorrer algum erro dentro deste bloco, ele será capturado pelo catch.

            // Define a query SQL para selecionar um aluno com base no ID fornecido
            const querySelectAluno = `SELECT * FROM aluno WHERE id_aluno = ${idAluno}`;

            // Executa a consulta no banco de dados e aguarda o resultado
            const respostaBD = await database.query(querySelectAluno);

            // Cria um novo objeto da classe Aluno com os dados retornados do banco
            let aluno = new Aluno(
                respostaBD.rows[0].nome,             // Nome do aluno
                respostaBD.rows[0].sobrenome,        // Sobrenome do aluno
                respostaBD.rows[0].data_nascimento,  // Data de nascimento do aluno
                respostaBD.rows[0].endereco,         // Endereço do aluno
                respostaBD.rows[0].email,            // E-mail do aluno
                respostaBD.rows[0].celular           // Celular do aluno
            );

            // Define o ID do aluno no objeto Aluno
            aluno.setIdAluno(respostaBD.rows[0].id_aluno);

            // Define o RA (Registro Acadêmico) do aluno
            aluno.setRA(respostaBD.rows[0].ra);

            // Define o status do aluno (ativo, inativo, etc.)
            aluno.setStatusAluno(respostaBD.rows[0].status_aluno);

            // Retorna o objeto aluno preenchido com os dados do banco
            return aluno;
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
}

export default Aluno;