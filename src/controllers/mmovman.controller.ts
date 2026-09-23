import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovmanService } from "../services/mmovman.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { Mmovman } from "../models/mmovman.model";

export class MmovmanController extends BaseController<Mmovman> {
  constructor(private readonly mmovmanService: MmovmanService = new MmovmanService()) {
    super(mmovmanService);
  }

  // * Sobrescreve o `list` genérico: filtro por janela de data (M_DATAHR) e
  // * por um lote de números de SS (`numeros=1,2,3`) não são "coluna = valor"
  // * simples.
  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, data_de, data_ate, numeros, equip } = req.query as Record<string, string>;
    const resultado = await this.mmovmanService.buscar(
      {
        dataDe: data_de,
        dataAte: data_ate,
        numeros: numeros ? numeros.split(",").map(Number) : undefined,
        equip: equip ? Number(equip) : undefined,
      },
      {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy,
        sortDir: sortDir === "DESC" ? "DESC" : sortDir === "ASC" ? "ASC" : undefined,
      },
    );
    res.json(resultado);
  });

  // * Mesmo filtro do `list`, mas lendo do corpo (POST) em vez da querystring
  // * — pra quando `numeros` pode ter centenas/milhares de itens (telas de
  // * lista grande: Kanban, Carga por Mecânico, Dashboard, Histórico). GET
  // * com querystring tem limite prático de tamanho de URL; POST com corpo
  // * JSON não.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, dataDe, dataAte, numeros, equip } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC";
      dataDe?: string; dataAte?: string; numeros?: number[]; equip?: number;
    };
    const resultado = await this.mmovmanService.buscar(
      { dataDe, dataAte, numeros, equip },
      { page, pageSize, sortBy, sortDir },
    );
    res.json(resultado);
  });

  // * Chave composta (M_NUMERO, M_SERIE) — rota é /:numero/:serie, então os 3
  // * handlers abaixo montam o objeto de chave a partir dos dois params (ver
  // * TODO em base.controller.ts).
  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovmanService.getById({
      M_NUMERO: Number(req.params.numero),
      M_SERIE: req.params.serie,
    });
    if (!registro) {
      res.status(404).json({ erro: "SS não encontrada." });
      return;
    }
    res.json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovmanService.update(
      { M_NUMERO: Number(req.params.numero), M_SERIE: req.params.serie },
      req.body as Partial<Mmovman>,
    );
    res.json(registro);
  });

  // ! Sem remove — MMOVMAN não pode ser deletada (ver mmovman.repository.ts).
}
