import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { OsService } from "../services/os.service";
import { asyncHandler } from "../utils/asyncHandler";
import type { Os } from "../models/os.model";

export class OsController extends BaseController<Os> {
  constructor(private readonly osService: OsService = new OsService()) {
    super(osService);
  }

  // * Sobrescreve o `list` genérico: a OS tem filtros de busca fora do
  // * padrão "coluna = valor" (ver os.repository.ts#buscar — o OR entre as
  // * 4 colunas de responsável não dá pra expressar como Partial<Os>).
  list = asyncHandler(async (req: Request, res: Response) => {
    const {
      page,
      pageSize,
      sortBy,
      sortDir,
      nrSol,
      nrSolIn,
      serie,
      matriculaResponsavel,
      emissaoDe,
      emissaoAte,
    } = req.query as Record<string, string>;

    const resultado = await this.osService.buscar(
      {
        nrSol: nrSol ? Number(nrSol) : undefined,
        nrSolIn: nrSolIn ? nrSolIn.split(",").map(Number) : undefined,
        serie,
        matriculaResponsavel,
        emissaoDe,
        emissaoAte,
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

  // * Mesmo filtro do `list`, lendo do corpo (POST) — `nrSolIn` pode ter
  // * centenas/milhares de itens nas telas de lista grande (Kanban,
  // * Dashboard, Histórico), o que estoura o limite prático de uma URL GET.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, nrSol, nrSolIn, serie, matriculaResponsavel, emissaoDe, emissaoAte } =
      req.body as {
        page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC";
        nrSol?: number; nrSolIn?: number[]; serie?: string; matriculaResponsavel?: string;
        emissaoDe?: string; emissaoAte?: string;
      };
    const resultado = await this.osService.buscar(
      { nrSol, nrSolIn, serie, matriculaResponsavel, emissaoDe, emissaoAte },
      { page, pageSize, sortBy, sortDir },
    );
    res.json(resultado);
  });

  // * Sobrescreve o `remove` genérico só pra deixar a resposta explícita:
  // * quem chama DELETE /api/os/:id precisa entender que isso NÃO apaga a
  // * OS — só devolve ela pro estado PENDENTE (ver a regra de segurança em
  // * os.repository.ts).
  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.osService.remove(req.params.id);
    res.status(200).json({
      ok: true,
      acao: "responsaveis_removidos",
      mensagem: "OS devolvida para PENDENTE — os responsáveis foram removidos; a linha NÃO foi apagada.",
    });
  });
}
