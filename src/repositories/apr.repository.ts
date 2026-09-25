import { pgPool, withTransaction } from "../config/postgres";

export interface SalvarAprInput {
  osId: number;
  grupo: number;
  tentativa: number;
  tag: string | null;
  checkServico: boolean;
  rAnimais?: boolean;
  rRuido?: boolean;
  rChoque?: boolean;
  rExtensao?: string | null;
  rEsmagamento?: boolean;
  rEscorregamento?: boolean;
  sinalizacao?: string | null;
  fonteEnergia?: string | null;
  epiOculos?: boolean;
  epiLuvas?: boolean;
  epiCapacete?: boolean;
  epiCinto?: boolean;
  epiOutros?: boolean;
  epiOutrosDesc?: string | null;
  ancEscada?: string | null;
  ancGuardaCorpo?: string | null;
  ancGcSeguro?: string | null;
  cliVento?: string | null;
  cliChuva?: string | null;
  cliRaios?: string | null;
  consRadio?: string | null;
  consOutros?: boolean;
  consOutrosDesc?: string | null;
  resp1Nome: string | null;
  resp1Assinatura: Buffer | null;
  resp2Nome: string | null;
  resp2Assinatura: Buffer | null;
  equipe: Array<{ matricula: string; nome: string }>;
  fotoCadeadoBuffer: Buffer | null;
}

// * Tradução de `salvar_apr`/`buscar_apr` do main.py. MMOVAPR mantém as
// * assinaturas como bytea de propósito (ver mmovapr.model.ts — não faz parte
// * da migração 001, só MMOV_REGISTROS/MMOV_QUALIDADE migraram pra arquivo_id).
export class AprRepository {
  private readonly pool = pgPool;

  async salvar(input: SalvarAprInput): Promise<{ aprId: number; regIdGrupo: number | null; maquinaNome: string }> {
    return withTransaction(async (client) => {
      const { rows: aprRows } = await client.query(
        `
          INSERT INTO manut."MMOVAPR" (
              "N_NUMERO", grupo, tentativa, "TAG_EQPG", "M_CHECK_SERVICO",
              "M_R_ANIMAIS", "M_R_RUIDO", "M_R_CHOQUE", "M_R_EXTENSAO",
              "M_R_ESMAGAMENTO", "M_R_ESCORREGAMENTO", "M_SINALIZACAO", "M_FONTE_ENERGIA",
              "M_EPI_OCULOS", "M_EPI_LUVAS", "M_EPI_CAPACETE", "M_EPI_CINTO",
              "M_EPI_OUTROS", "M_EPI_OUTROS_DESC",
              "M_ANC_ESCADA", "M_ANC_GUARDA_CORPO", "M_ANC_GC_SEGURO",
              "M_CLI_VENTO", "M_CLI_CHUVA", "M_CLI_RAIOS",
              "M_CONS_RADIO", "M_CONS_OUTROS", "M_CONS_OUTROS_DESC",
              "M_RESP_1_NOME", "M_RESP_1_ASSINATURA",
              "M_RESP_2_NOME", "M_RESP_2_ASSINATURA"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
          ON CONFLICT ("N_NUMERO", grupo, tentativa) DO UPDATE SET
              "TAG_EQPG" = EXCLUDED."TAG_EQPG", "M_CHECK_SERVICO" = EXCLUDED."M_CHECK_SERVICO",
              "M_RESP_1_NOME" = EXCLUDED."M_RESP_1_NOME", "M_RESP_1_ASSINATURA" = EXCLUDED."M_RESP_1_ASSINATURA",
              "M_RESP_2_NOME" = EXCLUDED."M_RESP_2_NOME", "M_RESP_2_ASSINATURA" = EXCLUDED."M_RESP_2_ASSINATURA"
          RETURNING "APR_ID"
        `,
        [
          input.osId,
          input.grupo,
          input.tentativa,
          input.tag,
          input.checkServico,
          input.rAnimais ?? null,
          input.rRuido ?? null,
          input.rChoque ?? null,
          input.rExtensao ?? null,
          input.rEsmagamento ?? null,
          input.rEscorregamento ?? null,
          input.sinalizacao ?? null,
          input.fonteEnergia ?? null,
          input.epiOculos ?? null,
          input.epiLuvas ?? null,
          input.epiCapacete ?? null,
          input.epiCinto ?? null,
          input.epiOutros ?? null,
          input.epiOutrosDesc ?? null,
          input.ancEscada ?? null,
          input.ancGuardaCorpo ?? null,
          input.ancGcSeguro ?? null,
          input.cliVento ?? null,
          input.cliChuva ?? null,
          input.cliRaios ?? null,
          input.consRadio ?? null,
          input.consOutros ?? null,
          input.consOutrosDesc ?? null,
          input.resp1Nome,
          input.resp1Assinatura,
          input.resp2Nome,
          input.resp2Assinatura,
        ],
      );
      const aprId = aprRows[0].APR_ID;

      await client.query(`DELETE FROM manut."MMOVAPR_EQUIPE" WHERE "APR_ID" = $1`, [aprId]);
      for (const m of input.equipe) {
        await client.query(`INSERT INTO manut."MMOVAPR_EQUIPE" ("APR_ID", "MATRICULA", "NOME") VALUES ($1, $2, $3)`, [
          aprId,
          m.matricula,
          m.nome,
        ]);
      }

      await client.query(
        `
          INSERT INTO manut."MMOV_REGISTROS" ("N_NUMERO", tentativa, grupo)
          VALUES ($1, $2, $3)
          ON CONFLICT ("N_NUMERO", tentativa, grupo) DO NOTHING
        `,
        [input.osId, input.tentativa, input.grupo],
      );
      const { rows: regRows } = await client.query(
        `SELECT "REG_ID" FROM manut."MMOV_REGISTROS" WHERE "N_NUMERO" = $1 AND tentativa = $2 AND grupo = $3 LIMIT 1`,
        [input.osId, input.tentativa, input.grupo],
      );
      const regIdGrupo: number | null = regRows[0]?.REG_ID ?? null;

      if (input.fotoCadeadoBuffer && regIdGrupo) {
        // * COALESCE preserva a primeira foto salva — igual ao Flask (nunca sobrescreve).
        // ! 2026-09-21: grava direto na coluna bytea (FOTO_CADEADO) — a
        // ! migração que trocaria isso por manut.arquivos nunca rodou de
        // ! verdade no banco (ver nota em mmov-registros.model.ts). Isso
        // ! estava derrubando a transação inteira (a APR inteira, não só a
        // ! foto) sempre que uma foto de cadeado era enviada.
        await client.query(
          `UPDATE manut."MMOV_REGISTROS" SET "FOTO_CADEADO" = COALESCE("FOTO_CADEADO", $1) WHERE "REG_ID" = $2`,
          [input.fotoCadeadoBuffer, regIdGrupo],
        );
      }

      const { rows: maquinaRows } = await client.query(
        `SELECT e."EQPG_DESCRICAO" as nome FROM manut."MMOVMAN" m LEFT JOIN public."UEQUIPGRU" e ON m."M_EQUIP" = e."EQPG_CODIGO" WHERE m."M_NUMERO" = $1`,
        [input.osId],
      );
      const maquinaNome = maquinaRows[0]?.nome || "Equipamento Geral";

      return { aprId, regIdGrupo, maquinaNome };
    });
  }

  async horariosDoGrupo(osId: number, regIdGrupo: number | null): Promise<{ inicio: Date | null; fim: Date | null }> {
    const { rows } = regIdGrupo
      ? await this.pool.query(
          `SELECT "HR_CHEGADA_LOCAL", "HR_FIM_MANUTENCAO" FROM manut."MMOV_REGISTROS" WHERE "REG_ID" = $1`,
          [regIdGrupo],
        )
      : await this.pool.query(
          `SELECT "HR_CHEGADA_LOCAL", "HR_FIM_MANUTENCAO" FROM manut."MMOV_REGISTROS" WHERE "N_NUMERO" = $1 LIMIT 1`,
          [osId],
        );
    return { inicio: rows[0]?.HR_CHEGADA_LOCAL ?? null, fim: rows[0]?.HR_FIM_MANUTENCAO ?? null };
  }

  // ! 2026-09-21: volta a gravar o PDF direto na coluna bytea (PDF_APR) — ver
  // ! nota em mmov-registros.model.ts sobre a migração nunca ter rodado.
  async salvarPdf(regIdGrupo: number, pdfBuffer: Buffer): Promise<void> {
    await this.pool.query(`UPDATE manut."MMOV_REGISTROS" SET "PDF_APR" = $1 WHERE "REG_ID" = $2`, [
      pdfBuffer,
      regIdGrupo,
    ]);
  }

  async buscarPorOs(osId: number): Promise<any | null> {
    const { rows } = await this.pool.query(`SELECT * FROM manut."MMOVAPR" WHERE "N_NUMERO" = $1`, [osId]);
    const apr = rows[0];
    if (!apr) return null;

    const { rows: equipeRows } = await this.pool.query(
      `SELECT "MATRICULA", "NOME" FROM manut."MMOVAPR_EQUIPE" WHERE "APR_ID" = $1`,
      [apr.APR_ID],
    );
    apr.equipe_detalhada = equipeRows.map((r: any) => ({ matricula: r.MATRICULA, nome: r.NOME }));

    if (apr.M_RESP_1_ASSINATURA) apr.M_RESP_1_ASSINATURA = Buffer.from(apr.M_RESP_1_ASSINATURA).toString("base64");
    if (apr.M_RESP_2_ASSINATURA) apr.M_RESP_2_ASSINATURA = Buffer.from(apr.M_RESP_2_ASSINATURA).toString("base64");

    return apr;
  }
}
