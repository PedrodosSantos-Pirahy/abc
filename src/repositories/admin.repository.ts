import { LogRequisicao } from "../middlewares/requestLogger.middleware";

// * GET /api/admin/logs no Flask de referência lê um arquivo `logs/api.log`
// * (rotativo, com linhas "[ERROR]"/"[WARNING]"/"[INFO]"). Este backend não
// * tem esse arquivo — o log de requisições já vai pro Mongo (ver
// * requestLogger.middleware.ts). Em vez de inventar um logger de arquivo só
// * pra imitar o formato antigo, reaproveitamos o que já existe: mesma
// * finalidade (auditoria de requisições), infraestrutura já wired.
export class AdminRepository {
  async logsRecentes(limite: number, nivel: string): Promise<{ totalNoArquivo: number; linhas: string[] }> {
    const filtro: Record<string, unknown> = {};
    if (nivel === "ERROR") filtro.status = { $gte: 500 };
    else if (nivel === "WARNING") filtro.status = { $gte: 400, $lt: 500 };
    else if (nivel === "INFO") filtro.status = { $lt: 400 };

    const [totalNoArquivo, registros] = await Promise.all([
      LogRequisicao.countDocuments(filtro),
      LogRequisicao.find(filtro).sort({ criadoEm: -1 }).limit(limite).lean(),
    ]);

    const linhas = registros
      .reverse()
      .map((r: any) => {
        const nivelLinha = r.status >= 500 ? "ERROR" : r.status >= 400 ? "WARNING" : "INFO";
        return `${new Date(r.criadoEm).toISOString()} [${nivelLinha}] ${r.metodo} ${r.rota} -> ${r.status} (${r.duracaoMs}ms)`;
      });

    return { totalNoArquivo, linhas };
  }
}
