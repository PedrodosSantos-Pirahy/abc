import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovQualidadeService } from "../services/mmov-qualidade.service";
import { asyncHandler } from "../utils/asyncHandler";
import { base64ParaBuffer } from "../utils/conversao";
import { NotFoundError, ValidationError } from "../utils/AppError";
import type { MmovQualidade } from "../models/mmov-qualidade.model";
import type { ColunaArquivoQualidade } from "../repositories/mmov-qualidade.repository";

const COLUNA_POR_TIPO: Record<string, ColunaArquivoQualidade> = {
  pdf: "PDF_QUALIDADE",
  "assinatura-resp": "RESP_ASSINATURA",
  "assinatura-manut": "MANUT_ASSINATURA",
};
const MIME_POR_TIPO: Record<string, string> = {
  pdf: "application/pdf",
  "assinatura-resp": "image/png",
  "assinatura-manut": "image/png",
};

export class MmovQualidadeController extends BaseController<MmovQualidade> {
  constructor(private readonly mmovQualidadeService: MmovQualidadeService = new MmovQualidadeService()) {
    super(mmovQualidadeService);
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros } = req.query as Record<string, string>;
    const resultado = await this.mmovQualidadeService.buscar(
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

  // * Chave composta (N_NUMERO, grupo, tentativa) — rota /:nNumero/:grupo/:tentativa.
  private chave(req: Request) {
    return {
      N_NUMERO: Number(req.params.nNumero),
      grupo: Number(req.params.grupo),
      tentativa: Number(req.params.tentativa),
    };
  }

  getById = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovQualidadeService.getById(this.chave(req));
    if (!registro) {
      res.status(404).json({ erro: "Registro de qualidade não encontrado." });
      return;
    }
    res.json(registro);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const registro = await this.mmovQualidadeService.update(this.chave(req), req.body as Partial<MmovQualidade>);
    res.json(registro);
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.mmovQualidadeService.remove(this.chave(req));
    res.status(204).send();
  });

  private resolverColuna(tipo: string): ColunaArquivoQualidade {
    const coluna = COLUNA_POR_TIPO[tipo];
    if (!coluna) throw new ValidationError(`Tipo de arquivo inválido: ${tipo}`);
    return coluna;
  }

  // * Binário sob demanda — mesma decisão de mmov-registros.controller.ts.
  buscarArquivo = asyncHandler(async (req: Request, res: Response) => {
    const tipo = String(req.params.tipo);
    const coluna = this.resolverColuna(tipo);
    const conteudo = await this.mmovQualidadeService.buscarArquivo(this.chave(req), coluna);
    if (!conteudo) throw new NotFoundError("Arquivo não encontrado.");
    res.setHeader("Content-Type", MIME_POR_TIPO[tipo]);
    res.send(conteudo);
  });

  salvarArquivo = asyncHandler(async (req: Request, res: Response) => {
    const coluna = this.resolverColuna(String(req.params.tipo));
    const { base64 } = req.body as { base64?: string | null };
    await this.mmovQualidadeService.salvarArquivo(this.chave(req), coluna, base64ParaBuffer(base64));
    res.json({ mensagem: "Arquivo salvo." });
  });
}
