import type { Request, Response } from "express";
import { AprService } from "../services/apr.service";
import { asyncHandler } from "../utils/asyncHandler";

export class AprController {
  constructor(private readonly aprService: AprService = new AprService()) {}

  salvar = asyncHandler(async (req: Request, res: Response) => {
    const body = req.body as Record<string, any>;
    const resultado = await this.aprService.salvar({
      osId: body.osId,
      grupo: body.grupo,
      tentativa: body.tentativa,
      conteudo: body.conteudo,
      fotoCadeado: body.conteudo?.fotoCadeado,
    });
    res.status(201).json({
      mensagem: resultado.mensagem,
      apr_id: resultado.aprId,
      ...(resultado.avisoPdf ? { aviso_pdf: resultado.avisoPdf } : {}),
    });
  });

  buscarPorOs = asyncHandler(async (req: Request, res: Response) => {
    res.json(await this.aprService.buscarPorOs(Number(req.params.osId)));
  });
}
