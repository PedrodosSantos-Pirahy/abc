import type { Request, Response } from "express";
import { AuditoriaService } from "../services/auditoria.service";
import { asyncHandler } from "../utils/asyncHandler";
import { numeroOuPadrao } from "../utils/numero";
import { GRUPO_PADRAO } from "../constants/dominio";

export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService = new AuditoriaService()) {}

  registrarTempo = asyncHandler(async (req: Request, res: Response) => {
    const { osId, etapa, grupo } = req.body as { osId: number; etapa: string; grupo?: number };
    const hora = await this.auditoriaService.registrarTempo(osId, etapa, numeroOuPadrao(grupo, GRUPO_PADRAO));
    res.json({ mensagem: "Tempo registrado!", hora });
  });

  registrarFoto = asyncHandler(async (req: Request, res: Response) => {
    const { osId, coluna, fotoBase64, grupo } = req.body as {
      osId: number;
      coluna: string;
      fotoBase64: string;
      grupo?: number;
    };
    await this.auditoriaService.registrarFoto(osId, coluna, fotoBase64, numeroOuPadrao(grupo, GRUPO_PADRAO));
    res.json({ mensagem: "Foto salva com sucesso!" });
  });

  registrarCausa = asyncHandler(async (req: Request, res: Response) => {
    const { osId, causa, grupo } = req.body as { osId: number; causa: string; grupo?: number };
    await this.auditoriaService.registrarCausa(osId, causa, numeroOuPadrao(grupo, GRUPO_PADRAO));
    res.json({ mensagem: "Causa salva." });
  });
}
