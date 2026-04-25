import { type Request, type Response, type NextFunction } from 'express';

/**
 * Middleware de autorização baseado em roles.
 *
 * Diferença entre autenticação e autorização:
 * - Autenticação (Auth.verifyToken): "Quem é você?" — valida o token JWT
 * - Autorização (Authorize):         "O que você pode fazer?" — verifica permissões
 *
 * Esses middlewares dependem de res.locals.userRole e res.locals.idAluno,
 * que são preenchidos por Auth.verifyToken e devem ser executados após ele.
 */
export class Authorize {

    /**
     * Permite acesso APENAS para administradores.
     * Retorna 403 Forbidden para qualquer outro role.
     *
     * Usado em rotas de escrita (POST, PUT, DELETE) que só admins podem executar:
     * - Cadastrar, atualizar e remover alunos
     * - Cadastrar, atualizar e remover livros
     * - Cadastrar, atualizar e remover empréstimos
     *
     * @param req Requisição HTTP
     * @param res Resposta HTTP
     * @param next Próximo middleware/controller
     */
    static requireAdmin(req: Request, res: Response, next: NextFunction) {
        if (res.locals.userRole !== 'admin') {
            console.log(`[Authorize] Acesso negado: role '${res.locals.userRole}' tentou acessar rota restrita a admin. Rota: ${req.method} ${req.path}`);
            return res.status(403).json({
                mensagem: "Acesso negado. Apenas administradores podem realizar esta ação."
            });
        }
        // Admin autenticado — permite prosseguir para o controller
        next();
    }

    /**
     * Controle de acesso misto para rotas de leitura (GET):
     * - admin  → passa sem restrições (res.locals.idAluno permanece null = sem filtro)
     * - user   → idAluno deve estar presente no token; o controller usará esse valor
     *            para filtrar os dados e retornar apenas as informações do próprio aluno.
     *
     * Se um 'user' não tiver id_aluno vinculado no token, o acesso é negado com 403.
     *
     * Usado em:
     * - GET /api/alunos          → admin vê todos; user vê apenas si mesmo
     * - GET /api/alunos/:id      → admin vê qualquer um; user só o próprio
     * - GET /api/emprestimos     → admin vê todos; user vê apenas os seus
     * - GET /api/emprestimos/:id → admin vê qualquer um; user só os seus
     *
     * @param req Requisição HTTP
     * @param res Resposta HTTP
     * @param next Próximo middleware/controller
     */
    static requireSelf(req: Request, res: Response, next: NextFunction) {
        // Admin passa direto — res.locals.idAluno permanece null (sem filtro)
        if (res.locals.userRole === 'admin') {
            return next();
        }

        // 'user' precisa ter um id_aluno vinculado no token para acessar dados filtrados
        // Se id_aluno for null, o usuário não está associado a nenhum aluno no sistema
        if (res.locals.idAluno === null || res.locals.idAluno === undefined) {
            console.log(`[Authorize] Acesso negado: usuário ID ${res.locals.userId} sem vínculo com aluno tentou acessar ${req.method} ${req.path}`);
            return res.status(403).json({
                mensagem: "Acesso negado. Seu usuário não está vinculado a um aluno no sistema."
            });
        }

        // 'user' com id_aluno válido — controller usará res.locals.idAluno para filtrar
        next();
    }
}
