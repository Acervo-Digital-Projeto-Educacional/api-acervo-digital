// Importa o tipo AlunoDTO, que define a "forma" dos dados de um aluno (como um molde/contrato)
// DTO (Data Transfer Object) é um objeto simples usado para trafegar dados entre camadas da aplicação
// Diferente da classe Aluno, o AlunoDTO não tem métodos — é apenas um objeto com campos
import type AlunoDTO from "../dto/AlunoDTO.js";

// Importa a classe DatabaseModel, responsável por gerenciar a conexão com o banco de dados
import { DatabaseModel } from "./DatabaseModel.js";

// Cria uma instância do DatabaseModel e acessa o pool de conexões com o banco de dados
// O "pool" é um conjunto de conexões reutilizáveis — mais eficiente que abrir e fechar uma conexão a cada query
// Ex: em vez de conectar ao banco 100 vezes para 100 requisições, o pool mantém conexões abertas e as reutiliza
const database = new DatabaseModel().pool;

// Define a classe Aluno, que representa a entidade aluno no sistema
// É aqui que ficam tanto os atributos do aluno quanto os métodos que acessam o banco de dados
class Aluno {

    // ==================== ATRIBUTOS PRIVADOS ====================
    // Atributos privados só podem ser acessados dentro da própria classe
    // Para lê-los ou alterá-los de fora, usamos os getters e setters definidos abaixo

    private id_aluno: number = 0;         // ID único gerado pelo banco — começa em 0 pois ainda não foi salvo
    private ra: string = "";              // Registro Acadêmico — preenchido pelo banco após o cadastro
    private nome: string;
    private sobrenome: string;
    private data_nascimento: Date;
    private endereco: string;
    private email: string;
    private celular: string;
    private status_aluno: boolean = true; // true = ativo, false = inativo (removido logicamente)

    // ==================== CONSTRUTOR ====================
    // O construtor é chamado automaticamente ao criar um novo objeto com "new Aluno(...)"
    // Os parâmetros com "_" na frente são uma convenção para não conflitar com os nomes dos atributos
    constructor(
        _nome: string,
        _sobrenome: string,
        _data_nascimento: Date,
        _endereco: string,
        _email: string,
        _celular?: string   // O "?" torna o parâmetro opcional — pode ser omitido na criação do objeto
    ) {
        this.nome = _nome;
        this.sobrenome = _sobrenome;
        this.data_nascimento = _data_nascimento;
        this.endereco = _endereco;
        this.email = _email;
        // "??" é o operador "nullish coalescing": retorna o valor da direita se o da esquerda for null/undefined
        // Se _celular não foi informado (undefined), usa string vazia como padrão
        this.celular = _celular ?? "";
    }

    // ==================== GETTERS E SETTERS ====================
    // Getters permitem ler atributos privados de fora da classe
    // Setters permitem alterar atributos privados de fora da classe
    // Essa separação é um princípio de encapsulamento — protege os dados de alterações acidentais

    public getIdAluno(): number { return this.id_aluno; }
    public setIdAluno(id_aluno: number): void { this.id_aluno = id_aluno; }

    public getRa(): string { return this.ra; }
    public setRa(ra: string): void { this.ra = ra; }

    public getNome(): string { return this.nome; }
    public setNome(nome: string): void { this.nome = nome; }

    public getSobrenome(): string { return this.sobrenome; }
    public setSobrenome(sobrenome: string): void { this.sobrenome = sobrenome; }

    public getDataNascimento(): Date { return this.data_nascimento; }
    public setDataNascimento(data_nascimento: Date): void { this.data_nascimento = data_nascimento; }

    public getEndereco(): string { return this.endereco; }
    public setEndereco(endereco: string): void { this.endereco = endereco; }

    public getEmail(): string { return this.email; }
    public setEmail(email: string): void { this.email = email; }

    public getCelular(): string { return this.celular; }
    public setCelular(celular: string): void { this.celular = celular; }

    public getStatusAluno(): boolean { return this.status_aluno; }
    public setStatusAluno(status_aluno: boolean): void { this.status_aluno = status_aluno; }

    // ==================== MÉTODO PRIVADO: toDTO ====================
    /**
     * Converte uma linha bruta retornada pelo banco de dados em um objeto AlunoDTO estruturado.
     * Centralizar o mapeamento aqui evita repetição de código nos métodos de consulta.
     * 
     * @param aluno Linha retornada pelo banco de dados (tipagem any pois vem do driver do PostgreSQL)
     * @returns Objeto AlunoDTO com os campos mapeados
     */
    // É "private static" pois só é usado internamente nesta classe, sem precisar de um objeto instanciado
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

    // ==================== MÉTODOS ESTÁTICOS (acesso ao banco de dados) ====================
    // Métodos "static" pertencem à classe, não a um objeto específico
    // São chamados diretamente na classe: Aluno.listarAlunos() — sem precisar de "new Aluno()"
    // Isso faz sentido aqui pois as operações de banco não dependem de um aluno específico instanciado

    /**
     * Busca e retorna todos os alunos com status ativo no banco de dados.
     * Alunos removidos logicamente (status_aluno = FALSE) não são incluídos no resultado.
     * 
     * @returns Promise com array de AlunoDTO contendo todos os alunos ativos.
     *          Retorna array vazio se não houver alunos cadastrados.
     * @throws Error se ocorrer falha na consulta ao banco de dados.
     */
    static async listarAlunos(): Promise<AlunoDTO[]> {
        try {
            // Busca apenas alunos com status_aluno = TRUE (ativos)
            // Alunos removidos logicamente (status = FALSE) não aparecem na listagem
            const query = `SELECT * FROM Aluno WHERE status_aluno = TRUE;`;
            const respostaBD = await database.query(query);

            // .map() percorre cada linha retornada e transforma em AlunoDTO usando o método toDTO
            // É equivalente a um forEach que cria um array novo — mais idiomático e sem variável mutável
            return respostaBD.rows.map(Aluno.toDTO);
        } catch (error) {
            console.error(`[AlunoModel] Erro ao listar alunos:`, error);
            throw error;
        }
    }

    /**
     * Busca e retorna os dados de um aluno específico pelo seu ID.
     * 
     * @param id_aluno Identificador único do aluno no banco de dados.
     * @returns Promise com AlunoDTO contendo os dados do aluno encontrado.
     * @throws Error com mensagem "não encontrado" se nenhum aluno com o ID informado existir.
     * @throws Error se ocorrer falha na consulta ao banco de dados.
     */
    static async listarAluno(id_aluno: number): Promise<AlunoDTO> {
        try {
            // "$1" é um placeholder de prepared statement — o valor real é passado no array [id_aluno]
            // Isso protege contra SQL Injection: o banco trata o valor como dado, nunca como código SQL
            const querySelectAluno = `SELECT * FROM aluno WHERE id_aluno = $1`;
            const respostaBD = await database.query(querySelectAluno, [id_aluno]);

            // rows.length === 0 significa que nenhuma linha foi retornada — o ID não existe no banco
            // Sem esta verificação, acessar rows[0] abaixo causaria um TypeError silencioso
            if (respostaBD.rows.length === 0) {
                throw new Error(`Aluno com ID ${id_aluno} não encontrado.`);
            }

            // rows[0] acessa a primeira (e única) linha retornada pela query
            return Aluno.toDTO(respostaBD.rows[0]);
        } catch (error) {
            console.error(`[AlunoModel] Erro ao buscar aluno (id: ${id_aluno}):`, error);
            // "throw error" relança o erro para que o controller possa tratá-lo
            // Isso permite diferenciar "não encontrado" (404) de "erro de banco" (500) no controller
            throw error;
        }
    }

    /**
     * Cadastra um novo aluno no banco de dados.
     * Nome, sobrenome e endereço são salvos em maiúsculas; e-mail em minúsculas.
     * 
     * @param aluno Objeto Aluno contendo os dados a serem cadastrados.
     * @returns Promise com true se o cadastro foi realizado com sucesso.
     * @throws Error se o INSERT não retornar o ID gerado ou ocorrer falha no banco.
     */
    static async cadastrarAluno(aluno: Aluno): Promise<boolean> {
        try {
            // "RETURNING id_aluno" faz o banco retornar o ID gerado automaticamente após o INSERT
            // Isso confirma que o registro foi criado e nos dá o ID para exibir no log
            const queryInsertAluno = `
                INSERT INTO Aluno (nome, sobrenome, data_nascimento, endereco, email, celular)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id_aluno;
            `;

            // Os valores são passados separadamente — o banco substitui $1, $2... na ordem do array
            // .toUpperCase() e .toLowerCase() padronizam os dados antes de salvar no banco
            const valores = [
                aluno.getNome().toUpperCase(),
                aluno.getSobrenome().toUpperCase(),
                aluno.getDataNascimento(),
                aluno.getEndereco().toUpperCase(),
                aluno.getEmail().toLowerCase(),
                aluno.getCelular()
            ];

            const result = await database.query(queryInsertAluno, valores);

            // Se o RETURNING não retornou nenhuma linha, o INSERT falhou silenciosamente
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
     * Remove logicamente um aluno do sistema, desativando também todos os seus empréstimos.
     * Utiliza transação para garantir que as duas operações ocorram juntas ou nenhuma ocorra.
     * Não apaga o registro do banco — apenas define status_aluno = FALSE.
     * 
     * @param id_aluno ID do aluno a ser removido.
     * @returns Promise com true se a remoção foi bem-sucedida, false se o aluno já estava inativo.
     * @throws Error se o aluno não for encontrado ou ocorrer falha no banco de dados.
     */
    static async removerAluno(id_aluno: number): Promise<boolean> {
        // "database.connect()" obtém uma conexão dedicada do pool — necessária para usar transações
        // Com o pool padrão (database.query), cada query pode usar uma conexão diferente
        // A transação exige que todas as queries usem a mesma conexão
        const client = await database.connect();

        try {
            const aluno: AlunoDTO = await Aluno.listarAluno(id_aluno);

            // Se o aluno já está inativo, não há nada a fazer — retorna false sem erro
            if (!aluno.status_aluno) {
                return false;
            }

            // BEGIN inicia a transação — a partir daqui, as queries são agrupadas como uma unidade
            // Ou todas são confirmadas (COMMIT) ou todas são desfeitas (ROLLBACK)
            await client.query("BEGIN");

            // Primeiro desativa os empréstimos relacionados ao aluno
            // A ordem importa: desativar os empréstimos antes do aluno garante consistência nos dados
            await client.query(
                `UPDATE emprestimo SET status_emprestimo_registro = FALSE WHERE id_aluno = $1`,
                [id_aluno]
            );

            // Depois desativa o próprio aluno
            const result = await client.query(
                `UPDATE aluno SET status_aluno = FALSE WHERE id_aluno = $1`,
                [id_aluno]
            );

            // COMMIT confirma as duas operações juntas — só agora as mudanças são salvas no banco
            await client.query("COMMIT");

            // rowCount indica quantas linhas foram afetadas pelo UPDATE
            // "?? 0" trata o caso em que rowCount é null (o que não deveria ocorrer aqui, mas é uma segurança)
            return (result.rowCount ?? 0) > 0;

        } catch (error) {
            // Se qualquer etapa falhar, ROLLBACK desfaz tudo — banco volta ao estado anterior
            // Isso evita situações onde os empréstimos foram desativados mas o aluno não (ou vice-versa)
            await client.query("ROLLBACK");
            console.error(`[AlunoModel] Erro ao remover aluno (id: ${id_aluno}):`, error);
            throw error;
        } finally {
            // "finally" é executado SEMPRE — com erro ou sem erro
            // client.release() devolve a conexão ao pool para ser reutilizada por outras requisições
            // Sem isso, a conexão ficaria ocupada indefinidamente e o pool se esgotaria com o tempo
            client.release();
        }
    }

    /**
     * Atualiza os dados cadastrais de um aluno existente no banco de dados.
     * Verifica se o aluno existe e está ativo antes de executar o UPDATE.
     * 
     * @param aluno Objeto Aluno com os novos dados. O atributo id_aluno deve estar preenchido
     *              para identificar qual registro será atualizado no banco.
     * @returns Promise com true se a atualização foi bem-sucedida,
     *          false se o aluno estiver inativo.
     * @throws Error se o aluno não for encontrado ou ocorrer falha no banco de dados.
     */
    static async atualizarAluno(aluno: Aluno): Promise<boolean> {
        try {
            // Verifica se o aluno existe e está ativo antes de tentar atualizar
            // Se listarAluno lançar erro ("não encontrado"), ele será propagado automaticamente
            const alunoConsulta: AlunoDTO = await Aluno.listarAluno(aluno.id_aluno);

            // Aluno inativo não pode ser atualizado — retorna false sem erro
            if (!alunoConsulta.status_aluno) {
                return false;
            }

            // Cada $n corresponde ao valor na mesma posição do array "valores" abaixo
            // O $7 no WHERE garante que apenas o aluno com o ID correto seja atualizado
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
                aluno.id_aluno  // Usado no WHERE — identifica qual aluno será atualizado
            ];

            const respostaBD = await database.query(queryAtualizarAluno, valores);

            // rowCount > 0 confirma que pelo menos uma linha foi alterada no banco
            return (respostaBD.rowCount ?? 0) > 0;

        } catch (error) {
            console.error(`[AlunoModel] Erro ao atualizar aluno (id: ${aluno.id_aluno}):`, error);
            throw error;
        }
    }
}

// Exporta a classe para que possa ser importada nos controllers e outros arquivos do projeto
// "export default" permite importar com qualquer nome: import Aluno from "./Aluno.js"
export default Aluno;