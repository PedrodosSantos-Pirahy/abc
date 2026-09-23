import { BaseRepository } from "./base.repository";
import type { Mmovapr } from "../models/mmovapr.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

const COLUNAS_MMOVAPR = [
  "N_NUMERO",
  "grupo",
  "tentativa",
  "TAG_EQPG",
  "M_CHECK_SERVICO",
  "M_R_ANIMAIS",
  "M_R_RUIDO",
  "M_R_CHOQUE",
  "M_R_EXTENSAO",
  "M_R_ESMAGAMENTO",
  "M_R_ESCORREGAMENTO",
  "M_SINALIZACAO",
  "M_FONTE_ENERGIA",
  "M_EPI_OCULOS",
  "M_EPI_LUVAS",
  "M_EPI_CAPACETE",
  "M_EPI_CINTO",
  "M_EPI_OUTROS",
  "M_EPI_OUTROS_DESC",
  "M_ANC_ESCADA",
  "M_ANC_GUARDA_CORPO",
  "M_ANC_GC_SEGURO",
  "M_CLI_VENTO",
  "M_CLI_CHUVA",
  "M_CLI_RAIOS",
  "M_CONS_RADIO",
  "M_CONS_OUTROS",
  "M_CONS_OUTROS_DESC",
  "M_RESP_1_NOME",
  "M_RESP_1_ASSINATURA",
  "M_RESP_2_NOME",
  "M_RESP_2_ASSINATURA",
] as const;

export interface MmovaprFiltros {
  numeros?: number[];
}

// * Consulta só nesta tabela — sem JOIN.
// ? Sem coluna de ativo/inativo — remove() cai no DELETE físico.
export class MmovaprRepository extends BaseRepository<Mmovapr> {
  protected table = 'manut."MMOVAPR"';
  protected primaryKey = "APR_ID" as const;
  protected columns = COLUNAS_MMOVAPR;

  async buscar(filtros: MmovaprFiltros, opcoes: Partial<OpcoesPaginacao> = {}): Promise<ResultadoPaginado<Mmovapr>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.numeros && filtros.numeros.length > 0) {
      valores.push(filtros.numeros);
      clausulas.push(`"N_NUMERO" = ANY($${valores.length}::int[])`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }
}
