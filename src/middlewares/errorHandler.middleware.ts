import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

// * 404 explícito pra qualquer rota não mapeada — evita a resposta HTML
// * padrão do Express, que quebraria qualquer client esperando JSON.
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
}

/**
 * * Rede de segurança: captura qualquer erro não tratado (inclusive
 * * rejeições de Promise, que o Express 5 encaminha automaticamente pra
 * * cá). `AppError` e subclasses (NotFoundError, ValidationError, etc.)
 * * já sabem seu próprio status HTTP; qualquer outro erro é tratado como
 * * falha inesperada (500) — e sempre logado no console, nunca escondido.
 */
export function errorHandler(
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (erro instanceof AppError) {
    res.status(erro.statusCode).json({ erro: erro.message });
    return;
  }

  console.error("❌ Erro não tratado:", erro);
  res.status(500).json({ erro: "Erro interno no servidor." });
}
