import type { Request, Response } from "express";
import { AdminRepository } from "../repositories/admin.repository";
import { asyncHandler } from "../utils/asyncHandler";

export class AdminController {
  constructor(private readonly adminRepository: AdminRepository = new AdminRepository()) {}

  verLogs = asyncHandler(async (req: Request, res: Response) => {
    const { linhas, nivel } = req.query as Record<string, string>;
    const limite = Math.min(Number(linhas || 200), 2000);
    const nivelFiltro = (nivel || "").toUpperCase();
    const resultado = await this.adminRepository.logsRecentes(limite, nivelFiltro);
    res.json({
      total_no_arquivo: resultado.totalNoArquivo,
      exibindo: resultado.linhas.length,
      nivel: nivelFiltro || "TODOS",
      linhas: resultado.linhas,
    });
  });
}
