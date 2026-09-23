import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovKanbanEquipeService } from "../services/mmov-kanban-equipe.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { MmovKanbanEquipe } from "../models/mmov-kanban-equipe.model";

export class MmovKanbanEquipeController extends BaseController<MmovKanbanEquipe> {
  constructor(private readonly mmovKanbanEquipeService: MmovKanbanEquipeService = new MmovKanbanEquipeService()) {
    super(mmovKanbanEquipeService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros, matricula } = req.query as Record<string, string>;
    const resultado = await this.mmovKanbanEquipeService.buscar(
      { numeros: numeros ? numeros.split(",").map(Number) : undefined, matricula },
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
  // * centenas/milhares de itens, o que estoura o limite prático de tamanho
  // * de uma URL GET.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros, matricula } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC";
      numeros?: number[]; matricula?: string;
    };
    const resultado = await this.mmovKanbanEquipeService.buscar({ numeros, matricula }, { page, pageSize, sortBy, sortDir });
    res.json(resultado);
  });

  // * Lista pequena de N_NUMERO (não linhas inteiras) — ver
  // * mmov-kanban-equipe.repository.ts#numerosAtivos pra entender por que
  // * este é o único lugar do backend com uma consulta cruzando 2 tabelas.
  numerosAtivos = asyncHandler(async (_req: Request, res: Response) => {
    res.json(await this.mmovKanbanEquipeService.numerosAtivos());
  });

  // * Página de N_NUMERO (não linhas inteiras) mais recentes daquela
  // * matrícula — ver numerosPorMatricula no repository.
  numerosPorMatricula = asyncHandler(async (req: Request, res: Response) => {
    const { matricula, page, pageSize } = req.query as Record<string, string>;
    if (!matricula) {
      res.status(400).json({ erro: "matricula é obrigatória." });
      return;
    }
    const resultado = await this.mmovKanbanEquipeService.numerosPorMatricula(
      matricula,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
    res.json(resultado);
  });

  // * Chave composta (N_NUMERO, MATRICULA) — rota /:nNumero/:matricula.
  private chave(req: Request) {
    return { N_NUMERO: Number(req.params.nNumero), MATRICULA: req.params.matricula };
  }

  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovKanbanEquipeService.getById(this.chave(req));
    if (!registro) {
      res.status(404).json({ erro: "Membro de equipe não encontrado." });
      return;
    }
    res.json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovKanbanEquipeService.update(this.chave(req), req.body as Partial<MmovKanbanEquipe>);
    res.json(registro);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.mmovKanbanEquipeService.remove(this.chave(req));
    res.status(204).send();
  });
}
