import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovKanbanService } from "../services/mmov-kanban.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { MmovKanban } from "../models/mmov-kanban.model";

export class MmovKanbanController extends BaseController<MmovKanban> {
  constructor(private readonly mmovKanbanService: MmovKanbanService = new MmovKanbanService()) {
    super(mmovKanbanService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros } = req.query as Record<string, string>;
    const resultado = await this.mmovKanbanService.buscar(
      { numeros: numeros ? numeros.split(",").map(Number) : undefined },
      {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy,
        sortDir: sortDir === "DESC" ? "DESC" : sortDir === "ASC" ? "ASC" : undefined,
      },
    );
    res.json(resultado);
  });

  // * Mesmo filtro, lendo do corpo (POST) — `numeros` pode ter centenas/
  // * milhares de itens nas telas de lista grande.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC"; numeros?: number[];
    };
    const resultado = await this.mmovKanbanService.buscar({ numeros }, { page, pageSize, sortBy, sortDir });
    res.json(resultado);
  });
}
