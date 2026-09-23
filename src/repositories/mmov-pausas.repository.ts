import { BaseRepository } from "./base.repository";
import type { MmovPausas } from "../models/mmov-pausas.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";
import { agoraComoLiteral } from "../utils/conversao";

// * N_NUMERO/tentativa/grupo/HR_INICIO_PAUSA formam a chave composta e não
// * são geradas pelo banco — precisam estar aqui pra poderem ser gravadas
// * no create().
const COLUNAS_MMOV_PAUSAS = ["N_NUMERO", "tentativa", "grupo", "HR_INICIO_PAUSA", "HR_FIM_PAUSA", "motivo"] as const;

export interface MmovPausasFiltros {
  numeros?: number[];
}

// * Consulta só nesta tabela. Relacionar pausa com o registro/grupo/tentativa
// * correspondente (MMOV_REGISTROS) é trabalho do frontend.
// ? Sem coluna de ativo/inativo — remove() cai no DELETE físico.
export class MmovPausasRepository extends BaseRepository<MmovPausas> {
  protected table = 'manut."MMOV_PAUSAS"';
  protected primaryKey = ["N_NUMERO", "tentativa", "grupo", "HR_INICIO_PAUSA"] as const;
  protected columns = COLUNAS_MMOV_PAUSAS;

  async buscar(filtros: MmovPausasFiltros, opcoes: Partial<OpcoesPaginacao> = {}): Promise<ResultadoPaginado<MmovPausas>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.numeros && filtros.numeros.length > 0) {
      valores.push(filtros.numeros);
      clausulas.push(`"N_NUMERO" = ANY($${valores.length}::int[])`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }

  // * "Está dentro da janela de 4h" é uma comparação com NOW() do PRÓPRIO
  // * Postgres — fazer isso no cliente exigiria saber o fuso do processo
  // * Node pra desfazer a serialização de Date/JSON corretamente (mesmo
  // * problema que isoLocalSemZ existe pra evitar). Continua uma consulta só
  // * nesta tabela (sem JOIN) — só o booleano é calculado aqui.
  async buscarAberta(numero: number, grupo: number): Promise<{ hrInicioPausa: Date; motivo: string | null; dentroJanela: boolean } | null> {
    const { rows } = await this.pool.query(
      `
        SELECT "HR_INICIO_PAUSA", motivo, EXTRACT(EPOCH FROM (NOW() - "HR_INICIO_PAUSA")) < 14400 as dentro_janela
        FROM ${this.table}
        WHERE "N_NUMERO" = $1 AND grupo = $2 AND "HR_FIM_PAUSA" IS NULL
        ORDER BY "HR_INICIO_PAUSA" DESC LIMIT 1
      `,
      [numero, grupo],
    );
    if (rows.length === 0) return null;
    return {
      hrInicioPausa: rows[0].HR_INICIO_PAUSA,
      motivo: rows[0].motivo,
      dentroJanela: Boolean(rows[0].dentro_janela),
    };
  }

  // * Fecha a pausa em aberto (HR_FIM_PAUSA IS NULL) de um grupo/tentativa —
  // * ainda uma operação só nesta tabela, mas via WHERE em vez da chave
  // * composta exata: o app não sabe (e não deveria precisar saber) o literal
  // * exato de HR_INICIO_PAUSA já gravado pra montar a URL /:hrInicio.
  // * `hrFimLiteral`, se enviado, já vem formatado como "YYYY-MM-DD HH:MI:SS"
  // * local (ver ExecucaoActionsService#literalLocal no frontend_manutentor)
  // * — nada de fuso a desfazer aqui, diferente do antigo ajustarFusoRs.
  async fecharAberta(numero: number, grupo: number, tentativa: number, hrFimLiteral?: string | null): Promise<void> {
    const hrFim = hrFimLiteral || agoraComoLiteral();
    await this.pool.query(
      `UPDATE ${this.table} SET "HR_FIM_PAUSA" = $1 WHERE "N_NUMERO" = $2 AND grupo = $3 AND tentativa = $4 AND "HR_FIM_PAUSA" IS NULL`,
      [hrFim, numero, grupo, tentativa],
    );
  }

  // * Igual ao original: fecha a pausa em aberto usando o PRÓPRIO horário de
  // * início como fim (fechamento de segurança sem duração), usado quando a
  // * sessão é concluída sem que o app tenha explicitamente retomado a pausa.
  async fecharComPropriaHora(numero: number, grupo: number, tentativa: number): Promise<void> {
    await this.pool.query(
      `UPDATE ${this.table} SET "HR_FIM_PAUSA" = COALESCE("HR_FIM_PAUSA", "HR_INICIO_PAUSA") WHERE "N_NUMERO" = $1 AND grupo = $2 AND tentativa = $3 AND "HR_FIM_PAUSA" IS NULL`,
      [numero, grupo, tentativa],
    );
  }
}
