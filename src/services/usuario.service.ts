import { BaseService } from "./base.service";
import { UsuarioRepository } from "../repositories/usuario.repository";
import type { Usuario, UsuarioPublico } from "../models/usuario.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

function semSenha(usuario: Usuario): UsuarioPublico {
  const { senha_hash, ...publico } = usuario;
  return publico;
}

// ! `senha_hash` nunca deve sair por HTTP — por isso este service não expõe
// ! o CRUD genérico de `BaseService<Usuario>` diretamente pro controller;
// ! `list`/`getById` sempre devolvem `UsuarioPublico`.
export class UsuarioService extends BaseService<Usuario> {
  constructor(private readonly usuarioRepository: UsuarioRepository = new UsuarioRepository()) {
    super(usuarioRepository);
  }

  async listarPublico(
    filtros: Partial<Usuario> = {},
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<UsuarioPublico>> {
    const resultado = await this.repository.findMany(filtros, opcoes);
    return { ...resultado, items: resultado.items.map(semSenha) };
  }

  async getByIdPublico(id: unknown): Promise<UsuarioPublico | null> {
    const usuario = await this.repository.findById(id);
    return usuario ? semSenha(usuario) : null;
  }

  async updatePublico(id: unknown, dados: Partial<Usuario>): Promise<UsuarioPublico> {
    const usuario = await this.update(id, dados);
    return semSenha(usuario);
  }
}
