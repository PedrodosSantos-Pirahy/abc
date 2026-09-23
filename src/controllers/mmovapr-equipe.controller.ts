import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovaprEquipeService } from "../services/mmovapr-equipe.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { MmovaprEquipe } from "../models/mmovapr-equipe.model";

export class MmovaprEquipeController extends BaseController<MmovaprEquipe> {
  constructor(private readonly mmovaprEquipeService: MmovaprEquipeService = new MmovaprEquipeService()) {
    super(mmovaprEquipeService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, aprIds } = req.query as Record<string, string>;
    const resultado = await this.mmovaprEquipeService.buscar(
      { aprIds: aprIds ? aprIds.split(",").map(Number) : undefined },
      {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy,
        sortDir: sortDir === "DESC" ? "DESC" : sortDir === "ASC" ? "ASC" : undefined,
      },
    );
    res.json(resultado);
  });

  // * Chave composta (APR_ID, MATRICULA) — rota /:aprId/:matricula.
  private chave(req: Request) {
    return { APR_ID: Number(req.params.aprId), MATRICULA: req.params.matricula };
  }

  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovaprEquipeService.getById(this.chave(req));
    if (!registro) {
      res.status(404).json({ erro: "Membro da equipe de APR não encontrado." });
      return;
    }
    res.json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovaprEquipeService.update(this.chave(req), req.body as Partial<MmovaprEquipe>);
    res.json(registro);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.mmovaprEquipeService.remove(this.chave(req));
    res.status(204).send();
  });
}
