import { RedisConnection } from "../config/redis";

/**
 * * Helper genérico de cache — primeiro consumidor real do `RedisConnection`
 * * (até aqui só existia a conexão, sem nada usando). Se o Redis não estiver
 * * disponível ou qualquer operação falhar, cai direto para `fn()` sem
 * * quebrar a rota: cache aqui é estritamente best-effort, igual ao resto da
 * * infraestrutura auxiliar do projeto (Mongo, Redis) — nunca pode ser a
 * * causa de uma requisição falhar.
 */
export async function cachearOuExecutar<T>(
  chave: string,
  ttlSegundos: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cliente = RedisConnection.getClient();
  if (!cliente) return fn();

  try {
    const bruto = await cliente.get(chave);
    if (bruto !== null) return JSON.parse(bruto) as T;
  } catch {
    // * Leitura de cache corrompida/indisponível — segue pro cálculo real.
  }

  const resultado = await fn();

  try {
    await cliente.set(chave, JSON.stringify(resultado), { EX: ttlSegundos });
  } catch {
    // * Falha ao gravar cache não pode derrubar a resposta já calculada.
  }

  return resultado;
}
