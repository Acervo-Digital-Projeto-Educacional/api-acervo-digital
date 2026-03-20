// Exporta a interface como padrão do arquivo, tornando-a disponível para importação em outros arquivos
// Define o contrato de dados para um livro — todo objeto LivroDTO deve seguir esta estrutura
export default interface LivroDTO {

    // ID único do livro no banco de dados — OPCIONAL
    // O "?" indica que pode estar ausente, pois ao criar um novo livro
    // o ID ainda não existe — ele é gerado automaticamente pelo banco após o INSERT
    id_livro?: number,

    // Título do livro — OBRIGATÓRIO
    // Todo livro precisa ter um título para ser cadastrado no sistema
    titulo: string,

    // Nome do autor do livro — OBRIGATÓRIO
    autor: string,

    // Nome da editora responsável pela publicação — OBRIGATÓRIO
    editora: string,

    // Ano em que o livro foi publicado — OBRIGATÓRIO
    // Definido como string (e não number) para suportar formatos variados como "2024" ou "Século XIX"
    ano_publicacao: string,

    // Código ISBN do livro — OBRIGATÓRIO
    // ISBN (International Standard Book Number) é o identificador único internacional de livros
    // Também é string pois pode conter hífens, como "978-65-5540-101-2"
    isbn: string,

    // Quantidade total de exemplares do livro no acervo — OBRIGATÓRIO
    // Representa todos os exemplares, independente de estarem disponíveis ou emprestados
    quant_total: number,

    // Quantidade de exemplares disponíveis para empréstimo no momento — OBRIGATÓRIO
    // Este valor muda conforme os livros são emprestados e devolvidos (quant_total - emprestados)
    quant_disponivel: number,

    // Valor pago para adquirir o livro — OBRIGATÓRIO
    // Usado para controle financeiro do acervo da biblioteca
    valor_aquisicao: number | string,

    // Indica a situação de circulação do livro — OPCIONAL
    // Exemplos de valores: "Disponível", "Emprestado"
    // Opcional pois o sistema pode definir este valor automaticamente com base na quant_disponivel
    status_livro_emprestado?: string;

    // Status do livro no sistema (true = ativo, false = removido logicamente) — OPCIONAL
    // Opcional pois ao cadastrar um novo livro, o status é definido automaticamente pelo banco
    // Livros com false não aparecem nas listagens, mas continuam no banco para preservar o histórico
    status_livro?: boolean
}