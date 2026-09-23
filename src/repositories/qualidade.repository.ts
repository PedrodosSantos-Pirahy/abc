import { pgPool } from "../config/postgres";

export interface SalvarPreInput {
  osId: number;
  grupo: number;
  tentativa: number;
  protecao: string;
  ferramentas: string;
  epis: string;
  lubrificantes: string;
}

export interface SalvarPosInput {
  osId: number;
  grupo: number;
  tentativa: number;
  limpeza: string;
  montagem: string;
  avaliacao: string;
  residuos: string;
  respMatricula: string | null;
  respNome: string | null;
  manutMatricula: string | null;
  manutNome: string | null;
  respAssinatura: Buffer | null;
  manutAssinatura: Buffer | null;
}

// * Tradução de `salvar_pre_manutencao`/`salvar_pos_manutencao`.
// * ! 2026-09-21: assinaturas e PDF do RAPPM gravados direto como bytea
// * ! (RESP_ASSINATURA/MANUT_ASSINATURA/PDF_QUALIDADE) — a migração que
// * ! trocaria isso por manut.arquivos nunca rodou de verdade no banco
// * ! (ver nota em mmov-registros.model.ts).
export class QualidadeRepository {
  private readonly pool = pgPool;

  async salvarPre(input: SalvarPreInput): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO manut."MMOV_QUALIDADE"
        ("N_NUMERO", grupo, tentativa, "PRE_PROTECAO", "PRE_FERRAMENTAS", "PRE_EPIS", "PRE_LUBRIFICANTES")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("N_NUMERO", grupo, tentativa) DO UPDATE SET
            "PRE_PROTECAO" = EXCLUDED."PRE_PROTECAO",
            "PRE_FERRAMENTAS" = EXCLUDED."PRE_FERRAMENTAS",
            "PRE_EPIS" = EXCLUDED."PRE_EPIS",
            "PRE_LUBRIFICANTES" = EXCLUDED."PRE_LUBRIFICANTES"
      `,
      [input.osId, input.grupo, input.tentativa, input.protecao, input.ferramentas, input.epis, input.lubrificantes],
    );
  }

  async salvarPos(input: SalvarPosInput): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO manut."MMOV_QUALIDADE"
            ("N_NUMERO", grupo, tentativa,
             "POS_LIMPEZA", "POS_MONTAGEM", "POS_AVALIACAO", "POS_RESIDUOS",
             "RESP_MATRICULA", "RESP_NOME", "RESP_ASSINATURA",
             "MANUT_MATRICULA", "MANUT_NOME", "MANUT_ASSINATURA")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT ("N_NUMERO", grupo, tentativa) DO UPDATE SET
            "POS_LIMPEZA"      = EXCLUDED."POS_LIMPEZA",
            "POS_MONTAGEM"     = EXCLUDED."POS_MONTAGEM",
            "POS_AVALIACAO"    = EXCLUDED."POS_AVALIACAO",
            "POS_RESIDUOS"     = EXCLUDED."POS_RESIDUOS",
            "RESP_MATRICULA"   = EXCLUDED."RESP_MATRICULA",
            "RESP_NOME"        = EXCLUDED."RESP_NOME",
            "RESP_ASSINATURA"  = EXCLUDED."RESP_ASSINATURA",
            "MANUT_MATRICULA"  = EXCLUDED."MANUT_MATRICULA",
            "MANUT_NOME"       = EXCLUDED."MANUT_NOME",
            "MANUT_ASSINATURA" = EXCLUDED."MANUT_ASSINATURA"
      `,
      [
        input.osId,
        input.grupo,
        input.tentativa,
        input.limpeza,
        input.montagem,
        input.avaliacao,
        input.residuos,
        input.respMatricula,
        input.respNome,
        input.respAssinatura,
        input.manutMatricula,
        input.manutNome,
        input.manutAssinatura,
      ],
    );
  }

  async buscarDadosCompletos(osId: number, grupo: number, tentativa: number): Promise<any | null> {
    const { rows } = await this.pool.query(
      `
        SELECT m."M_NUMERO" as os_numero, e."EQPG_DESCRICAO" as maquina_nome, q.*
        FROM manut."MMOVMAN" m
        INNER JOIN manut."MMOV_QUALIDADE" q ON m."M_NUMERO" = q."N_NUMERO" AND q.grupo = $1 AND q.tentativa = $2
        LEFT JOIN public."UEQUIPGRU" e ON m."M_EQUIP" = e."EQPG_CODIGO"
        WHERE m."M_NUMERO" = $3
      `,
      [grupo, tentativa, osId],
    );
    return rows[0] ?? null;
  }

  async salvarPdf(osId: number, grupo: number, tentativa: number, pdfBuffer: Buffer): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO manut."MMOV_QUALIDADE" ("N_NUMERO", grupo, tentativa, "PDF_QUALIDADE")
        VALUES ($1, $2, $3, $4)
        ON CONFLICT ("N_NUMERO", grupo, tentativa) DO UPDATE SET "PDF_QUALIDADE" = EXCLUDED."PDF_QUALIDADE"
      `,
      [osId, grupo, tentativa, pdfBuffer],
    );
  }
}
