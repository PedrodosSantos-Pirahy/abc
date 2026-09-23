import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { UfuncService } from "../services/ufunc.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { Ufunc } from "../models/ufunc.model";

export class UfuncController extends BaseController<Ufunc> {
  constructor(private readonly ufuncService: UfuncService = new UfuncService()) {
    super(ufuncService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, codigos } = req.query as Record<string, string>;
    const resultado = await this.ufuncService.buscar(
      { codigos: codigos ? codigos.split(",") : undefined },
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
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC"; codigos?: string[];
    };
    const resultado = await this.ufuncService.buscar({ codigos }, { page, pageSize, sortBy, sortDir });
    res.json(resultado);
  });
}
