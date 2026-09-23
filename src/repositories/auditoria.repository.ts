import { pgPool } from "../config/postgres";
import { ValidationError } from "../utils/AppError";

// * Colunas de timestamp que `registrar_tempo` pode gravar — mesma lista
// * branca do Flask (`colunas_permitidas`). Nome de coluna nunca vem
// * interpolado direto do input sem passar por essa validação.
// ! 2026-09-21: `HR_INICIO_DESLOCAMENTO` removida — não existe de verdade
// ! na tabela (ver nota em mmov-registros.model.ts).
const COLUNAS_TEMPO_PERMITIDAS = [
  "HR_ACEITE",
  "HR_CHEGADA_LOCAL",
  "HR_FINALIZACAO_OS",
  "HR_INICIO_MANUTENCAO",
  "HR_FIM_MANUTENCAO",
] as const;
export type ColunaTempo = (typeof COLUNAS_TEMPO_PERMITIDAS)[number];

// * `registrar_foto` grava direto na coluna bytea (contrato da API não
// * muda — mesmos 3 nomes de sempre).
// ! 2026-09-21: volta a gravar bytea direto — a migração pra
// ! `*_arquivo_id`/manut.arquivos nunca rodou de verdade no banco (ver
// ! nota em mmov-registros.model.ts).
const COLUNAS_FOTO_PERMITIDAS = ["FOTO_CHEGADA", "FOTO_FINALIZACAO", "FOTO_CADEADO"] as const;

export class AuditoriaRepository {
  private readonly pool = pgPool;

  async registrarTempo(osId: number, etapa: string, grupo: number): Promise<Date> {
    if (!COLUNAS_TEMPO_PERMITIDAS.includes(etapa as ColunaTempo)) {
      throw new ValidationError("Etapa inválida.");
    }
    const { rows: tentRows } = await this.pool.query(
      `SELECT COALESCE(MAX(tentativa), 1) as tentativa FROM manut."MMOV_REGISTROS" WHERE "N_NUMERO" = $1`,
      [osId],
    );
    const tentativaAtual = tentRows[0].tentativa;
    const horaAtual = new Date();

    await this.pool.query(
      `
        INSERT INTO manut."MMOV_REGISTROS" ("N_NUMERO", tentativa, grupo, "${etapa}")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("N_NUMERO", tentativa, grupo) DO UPDATE SET "${etapa}" = EXCLUDED."${etapa}"
      `,
      [osId, tentativaAtual, grupo, horaAtual],
    );
    return horaAtual;
  }

  async registrarFoto(osId: number, coluna: string, buffer: Buffer, grupo: number): Promise<void> {
    if (!COLUNAS_FOTO_PERMITIDAS.includes(coluna as (typeof COLUNAS_FOTO_PERMITIDAS)[number])) {
      throw new ValidationError("Coluna de foto inválida.");
    }

    const { rows: tentRows } = await this.pool.query(
      `SELECT COALESCE(MAX(tentativa), 1) as tentativa FROM manut."MMOV_REGISTROS" WHERE "N_NUMERO" = $1`,
      [osId],
    );
    const tentativaAtual = tentRows[0].tentativa;

    await this.pool.query(
      `
        INSERT INTO manut."MMOV_REGISTROS" ("N_NUMERO", tentativa, grupo, "${coluna}")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("N_NUMERO", tentativa, grupo) DO UPDATE SET "${coluna}" = EXCLUDED."${coluna}"
      `,
      [osId, tentativaAtual, grupo, buffer],
    );
  }

  async registrarCausa(osId: number, causa: string, grupo: number): Promise<void> {
    const { rows: tentRows } = await this.pool.query(
      `SELECT COALESCE(MAX(tentativa), 1) as tentativa FROM manut."MMOV_REGISTROS" WHERE "N_NUMERO" = $1`,
      [osId],
    );
    const tentativaAtual = tentRows[0].tentativa;

    const { rows: linhaRows } = await this.pool.query(
      `SELECT "REG_ID" FROM manut."MMOV_REGISTROS" WHERE "N_NUMERO" = $1 AND tentativa = $2 AND grupo = $3 LIMIT 1`,
      [osId, tentativaAtual, grupo],
    );
    if (linhaRows.length > 0) {
      await this.pool.query(`UPDATE manut."MMOV_REGISTROS" SET "CAUSA_PROBLEMA" = $1 WHERE "REG_ID" = $2`, [
        causa,
        linhaRows[0].REG_ID,
      ]);
    } else {
      await this.pool.query(
        `INSERT INTO manut."MMOV_REGISTROS" ("N_NUMERO", tentativa, grupo, "CAUSA_PROBLEMA") VALUES ($1, $2, $3, $4)`,
        [osId, tentativaAtual, grupo, causa],
      );
    }
  }
}
