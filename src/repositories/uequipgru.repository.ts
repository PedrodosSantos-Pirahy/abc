import { BaseRepository } from "./base.repository";
import type { Uequipgru } from "../models/uequipgru.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

const COLUNAS_UEQUIPGRU = ["EQPG_CODIGO", "EQPG_LOCAL", "EQPG_EMPRESA", "EQPG_DESCRICAO"] as const;

export interface UequipgruFiltros {
  codigos?: number[];
  q?: string;
  local?: string;
  empresa?: string;
}

export class UequipgruRepository extends BaseRepository<Uequipgru> {
  protected table = 'public."UEQUIPGRU"';
  protected primaryKey = "EQPG_CODIGO" as const;
  protected columns = COLUNAS_UEQUIPGRU;
  // * EQPG_DESATIVADO já existe e já era respeitado no filtro de busca acima
  // * (true = desativado) — só ligamos o remove() genérico nela.
  protected desativacao = { coluna: "EQPG_DESATIVADO", valorDesativado: true };

  async buscar(filtros: UequipgruFiltros, opcoes: Partial<OpcoesPaginacao> = {}): Promise<ResultadoPaginado<Uequipgru>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [`("EQPG_DESATIVADO" IS NULL OR "EQPG_DESATIVADO" = false)`];

    if (filtros.codigos && filtros.codigos.length > 0) {
      valores.push(filtros.codigos);
      clausulas.push(`"EQPG_CODIGO" = ANY($${valores.length}::int[])`);
    }
    if (filtros.local) {
      valores.push(filtros.local);
      clausulas.push(`"EQPG_LOCAL" = $${valores.length}`);
    }
    if (filtros.empresa) {
      valores.push(filtros.empresa);
      clausulas.push(`"EQPG_EMPRESA" = $${valores.length}`);
    }
    if (filtros.q) {
      valores.push(`%${filtros.q}%`);
      clausulas.push(`UPPER("EQPG_DESCRICAO") LIKE UPPER($${valores.length})`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 30 });
  }
}
