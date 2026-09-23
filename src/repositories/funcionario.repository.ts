import { pgPool } from "../config/postgres";

export interface FuncionarioErp {
  matricula: number;
  nome: string;
  ativo: boolean;
  empresa: number;
  manutencao: boolean;
}

export class FuncionarioRepository {
  private readonly pool = pgPool;

  // ==========================================================================
  // GET /api/funcionario/:matricula
  // ==========================================================================
  async buscarNome(matricula: string): Promise<string | null> {
    const { rows: userRows } = await this.pool.query(`SELECT nome FROM manut."user" WHERE matricula = $1`, [
      matricula,
    ]);
    if (userRows.length > 0) return userRows[0].nome;

    const matInt = Number(matricula);
    if (!Number.isInteger(matInt)) return null;
    const { rows: ufuncRows } = await this.pool.query(
      `SELECT "UFUN_DESCRICAO" AS nome FROM public."UFUNC" WHERE "UFUN_CODIGO" = $1 AND "UFUN_ATIVO" = true LIMIT 1`,
      [matInt],
    );
    return ufuncRows[0]?.nome ?? null;
  }

  // ==========================================================================
  // GET /api/erp/funcionario/:matricula
  // ==========================================================================
  // ==========================================================================
  // GET /api/funcionario/usuarios-lote?matriculas=1,2,3 — só manut."user"
  // ==========================================================================
  async buscarUsuariosPorMatriculas(matriculas: string[]): Promise<{ matricula: string; nome: string }[]> {
    if (matriculas.length === 0) return [];
    const { rows } = await this.pool.query(
      `SELECT matricula, nome FROM manut."user" WHERE matricula = ANY($1::varchar[])`,
      [matriculas],
    );
    return rows;
  }

  // ==========================================================================
  // GET /api/funcionario/ufunc-lote?matriculas=1,2,3 — só public."UFUNC"
  // ==========================================================================
  async buscarUfuncPorMatriculas(matriculas: string[]): Promise<{ matricula: string; nome: string }[]> {
    if (matriculas.length === 0) return [];
    const { rows } = await this.pool.query(
      `
      SELECT "UFUN_CODIGO"::varchar AS matricula, "UFUN_DESCRICAO" AS nome
      FROM public."UFUNC"
      WHERE "UFUN_CODIGO"::varchar = ANY($1::varchar[]) AND "UFUN_ATIVO" = true
      `,
      [matriculas],
    );
    return rows;
  }

  async buscarNoErp(matricula: string): Promise<FuncionarioErp[]> {
    const { rows } = await this.pool.query(
      `
        SELECT
            "UFUN_CODIGO"     as matricula,
            "UFUN_DESCRICAO"  as nome,
            "UFUN_ATIVO"      as ativo,
            "UFUN_EMPRESA"    as empresa,
            "UFUN_MANUTENCAO" as manutencao
        FROM public."UFUNC"
        WHERE "UFUN_CODIGO"::varchar = $1 AND "UFUN_ATIVO" = true
        ORDER BY "UFUN_MANUTENCAO" DESC
      `,
      [matricula],
    );
    return rows;
  }
}
