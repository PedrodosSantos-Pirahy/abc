import type { Request, Response } from "express";
import { FuncionarioService } from "../services/funcionario.service";
import { asyncHandler } from "../utils/asyncHandler";

export class FuncionarioController {
  constructor(private readonly funcionarioService: FuncionarioService = new FuncionarioService()) {}

  buscarUsuariosLote = asyncHandler(async (req: Request, res: Response) => {
    const { matriculas } = req.query as Record<string, string>;
    res.json(await this.funcionarioService.buscarUsuariosPorMatriculas(matriculas ? matriculas.split(",") : []));
  });

  buscarUfuncLote = asyncHandler(async (req: Request, res: Response) => {
    const { matriculas } = req.query as Record<string, string>;
    res.json(await this.funcionarioService.buscarUfuncPorMatriculas(matriculas ? matriculas.split(",") : []));
  });

  // * Mesmas duas rotas acima, lendo do corpo (POST) — `matriculas` pode ter
  // * centenas de itens nas telas de lista grande, o que estoura o limite
  // * prático de uma URL GET.
  buscarUsuariosLotePost = asyncHandler(async (req: Request, res: Response) => {
    const { matriculas } = req.body as { matriculas?: string[] };
    res.json(await this.funcionarioService.buscarUsuariosPorMatriculas(matriculas ?? []));
  });

  buscarUfuncLotePost = asyncHandler(async (req: Request, res: Response) => {
    const { matriculas } = req.body as { matriculas?: string[] };
    res.json(await this.funcionarioService.buscarUfuncPorMatriculas(matriculas ?? []));
  });

  buscarNome = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.funcionarioService.buscarNome(String(req.params.matricula)));
  });

  buscarNoErp = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.funcionarioService.buscarNoErp(String(req.params.matricula)));
  });

  cadastrarUsuario = asyncHandler(async (req: Request, res: Response) => {
    const usuario = await this.funcionarioService.cadastrarUsuario(req.body as Record<string, any>);
    res.status(201).json({ mensagem: `Colaborador ${usuario.nome} cadastrado/atualizado com sucesso!` });
  });
}
