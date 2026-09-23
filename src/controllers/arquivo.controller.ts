import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { ArquivoService } from "../services/arquivo.service";
import { NotFoundError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import type { Arquivo } from "../models/arquivo.model";

export class ArquivoController extends BaseController<Arquivo> {
  constructor(private readonly arquivoService: ArquivoService = new ArquivoService()) {
    super(arquivoService);
  }

  // * Sobrescreve o `list` genérico do BaseController: a listagem nunca
  // * devolve o binário (`conteudo`) de cada arquivo, só os metadados.
  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize } = req.query as Record<string, string>;
    const resultado = await this.arquivoService.listarMetadados(
      page ? Number(page) : undefined,
      pageSize ? Number(pageSize) : undefined,
    );
    res.json(resultado);
  });

  // * Sobrescreve o `create` genérico: aqui o corpo da requisição é
  // * multipart/form-data (ver upload.middleware.ts, que popula `req.file`),
  // * não JSON.
  upload = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ erro: "Nenhum arquivo enviado (campo 'arquivo')." });
      return;
    }
    const metadados = await this.arquivoService.upload(req.file);
    res.status(201).json(metadados);
  });

  // * Sobrescreve o `getById` genérico: a resposta aqui é o BINÁRIO em stream
  // * (pra um <img src="/api/arquivos/123"> ou download funcionar direto),
  // * não um JSON com o registro inteiro.
  download = asyncHandler(async (req: Request, res: Response) => {
    const arquivo = await this.arquivoService.baixar(Number(req.params.id));
    if (!arquivo) {
      throw new NotFoundError("Arquivo não encontrado.");
    }
    res.setHeader("Content-Type", arquivo.mimetype);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(arquivo.nome_original ?? "arquivo")}"`,
    );
    res.send(arquivo.conteudo);
  });
}
