import { BaseRepository } from "./base.repository";
import { NotFoundError } from "../utils/AppError";
import type { MmovQualidade } from "../models/mmov-qualidade.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

const COLUNAS_MMOV_QUALIDADE = [
  "N_NUMERO",
  "grupo",
  "tentativa",
  "PRE_PROTECAO",
  "PRE_FERRAMENTAS",
  "PRE_EPIS",
  "PRE_LUBRIFICANTES",
  "POS_LIMPEZA",
  "POS_MONTAGEM",
  "POS_AVALIACAO",
  "POS_RESIDUOS",
  "RESP_MATRICULA",
  "RESP_NOME",
  "MANUT_MATRICULA",
  "MANUT_NOME",
] as const;

const COLUNAS_ARQUIVO_QUALIDADE = ["PDF_QUALIDADE", "RESP_ASSINATURA", "MANUT_ASSINATURA"] as const;
export type ColunaArquivoQualidade = (typeof COLUNAS_ARQUIVO_QUALIDADE)[number];
export interface ChaveQualidade {
  N_NUMERO: number;
  grupo: number;
  tentativa: number;
}

export interface MmovQualidadeFiltros {
  numeros?: number[];
}

// * Consulta só nesta tabela — sem JOIN.
// ? Sem coluna de ativo/inativo — remove() cai no DELETE físico.
export class MmovQualidadeRepository extends BaseRepository<MmovQualidade> {
  protected table = 'manut."MMOV_QUALIDADE"';
  protected primaryKey = ["N_NUMERO", "grupo", "tentativa"] as const;
  protected columns = COLUNAS_MMOV_QUALIDADE;

  // * SELECT/RETURNING genérico nunca traz os bytea — ver mesma decisão em
  // * mmov-registros.repository.ts.
  protected colunasSelect = `
    "N_NUMERO",grupo,tentativa,
    "PRE_PROTECAO","PRE_FERRAMENTAS","PRE_EPIS","PRE_LUBRIFICANTES",
    "POS_LIMPEZA","POS_MONTAGEM","POS_AVALIACAO","POS_RESIDUOS",
    "RESP_MATRICULA","RESP_NOME","MANUT_MATRICULA","MANUT_NOME",
    ("PDF_QUALIDADE" IS NOT NULL) as tem_pdf_qualidade,
    ("RESP_ASSINATURA" IS NOT NULL) as tem_resp_assinatura,
    ("MANUT_ASSINATURA" IS NOT NULL) as tem_manut_assinatura
  `;

  async buscar(
    filtros: MmovQualidadeFiltros,
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<MmovQualidade>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.numeros && filtros.numeros.length > 0) {
      valores.push(filtros.numeros);
      clausulas.push(`"N_NUMERO" = ANY($${valores.length}::int[])`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }

  async buscarArquivo(chave: ChaveQualidade, coluna: ColunaArquivoQualidade): Promise<Buffer | null> {
    if (!COLUNAS_ARQUIVO_QUALIDADE.includes(coluna)) throw new Error(`Coluna de arquivo inválida: ${coluna}`);
    const { rows } = await this.pool.query(
      `SELECT "${coluna}" as conteudo FROM ${this.table} WHERE "N_NUMERO" = $1 AND grupo = $2 AND tentativa = $3`,
      [chave.N_NUMERO, chave.grupo, chave.tentativa],
    );
    return rows[0]?.conteudo ?? null;
  }

  async salvarArquivo(chave: ChaveQualidade, coluna: ColunaArquivoQualidade, conteudo: Buffer | null): Promise<void> {
    if (!COLUNAS_ARQUIVO_QUALIDADE.includes(coluna)) throw new Error(`Coluna de arquivo inválida: ${coluna}`);
    const resultado = await this.pool.query(
      `UPDATE ${this.table} SET "${coluna}" = $1 WHERE "N_NUMERO" = $2 AND grupo = $3 AND tentativa = $4`,
      [conteudo, chave.N_NUMERO, chave.grupo, chave.tentativa],
    );
    if (resultado.rowCount === 0) throw new NotFoundError(`Registro não encontrado em ${this.table}.`);
  }
}
