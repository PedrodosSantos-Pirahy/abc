import type { Request, Response } from "express";
import { PdfDownloadRepository } from "../repositories/pdf-download.repository";
import { NotFoundError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { numeroOuPadrao } from "../utils/numero";
import { GRUPO_PADRAO } from "../constants/dominio";

export class PdfDownloadController {
  constructor(private readonly pdfDownloadRepository: PdfDownloadRepository = new PdfDownloadRepository()) {}

  baixarApr = asyncHandler(async (req: Request, res: Response) => {
    const grupo = numeroOuPadrao(req.query.grupo, GRUPO_PADRAO);
    const conteudo = await this.pdfDownloadRepository.pdfApr(Number(req.params.osId), grupo);
    if (!conteudo) throw new NotFoundError("PDF da APR não encontrado no histórico.");
    this.enviarPdf(res, conteudo, `APR_OS_${req.params.osId}.pdf`);
  });

  baixarQualidade = asyncHandler(async (req: Request, res: Response) => {
    const grupo = numeroOuPadrao(req.query.grupo, GRUPO_PADRAO);
    const conteudo = await this.pdfDownloadRepository.pdfQualidade(Number(req.params.osId), grupo);
    if (!conteudo) throw new NotFoundError("PDF não encontrado no histórico.");
    this.enviarPdf(res, conteudo, `RAPPM_OS_${req.params.osId}.pdf`);
  });

  private enviarPdf(res: Response, conteudo: Buffer, nomeArquivo: string): void {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${nomeArquivo}`);
    res.send(conteudo);
  }
}
