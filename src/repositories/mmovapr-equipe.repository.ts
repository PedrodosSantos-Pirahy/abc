import { BaseRepository } from "./base.repository";
import type { MmovaprEquipe } from "../models/mmovapr-equipe.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

const COLUNAS_MMOVAPR_EQUIPE = ["APR_ID", "MATRICULA", "NOME"] as const;

export interface MmovaprEquipeFiltros {
  aprIds?: number[];
}

// * Consulta só nesta tabela — sem JOIN.
// ? Sem coluna de ativo/inativo — remove() cai no DELETE físico.
export class MmovaprEquipeRepository extends BaseRepository<MmovaprEquipe> {
  protected table = 'manut."MMOVAPR_EQUIPE"';
  protected primaryKey = ["APR_ID", "MATRICULA"] as const;
  protected columns = COLUNAS_MMOVAPR_EQUIPE;

  async buscar(
    filtros: MmovaprEquipeFiltros,
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<MmovaprEquipe>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.aprIds && filtros.aprIds.length > 0) {
      valores.push(filtros.aprIds);
      clausulas.push(`"APR_ID" = ANY($${valores.length}::int[])`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }
}
