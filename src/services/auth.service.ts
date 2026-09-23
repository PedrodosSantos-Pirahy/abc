import bcrypt from "bcrypt";
import { BaseService } from "./base.service";
import { UsuarioRepository } from "../repositories/usuario.repository";
import type { Usuario, UsuarioPublico } from "../models/usuario.model";
import { UnauthorizedError, NotFoundError } from "../utils/AppError";

function paraPublico(usuario: Usuario): UsuarioPublico {
  const { senha_hash: _senhaHash, ...publico } = usuario;
  return publico;
}

// * Estende BaseService<Usuario> pra ganhar de graça o CRUD de usuários
// * (útil pro futuro Cadastro de Usuário), e adiciona por cima o único
// * comportamento que não é CRUD: o login.
export class AuthService extends BaseService<Usuario> {
  constructor(private readonly usuarioRepository: UsuarioRepository = new UsuarioRepository()) {
    super(usuarioRepository);
  }

  /**
   * * Mesma regra do login do Flask: confere matrícula + senha (bcrypt) e
   * * devolve os dados do usuário — SEM token/sessão por enquanto (decisão
   * * já registrada no plano: "manter simples por agora").
   */
  async login(matricula: string, senha: string): Promise<UsuarioPublico> {
    const usuario = await this.usuarioRepository.buscarPorMatricula(matricula);
    if (!usuario) {
      throw new NotFoundError("Matrícula não encontrada.");
    }
    if (!usuario.ativo) {
      throw new UnauthorizedError("Usuário inativo. Procure o RH.");
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaConfere) {
      throw new UnauthorizedError("Senha incorreta.");
    }

    return paraPublico(usuario);
  }

  /**
   * * Tradução de `cadastrar_usuario`/`cadastro.py` — cadastra (ou atualiza,
   * * via upsert por matrícula) um colaborador que pode logar no sistema.
   * * Senha padrão "1234" igual ao Flask/script de seed, quando não informada.
   */
  async cadastrar(dados: {
    matricula: string;
    nome: string;
    cargo: string;
    setor: string;
    senha?: string;
    ativo?: boolean;
  }): Promise<UsuarioPublico> {
    const senha = dados.senha || "1234";
    const senhaHash = await bcrypt.hash(senha, 10);
    const usuario = await this.usuarioRepository.upsertPorMatricula({
      matricula: dados.matricula,
      senha_hash: senhaHash,
      ativo: dados.ativo ?? true,
      nome: dados.nome,
      cargo: dados.cargo,
      setor: dados.setor,
    });
    return paraPublico(usuario);
  }
}
