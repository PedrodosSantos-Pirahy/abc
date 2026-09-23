import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovPausasService } from "../services/mmov-pausas.service";
import { asyncHandler } from "../utils/asyncHandler";
import { isoLocalSemZ } from "../utils/conversao";
import type { MmovPausas } from "../models/mmov-pausas.model";

export class MmovPausasController extends BaseController<MmovPausas> {
  constructor(private readonly mmovPausasService: MmovPausasService = new MmovPausasService()) {
    super(mmovPausasService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros } = req.query as Record<string, string>;
    const resultado = await this.mmovPausasService.buscar(
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

  // * Mesmo filtro do `list`, lendo do corpo (POST) — `numeros` pode ter
  // * centenas/milhares de itens nas telas de lista grande.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC"; numeros?: number[];
    };
    const resultado = await this.mmovPausasService.buscar({ numeros }, { page, pageSize, sortBy, sortDir });
    res.json(resultado);
  });

  // * Chave composta de 4 colunas — rota /:nNumero/:tentativa/:grupo/:hrInicio.
  private chave(req: Request) {
    return {
      N_NUMERO: Number(req.params.nNumero),
      tentativa: Number(req.params.tentativa),
      grupo: Number(req.params.grupo),
      HR_INICIO_PAUSA: req.params.hrInicio,
    };
  }

  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovPausasService.getById(this.chave(req));
    if (!registro) {
      res.status(404).json({ erro: "Pausa não encontrada." });
      return;
    }
    res.json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovPausasService.update(this.chave(req), req.body as Partial<MmovPausas>);
    res.json(registro);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.mmovPausasService.remove(this.chave(req));
    res.status(204).send();
  });

  buscarAberta = asyncHandler(async (req: Request, res: Response) => {
    const numero = Number(req.query.numero);
    const grupo = Number(req.query.grupo);
    const aberta = await this.mmovPausasService.buscarAberta(numero, grupo);
    if (!aberta) {
      res.json(null);
      return;
    }
    res.json({
      hr_inicio_pausa: isoLocalSemZ(aberta.hrInicioPausa),
      motivo: aberta.motivo,
      dentro_janela: aberta.dentroJanela,
    });
  });

  fecharAberta = asyncHandler(async (req: Request, res: Response) => {
    const { numero, grupo, tentativa, hrFimRaw } = req.body as {
      numero: number;
      grupo: number;
      tentativa: number;
      hrFimRaw?: string;
    };
    await this.mmovPausasService.fecharAberta(Number(numero), Number(grupo), Number(tentativa), hrFimRaw);
    res.json({ mensagem: "Pausa encerrada!" });
  });

  fecharComPropriaHora = asyncHandler(async (req: Request, res: Response) => {
    const { numero, grupo, tentativa } = req.body as { numero: number; grupo: number; tentativa: number };
    await this.mmovPausasService.fecharComPropriaHora(Number(numero), Number(grupo), Number(tentativa));
    res.json({ mensagem: "Pausa encerrada!" });
  });
}
