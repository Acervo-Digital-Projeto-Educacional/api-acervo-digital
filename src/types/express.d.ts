/**
 * Extensão dos tipos nativos do Express para incluir campos customizados em res.locals.
 * Esses campos são preenchidos pelos middlewares de autenticação e usados nos controllers.
 *
 * Colocar aqui garante que TypeScript reconheça res.locals.userId, res.locals.userRole
 * e res.locals.idAluno em todo o projeto sem precisar de casts manuais.
 */
declare namespace Express {
    interface Locals {
        // ID do usuário autenticado (extraído do token JWT)
        userId: number;

        // Role do usuário autenticado: 'admin' ou 'user'
        userRole: string;

        // ID do aluno vinculado ao usuário logado.
        // null para admins que não possuem vínculo com um aluno.
        // Preenchido pelo verifyToken e usado pelos controllers para filtrar dados.
        idAluno: number | null;
    }
}
