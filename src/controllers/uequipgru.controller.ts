import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { UequipgruService } from "../services/uequipgru.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { Uequipgru } from "../models/uequipgru.model";

export class UequipgruController extends BaseController<Uequipgru> {
  constructor(private readonly uequipgruService: UequipgruService = new UequipgruService()) {
    super(uequipgruService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, codigos, q, local, empresa } = req.query as Record<string, string>;
    const resultado = await this.uequipgruService.buscar(
      { codigos: codigos ? codigos.split(",").map(Number) : undefined, q, local, empresa },
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
    const { page, pageSize, sortBy, sortDir, codigos, q, local, empresa } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC";
      codigos?: number[]; q?: string; local?: string; empresa?: string;
    };
    const resultado = await this.uequipgruService.buscar({ codigos, q, local, empresa }, { page, pageSize, sortBy, sortDir });
    res.json(resultado);
  });
}
