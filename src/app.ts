// Importa a biblioteca dotenv e já executa a configuração imediatamente.
// Isso garante que process.env esteja populado com as variáveis do .env ANTES 
// das próximas importações acontecerem (ex: ao ler a string de conexão no model).
import "dotenv/config";

// Importa a classe DatabaseModel — usada para testar a conexão com o banco antes de subir o servidor
import { DatabaseModel } from "./model/DatabaseModel.js";
// Importa o servidor Express configurado no server.ts — é ele quem será iniciado após a conexão com o banco
import { server } from "./server.js";

/**
 * Configura a porta do servidor web
 */
// Lê a variável PORT do arquivo .env e converte de string para número. 
// Caso não exista a variável, ou não seja um número (NaN), usa 3333 como valor padrão seguro.
const port: number = Number(process.env.PORT) || 3333;

// Lê a variável HOST do arquivo .env limitando a localhost caso venha vazia
const host: string = process.env.HOST ?? "localhost";

/**
 * Função principal para iniciar o servidor web
 * Permite o uso de async/await no escopo global
 */
const startServer = async () => {
    try {
        console.info('Testando conexão com o banco de dados...');
        const dbModel = new DatabaseModel();
        
        // Aguarda o resultado do teste de conexão
        const ok = await dbModel.testeConexao();

        if (ok) {
            // Inicia o servidor Express na porta e host definidos
            server.listen(port, () => {
                console.info(`✅ Servidor executando no endereço http://${host}:${port}`);
            });
        } else {
            // Emite aviso que falhou e finaliza o processo do Node (process.exit)
            // O código 1 indica ao S.O. que a aplicação 'crachou' (diferente de 0)
            console.error(`❌ Não foi possível conectar com o banco de dados. Servidor abortado.`);
            process.exit(1); 
        }
    } catch (error) {
        // Captura exceções críticas durante o processo de inicialização do servidor ou do banco
        console.error(`💥 Erro fatal ao iniciar o servidor:`, error);
        process.exit(1);
    }
};

// Dispara a execução do método para subir os serviços
startServer();