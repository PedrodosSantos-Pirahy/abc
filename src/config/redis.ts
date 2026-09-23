import { createClient, type RedisClientType } from "redis";
import { env } from "./env";

// ? Redis ainda não tem um consumidor real nesta fase (sem JWT/refresh-token,
// ? sem cache de domínios ainda) — é infraestrutura preparada para as
// ? próximas fases (cache de listas de domínio, rate-limit, etc.). Por isso
// ? a conexão é best-effort: se o Redis não estiver disponível, a API sobe
// ? do mesmo jeito.
let cliente: RedisClientType | null = null;

export class RedisConnection {
  static async connect(): Promise<void> {
    try {
      cliente = createClient({ url: env.redisUrl });
      await cliente.connect();
      console.log("✅ Conectado ao Redis com sucesso!");
    } catch (erro) {
      console.error("❌ Falha ao conectar no Redis (seguindo sem cache):", erro);
      cliente = null;
    }
  }

  static getClient(): RedisClientType | null {
    return cliente;
  }

  static async disconnect(): Promise<void> {
    await cliente?.disconnect();
  }
}
