import { FuncionarioRepository } from "../repositories/funcionario.repository";
import { AuthService } from "./auth.service";
import { NotFoundError, UnprocessableEntityError, ValidationError } from "../utils/AppError";
import { EMPRESAS_ERP_VALIDAS } from "../constants/dominio";

export class FuncionarioService {
  constructor(
    private readonly funcionarioRepository: FuncionarioRepository = new FuncionarioRepository(),
    private readonly authService: AuthService = new AuthService(),
  ) {}

  async buscarUsuariosPorMatriculas(matriculas: string[]) {
    return this.funcionarioRepository.buscarUsuariosPorMatriculas(matriculas);
  }

  async buscarUfuncPorMatriculas(matriculas: string[]) {
    return this.funcionarioRepository.buscarUfuncPorMatriculas(matriculas);
  }

  async buscarNome(matricula: string): Promise<{ nome: string }> {
    const nome = await this.funcionarioRepository.buscarNome(matricula);
    if (!nome) throw new NotFoundError("Funcionário não encontrado");
    return { nome };
  }

  async buscarNoErp(matricula: string): Promise<
    | { matricula: number; nome: string; manutencao: boolean }
    | { multiplos: true; opcoes: Array<{ nome: string; empresa: number; manutencao: boolean }> }
  > {
    const registros = await this.funcionarioRepository.buscarNoErp(matricula);
    if (registros.length === 0) throw new NotFoundError("Matrícula não encontrada no ERP.");

    const validos = registros.filter((r) => r.ativo && EMPRESAS_ERP_VALIDAS.includes(Number(r.empresa)));
    if (validos.length === 0) {
      const r = registros[0];
      if (!r.ativo) throw new UnprocessableEntityError("Funcionário inativo no ERP.");
      if (!EMPRESAS_ERP_VALIDAS.includes(Number(r.empresa))) {
        throw new UnprocessableEntityError(
          `Empresa ${r.empresa} não autorizada (somente ${EMPRESAS_ERP_VALIDAS.join(" ou ")}).`,
        );
      }
      throw new UnprocessableEntityError("Funcionario nao atende aos criterios de cadastro.");
    }

    if (validos.length === 1) {
      return { matricula: validos[0].matricula, nome: validos[0].nome, manutencao: Boolean(validos[0].manutencao) };
    }

    return {
      multiplos: true,
      opcoes: validos.map((r) => ({ nome: r.nome, empresa: r.empresa, manutencao: Boolean(r.manutencao) })),
    };
  }

  async cadastrarUsuario(dados: {
    matricula?: string;
    nome?: string;
    cargo?: string;
    setor?: string;
    senha?: string;
    ativo?: boolean;
  }) {
    const matricula = String(dados.matricula ?? "").trim();
    const nome = (dados.nome ?? "").trim();
    const cargo = (dados.cargo ?? "").trim();
    const setor = (dados.setor ?? "").trim();
    if (!matricula || !nome || !cargo) {
      throw new ValidationError("Matrícula, nome e cargo são obrigatórios.");
    }
    return this.authService.cadastrar({ matricula, nome, cargo, setor, senha: dados.senha, ativo: dados.ativo });
  }
}
