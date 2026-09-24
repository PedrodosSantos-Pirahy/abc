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
  "M_PERG1",
  "M_PERG2",
  "M_PERG3",
] as const;

export interface MmovmanFiltros {
  dataDe?: string;
  dataAte?: string;
  numeros?: number[];
  equip?: number;
  // * Filtros do painel do Kanban (kanban.component.ts) — todos coluna
  // * direta de MMOVMAN, sem JOIN.
  risco?: number;
  priorid?: number;
  tipo?: number;
  atividade?: number;
  setor?: number;
  local?: number;
  serie?: string;
  perg1?: string;
  perg2?: string;
  perg3?: string;
  // * Busca parcial pelo próprio número da SS (M_NUMERO) — cast pra texto,
  // * ILIKE.
  numeroParcial?: string;
  // * M_FUNC_SOL é nativo de MMOVMAN (só o código, sem o nome) — filtro por
  // * nome do solicitante primeiro resolve os códigos em UFUNC (frontend), e
  // * manda a lista aqui.
  funcSolIn?: number[];
  // * Lista de N_NUMERO já resolvida em OUTRA tabela (mecânico via
  // * MMOV_KANBAN_EQUIPE, nº da OS via MMOVEXEC) — campo separado de
  // * `numeros` de propósito: `numeros` já é usado internamente pra buscar
  // * um lote específico (ex: SS ativas fora da janela de data no board do
  // * Kanban); `numerosPermitidos` é sempre um AND adicional por cima disso,
  // * nunca substitui.
  numerosPermitidos?: number[];
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
    if (filtros.risco !== undefined) {
      valores.push(filtros.risco);
      clausulas.push(`"M_RISCO" = $${valores.length}`);
    }
    if (filtros.priorid !== undefined) {
      valores.push(filtros.priorid);
      clausulas.push(`"M_PRIORID" = $${valores.length}`);
    }
    if (filtros.tipo !== undefined) {
      valores.push(filtros.tipo);
      clausulas.push(`"M_TIPO" = $${valores.length}`);
    }
    if (filtros.atividade !== undefined) {
      valores.push(filtros.atividade);
      clausulas.push(`"M_ATIVIDADE" = $${valores.length}`);
    }
    if (filtros.setor !== undefined) {
      valores.push(filtros.setor);
      clausulas.push(`"M_SETOR" = $${valores.length}`);
    }
    if (filtros.local !== undefined) {
      valores.push(filtros.local);
      clausulas.push(`"M_LOCAL" = $${valores.length}`);
    }
    if (filtros.serie) {
      valores.push(filtros.serie);
      clausulas.push(`"M_SERIE" = $${valores.length}`);
    }
    if (filtros.perg1) {
      valores.push(filtros.perg1);
      clausulas.push(`"M_PERG1" = $${valores.length}`);
    }
    if (filtros.perg2) {
      valores.push(filtros.perg2);
      clausulas.push(`"M_PERG2" = $${valores.length}`);
    }
    if (filtros.perg3) {
      valores.push(filtros.perg3);
      clausulas.push(`"M_PERG3" = $${valores.length}`);
    }
    if (filtros.numeroParcial) {
      valores.push(`%${filtros.numeroParcial}%`);
      clausulas.push(`"M_NUMERO"::varchar ILIKE $${valores.length}`);
    }
    // * `!== undefined`, não `.length > 0` — uma lista VAZIA aqui significa
    // * "o filtro indireto rodou e não achou ninguém", tem que devolver zero
    // * linhas. Tratar [] como "não filtrado" (o bug de antes) fazia uma
    // * busca de mecânico/solicitante sem resultado mostrar o board inteiro.
    if (filtros.funcSolIn !== undefined) {
      valores.push(filtros.funcSolIn);
      clausulas.push(`"M_FUNC_SOL" = ANY($${valores.length}::int[])`);
    }
    if (filtros.numerosPermitidos !== undefined) {
      valores.push(filtros.numerosPermitidos);
      clausulas.push(`"M_NUMERO" = ANY($${valores.length}::int[])`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }

  // ! Tabela do ERP compartilhada com outras telas — nunca um DELETE de
  // ! verdade (mesmo espírito de os.repository.ts pra MMOVEXEC).
  override async delete(): Promise<void> {
    throw new Error("MMOVMAN não pode ser removida por este backend — tabela do ERP.");
  }
}
