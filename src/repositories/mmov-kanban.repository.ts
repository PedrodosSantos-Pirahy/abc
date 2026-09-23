import { BaseRepository } from "./base.repository";
import type { MmovKanban } from "../models/mmov-kanban.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

// * N_NUMERO é a chave e não é gerada pelo banco — entra na lista branca.
const COLUNAS_MMOV_KANBAN = ["N_NUMERO", "OBSERVACAO", "grupos_config"] as const;

export interface MmovKanbanFiltros {
  numeros?: number[];
}

// ? Tabela própria da aplicação, sem coluna de ativo/inativo hoje — remove()
// ? cai no DELETE físico. Como é "nossa", dá pra adicionar uma coluna
// ? (ex.: `ativo boolean`) se precisarmos preservar histórico — decisão em
// ? aberto, não fiz a migração sem confirmar.
export class MmovKanbanRepository extends BaseRepository<MmovKanban> {
  protected table = 'manut."MMOV_KANBAN"';
  protected primaryKey = "N_NUMERO" as const;
  protected columns = COLUNAS_MMOV_KANBAN;

  async buscar(filtros: MmovKanbanFiltros, opcoes: Partial<OpcoesPaginacao> = {}): Promise<ResultadoPaginado<MmovKanban>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.numeros && filtros.numeros.length > 0) {
      valores.push(filtros.numeros);
      clausulas.push(`"N_NUMERO" = ANY($${valores.length}::int[])`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }
}
