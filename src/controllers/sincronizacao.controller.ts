import type { Request, Response } from "express";
import { SincronizacaoService } from "../services/sincronizacao.service";
import { asyncHandler } from "../utils/asyncHandler";

export class SincronizacaoController {
  constructor(private readonly sincronizacaoService: SincronizacaoService = new SincronizacaoService()) {}

  sincronizar = asyncHandler(async (req: Request, res: Response) => {
    const { osFinalizadas } = req.body as { osFinalizadas?: any[] };
    const resultado = await this.sincronizacaoService.sincronizar(osFinalizadas ?? []);
    res.json({ mensagem: "Sincronização concluída", sucessos: resultado.sucessos, erros: resultado.erros });
  });
}
