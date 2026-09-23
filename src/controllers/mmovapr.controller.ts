import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovaprService } from "../services/mmovapr.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { Mmovapr } from "../models/mmovapr.model";

export class MmovaprController extends BaseController<Mmovapr> {
  constructor(private readonly mmovaprService: MmovaprService = new MmovaprService()) {
    super(mmovaprService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros } = req.query as Record<string, string>;
    const resultado = await this.mmovaprService.buscar(
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
  // * milhares de itens (Histórico do manutentor busca a fila inteira do
  // * mecânico), o que estoura o limite prático de tamanho de uma URL GET.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC"; numeros?: number[];
    };
    const resultado = await this.mmovaprService.buscar({ numeros }, { page, pageSize, sortBy, sortDir });
    res.json(resultado);
  });
}
