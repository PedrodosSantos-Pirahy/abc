import morgan from "morgan";
import mongoose from "mongoose";
import type { NextFunction, Request, Response } from "express";

// * Schema simples só pra guardar histórico de requisições — isso é
// * observabilidade, não dado de negócio, por isso fica solto aqui em vez
// * de ir pra models/ (aquela pasta é só pra entidades do Postgres).
const logRequisicaoSchema = new mongoose.Schema(
  {
    metodo: String,
    rota: String,
    status: Number,
    duracaoMs: Number,
    criadoEm: { type: Date, default: Date.now },
  },
  { collection: "logs_requisicao" },
);

// * Exportado pro admin.repository.ts (GET /api/admin/logs) reaproveitar a
// * mesma collection — ver comentário lá sobre por que esse endpoint lê do
// * Mongo em vez de um arquivo de log como no Flask de referência.
export const LogRequisicao =
  mongoose.models.LogRequisicao ?? mongoose.model("LogRequisicao", logRequisicaoSchema);

const logMorgan = morgan("dev");

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const inicio = Date.now();

  res.on("finish", () => {
    // ! Gravação no Mongo é "fire and forget": se o Mongo estiver fora do ar
    // ! (ou nem configurado ainda), isso NUNCA pode travar ou derrubar a
    // ! requisição real — só perdemos aquele log específico.
    LogRequisicao.create({
      metodo: req.method,
      rota: req.originalUrl,
      status: res.statusCode,
      duracaoMs: Date.now() - inicio,
    }).catch(() => {});
  });

  logMorgan(req, res, next);
}
