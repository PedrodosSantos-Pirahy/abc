import { Pool, type PoolClient } from "pg";
import { env } from "./env";

// * Pool único e compartilhado por todo o backend — cada repository recebe
// * esse mesmo pool em vez de abrir conexão própria. Espelha o padrão do
// * `db_pool` do Flask (ThreadedConnectionPool), só que o `pg.Pool` já
// * gerencia isso nativamente em Node.
export const pgPool = new Pool({
  host: env.db.host,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  port: env.db.port,
  max: 20,
});

pgPool.on("error", (erro) => {
  // ! Erro de conexão ociosa do pool não pode derrubar o processo — só logamos.
  console.error("❌ Erro inesperado no pool do PostgreSQL:", erro);
});

export async function verificarConexaoPostgres(): Promise<void> {
  const cliente = await pgPool.connect();
  try {
    await cliente.query("SELECT 1");
  } finally {
    cliente.release();
  }
}

/**
 * * Vários fluxos do Flask de referência fazem múltiplos `cur.execute` e só
 * * um `conn.commit()`/`conn.rollback()` no fim — ou seja, cada handler é UMA
 * * transação. O `pg.Pool.query()` sozinho não dá isso (cada chamada é
 * * autocommit). Este helper reproduce o mesmo comportamento: pega um client
 * * dedicado, BEGIN, roda o callback, COMMIT — ou ROLLBACK se algo lançar.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (erro) {
    await client.query("ROLLBACK");
    throw erro;
  } finally {
    client.release();
  }
}
