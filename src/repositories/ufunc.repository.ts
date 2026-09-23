import { BaseRepository } from "./base.repository";
import type { Ufunc } from "../models/ufunc.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

const COLUNAS_UFUNC = ["UFUN_CODIGO", "UFUN_DESCRICAO", "UFUN_ATIVO", "UFUN_EMPRESA"] as const;

export interface UfuncFiltros {
  codigos?: string[];
}

export class UfuncRepository extends BaseRepository<Ufunc> {
  protected table = 'public."UFUNC"';
  protected primaryKey = "UFUN_CODIGO" as const;
  protected columns = COLUNAS_UFUNC;
  // ! UFUNC é do ERP — "desativar" por aqui muda um funcionário de verdade
  // ! pra outros sistemas também. Usar com cuidado.
  protected desativacao = { coluna: "UFUN_ATIVO", valorDesativado: false };

  // * Lote por matrícula — usado quando o frontend já sabe quais matrículas
  // * quer resolver o nome (equipe do Kanban, solicitante, etc.).
  async buscar(filtros: UfuncFiltros, opcoes: Partial<OpcoesPaginacao> = {}): Promise<ResultadoPaginado<Ufunc>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [`"UFUN_ATIVO" = true`];

    if (filtros.codigos && filtros.codigos.length > 0) {
      valores.push(filtros.codigos);
      clausulas.push(`"UFUN_CODIGO"::varchar = ANY($${valores.length}::varchar[])`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }
}
