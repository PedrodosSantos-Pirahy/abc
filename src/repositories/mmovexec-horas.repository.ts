import { BaseRepository } from "./base.repository";
import type { MmovexecHoras } from "../models/mmovexec-horas.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

// * Chave composta de 6 colunas, nenhuma gerada pelo banco — todas entram na
// * lista branca pra poderem ser gravadas no create().
const COLUNAS_MMOVEXEC_HORAS = [
  "MH_NR_ORD",
  "MH_LOCAL",
  "MH_EMPRESA",
  "MH_DATA",
  "MH_RESPONS",
  "MH_SEQ",
  "MH_HORAS",
  "MH_HRI",
  "MH_HRF",
] as const;

export interface MmovexecHorasFiltros {
  nrOrds?: number[];
}

// * Consulta só nesta tabela — sem JOIN.
// ? Sem coluna de ativo/inativo — remove() cai no DELETE físico.
export class MmovexecHorasRepository extends BaseRepository<MmovexecHoras> {
  protected table = 'manut."MMOVEXEC_HORAS"';
  protected primaryKey = ["MH_NR_ORD", "MH_LOCAL", "MH_EMPRESA", "MH_DATA", "MH_RESPONS", "MH_SEQ"] as const;
  protected columns = COLUNAS_MMOVEXEC_HORAS;

  async buscar(
    filtros: MmovexecHorasFiltros,
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<MmovexecHoras>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.nrOrds && filtros.nrOrds.length > 0) {
      valores.push(filtros.nrOrds);
      clausulas.push(`"MH_NR_ORD" = ANY($${valores.length}::int[])`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }
}
