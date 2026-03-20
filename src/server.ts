// Importa o framework Express — é ele quem cria e gerencia o servidor web da aplicação
// Adicionamos as tipagens do Request, Response e NextFunction do express para o tratamento de erros
import express, { type Request, type Response, type NextFunction } from "express";
// Importa o middleware CORS (Cross-Origin Resource Sharing)
// O CORS controla quais origens (domínios) têm permissão para acessar a API
// Sem ele, o navegador bloquearia requisições vindas de um domínio diferente do servidor
// Ex: front-end em localhost:3000 tentando acessar API em localhost:3333 seria bloqueado sem CORS
import cors from "cors";
// Importa o router criado no arquivo routes.ts — contém todos os endpoints da aplicação
import { router } from "./routes.js";

/**
 * Cria servidor express
 */
// Cria a instância do servidor Express e armazena na variável "server"
// É este objeto que recebe todas as configurações e sobe o servidor HTTP
const server = express();

/**
 * Configurações do servidor
 */
// Registra o middleware que permite ao servidor ler e interpretar corpos de requisição em formato JSON
// Sem isso, req.body chegaria como undefined nos controllers — nenhum dado do front-end seria lido
server.use(express.json());

// Registra o middleware CORS com as configurações padrão
// Na configuração padrão, permite requisições de qualquer origem ("*")
// Em produção, o ideal seria restringir para apenas os domínios autorizados
server.use(cors());

// Registra o router com todos os endpoints da aplicação
// A partir daqui, toda requisição que chegar ao servidor será direcionada para a rota correspondente
server.use(router);

// Middleware de fallback para rotas não encontradas (404 Not Found)
// Se nenhuma rota acima (no router) atendeu à requisição, ela cai aqui.
server.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ erro: "Rota não encontrada" });
});

// Middleware Tratador de Erros Global (Global Error Handler)
// Captura exceções não tratadas que chegam até a raiz da aplicação e retorna erro 500 em JSON.
server.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ERRO GLOBAL]: ${err.message}`);
    // Retorna 500 para não vazar stacktrace de erros
    res.status(500).json({ erro: "Erro interno do servidor" });
});

// Exporta o servidor para que possa ser importado e iniciado em outro arquivo (geralmente o index.ts ou server.ts)
// O uso de exportação nomeada "export { server }" mantém consistência com a exportação do router
export { server }