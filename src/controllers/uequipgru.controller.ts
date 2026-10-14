import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { UequipgruService } from "../services/uequipgru.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { Uequipgru } from "../models/uequipgru.model";
import type { ChaveEquipamento } from "../repositories/uequipgru.repository";

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

  // * Mesmo filtro, lendo do corpo (POST) — `codigos`/`chaves` pode ter
  // * centenas de itens nas telas de lista grande.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, codigos, chaves, q, local, empresa } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC";
      codigos?: number[]; chaves?: ChaveEquipamento[]; q?: string; local?: string; empresa?: string;
    };
    const resultado = await this.uequipgruService.buscar({ codigos, chaves, q, local, empresa }, { page, pageSize, sortBy, sortDir });
    res.json(resultado);
  });

  // * Chave composta (EQPG_CODIGO, EQPG_LOCAL, EQPG_EMPRESA) — rota
  // * /:codigo/:local/:empresa. Só o código não identifica a máquina (ver
  // * ChaveEquipamento em uequipgru.repository.ts).
  private chave(req: Request) {
    return {
      EQPG_CODIGO: Number(req.params.codigo),
      EQPG_LOCAL: Number(req.params.local),
      EQPG_EMPRESA: Number(req.params.empresa),
    };
  }

  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.uequipgruService.getById(this.chave(req));
    if (!registro) {
      res.status(404).json({ erro: "Equipamento não encontrado." });
      return;
    }
    res.json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.uequipgruService.update(this.chave(req), req.body as Partial<Uequipgru>);
    res.json(registro);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.uequipgruService.remove(this.chave(req));
    res.status(204).send();
  });
}
