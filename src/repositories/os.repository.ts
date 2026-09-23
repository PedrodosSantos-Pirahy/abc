import { BaseRepository } from "./base.repository";
import { NotFoundError } from "../utils/AppError";
import type { Os } from "../models/os.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

export interface OsFiltros {
  nrSol?: number;
  nrSolIn?: number[];
  serie?: string;
  matriculaResponsavel?: string;
  emissaoDe?: Date | string;
  emissaoAte?: Date | string;
}

// * Todas as colunas de MMOVEXEC que este backend pode ler/gravar — ver
// * models/mmovexec.model.ts pro significado de cada uma. M_NR_ORD fica de
// * fora de propósito: é a chave primária (serial), nunca é "gravável".
const COLUNAS_MMOVEXEC = [
  "M_NR_SOL",
  "M_SR_SOL",
  "M_LOCAL",
  "M_EMPRESA",
  "M_DT_EMISSAO",
  "M_DISCRIM",
  "M_RESPONS",
  "M_RESPONS2",
  "M_RESPONS3",
  "M_RESPONS4",
  "M_HR_EFET_COLAB",
  "M_IDSERVICO_ATIV",
  "M_HR_PREV",
  "M_DT_PREV",
  "M_JUSTIFICATIVA",
  "M_DT_EFET",
  "M_HRI",
  "M_DT_EFETFIM",
  "M_HRF",
  "M_HR_EFET",
  "M_SOLUCAO",
] as const;

export class OsRepository extends BaseRepository<Os> {
  protected table = 'manut."MMOVEXEC"';
  protected primaryKey = "M_NR_ORD" as const;
  protected columns = COLUNAS_MMOVEXEC;

  /**
   * * Busca com os filtros que a OS realmente precisa. Nenhum deles é um
   * * simples "coluna = valor" isolado — por isso não dá pra usar o
   * * `findMany` genérico direto: filtro por SS de origem, série, intervalo
   * * de emissão e, o mais específico, "está atribuída a esta matrícula",
   * * que é um OR entre as 4 colunas de responsável (`M_RESPONS`..`M_RESPONS4`).
   */
  async buscar(
    filtros: OsFiltros,
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<Os>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.nrSol !== undefined) {
      valores.push(filtros.nrSol);
      clausulas.push(`${this.validarColuna("M_NR_SOL")} = $${valores.length}`);
    }
    if (filtros.nrSolIn && filtros.nrSolIn.length > 0) {
      valores.push(filtros.nrSolIn);
      clausulas.push(`${this.validarColuna("M_NR_SOL")} = ANY($${valores.length}::int[])`);
    }
    if (filtros.serie) {
      valores.push(filtros.serie);
      clausulas.push(`${this.validarColuna("M_SR_SOL")} = $${valores.length}`);
    }
    if (filtros.emissaoDe) {
      valores.push(filtros.emissaoDe);
      clausulas.push(`${this.validarColuna("M_DT_EMISSAO")} >= $${valores.length}`);
    }
    if (filtros.emissaoAte) {
      valores.push(filtros.emissaoAte);
      clausulas.push(`${this.validarColuna("M_DT_EMISSAO")} <= $${valores.length}`);
    }
    if (filtros.matriculaResponsavel) {
      valores.push(filtros.matriculaResponsavel);
      const colunasResponsavel = ["M_RESPONS", "M_RESPONS2", "M_RESPONS3", "M_RESPONS4"]
        .map((coluna) => this.validarColuna(coluna))
        .join(", ");
      clausulas.push(`$${valores.length} IN (${colunasResponsavel})`);
    }

    return this.paginar(clausulas.join(" AND "), valores, opcoes);
  }

  /**
   * ! Nunca roda um DELETE de verdade em MMOVEXEC — essa tabela é
   * ! compartilhada com outras telas do ERP, que decidem PENDENTE vs
   * ! EM_EXECUCAO olhando pra M_RESPONS1..4 (ver CLAUDE.md do projeto,
   * ! seção "Retorno para PENDENTE — Fluxo Correto"). "Excluir" uma OS aqui
   * ! significa devolvê-la ao estado PENDENTE zerando os 4 responsáveis —
   * ! NUNCA apagar a linha (isso destruiria o histórico e o vínculo com a
   * ! SS de origem, M_NR_SOL).
   */
  /**
   * * Substitui o script SQL manual que rodava de tempos em tempos pra
   * * preencher M_DT_EMISSAO/M_DISCRIM destas OS (M_LOCAL=2, M_SR_SOL=S —
   * * nascem direto no ERP legado, sem emissão pelo fluxo normal do
   * * `os.service.ts`). Chamado pelo hook de MMOV_REGISTROS assim que a
   * * solução aplicada é gravada — ver mmov-registros.service.ts.
   * * `M_DT_EMISSAO IS NULL` torna isso idempotente: só grava na primeira
   * * vez, nunca sobrescreve numa chamada seguinte pra mesma OS.
   */
  async emitirParaErpLegado(nrSol: number, dataEmissao: Date, discriminacao: string | null): Promise<void> {
    await this.pool.query(
      `
        UPDATE manut."MMOVEXEC"
        SET "M_DT_EMISSAO" = $2, "M_DISCRIM" = $3
        WHERE "M_NR_SOL" = $1 AND "M_LOCAL" = '2' AND "M_SR_SOL" = 'S' AND "M_DT_EMISSAO" IS NULL
      `,
      [nrSol, dataEmissao, discriminacao],
    );
  }

  async delete(id: unknown): Promise<void> {
    const sql = `
      UPDATE ${this.table}
      SET "M_RESPONS" = NULL, "M_RESPONS2" = NULL, "M_RESPONS3" = NULL, "M_RESPONS4" = NULL
      WHERE "M_NR_ORD" = $1
    `;
    const resultado = await this.pool.query(sql, [id]);
    if (resultado.rowCount === 0) {
      throw new NotFoundError(`OS ${id} não encontrada em ${this.table}.`);
    }
  }
}
