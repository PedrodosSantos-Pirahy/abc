import { pgPool } from "../config/postgres";

// * GET /api/pdf/download/apr|qualidade/:osId — lê o PDF (bytea) mais
// * recente (maior tentativa) daquele grupo, direto da própria tabela.
// * ! 2026-09-21: voltou a ler o bytea direto (PDF_APR/PDF_QUALIDADE) — a
// * ! migração que trocaria isso por um arquivo_id em manut.arquivos nunca
// * ! rodou de verdade no banco (ver nota em mmov-registros.model.ts).
export class PdfDownloadRepository {
  private readonly pool = pgPool;

  async pdfApr(osId: number, grupo: number): Promise<Buffer | null> {
    const { rows } = await this.pool.query(
      `
        SELECT "PDF_APR" as conteudo FROM manut."MMOV_REGISTROS"
        WHERE "N_NUMERO" = $1 AND grupo = $2 AND "PDF_APR" IS NOT NULL
        ORDER BY tentativa DESC LIMIT 1
      `,
      [osId, grupo],
    );
    return rows[0]?.conteudo ?? null;
  }

  async pdfQualidade(osId: number, grupo: number): Promise<Buffer | null> {
    const { rows } = await this.pool.query(
      `
        SELECT "PDF_QUALIDADE" as conteudo FROM manut."MMOV_QUALIDADE"
        WHERE "N_NUMERO" = $1 AND grupo = $2 AND "PDF_QUALIDADE" IS NOT NULL
        ORDER BY tentativa DESC LIMIT 1
      `,
      [osId, grupo],
    );
    return rows[0]?.conteudo ?? null;
  }
}
