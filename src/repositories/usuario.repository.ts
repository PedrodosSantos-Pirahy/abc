import { BaseRepository } from "./base.repository";
import type { Usuario } from "../models/usuario.model";

export class UsuarioRepository extends BaseRepository<Usuario> {
  protected table = 'manut."user"';
  protected primaryKey = "id" as const;
  protected columns = ["matricula", "senha_hash", "ativo", "nome", "cargo", "setor"] as const;

  async buscarPorMatricula(matricula: string): Promise<Usuario | null> {
    const sql = `SELECT * FROM ${this.table} WHERE "matricula" = $1 LIMIT 1`;
    const resultado = await this.pool.query(sql, [matricula]);
    return (resultado.rows[0] as Usuario) ?? null;
  }

  // * Tradução de `cadastrar_usuario` — no Flask de referência esse endpoint
  // * grava em `public.usuariosweb`/`manut.user_perfil` (tabelas que o
  // * `login()` do MESMO Flask não lê). Aqui usamos `manut."user"` de
  // * propósito: é a tabela que o login já consulta, então um usuário
  // * cadastrado por aqui consegue entrar de verdade.
  // ! Pressupõe índice/constraint UNIQUE em "matricula" (o `login()` já
  // ! espera isso implicitamente, ao tratar `WHERE matricula = $1` como
  // ! retornando uma linha só). Se essa constraint não existir na tabela
  // ! real, o ON CONFLICT abaixo falha — nesse caso, criar o índice antes.
  async upsertPorMatricula(dados: Omit<Usuario, "id">): Promise<Usuario> {
    const sql = `
      INSERT INTO ${this.table} ("matricula", "senha_hash", "ativo", "nome", "cargo", "setor")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT ("matricula") DO UPDATE SET
          "senha_hash" = EXCLUDED."senha_hash",
          "ativo" = EXCLUDED."ativo",
          "nome" = EXCLUDED."nome",
          "cargo" = EXCLUDED."cargo",
          "setor" = EXCLUDED."setor"
      RETURNING *
    `;
    const resultado = await this.pool.query(sql, [
      dados.matricula,
      dados.senha_hash,
      dados.ativo,
      dados.nome,
      dados.cargo,
      dados.setor,
    ]);
    return resultado.rows[0] as Usuario;
  }
}
