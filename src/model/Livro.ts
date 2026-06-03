// Importa o tipo LivroDTO, que define a "forma" dos dados de um livro (como um molde/contrato)
// DTO (Data Transfer Object) é um objeto simples usado para trafegar dados entre camadas da aplicação
// Diferente da classe Livro, o LivroDTO não tem métodos — é apenas um objeto com campos
import type LivroDTO from "../dto/LivroDTO.js";

// Importa a classe DatabaseModel, responsável por gerenciar a conexão com o banco de dados
import { DatabaseModel } from "./DatabaseModel.js";

// Cria uma instância do DatabaseModel e acessa o pool de conexões com o banco de dados
// O "pool" é um conjunto de conexões reutilizáveis — mais eficiente que abrir e fechar uma conexão a cada query
// Ex: em vez de conectar ao banco 100 vezes para 100 requisições, o pool mantém conexões abertas e as reutiliza
const database = new DatabaseModel().pool;

// Define a classe Livro, que representa a entidade livro no sistema de biblioteca
// É aqui que ficam tanto os atributos do livro quanto os métodos que acessam o banco de dados
class Livro {

    // ==================== ATRIBUTOS PRIVADOS ====================
    // Atributos privados só podem ser acessados dentro da própria classe
    // Para lê-los ou alterá-los de fora, usamos os getters e setters definidos abaixo

    private id_livro: number = 0;                          // ID único gerado pelo banco — começa em 0 pois ainda não foi salvo
    private titulo: string;
    private autor: string;
    private editora: string;
    private ano_publicacao: string;                        // String para suportar formatos como "2024" ou "s.d."
    private isbn: string;                                  // Código ISBN — identificador único internacional de livros
    private quant_total: number;                           // Total de exemplares no acervo
    private quant_disponivel: number;                      // Exemplares disponíveis para empréstimo no momento
    private valor_aquisicao: number;                       // Valor pago para adquirir o livro
    private status_livro_emprestado: string = "Disponível"; // Status de disponibilidade: "Disponível" ou "Emprestado"
    private status_livro: boolean = false;                 // true = ativo no sistema, false = removido logicamente

    // ==================== CONSTRUTOR ====================
    // O construtor é chamado automaticamente ao criar um novo objeto com "new Livro(...)"
    // Os parâmetros com "_" na frente são uma convenção para não conflitar com os nomes dos atributos
    // ⚠️ Atenção: o parâmetro "_quant_aquisicao" é recebido mas não possui atributo correspondente na classe
    constructor(
        _titulo: string,
        _autor: string,
        _editora: string,
        _ano_publicacao: string,
        _isbn: string,
        _quant_total: number,
        _quant_disponivel: number,
        _quant_aquisicao: number,  // Recebido para manter compatibilidade com o DTO, mas não armazenado na classe
        _valor_aquisicao: number
    ) {
        this.titulo = _titulo;
        this.autor = _autor;
        this.editora = _editora;
        this.ano_publicacao = _ano_publicacao;
        this.isbn = _isbn;
        this.quant_total = _quant_total;
        this.quant_disponivel = _quant_disponivel;
        this.valor_aquisicao = _valor_aquisicao;
    }

    // ==================== GETTERS E SETTERS ====================
    // Getters permitem ler atributos privados de fora da classe
    // Setters permitem alterar atributos privados de fora da classe
    // Essa separação é um princípio de encapsulamento — protege os dados de alterações acidentais

    public getIdLivro(): number { return this.id_livro; }
    public setIdLivro(value: number): void { this.id_livro = value; }

    public getTitulo(): string { return this.titulo; }
    public setTitulo(value: string): void { this.titulo = value; }

    public getAutor(): string { return this.autor; }
    public setAutor(value: string): void { this.autor = value; }

    public getEditora(): string { return this.editora; }
    public setEditora(value: string): void { this.editora = value; }

    public getAnoPublicacao(): string { return this.ano_publicacao; }
    public setAnoPublicacao(value: string): void { this.ano_publicacao = value; }

    public getIsbn(): string { return this.isbn; }
    public setIsbn(value: string): void { this.isbn = value; }

    public getQuantTotal(): number { return this.quant_total; }
    public setQuantTotal(value: number): void { this.quant_total = value; }

    public getQuantDisponivel(): number { return this.quant_disponivel; }
    public setQuantDisponivel(value: number): void { this.quant_disponivel = value; }

    public getValorAquisicao(): number { return this.valor_aquisicao; }
    public setValorAquisicao(value: number): void { this.valor_aquisicao = value; }

    public getStatusLivroEmprestado(): string { return this.status_livro_emprestado; }
    public setStatusLivroEmprestado(value: string): void { this.status_livro_emprestado = value; }

    public getStatusLivro(): boolean { return this.status_livro; }
    public setStatusLivro(value: boolean): void { this.status_livro = value; }

    // ==================== MÉTODO PRIVADO: toDTO ====================
    /**
     * Converte uma linha bruta retornada pelo banco de dados em um objeto LivroDTO estruturado.
     * Centralizar o mapeamento aqui evita repetição de código nos métodos de consulta.
     *
     * @param livro Linha retornada pelo banco de dados (tipagem any pois vem do driver do PostgreSQL)
     * @returns Objeto LivroDTO com os campos mapeados
     */
    // É "private static" pois só é usado internamente nesta classe, sem precisar de um objeto instanciado
    private static toDTO(livro: any): LivroDTO {
        return {
            id_livro: livro.id_livro,
            titulo: livro.titulo,
            autor: livro.autor,
            editora: livro.editora,
            ano_publicacao: livro.ano_publicacao,
            isbn: livro.isbn,
            quant_total: livro.quant_total,
            quant_disponivel: livro.quant_disponivel,
            quant_aquisicao: livro.quant_aquisicao,
            valor_aquisicao: livro.valor_aquisicao,
            status_livro_emprestado: livro.status_livro_emprestado,
            status_livro: livro.status_livro
        };
    }

    // ==================== MÉTODOS ESTÁTICOS (acesso ao banco de dados) ====================
    // Métodos "static" pertencem à classe, não a um objeto específico
    // São chamados diretamente na classe: Livro.listarLivros() — sem precisar de "new Livro()"
    // Isso faz sentido aqui pois as operações de banco não dependem de um livro específico instanciado

    /**
     * Busca e retorna todos os livros com status ativo no banco de dados.
     * Livros removidos logicamente (status_livro = FALSE) não são incluídos no resultado.
     *
     * @returns Promise com array de LivroDTO contendo todos os livros ativos.
     *          Retorna array vazio se não houver livros cadastrados.
     * @throws Error se ocorrer falha na consulta ao banco de dados.
     */
    static async listarLivros(): Promise<LivroDTO[]> {
        try {
            // Busca apenas livros com status_livro = TRUE (ativos)
            // Livros removidos logicamente (status = FALSE) não aparecem na listagem
            const querySelectLivro = `SELECT * FROM Livro WHERE status_livro = TRUE;`;
            const respostaBD = await database.query(querySelectLivro);

            // .map() percorre cada linha retornada e transforma em LivroDTO usando o método toDTO
            // É equivalente a um forEach que cria um array novo — mais idiomático e sem variável mutável
            return respostaBD.rows.map(Livro.toDTO);

        } catch (error) {
            console.error(`[LivroModel] Erro ao listar livros:`, error);
            throw error;
        }
    }

    /**
     * Busca e retorna os dados de um livro específico pelo seu ID.
     *
     * @param id_livro Identificador único do livro no banco de dados.
     * @returns Promise com LivroDTO contendo os dados do livro encontrado.
     * @throws Error com mensagem "não encontrado" se nenhum livro com o ID informado existir.
     * @throws Error se ocorrer falha na consulta ao banco de dados.
     */
    static async listarLivro(id_livro: number): Promise<LivroDTO> {
        try {
            // "$1" é um placeholder de prepared statement — o valor real é passado no array [id_livro]
            // Isso protege contra SQL Injection: o banco trata o valor como dado, nunca como código SQL
            const querySelectLivro = `SELECT * FROM livro WHERE id_livro = $1`;
            const respostaBD = await database.query(querySelectLivro, [id_livro]);

            // rows.length === 0 significa que nenhuma linha foi retornada — o ID não existe no banco
            // Sem esta verificação, acessar rows[0] abaixo causaria um TypeError silencioso
            if (respostaBD.rows.length === 0) {
                throw new Error(`Livro com ID ${id_livro} não encontrado.`);
            }

            // rows[0] acessa a primeira (e única) linha retornada pela query
            return Livro.toDTO(respostaBD.rows[0]);

        } catch (error) {
            console.error(`[LivroModel] Erro ao buscar livro (id: ${id_livro}):`, error);
            // "throw error" relança o erro para que o controller possa tratá-lo
            // Isso permite diferenciar "não encontrado" (404) de "erro de banco" (500) no controller
            throw error;
        }
    }

    /**
     * Cadastra um novo livro no banco de dados.
     * Título, autor, editora, ISBN e status são salvos em maiúsculas para padronização.
     *
     * @param livro Objeto Livro contendo os dados a serem cadastrados.
     * @returns Promise com true se o cadastro foi realizado com sucesso.
     * @throws Error se o INSERT não retornar o ID gerado ou ocorrer falha no banco.
     */
    static async cadastrarLivro(livro: Livro): Promise<boolean> {
        try {
            // "RETURNING id_livro" faz o banco retornar o ID gerado automaticamente após o INSERT
            // Isso confirma que o registro foi criado e nos dá o ID para exibir no log
            const queryInsertLivro = `
                INSERT INTO Livro (titulo, autor, editora, ano_publicacao, isbn, quant_total, quant_disponivel, valor_aquisicao, status_livro_emprestado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id_livro;
            `;

            // Os valores são passados separadamente — o banco substitui $1, $2... na ordem do array
            // .toUpperCase() padroniza os textos antes de salvar no banco
            const valores = [
                livro.getTitulo().toUpperCase(),
                livro.getAutor().toUpperCase(),
                livro.getEditora().toUpperCase(),
                livro.getAnoPublicacao().toUpperCase(),
                livro.getIsbn().toUpperCase(),
                livro.getQuantTotal(),
                livro.getQuantDisponivel(),
                livro.getValorAquisicao(),
                livro.getStatusLivroEmprestado().toUpperCase()
            ];

            const result = await database.query(queryInsertLivro, valores);

            // Se o RETURNING não retornou nenhuma linha, o INSERT falhou silenciosamente
            if (result.rows.length === 0) {
                throw new Error("INSERT não retornou ID — cadastro pode ter falhado silenciosamente.");
            }

            console.info(`[LivroModel] Livro cadastrado com sucesso. ID: ${result.rows[0].id_livro}`);
            return true;

        } catch (error) {
            console.error(`[LivroModel] Erro ao cadastrar livro:`, error);
            throw error;
        }
    }

    /**
     * Remove logicamente um livro do sistema, desativando também todos os seus empréstimos.
     * Utiliza transação para garantir que as duas operações ocorram juntas ou nenhuma ocorra.
     * Não apaga o registro do banco — apenas define status_livro = FALSE.
     *
     * @param id_livro ID do livro a ser removido.
     * @returns Promise com true se a remoção foi bem-sucedida, false se o livro já estava inativo.
     * @throws Error se o livro não for encontrado ou ocorrer falha no banco de dados.
     */
    static async removerLivro(id_livro: number): Promise<boolean> {
        // "database.connect()" obtém uma conexão dedicada do pool — necessária para usar transações
        // Com o pool padrão (database.query), cada query pode usar uma conexão diferente
        // A transação exige que todas as queries usem a mesma conexão
        const client = await database.connect();

        try {
            const livro: LivroDTO = await Livro.listarLivro(id_livro);

            // Se o livro já está inativo, não há nada a fazer — retorna false sem erro
            if (!livro.status_livro) {
                return false;
            }

            // BEGIN inicia a transação — a partir daqui, as queries são agrupadas como uma unidade
            // Ou todas são confirmadas (COMMIT) ou todas são desfeitas (ROLLBACK)
            await client.query("BEGIN");

            // Primeiro desativa os empréstimos relacionados ao livro
            // A ordem importa: desativar os empréstimos antes do livro garante consistência nos dados
            await client.query(
                `UPDATE emprestimo SET status_emprestimo_registro = FALSE WHERE id_livro = $1`,
                [id_livro]
            );

            // Depois desativa o próprio livro
            const result = await client.query(
                `UPDATE livro SET status_livro = FALSE WHERE id_livro = $1`,
                [id_livro]
            );

            // COMMIT confirma as duas operações juntas — só agora as mudanças são salvas no banco
            await client.query("COMMIT");

            // rowCount indica quantas linhas foram afetadas pelo UPDATE
            // "?? 0" trata o caso em que rowCount é null (o que não deveria ocorrer aqui, mas é uma segurança)
            return (result.rowCount ?? 0) > 0;

        } catch (error) {
            // Se qualquer etapa falhar, ROLLBACK desfaz tudo — banco volta ao estado anterior
            // Isso evita situações onde os empréstimos foram desativados mas o livro não (ou vice-versa)
            await client.query("ROLLBACK");
            console.error(`[LivroModel] Erro ao remover livro (id: ${id_livro}):`, error);
            throw error;
        } finally {
            // "finally" é executado SEMPRE — com erro ou sem erro
            // client.release() devolve a conexão ao pool para ser reutilizada por outras requisições
            // Sem isso, a conexão ficaria ocupada indefinidamente e o pool se esgotaria com o tempo
            client.release();
        }
    }

    /**
     * Atualiza os dados cadastrais de um livro existente no banco de dados.
     * Verifica se o livro existe e está ativo antes de executar o UPDATE.
     *
     * @param livro Objeto Livro com os novos dados. O método getIdLivro() deve retornar um ID válido
     *              para identificar qual registro será atualizado no banco.
     * @returns Promise com true se a atualização foi bem-sucedida,
     *          false se o livro estiver inativo.
     * @throws Error se o livro não for encontrado ou ocorrer falha no banco de dados.
     */
    static async atualizarLivro(livro: Livro): Promise<boolean> {
        try {
            // Verifica se o livro existe e está ativo antes de tentar atualizar
            // Se listarLivro lançar erro ("não encontrado"), ele será propagado automaticamente
            const livroConsulta: LivroDTO = await Livro.listarLivro(livro.getIdLivro());

            // Livro inativo não pode ser atualizado — retorna false sem erro
            if (!livroConsulta.status_livro) {
                return false;
            }

            // Cada $n corresponde ao valor na mesma posição do array "valores" abaixo
            // O $10 no WHERE garante que apenas o livro com o ID correto seja atualizado
            const queryAtualizarLivro = `
                UPDATE Livro SET
                    titulo                  = $1,
                    autor                   = $2,
                    editora                 = $3,
                    ano_publicacao          = $4,
                    isbn                    = $5,
                    quant_total             = $6,
                    quant_disponivel        = $7,
                    valor_aquisicao         = $8,
                    status_livro_emprestado = $9
                WHERE id_livro = $10
            `;

            const valores = [
                livro.getTitulo().toUpperCase(),
                livro.getAutor().toUpperCase(),
                livro.getEditora().toUpperCase(),
                livro.getAnoPublicacao().toUpperCase(),
                livro.getIsbn().toUpperCase(),
                livro.getQuantTotal(),
                livro.getQuantDisponivel(),
                livro.getValorAquisicao(),
                livro.getStatusLivroEmprestado().toUpperCase(),
                livro.getIdLivro()  // Usado no WHERE — identifica qual livro será atualizado
            ];

            const respostaBD = await database.query(queryAtualizarLivro, valores);

            // rowCount > 0 confirma que pelo menos uma linha foi alterada no banco
            return (respostaBD.rowCount ?? 0) > 0;

        } catch (error) {
            console.error(`[LivroModel] Erro ao atualizar livro (id: ${livro.getIdLivro()}):`, error);
            throw error;
        }
    }
}

// Exporta a classe para que possa ser importada nos controllers e outros arquivos do projeto
// "export default" permite importar com qualquer nome: import Livro from "./Livro.js"
export default Livro;