import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { UequipsetService } from "../services/uequipset.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { Uequipset } from "../models/uequipset.model";

export class UequipsetController extends BaseController<Uequipset> {
  constructor(private readonly uequipsetService: UequipsetService = new UequipsetService()) {
    super(uequipsetService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, codigos } = req.query as Record<string, string>;
    const resultado = await this.uequipsetService.buscar(
      { codigos: codigos ? codigos.split(",").map(Number) : undefined },
      {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy,
        sortDir: sortDir === "DESC" ? "DESC" : sortDir === "ASC" ? "ASC" : undefined,
      },
    );
    res.json(resultado);
  });

  // * Mesmo filtro, lendo do corpo (POST) — `codigos` pode ter centenas de
  // * itens nas telas de lista grande.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, codigos } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC"; codigos?: number[];
    };
    const resultado = await this.uequipsetService.buscar({ codigos }, { page, pageSize, sortBy, sortDir });
    res.json(resultado);
  });
}
