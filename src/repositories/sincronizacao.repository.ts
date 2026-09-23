import { pgPool } from "../config/postgres";

export interface UpsertRegistroOfflineInput {
  osId: number;
  tentativa: number;
  grupo: number;
  hrAceite: string | null;
  hrChegadaLocal: string | null;
  hrInicioManutencao: string | null;
  hrFimManutencao: string | null;
  hrFinalizacaoOs: string | null;
  fotoChegada: Buffer | null;
  fotoFinalizacao: Buffer | null;
  fotoCadeado: Buffer | null;
  concluido: boolean;
  causaInicial: string | null;
  solucaoAplicada: string | null;
  utiMaterial: string | null;
  solMaterial: string | null;
}

// * Tradução da parte "grava direto no banco" de `sincronizar_offline`. O
// * roteamento pras APIs de APR/Qualidade (que no Flask usa `app.test_client()`
// * pra chamar as próprias rotas internamente) fica no sincronizacao.service.ts,
// * chamando AprService/QualidadeService direto — mais simples que simular HTTP
// * interno.
export class SincronizacaoRepository {
  private readonly pool = pgPool;

  async buscarNomeFuncionario(matricula: string): Promise<string | null> {
    const { rows: userRows } = await this.pool.query(`SELECT nome FROM manut."user" WHERE matricula = $1`, [
      String(matricula),
    ]);
    if (userRows.length > 0) return userRows[0].nome;

    const matInt = Number(matricula);
    if (!Number.isInteger(matInt)) return null;
    const { rows: ufuncRows } = await this.pool.query(
      `SELECT "UFUN_DESCRICAO" as nome FROM public."UFUNC" WHERE "UFUN_CODIGO" = $1 AND "UFUN_ATIVO" = true LIMIT 1`,
      [matInt],
    );
    return ufuncRows[0]?.nome ?? null;
  }

  async tentativaAtual(osId: number): Promise<number> {
    const { rows } = await this.pool.query(
      `SELECT COALESCE(MAX(tentativa), 1) as tentativa FROM manut."MMOV_REGISTROS" WHERE "N_NUMERO" = $1`,
      [osId],
    );
    return rows[0].tentativa;
  }

  async upsertRegistro(input: UpsertRegistroOfflineInput): Promise<{ createdAt: Date; solucaoAplicada: string | null }> {
    const { rows } = await this.pool.query(
      `
        INSERT INTO manut."MMOV_REGISTROS" (
            "N_NUMERO", tentativa, grupo,
            "HR_ACEITE", "HR_CHEGADA_LOCAL",
            "HR_INICIO_MANUTENCAO", "HR_FIM_MANUTENCAO", "HR_FINALIZACAO_OS",
            "FOTO_CHEGADA", "FOTO_FINALIZACAO", "FOTO_CADEADO", concluido,
            "CAUSA_PROBLEMA", "SOLUCAO_APLICADA", "UTI_MATERIAL", "SOL_MATERIAL"
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT ("N_NUMERO", tentativa, grupo) DO UPDATE SET
            "HR_ACEITE"            = COALESCE("MMOV_REGISTROS"."HR_ACEITE",            EXCLUDED."HR_ACEITE"),
            "HR_CHEGADA_LOCAL"     = COALESCE("MMOV_REGISTROS"."HR_CHEGADA_LOCAL",     EXCLUDED."HR_CHEGADA_LOCAL"),
            "HR_INICIO_MANUTENCAO" = COALESCE("MMOV_REGISTROS"."HR_INICIO_MANUTENCAO", EXCLUDED."HR_INICIO_MANUTENCAO"),
            "HR_FIM_MANUTENCAO"    = COALESCE("MMOV_REGISTROS"."HR_FIM_MANUTENCAO",    EXCLUDED."HR_FIM_MANUTENCAO"),
            "HR_FINALIZACAO_OS"    = COALESCE("MMOV_REGISTROS"."HR_FINALIZACAO_OS",    EXCLUDED."HR_FINALIZACAO_OS"),
            "CAUSA_PROBLEMA"       = COALESCE("MMOV_REGISTROS"."CAUSA_PROBLEMA",       EXCLUDED."CAUSA_PROBLEMA"),
            "SOLUCAO_APLICADA"     = COALESCE("MMOV_REGISTROS"."SOLUCAO_APLICADA",     EXCLUDED."SOLUCAO_APLICADA"),
            "UTI_MATERIAL"         = COALESCE("MMOV_REGISTROS"."UTI_MATERIAL",         EXCLUDED."UTI_MATERIAL"),
            "SOL_MATERIAL"         = COALESCE("MMOV_REGISTROS"."SOL_MATERIAL",         EXCLUDED."SOL_MATERIAL"),
            "FOTO_CHEGADA"     = COALESCE("MMOV_REGISTROS"."FOTO_CHEGADA",     EXCLUDED."FOTO_CHEGADA"),
            "FOTO_FINALIZACAO" = COALESCE("MMOV_REGISTROS"."FOTO_FINALIZACAO", EXCLUDED."FOTO_FINALIZACAO"),
            "FOTO_CADEADO"     = COALESCE("MMOV_REGISTROS"."FOTO_CADEADO",     EXCLUDED."FOTO_CADEADO"),
            concluido              = "MMOV_REGISTROS".concluido OR EXCLUDED.concluido
        RETURNING "CREATED_AT", "SOLUCAO_APLICADA"
      `,
      [
        input.osId,
        input.tentativa,
        input.grupo,
        input.hrAceite,
        input.hrChegadaLocal,
        input.hrInicioManutencao,
        input.hrFimManutencao,
        input.hrFinalizacaoOs,
        input.fotoChegada,
        input.fotoFinalizacao,
        input.fotoCadeado,
        input.concluido,
        input.causaInicial,
        input.solucaoAplicada,
        input.utiMaterial,
        input.solMaterial,
      ],
    );
    return { createdAt: rows[0].CREATED_AT, solucaoAplicada: rows[0].SOLUCAO_APLICADA };
  }

  /** Evita pausa duplicada: se já existe uma pausa no mesmo minuto (janela de 60s), pula. */
  async existePausaProxima(osId: number, grupo: number, tentativa: number, hrInicioLiteral: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      `
        SELECT 1 FROM manut."MMOV_PAUSAS"
        WHERE "N_NUMERO" = $1 AND grupo = $2 AND tentativa = $3
          AND ABS(EXTRACT(EPOCH FROM ("HR_INICIO_PAUSA" - $4::timestamp))) < 60
      `,
      [osId, grupo, tentativa, hrInicioLiteral],
    );
    return rows.length > 0;
  }

  async inserirPausa(
    osId: number,
    tentativa: number,
    grupo: number,
    hrInicio: string,
    hrFim: string | null,
    motivo: string | null,
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO manut."MMOV_PAUSAS" ("N_NUMERO", tentativa, grupo, "HR_INICIO_PAUSA", "HR_FIM_PAUSA", motivo) VALUES ($1, $2, $3, $4, $5, $6)`,
      [osId, tentativa, grupo, hrInicio, hrFim, motivo],
    );
  }
}
