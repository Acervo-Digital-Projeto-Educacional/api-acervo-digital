import type LivroDTO from "../dto/LivroDTO.js";
import { DatabaseModel } from "./DatabaseModel.js";

const database = new DatabaseModel().pool;

class Livro {
    private id_livro: number = 0;
    private titulo: string;
    private autor: string;
    private editora: string;
    private ano_publicacao: string;
    private isbn: string;
    private quant_total: number;
    private quant_disponivel: number;
    private valor_aquisicao: number;
    private status_livro_emprestado: string = "Disponível";
    private status_livro: boolean = false;

    constructor(
        _titulo: string,
        _autor: string,
        _editora: string,
        _ano_publicacao: string,
        _isbn: string,
        _quant_total: number,
        _quant_disponivel: number,
        _quant_aquisicao: number,
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

    // Getters e Setters
    public getIdLivro(): number {
        return this.id_livro;
    }

    public setIdLivro(value: number) {
        this.id_livro = value;
    }

    public getTitulo(): string {
        return this.titulo;
    }

    public setTitulo(value: string) {
        this.titulo = value;
    }

    public getAutor(): string {
        return this.autor;
    }

    public setAutor(value: string) {
        this.autor = value;
    }

    public getEditora(): string {
        return this.editora;
    }

    public setEditora(value: string) {
        this.editora = value;
    }

    public getAnoPublicacao(): string {
        return this.ano_publicacao;
    }

    public setAnoPublicacao(value: string) {
        this.ano_publicacao = value;
    }

    public getIsbn(): string {
        return this.isbn;
    }

    public setIsbn(value: string) {
        this.isbn = value;
    }

    public getQuantTotal(): number {
        return this.quant_total;
    }

    public setQuantTotal(value: number) {
        this.quant_total = value;
    }

    public getQuantDisponivel(): number {
        return this.quant_disponivel;
    }

    public setQuantDisponivel(value: number) {
        this.quant_disponivel = value;
    }

    public getValorAquisicao(): number {
        return this.valor_aquisicao;
    }

    public setValorAquisicao(value: number) {
        this.valor_aquisicao = value;
    }

    public getStatusLivroEmprestado(): string {
        return this.status_livro_emprestado;
    }

    public setStatusLivroEmprestado(value: string) {
        this.status_livro_emprestado = value;
    }

    public getStatusLivro(): boolean {
        return this.status_livro;
    }

    public setStatusLivro(value: boolean) {
        this.status_livro = value;
    }

    /**
     * Retorna uma lista com todos os livros cadastrados no banco de dados
     * 
     * @returns Lista com todos os livros cadastrados no banco de dados
     */
    static async listarLivros(): Promise<Array<LivroDTO> | null> {
        // Criando lista vazia para armazenar os livros
        let listaDeLivros: Array<LivroDTO> = [];

        try {
            // Query para consulta no banco de dados
            const querySelectLivro = `SELECT * FROM Livro WHERE status_livro = TRUE;`;

            // executa a query no banco de dados
            const respostaBD = await database.query(querySelectLivro);

            // percorre cada resultado retornado pelo banco de dados
            // livro é o apelido que demos para cada linha retornada do banco de dados
            respostaBD.rows.forEach((livro) => {
                // criando objeto livro
                const livroDTO: LivroDTO = {
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

                listaDeLivros.push(livroDTO);
            });

            // retornado a lista de livros para quem chamou a função
            return listaDeLivros;

            // captura qualquer erro que aconteça
        } catch (error) {
            // exibe detalhes do erro no console
            console.log(`Erro ao acessar o modelo: ${error}`);
            // retorna um valor nulo
            return null;
        }
    }

    /**
     * Retorna as informações de um livro informado pelo ID
     * 
     * @param idLivro Identificador único do livro
     * @returns Objeto com informações do livro
     */
    static async listarLivro(idLivro: number): Promise<LivroDTO | null> {
        try {
            const querySelectLivro = `SELECT * FROM livro WHERE id_livro = ${idLivro}`;

            const respostaBD = await database.query(querySelectLivro);

            const livroDTO: LivroDTO = {
                id_livro: respostaBD.rows[0].id_livro,
                titulo: respostaBD.rows[0].titulo,
                autor: respostaBD.rows[0].autor,
                editora: respostaBD.rows[0].editora,
                ano_publicacao: respostaBD.rows[0].ano_publicacao,
                isbn: respostaBD.rows[0].isbn,
                quant_total: respostaBD.rows[0].quant_total,
                quant_disponivel: respostaBD.rows[0].quant_disponivel,
                quant_aquisicao: respostaBD.rows[0].quant_aquisicao,
                valor_aquisicao: respostaBD.rows[0].valor_aquisicao,
                status_livro_emprestado: respostaBD.rows[0].status_livro_emprestado,
                status_livro: respostaBD.rows[0].status_livro
            };

            return livroDTO;
        } catch (error) {
            console.error(`Erro ao realizar consulta. ${error}`);
            return null;
        }
    }

    /**
     * Cadastra um novo livro no banco de dados
     * @param livro Objeto Livro contendo as informações a serem cadastradas
     * @returns Boolean indicando se o cadastro foi bem-sucedido
     */
    static async cadastrarLivro(livro: Livro): Promise<boolean> {
        try {
            // Cria a consulta (query) para inserir livro na tabela retornado o ID do livro
            const queryInsertLivro = `
                INSERT INTO Livro (titulo, autor, editora, ano_publicacao, isbn, quant_total, quant_disponivel, valor_aquisicao, status_livro_emprestado)
                VALUES (
                    '${livro.getTitulo().toUpperCase()}',
                    '${livro.getAutor().toUpperCase()}',
                    '${livro.getEditora().toUpperCase()}',
                    '${livro.getAnoPublicacao().toUpperCase()}',
                    '${livro.getIsbn().toUpperCase()}',
                    '${livro.getQuantTotal()}',
                    '${livro.getQuantDisponivel()}',
                    '${livro.getValorAquisicao()}',
                    '${livro.getStatusLivroEmprestado().toUpperCase()}'
                )
                RETURNING id_livro;`;

            // executa a consulta no banco e armazena o resultado
            const result = await database.query(queryInsertLivro);

            // verifica se o número de linhas alteradas no banco de dados é maior que 0
            if (result.rows.length > 0) {
                // exibe mensagem de sucesso no console
                console.log(`Livro cadastrado com sucesso. ID: ${result.rows[0].id_livro}`);
                // altera o valor da variável de controle para verdadeiro
                return true;
            }

            return false;
            // captura qualquer tipo de erro que possa acontecer
        } catch (error) {
            console.error(`Erro ao cadastrar livro: ${error}`);
            return false;
        }
    }

    /**
     * Remove um livro do banco de dados
     * @param id_livro ID do livro a ser removido
     * @returns Boolean indicando se a remoção foi bem-sucedida
    */
    static async removerLivro(id_livro: number): Promise<boolean> {
        try {
            const livro: LivroDTO | null = await this.listarLivro(id_livro);

            if (livro && livro.status_livro) {
                // Cria a consulta para rmeover empréstimo do banco de dados
                const queryDeleteEmprestimoLivro = `UPDATE emprestimo
                                                    SET status_emprestimo_registro = FALSE 
                                                    WHERE id_livro=${id_livro}`;

                // executa a query para remover empréstimo
                await database.query(queryDeleteEmprestimoLivro);

                // Construção da query SQL para deletar o Livro.
                const queryDeleteLivro = `UPDATE livro
                                        SET status_livro = FALSE 
                                        WHERE id_livro=${id_livro};`;

                // Executa a query de exclusão e verifica se a operação foi bem-sucedida.
                const result = await database.query(queryDeleteLivro);

                return result.rowCount != 0;
            }

            return false;
        } catch (error) {
            // Exibe detalhes do erro no console
            console.log(`Erro na consulta: ${error}`);
            // retorna o valor fa variável de controle
            return false;
        }
    }

    /**
     * Atualiza os dados de um livro no banco de dados.
     * @param livro Objeto do tipo Livro com os novos dados
     * @returns true caso sucesso, false caso erro
     */
    static async atualizarLivro(livro: Livro): Promise<boolean> {
        try {
            const livroConsulta: LivroDTO | null = await this.listarLivro(livro.id_livro);

            if (livroConsulta && livroConsulta.status_livro) {
                // Construção da query SQL para atualizar os dados do livro no banco de dados.
                const queryAtualizarLivro = `UPDATE Livro SET 
                                            titulo = '${livro.getTitulo().toUpperCase()}', 
                                            autor = '${livro.getAutor().toUpperCase()}',
                                            editora = '${livro.getEditora().toUpperCase()}', 
                                            ano_publicacao = '${livro.getAnoPublicacao().toUpperCase()}',
                                            isbn = '${livro.getIsbn().toUpperCase()}', 
                                            quant_total = ${livro.getQuantTotal()},
                                            quant_disponivel = ${livro.getQuantDisponivel()},
                                            valor_aquisicao = ${livro.getValorAquisicao()},
                                            status_livro_emprestado = '${livro.getStatusLivroEmprestado().toUpperCase()}'                                           
                                        WHERE id_livro = ${livro.id_livro}`;

                // Executa a query de atualização e verifica se a operação foi bem-sucedida.
                const respostaBD = await database.query(queryAtualizarLivro);

                if(respostaBD.rowCount != 0) {
                    return true;
                }
            }

            return false;
            // captura qualquer erro que possa acontecer
        } catch (error) {
            // exibe detalhes do erro no console
            console.log(`Erro na consulta: ${error}`);
            // retorna o valor da variável de controle
            return false;
        }
    }

}

export default Livro;