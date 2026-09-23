import type { Request, Response } from "express";
import type { BaseService } from "../services/base.service";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * * Gera os 5 handlers REST padrão (list/getById/create/update/remove) a
 * * partir de um `BaseService`. Uma entidade nova só precisa herdar isso e
 * * passar o service no construtor — e, se precisar, sobrescrever só o
 * * handler que tiver uma regra diferente (ex.: `os.controller.ts` não
 * * precisa sobrescrever nada, porque a regra de "delete seguro" já mora
 * * no `os.service.ts`/`os.repository.ts`, não aqui).
 * *
 * * TODO: entidades com CHAVE COMPOSTA (mais de uma coluna na primaryKey)
 * * precisam sobrescrever getById/update/remove pra montar o objeto de
 * * chave a partir de múltiplos route params — nenhuma das 3 entidades
 * * desta rodada (Os, Arquivo, Usuario) tem chave composta, então isso
 * * ainda não foi necessário.
 */
export abstract class BaseController<T extends object> {
  constructor(protected readonly service: BaseService<T>) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, ...filtros } = req.query as Record<string, string>;
    const resultado = await this.service.list(filtros as Partial<T>, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      sortBy,
      sortDir: sortDir === "DESC" ? "DESC" : sortDir === "ASC" ? "ASC" : undefined,
    });
    res.json(resultado);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.service.getById(req.params.id);
    if (!registro) {
      res.status(404).json({ erro: "Registro não encontrado." });
      return;
    }
    res.json(registro);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.service.create(req.body as Partial<T>);
    res.status(201).json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.service.update(req.params.id, req.body as Partial<T>);
    res.json(registro);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.service.remove(req.params.id);
    res.status(204).send();
  });
}
