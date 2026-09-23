import type { Request, Response } from "express";
import { QualidadeService } from "../services/qualidade.service";
import { asyncHandler } from "../utils/asyncHandler";

export class QualidadeController {
  constructor(private readonly qualidadeService: QualidadeService = new QualidadeService()) {}

  salvarPre = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, any>;
    await this.qualidadeService.salvarPre({ osId: body.osId, grupo: body.grupo, tentativa: body.tentativa, conteudo: body.conteudo });
    res.status(201).json({ mensagem: "Pré-Manutenção salva com sucesso!" });
  });

  salvarPos = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, any>;
    const resultado = await this.qualidadeService.salvarPos({
      osId: body.osId,
      grupo: body.grupo,
      tentativa: body.tentativa,
      conteudo: body.conteudo,
    });
    res.json({ mensagem: resultado.mensagem, ...(resultado.avisoPdf ? { aviso_pdf: resultado.avisoPdf } : {}) });
  });
}
