import https from "node:https";
import app from "./app";
import { env } from "./config/env";
import { verificarConexaoPostgres } from "./config/postgres";
import { MongoConnection } from "./config/mongo";
import { RedisConnection } from "./config/redis";
import { carregarCertificadoHttps } from "./config/https";
import { WorkerManager } from "./workers";

/**
 * * Rede de segurança de último nível: qualquer promise rejeitada em algum
 * * lugar do processo sem `.catch()` cai aqui em vez de derrubar o servidor
 * * sem contexto nenhum no log.
 */
process.on("unhandledRejection", (motivo) => {
  console.error("Unhandled Promise Rejection:", motivo);
});

process.on("uncaughtException", (erro) => {
  console.error("Uncaught Exception:", erro);
  // Estado do processo pode estar inconsistente — encerra para o
  // orquestrador (PM2/systemd/k8s) reiniciar.
  process.exit(1);
});

async function bootstrap(): Promise<void> {
  try {
    // ! PostgreSQL é a única dependência que precisa estar de pé pro
    // ! servidor subir — é onde mora o dado de negócio de verdade (schema
    // ! manut). Mongo/Redis são infraestrutura auxiliar (logs/cache) e
    // ! entram em modo best-effort dentro de cada `connect()`.
    await verificarConexaoPostgres();
    console.log("✅ Conectado ao PostgreSQL com sucesso!");

    await MongoConnection.connect();
    await RedisConnection.connect();

    const certificado = carregarCertificadoHttps();
    if (certificado) {
      https.createServer(certificado, app).listen(env.port, env.host, () => {
        console.log("🔒 API iniciada com HTTPS (certificado autoassinado)");
        console.log(`Servidor rodando em https://${env.host}:${env.port}/api`);
        console.log(`📚 Documentação da API: https://${env.host}:${env.port}/api-docs`);
        WorkerManager.start();
      });
    } else {
      app.listen(env.port, env.host, () => {
        console.log("⚠️  Certificado não encontrado em certs/ — subindo em HTTP simples.");
        console.log(`Servidor rodando em http://${env.host}:${env.port}/api`);
        console.log(`📚 Documentação da API: http://${env.host}:${env.port}/api-docs`);
        WorkerManager.start();
      });
    }
  } catch (erro) {
    console.error("❌ Erro ao conectar com o PostgreSQL:", erro);
    process.exit(1);
  }
}

bootstrap();
