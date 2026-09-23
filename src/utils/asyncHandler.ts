import type { NextFunction, Request, Response } from "express";

type HandlerAssincrono = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<unknown>;

// * Express 5 já encaminha rejeições de Promise pro error handler automaticamente,
// * mas manter esse wrapper deixa a intenção explícita (e funciona igual em
// * qualquer versão do Express, caso o projeto precise fazer downgrade um dia).
export function asyncHandler(handler: HandlerAssincrono) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res, next).catch(next);
  };
}
