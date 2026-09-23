import { BaseRepository } from "./base.repository";
import type { Uequipset } from "../models/uequipset.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

export interface UequipsetFiltros {
  codigos?: number[];
}

// ? Sem coluna de ativo/inativo hoje — remove() cai no DELETE físico.
export class UequipsetRepository extends BaseRepository<Uequipset> {
  protected table = 'public."UEQUIPSET"';
  protected primaryKey = "EQPS_CODIGO" as const;
  protected columns = ["EQPS_CODIGO", "EQPS_DESCRICAO"] as const;

  async buscar(filtros: UequipsetFiltros, opcoes: Partial<OpcoesPaginacao> = {}): Promise<ResultadoPaginado<Uequipset>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];
    if (filtros.codigos && filtros.codigos.length > 0) {
      valores.push(filtros.codigos);
      clausulas.push(`"EQPS_CODIGO" = ANY($${valores.length}::int[])`);
    }
    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 500 });
  }
}
