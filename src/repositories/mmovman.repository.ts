import { BaseRepository } from "./base.repository";
import type { Mmovman } from "../models/mmovman.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

// * Todas as colunas de MMOVMAN que este backend pode ler/gravar. M_NUMERO/
// * M_SERIE também são a chave primária (composta, ver nota de SERIE no
// * CLAUDE.md), mas — diferente de uma chave serial tipo M_NR_ORD — não são
// * geradas pelo banco, então precisam poder ser gravadas no create().
const COLUNAS_MMOVMAN = [
  "M_NUMERO",
  "M_SERIE",
  "M_DESCRICAO",
  "M_DATAHR",
  "M_PRIORID",
  "M_RISCO",
  "M_FUNC_SOL",
  "M_EQUIP",
  "M_LOCAL",
  "M_EMPRESA",
  "M_TIPO",
  "M_ATIVIDADE",
  "M_AMBIENTE",
  "M_SETOR",
] as const;

export interface MmovmanFiltros {
  dataDe?: string;
  dataAte?: string;
  numeros?: number[];
  equip?: number;
}

// * Consulta só nesta tabela — nada de JOIN/EXISTS contra outra tabela do
// * app aqui. Relacionar com MMOVEXEC/MMOV_REGISTROS/etc. é trabalho do
// * frontend, não deste repository.
export class MmovmanRepository extends BaseRepository<Mmovman> {
  protected table = 'manut."MMOVMAN"';
  protected primaryKey = ["M_NUMERO", "M_SERIE"] as const;
  protected columns = COLUNAS_MMOVMAN;

  async buscar(filtros: MmovmanFiltros, opcoes: Partial<OpcoesPaginacao> = {}): Promise<ResultadoPaginado<Mmovman>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.numeros && filtros.numeros.length > 0) {
      valores.push(filtros.numeros);
      clausulas.push(`"M_NUMERO" = ANY($${valores.length}::int[])`);
    }
    if (filtros.dataDe) {
      valores.push(filtros.dataDe);
      clausulas.push(`"M_DATAHR" >= $${valores.length}::date`);
    }
    if (filtros.dataAte) {
      valores.push(filtros.dataAte);
      clausulas.push(`"M_DATAHR" <= $${valores.length}::date + INTERVAL '1 day'`);
    }
    if (filtros.equip !== undefined) {
      valores.push(filtros.equip);
      clausulas.push(`"M_EQUIP" = $${valores.length}`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }

  // ! Tabela do ERP compartilhada com outras telas — nunca um DELETE de
  // ! verdade (mesmo espírito de os.repository.ts pra MMOVEXEC).
  override async delete(): Promise<void> {
    throw new Error("MMOVMAN não pode ser removida por este backend — tabela do ERP.");
  }
}
