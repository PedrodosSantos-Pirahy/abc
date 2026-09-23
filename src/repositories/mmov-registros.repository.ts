import { BaseRepository } from "./base.repository";
import { NotFoundError } from "../utils/AppError";
import type { MmovRegistros } from "../models/mmov-registros.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

const COLUNAS_MMOV_REGISTROS = [
  "N_NUMERO",
  "tentativa",
  "grupo",
  "MATRICULA",
  "HR_ACEITE",
  "HR_CHEGADA_LOCAL",
  "HR_FINALIZACAO_OS",
  "HR_INICIO_MANUTENCAO",
  "HR_FIM_MANUTENCAO",
  "HR_APROVACAO_PCM",
  "CAUSA_PROBLEMA",
  "SOLUCAO_APLICADA",
  "UTI_MATERIAL",
  "SOL_MATERIAL",
  "concluido",
  "motivo_reprovacao",
] as const;

// * Nomes reais das colunas bytea — únicos aceitos por buscarArquivo/
// * salvarArquivo (nunca um nome de coluna vindo direto da URL/body).
const COLUNAS_ARQUIVO = ["FOTO_CHEGADA", "FOTO_FINALIZACAO", "FOTO_CADEADO", "PDF_APR", "PDF_QUALIDADE"] as const;
export type ColunaArquivoRegistros = (typeof COLUNAS_ARQUIVO)[number];

export interface MmovRegistrosFiltros {
  numeros?: number[];
  semMatricula?: boolean;
}

// * Consulta só nesta tabela. Relacionar com MMOVMAN/MMOVEXEC/MMOV_PAUSAS/
// * MMOV_KANBAN_EQUIPE (por N_NUMERO/grupo/tentativa) é trabalho do frontend.
// ? Sem coluna de ativo/inativo — remove() cai no DELETE físico. Provavelmente
// ? nunca deveria ser chamado na prática (é o histórico de execução da OS).
export class MmovRegistrosRepository extends BaseRepository<MmovRegistros> {
  protected table = 'manut."MMOV_REGISTROS"';
  protected primaryKey = "REG_ID" as const;
  protected columns = COLUNAS_MMOV_REGISTROS;

  // * SELECT/RETURNING genérico nunca traz os bytea — só booleanos "tem_x".
  // * Quem precisa do binário chama buscarArquivo(regId, coluna) à parte.
  protected colunasSelect = `
    "REG_ID","N_NUMERO",tentativa,grupo,sessao,"MATRICULA","CREATED_AT",
    "HR_ACEITE","HR_CHEGADA_LOCAL","HR_FINALIZACAO_OS","HR_INICIO_MANUTENCAO","HR_FIM_MANUTENCAO","HR_APROVACAO_PCM",
    "CAUSA_PROBLEMA","SOLUCAO_APLICADA","UTI_MATERIAL","SOL_MATERIAL",concluido,motivo_reprovacao,
    ("FOTO_CHEGADA" IS NOT NULL) as tem_foto_chegada,
    ("FOTO_FINALIZACAO" IS NOT NULL) as tem_foto_finalizacao,
    ("FOTO_CADEADO" IS NOT NULL) as tem_foto_cadeado,
    ("PDF_APR" IS NOT NULL) as tem_pdf_apr,
    ("PDF_QUALIDADE" IS NOT NULL) as tem_pdf_qualidade
  `;

  async buscarArquivo(regId: number, coluna: ColunaArquivoRegistros): Promise<Buffer | null> {
    if (!COLUNAS_ARQUIVO.includes(coluna)) throw new Error(`Coluna de arquivo inválida: ${coluna}`);
    const { rows } = await this.pool.query(
      `SELECT "${coluna}" as conteudo FROM ${this.table} WHERE "REG_ID" = $1`,
      [regId],
    );
    return rows[0]?.conteudo ?? null;
  }

  async salvarArquivo(regId: number, coluna: ColunaArquivoRegistros, conteudo: Buffer | null): Promise<void> {
    if (!COLUNAS_ARQUIVO.includes(coluna)) throw new Error(`Coluna de arquivo inválida: ${coluna}`);
    const resultado = await this.pool.query(
      `UPDATE ${this.table} SET "${coluna}" = $1 WHERE "REG_ID" = $2`,
      [conteudo, regId],
    );
    if (resultado.rowCount === 0) throw new NotFoundError(`Registro não encontrado em ${this.table}.`);
  }

  async buscar(
    filtros: MmovRegistrosFiltros,
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<MmovRegistros>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.numeros && filtros.numeros.length > 0) {
      valores.push(filtros.numeros);
      clausulas.push(`"N_NUMERO" = ANY($${valores.length}::int[])`);
    }
    if (filtros.semMatricula) {
      clausulas.push(`"MATRICULA" IS NULL`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }
}
