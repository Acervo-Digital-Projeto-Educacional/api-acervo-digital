// Importa o tipo LivroDTO, que define a estrutura de dados de um livro (objeto simples, sem métodos)
import type LivroDTO from "../dto/LivroDTO.js";
// Importa a classe DatabaseModel, responsável por gerenciar a conexão com o banco de dados
import { DatabaseModel } from "./DatabaseModel.js";

// Cria uma instância do DatabaseModel e acessa o pool de conexões com o banco de dados
// O "pool" gerencia múltiplas conexões simultâneas de forma eficiente
const database = new DatabaseModel().pool;

// Define a classe Livro, que representa um livro no sistema de biblioteca
class Livro {
    // Atributo privado: ID único do livro no banco de dados (começa em 0, pois ainda não foi salvo)
    private id_livro: number = 0;
    // Atributo privado: Título do livro
    private titulo: string;
    // Atributo privado: Nome do autor do livro
    private autor: string;
    // Atributo privado: Nome da editora responsável pela publicação
    private editora: string;
    // Atributo privado: Ano em que o livro foi publicado (string para suportar formatos como "2024")
    private ano_publicacao: string;
    // Atributo privado: Código ISBN — identificador único internacional de livros
    private isbn: string;
    // Atributo privado: Quantidade total de exemplares do livro no acervo
    private quant_total: number;
    // Atributo privado: Quantidade de exemplares disponíveis para empréstimo no momento
    private quant_disponivel: number;
    // Atributo privado: Valor pago para adquirir o livro
    private valor_aquisicao: number;
    // Atributo privado: Indica se o livro está disponível ou emprestado (começa como "Disponível")
    private status_livro_emprestado: string = "Disponível";
    // Atributo privado: Indica se o livro está ativo no sistema (false = ainda não persistido no banco)
    private status_livro: boolean = false;

    // Construtor: chamado automaticamente ao criar um novo objeto Livro
    constructor(
        _titulo: string,           // Título do livro — obrigatório
        _autor: string,            // Autor do livro — obrigatório
        _editora: string,          // Editora do livro — obrigatório
        _ano_publicacao: string,   // Ano de publicação — obrigatório
        _isbn: string,             // ISBN do livro — obrigatório
        _quant_total: number,      // Quantidade total de exemplares — obrigatório
        _quant_disponivel: number, // Quantidade disponível para empréstimo — obrigatório
        _valor_aquisicao: number   // Valor de aquisição — obrigatório
    ) {
        // Atribui os valores recebidos aos atributos internos da classe
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
    // Métodos públicos para acessar e modificar os atributos privados com segurança

    // Getter: retorna o ID do livro
    public getIdLivro(): number {
        return this.id_livro;
    }
    // Setter: define um novo valor para o ID do livro
    public setIdLivro(value: number) {
        this.id_livro = value;
    }

    // Getter: retorna o título do livro
    public getTitulo(): string {
        return this.titulo;
    }
    // Setter: define um novo título para o livro
    public setTitulo(value: string) {
        this.titulo = value;
    }

    // Getter: retorna o nome do autor do livro
    public getAutor(): string {
        return this.autor;
    }
    // Setter: define um novo autor para o livro
    public setAutor(value: string) {
        this.autor = value;
    }

    // Getter: retorna o nome da editora do livro
    public getEditora(): string {
        return this.editora;
    }
    // Setter: define uma nova editora para o livro
    public setEditora(value: string) {
        this.editora = value;
    }

    // Getter: retorna o ano de publicação do livro
    public getAnoPublicacao(): string {
        return this.ano_publicacao;
    }
    // Setter: define um novo ano de publicação para o livro
    public setAnoPublicacao(value: string) {
        this.ano_publicacao = value;
    }

    // Getter: retorna o ISBN do livro
    public getIsbn(): string {
        return this.isbn;
    }
    // Setter: define um novo ISBN para o livro
    public setIsbn(value: string) {
        this.isbn = value;
    }

    // Getter: retorna a quantidade total de exemplares do livro
    public getQuantTotal(): number {
        return this.quant_total;
    }
    // Setter: define uma nova quantidade total de exemplares
    public setQuantTotal(value: number) {
        this.quant_total = value;
    }

    // Getter: retorna a quantidade de exemplares disponíveis para empréstimo
    public getQuantDisponivel(): number {
        return this.quant_disponivel;
    }
    // Setter: define uma nova quantidade de exemplares disponíveis
    public setQuantDisponivel(value: number) {
        this.quant_disponivel = value;
    }


    // Getter: retorna o valor de aquisição do livro
    public getValorAquisicao(): number {
        return this.valor_aquisicao;
    }
    // Setter: define um novo valor de aquisição para o livro
    public setValorAquisicao(value: number) {
        this.valor_aquisicao = value;
    }

    // Getter: retorna o status de empréstimo do livro (ex: "Disponível", "Emprestado")
    public getStatusLivroEmprestado(): string {
        return this.status_livro_emprestado;
    }
    // Setter: define um novo status de empréstimo para o livro
    public setStatusLivroEmprestado(value: string) {
        this.status_livro_emprestado = value;
    }

    // Getter: retorna se o livro está ativo no sistema (true) ou removido logicamente (false)
    public getStatusLivro(): boolean {
        return this.status_livro;
    }
    // Setter: define o status de atividade do livro no sistema
    public setStatusLivro(value: boolean) {
        this.status_livro = value;
    }

    // ==================== MÉTODOS ESTÁTICOS (operações no banco de dados) ====================
    // Métodos "static" pertencem à classe, não ao objeto — são chamados como Livro.listarLivros()

    /**
     * Retorna uma lista com todos os livros cadastrados no banco de dados
     * 
     * @returns Lista com todos os livros cadastrados no banco de dados
     */
    // Método assíncrono que busca todos os livros ativos e retorna uma lista de LivroDTO ou null
    static async listarLivros(): Promise<Array<LivroDTO> | null> {
        // Cria uma lista vazia que vai receber os livros encontrados no banco
        let listaDeLivros: Array<LivroDTO> = [];

        try {
            // Query SQL que busca todos os livros com status ativo (status_livro = TRUE)
            // Livros com status FALSE foram removidos logicamente e não devem aparecer
            const querySelectLivro = `SELECT * FROM Livro WHERE status_livro = TRUE;`;

            // Executa a query no banco de dados e aguarda o resultado
            const respostaBD = await database.query(querySelectLivro);

            // Percorre cada linha retornada pelo banco de dados
            // "livro" é o apelido dado a cada registro individual retornado
            respostaBD.rows.forEach((livro) => {
                // Monta o objeto LivroDTO com os dados da linha atual
                // LivroDTO é um objeto simples de dados (sem métodos), diferente da classe Livro
                const livroDTO: LivroDTO = {
                    id_livro: livro.id_livro,                           // ID do livro
                    titulo: livro.titulo,                               // Título
                    autor: livro.autor,                                 // Autor
                    editora: livro.editora,                             // Editora
                    ano_publicacao: livro.ano_publicacao,               // Ano de publicação
                    isbn: livro.isbn,                                   // ISBN
                    quant_total: livro.quant_total,                     // Quantidade total
                    quant_disponivel: livro.quant_disponivel,           // Quantidade disponível
                    valor_aquisicao: livro.valor_aquisicao,             // Valor de aquisição
                    status_livro_emprestado: livro.status_livro_emprestado, // Status de empréstimo
                    status_livro: livro.status_livro                    // Status ativo/inativo
                };

                // Adiciona o objeto LivroDTO à lista
                listaDeLivros.push(livroDTO);
            });

            // Retorna a lista com todos os livros encontrados
            return listaDeLivros;

        } catch (error) {
            // Se ocorrer qualquer erro durante a consulta, exibe no console para facilitar o debug
            console.log(`Erro ao acessar o modelo: ${error}`);
            // Retorna null para indicar que houve falha
            return null;
        }
    }

    /**
     * Retorna as informações de um livro informado pelo ID
     * 
     * @param id_livro Identificador único do livro
     * @returns Objeto com informações do livro
     */
    // Recebe o ID do livro e retorna um único LivroDTO ou null
    static async listarLivro(id_livro: number): Promise<LivroDTO | null> {
        try {
            // Query SQL que busca um livro específico pelo ID
            // O "$1" é um placeholder substituído pelo valor real (proteção contra SQL Injection)
            const querySelectLivro = `SELECT * FROM livro WHERE id_livro = $1`;

            // Executa a query passando o id_livro como parâmetro (substitui o $1)
            const respostaBD = await database.query(querySelectLivro, [id_livro]);

            // Monta o objeto LivroDTO com os dados da primeira (e única) linha retornada
            // rows[0] acessa o primeiro elemento do array de resultados
            const livroDTO: LivroDTO = {
                id_livro: respostaBD.rows[0].id_livro,
                titulo: respostaBD.rows[0].titulo,
                autor: respostaBD.rows[0].autor,
                editora: respostaBD.rows[0].editora,
                ano_publicacao: respostaBD.rows[0].ano_publicacao,
                isbn: respostaBD.rows[0].isbn,
                quant_total: respostaBD.rows[0].quant_total,
                quant_disponivel: respostaBD.rows[0].quant_disponivel,
                valor_aquisicao: respostaBD.rows[0].valor_aquisicao,
                status_livro_emprestado: respostaBD.rows[0].status_livro_emprestado,
                status_livro: respostaBD.rows[0].status_livro
            };

            // Retorna o objeto LivroDTO preenchido com os dados do banco
            return livroDTO;
        } catch (error) {
            // Exibe o erro no console e retorna null em caso de falha
            console.error(`Erro ao realizar consulta. ${error}`);
            return null;
        }
    }

    /**
     * Cadastra um novo livro no banco de dados
     * @param livro Objeto Livro contendo as informações a serem cadastradas
     * @returns Boolean indicando se o cadastro foi bem-sucedido
     */
    // Recebe um objeto Livro completo e tenta inseri-lo no banco de dados
    static async cadastrarLivro(livro: Livro): Promise<boolean> {
        try {
            // Query SQL de inserção com 10 placeholders ($1 a $10), um para cada campo
            // "RETURNING id_livro" faz o banco retornar o ID gerado automaticamente após o INSERT
            const queryInsertLivro = `
                INSERT INTO Livro (titulo, autor, editora, ano_publicacao, isbn, quant_total, quant_disponivel, valor_aquisicao, status_livro_emprestado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id_livro;`;

            // Organiza os valores em um array na mesma ordem dos placeholders da query
            // Textos são convertidos para maiúsculas (.toUpperCase()) para padronizar o banco
            const valores = [
                livro.getTitulo().toUpperCase(),              // $1 — Título em maiúsculas
                livro.getAutor().toUpperCase(),               // $2 — Autor em maiúsculas
                livro.getEditora().toUpperCase(),             // $3 — Editora em maiúsculas
                livro.getAnoPublicacao().toUpperCase(),       // $4 — Ano de publicação em maiúsculas
                livro.getIsbn().toUpperCase(),                // $5 — ISBN em maiúsculas
                livro.getQuantTotal(),                        // $6 — Quantidade total (número, sem transformação)
                livro.getQuantDisponivel(),                   // $7 — Quantidade disponível (número)
                livro.getValorAquisicao(),                    // $8 — Valor de aquisição (número)
                livro.getStatusLivroEmprestado().toUpperCase() // $9 — Status em maiúsculas
            ];

            // Executa a query passando o array de valores e armazena o resultado
            const result = await database.query(queryInsertLivro, valores);

            // Verifica se o banco retornou pelo menos uma linha (ou seja, o INSERT funcionou)
            if (result.rows.length > 0) {
                // Exibe no console o ID do livro recém-cadastrado
                console.log(`Livro cadastrado com sucesso. ID: ${result.rows[0].id_livro}`);
                // Retorna true para indicar sucesso
                return true;
            }

            // Se nenhuma linha foi retornada, o cadastro não funcionou — retorna false
            return false;

        } catch (error) {
            // Exibe o erro no console e retorna false em caso de exceção
            console.error(`Erro ao cadastrar livro: ${error}`);
            return false;
        }
    }

    /**
     * Remove um livro do banco de dados
     * @param id_livro ID do livro a ser removido
     * @returns Boolean indicando se a remoção foi bem-sucedida
    */
    // Realiza uma remoção lógica: não apaga o registro, apenas muda o status para FALSE
    static async removerLivro(id_livro: number): Promise<boolean> {
        try {
            // Busca o livro no banco antes de tentar remover, para verificar se ele existe e está ativo
            const livro: LivroDTO | null = await this.listarLivro(id_livro);

            // Só prossegue se o livro existir (não for null) E estiver com status ativo (true)
            if (livro && livro.status_livro) {
                // Primeiro desativa todos os empréstimos relacionados a este livro
                // Isso garante a consistência dos dados — um livro removido não pode ter empréstimos ativos
                const queryDeleteEmprestimoLivro = `UPDATE emprestimo
                                    SET status_emprestimo_registro = FALSE 
                                    WHERE id_livro = $1`;

                // Executa a desativação dos empréstimos do livro (não precisa verificar o resultado aqui)
                await database.query(queryDeleteEmprestimoLivro, [id_livro]);

                // Agora desativa o próprio livro (remoção lógica — não apaga, apenas muda o status)
                const queryDeleteLivro = `UPDATE livro
                          SET status_livro = FALSE 
                          WHERE id_livro = $1`;

                // Executa a desativação do livro e armazena o resultado
                const result = await database.query(queryDeleteLivro, [id_livro]);

                // "rowCount" indica quantas linhas foram afetadas pelo UPDATE
                // Retorna true se pelo menos uma linha foi alterada, false caso contrário
                return result.rowCount != 0;
            }

            // Se o livro não existir ou já estiver inativo, retorna false
            return false;
        } catch (error) {
            // Exibe o erro no console e lança a exceção novamente
            console.log(`Erro na consulta: ${error}`);
            throw error;
        }
    }

    /**
     * Atualiza os dados de um livro no banco de dados.
     * @param livro Objeto do tipo Livro com os novos dados
     * @returns true caso sucesso, false caso erro
     */
    // Recebe um objeto Livro com os dados atualizados e os salva no banco
    static async atualizarLivro(livro: Livro): Promise<boolean> {
        try {
            // Antes de atualizar, verifica se o livro existe e está ativo no banco
            const livroConsulta: LivroDTO | null = await this.listarLivro(livro.id_livro);

            // Só prossegue com a atualização se o livro existir e estiver ativo
            if (livroConsulta && livroConsulta.status_livro) {
                // Query SQL de atualização com 11 placeholders ($1 a $11)
                // O $11 no WHERE garante que apenas o livro com o ID correto seja atualizado
                const queryAtualizarLivro = `UPDATE Livro SET 
                                titulo = $1, 
                                autor = $2,
                                editora = $3, 
                                ano_publicacao = $4,
                                isbn = $5, 
                                quant_total = $6,
                                quant_disponivel = $7,
                                valor_aquisicao = $8,
                                status_livro_emprestado = $9
                             WHERE id_livro = $10`;

                // Organiza os novos valores em um array na mesma ordem dos placeholders
                const valores = [
                    livro.getTitulo().toUpperCase(),               // $1 — Título em maiúsculas
                    livro.getAutor().toUpperCase(),                // $2 — Autor em maiúsculas
                    livro.getEditora().toUpperCase(),              // $3 — Editora em maiúsculas
                    livro.getAnoPublicacao().toUpperCase(),        // $4 — Ano de publicação em maiúsculas
                    livro.getIsbn().toUpperCase(),                 // $5 — ISBN em maiúsculas
                    livro.getQuantTotal(),                         // $6 — Quantidade total (número)
                    livro.getQuantDisponivel(),                    // $7 — Quantidade disponível (número)
                    livro.getValorAquisicao(),                     // $8 — Valor de aquisição (número)
                    livro.getStatusLivroEmprestado().toUpperCase(), // $9 — Status em maiúsculas
                    livro.getIdLivro()                             // $10 — ID do livro (usado no WHERE)
                ];

                // Executa a query de atualização e armazena o resultado
                const respostaBD = await database.query(queryAtualizarLivro, valores);

                // Se rowCount for diferente de 0, a atualização funcionou — retorna true
                if (respostaBD.rowCount != 0) {
                    return true;
                }
            }

            // Se o livro não existe, está inativo, ou o UPDATE não afetou nenhuma linha, retorna false
            return false;

        } catch (error) {
            // Exibe o erro no console e lança adiante
            console.log(`Erro na consulta: ${error}`);
            throw error;
        }
    }

}

// Exporta a classe Livro para que possa ser importada e usada em outros arquivos do projeto
export default Livro;