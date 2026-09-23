import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { UsuarioService } from "../services/usuario.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { Usuario } from "../models/usuario.model";

// ! Sobrescreve list/getById/update do BaseController de propósito — o
// ! genérico devolveria `senha_hash` na resposta HTTP (ver usuario.service.ts).
export class UsuarioController extends BaseController<Usuario> {
  constructor(private readonly usuarioService: UsuarioService = new UsuarioService()) {
    super(usuarioService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, ...filtros } = req.query as Record<string, string>;
    const resultado = await this.usuarioService.listarPublico(filtros as Partial<Usuario>, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy,
      sortDir: sortDir === "DESC" ? "DESC" : sortDir === "ASC" ? "ASC" : undefined,
    });
    res.json(resultado);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.usuarioService.getByIdPublico(req.params.id);
    if (!registro) {
      res.status(404).json({ erro: "Usuário não encontrado." });
      return;
    }
    res.json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.usuarioService.updatePublico(req.params.id, req.body as Partial<Usuario>);
    res.json(registro);
  });
}
