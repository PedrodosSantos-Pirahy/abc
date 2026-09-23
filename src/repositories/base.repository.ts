import type { Pool } from "pg";
import { pgPool } from "../config/postgres";
import { NotFoundError } from "../utils/AppError";
import {
  OpcoesPaginacao,
  ResultadoPaginado,
  PAGINACAO_PADRAO,
  PAGE_SIZE_MAXIMO,
} from "../types/pagination.types";

// * Helper só pra indexação dinâmica (ex.: montar o objeto de chave composta
// * a partir de `id`). NÃO é usado como constraint genérica de `T` — uma
// * interface "normal" (Arquivo, Mmovexec, Usuario...) não satisfaz
// * `Record<string, unknown>` no TypeScript sem um index signature explícito,
// * por isso o parâmetro genérico abaixo usa `extends object` (mais permissivo).
type RegistroIndexavel = Record<string, unknown>;

/**
 * * CRUD genérico reaproveitado por toda entidade do backend. Uma entidade
 * * concreta (ex.: `os.repository.ts`) só precisa declarar `table`,
 * * `primaryKey` e `columns` — os 5 métodos abaixo já funcionam sozinhos.
 * *
 * * Por que não gerar SQL 100% dinâmico a partir de qualquer chave do body?
 * * Porque o nome de uma coluna não pode ser parametrizado com `$1` (só
 * * VALORES podem) — então todo nome de coluna que entra numa query aqui
 * * passa antes por `validarColuna`, que checa contra a lista branca
 * * `columns`. Isso fecha a porta pra um cliente HTTP tentar injetar um
 * * nome de coluna arbitrário (ou uma coluna sensível fora da lista).
 */
export abstract class BaseRepository<T extends object> {
  protected readonly pool: Pool = pgPool;

  /** Nome da tabela já com schema e aspas corretas, ex.: `manut."MMOVEXEC"`. */
  protected abstract table: string;

  /** Coluna (ou colunas, para chave composta) que identifica uma linha. */
  protected abstract primaryKey: string | readonly string[];

  /** Lista branca de colunas que este repository pode ler/gravar. */
  protected abstract columns: readonly string[];

  /**
   * * `"*"` por padrão — todo `SELECT` genérico (`findById`/`paginar`) usa
   * * isso no lugar de `*`. Só precisa ser sobrescrito quando a tabela tem
   * * coluna `bytea` legada (ex.: `mmov-registros.repository.ts`): incluir
   * * o binário em TODO `SELECT *` genérico é caro (serializa como array de
   * * bytes em JSON, não como base64) e desnecessário — quem precisa do
   * * binário usa um método dedicado (`buscarArquivo`). Nesses casos,
   * * sobrescrever com uma lista explícita de colunas, tipicamente trocando
   * * a coluna bytea por um booleano `(coluna IS NOT NULL) as tem_x`.
   */
  protected colunasSelect: string = "*";

  /**
   * * Se a tabela tiver uma coluna real de ativo/inativo (ex.: `UFUN_ATIVO`,
   * * `EQPG_DESATIVADO`), declare aqui — `remove()`/`delete()` passa a fazer
   * * um UPDATE nessa coluna em vez de apagar a linha de verdade. Deixe
   * * undefined se a tabela não tiver essa coluna (nesse caso o padrão
   * * continua sendo DELETE físico — ou o que a entidade sobrescrever, como
   * * `os.repository.ts`/`mmovman.repository.ts` já fazem pras tabelas do ERP).
   */
  protected desativacao?: { coluna: string; valorDesativado: unknown };

  private get chaves(): readonly string[] {
    return Array.isArray(this.primaryKey) ? this.primaryKey : [this.primaryKey as string];
  }

  /**
   * * `protected`, não `private`: uma entidade com filtro de busca fora do
   * * padrão "coluna = valor" (ex.: `os.repository.ts`, que precisa de um OR
   * * entre 4 colunas de responsável) reaproveita isso pra montar a própria
   * * cláusula SQL sem abrir mão da validação contra a lista branca.
   * *
   * * ! Só serve pra nome de coluna vindo de FORA (filtro da querystring,
   * * ! chave do body de create/update, `sortBy`) — é aí que mora o risco de
   * * ! injeção. A chave primária (`this.primaryKey`) é definida pelo próprio
   * * ! repository (código, não input de usuário) e propositalmente NÃO
   * * ! precisa estar em `columns` — ela usa `quotar`, não `validarColuna`
   * * ! (ver `condicaoChave` abaixo).
   */
  protected validarColuna(coluna: string): string {
    if (!this.columns.includes(coluna)) {
      throw new Error(`Coluna "${coluna}" não está na lista branca de ${this.table}.`);
    }
    return this.quotar(coluna);
  }

  /**
   * * Só para `sortBy` (leitura) — diferente de `validarColuna`, aceita
   * * também as colunas da chave primária (ex.: `M_NR_ORD` em MMOVEXEC, que
   * * fica de fora de `columns` de propósito por não ser gravável). Ordenar
   * * por essas colunas é seguro (o nome vem do próprio código, não do
   * * client) mesmo sem estarem na lista branca de escrita.
   */
  private colunaOrdenavel(coluna: string): string {
    if (this.columns.includes(coluna) || this.chaves.includes(coluna)) {
      return this.quotar(coluna);
    }
    throw new Error(`Coluna "${coluna}" não está na lista branca de ${this.table}.`);
  }

  private quotar(coluna: string): string {
    return `"${coluna}"`;
  }

  /** Extrai os valores da chave primária de `id`, na mesma ordem de `this.chaves`. */
  private valoresDaChave(id: unknown): unknown[] {
    if (Array.isArray(this.primaryKey)) {
      const registro = id as RegistroIndexavel;
      return this.chaves.map((coluna) => registro[coluna]);
    }
    return [id];
  }

  /** Monta `"col1" = $1 AND "col2" = $2...` pras colunas da chave primária, a partir de `offset`. */
  private condicaoChave(offset = 0): string {
    return this.chaves
      .map((coluna, indice) => `${this.quotar(coluna)} = $${offset + indice + 1}`)
      .join(" AND ");
  }

  async findById(id: unknown): Promise<T | null> {
    const valores = this.valoresDaChave(id);
    const sql = `SELECT ${this.colunasSelect} FROM ${this.table} WHERE ${this.condicaoChave()} LIMIT 1`;
    const resultado = await this.pool.query(sql, valores);
    return (resultado.rows[0] as T) ?? null;
  }

  async findMany(
    filtros: Partial<T> = {},
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<T>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];
    for (const [coluna, valor] of Object.entries(filtros)) {
      if (valor === undefined) continue;
      valores.push(valor);
      clausulas.push(`${this.validarColuna(coluna)} = $${valores.length}`);
    }
    return this.paginar(clausulas.join(" AND "), valores, opcoes);
  }

  /**
   * * Executa SELECT paginado + COUNT a partir de uma cláusula WHERE já
   * * pronta (sem a palavra "WHERE") e seus valores posicionais. Usado pelo
   * * `findMany` acima E por repositories concretos que precisam de um
   * * filtro fora do padrão "coluna = valor" (ex.: `OsRepository.buscar`).
   */
  protected async paginar(
    where: string,
    valoresWhere: unknown[],
    opcoes: Partial<OpcoesPaginacao>,
  ): Promise<ResultadoPaginado<T>> {
    const page = Math.max(opcoes.page ?? PAGINACAO_PADRAO.page, 1);
    const pageSize = Math.min(
      Math.max(opcoes.pageSize ?? PAGINACAO_PADRAO.pageSize, 1),
      PAGE_SIZE_MAXIMO,
    );

    let orderBy = "";
    if (opcoes.sortBy) {
      const direcao = opcoes.sortDir === "DESC" ? "DESC" : "ASC";
      orderBy = `ORDER BY ${this.colunaOrdenavel(opcoes.sortBy)} ${direcao}`;
    }

    const clausulaWhere = where ? `WHERE ${where}` : "";
    const offset = (page - 1) * pageSize;
    const sqlItens = `SELECT ${this.colunasSelect} FROM ${this.table} ${clausulaWhere} ${orderBy} LIMIT $${valoresWhere.length + 1} OFFSET $${valoresWhere.length + 2}`;
    const sqlTotal = `SELECT COUNT(*)::int AS total FROM ${this.table} ${clausulaWhere}`;

    const [itens, total] = await Promise.all([
      this.pool.query(sqlItens, [...valoresWhere, pageSize, offset]),
      this.pool.query(sqlTotal, valoresWhere),
    ]);

    return {
      items: itens.rows as T[],
      total: Number(total.rows[0]?.total ?? 0),
      page,
      pageSize,
    };
  }

  async create(dados: Partial<T>): Promise<T> {
    const entradas = Object.entries(dados).filter(([, valor]) => valor !== undefined);
    if (entradas.length === 0) {
      throw new Error(`create() de ${this.table} chamado sem nenhum dado.`);
    }
    const colunas = entradas.map(([coluna]) => this.validarColuna(coluna));
    const valores = entradas.map(([, valor]) => valor);
    const placeholders = valores.map((_, indice) => `$${indice + 1}`);

    const sql = `INSERT INTO ${this.table} (${colunas.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING ${this.colunasSelect}`;
    const resultado = await this.pool.query(sql, valores);
    return resultado.rows[0] as T;
  }

  /**
   * * Atualização PARCIAL — só grava as colunas presentes em `dadosParciais`.
   * * Um campo ausente (`undefined`) nunca é tocado; um campo presente com
   * * `null` explícito É gravado como null (o chamador quis limpar o campo
   * * de propósito). Esse é o mesmo espírito do padrão `COALESCE` já usado
   * * pelo backend Flask ao atualizar tabelas do ERP.
   */
  async update(id: unknown, dadosParciais: Partial<T>): Promise<T> {
    const entradas = Object.entries(dadosParciais).filter(([, valor]) => valor !== undefined);
    if (entradas.length === 0) {
      const existente = await this.findById(id);
      if (!existente) throw new NotFoundError(`Registro não encontrado em ${this.table}.`);
      return existente;
    }

    const sets = entradas.map(([coluna], indice) => `${this.validarColuna(coluna)} = $${indice + 1}`);
    const valoresSet = entradas.map(([, valor]) => valor);
    const valoresChave = this.valoresDaChave(id);

    const sql = `UPDATE ${this.table} SET ${sets.join(", ")} WHERE ${this.condicaoChave(valoresSet.length)} RETURNING ${this.colunasSelect}`;
    const resultado = await this.pool.query(sql, [...valoresSet, ...valoresChave]);
    if (resultado.rows.length === 0) {
      throw new NotFoundError(`Registro não encontrado em ${this.table}.`);
    }
    return resultado.rows[0] as T;
  }

  /**
   * * Se `this.desativacao` estiver definido, isto é um UPDATE marcando a
   * * linha como inativa (nunca apaga). Sem isso, cai no DELETE físico —
   * * entidades ligadas a tabelas do ERP compartilhadas com outras telas
   * * (como `Os`/MMOVEXEC, `Mmovman`) DEVEM sobrescrever este método com uma
   * * regra mais segura — ver os.repository.ts/mmovman.repository.ts.
   */
  async delete(id: unknown): Promise<void> {
    const valores = this.valoresDaChave(id);

    if (this.desativacao) {
      const sql = `UPDATE ${this.table} SET ${this.quotar(this.desativacao.coluna)} = $${valores.length + 1} WHERE ${this.condicaoChave()}`;
      const resultado = await this.pool.query(sql, [...valores, this.desativacao.valorDesativado]);
      if (resultado.rowCount === 0) {
        throw new NotFoundError(`Registro não encontrado em ${this.table}.`);
      }
      return;
    }

    const sql = `DELETE FROM ${this.table} WHERE ${this.condicaoChave()}`;
    const resultado = await this.pool.query(sql, valores);
    if (resultado.rowCount === 0) {
      throw new NotFoundError(`Registro não encontrado em ${this.table}.`);
    }
  }
}
