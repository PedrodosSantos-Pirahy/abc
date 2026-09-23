import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovexecHorasService } from "../services/mmovexec-horas.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { MmovexecHoras } from "../models/mmovexec-horas.model";

export class MmovexecHorasController extends BaseController<MmovexecHoras> {
  constructor(private readonly mmovexecHorasService: MmovexecHorasService = new MmovexecHorasService()) {
    super(mmovexecHorasService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, nrOrds } = req.query as Record<string, string>;
    const resultado = await this.mmovexecHorasService.buscar(
      { nrOrds: nrOrds ? nrOrds.split(",").map(Number) : undefined },
      {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy,
        sortDir: sortDir === "DESC" ? "DESC" : sortDir === "ASC" ? "ASC" : undefined,
      },
    );
    res.json(resultado);
  });

  // * Chave composta de 6 colunas — rota /:nrOrd/:local/:empresa/:data/:respons/:seq.
  private chave(req: Request) {
    return {
      MH_NR_ORD: Number(req.params.nrOrd),
      MH_LOCAL: Number(req.params.local),
      MH_EMPRESA: Number(req.params.empresa),
      MH_DATA: req.params.data,
      MH_RESPONS: req.params.respons,
      MH_SEQ: Number(req.params.seq),
    };
  }

  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovexecHorasService.getById(this.chave(req));
    if (!registro) {
      res.status(404).json({ erro: "Apontamento de horas não encontrado." });
      return;
    }
    res.json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovexecHorasService.update(this.chave(req), req.body as Partial<MmovexecHoras>);
    res.json(registro);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.mmovexecHorasService.remove(this.chave(req));
    res.status(204).send();
  });
}
