import { BaseRepository } from "./base.repository";
import type { Uequipgru } from "../models/uequipgru.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

const COLUNAS_UEQUIPGRU = ["EQPG_CODIGO", "EQPG_LOCAL", "EQPG_EMPRESA", "EQPG_DESCRICAO"] as const;

// * Chave completa de um equipamento. EQPG_CODIGO SOZINHO NÃO É ÚNICO: o
// * mesmo código existe no local 1 e no local 2 como máquinas diferentes
// * (ex.: 172 = "DESCASCADOR SATAKE" no local 1 e "SILO 72 Nº 27" no 2).
// * Toda busca que parte de uma SS (M_EQUIP) precisa levar M_LOCAL/M_EMPRESA.
export interface ChaveEquipamento {
  codigo: number;
  local: number;
  empresa: number;
}

export interface UequipgruFiltros {
  codigos?: number[];
  // * Lote de chaves completas (codigo+local+empresa) — preferir isto a
  // * `codigos` sempre que os códigos vierem de SS (MMOVMAN). É resolução de
  // * NOME de SS já gravada, então inclui equipamento desativado (a OS
  // * antiga de uma máquina hoje desativada continua mostrando o nome dela).
  chaves?: ChaveEquipamento[];
  q?: string;
  local?: string;
  empresa?: string;
}

export class UequipgruRepository extends BaseRepository<Uequipgru> {
  protected table = 'public."UEQUIPGRU"';
  protected primaryKey = ["EQPG_CODIGO", "EQPG_LOCAL", "EQPG_EMPRESA"] as const;
  protected columns = COLUNAS_UEQUIPGRU;
  // * Só as 4 colunas que o frontend usa, em vez das 21 da tabela do ERP — o
  // * board do Kanban resolve ~1.400 equipamentos a cada refresh (25s), e
  // * `*` deixava essa resposta ~6x maior.
  protected colunasSelect = COLUNAS_UEQUIPGRU.map((c) => `"${c}"`).join(", ");
  // * EQPG_DESATIVADO já existe e já era respeitado no filtro de busca acima
  // * (true = desativado) — só ligamos o remove() genérico nela.
  protected desativacao = { coluna: "EQPG_DESATIVADO", valorDesativado: true };

  async buscar(filtros: UequipgruFiltros, opcoes: Partial<OpcoesPaginacao> = {}): Promise<ResultadoPaginado<Uequipgru>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];
    if (!filtros.chaves?.length) {
      clausulas.push(`("EQPG_DESATIVADO" IS NULL OR "EQPG_DESATIVADO" = false)`);
    }

    if (filtros.codigos && filtros.codigos.length > 0) {
      valores.push(filtros.codigos);
      clausulas.push(`"EQPG_CODIGO" = ANY($${valores.length}::int[])`);
    }
    if (filtros.chaves && filtros.chaves.length > 0) {
      valores.push(filtros.chaves.map((c) => c.codigo));
      valores.push(filtros.chaves.map((c) => c.local));
      valores.push(filtros.chaves.map((c) => c.empresa));
      const n = valores.length;
      clausulas.push(
        `("EQPG_CODIGO", "EQPG_LOCAL", "EQPG_EMPRESA") IN (SELECT * FROM unnest($${n - 2}::int[], $${n - 1}::int[], $${n}::int[]))`,
      );
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
