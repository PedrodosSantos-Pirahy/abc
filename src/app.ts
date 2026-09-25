import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import { env } from "./config/env";
import { requestLogger } from "./middlewares/requestLogger.middleware";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.middleware";

const app = express();

// Limite explícito de payload — evita que uma requisição gigante gaste
// CPU/memória processando JSON antes de qualquer validação acontecer.
// Upload de arquivo usa multer (upload.middleware.ts), que tem limite próprio.
// * 2mb (era 1mb) — margem de segurança: um pacote de sincronização offline
// * de uma única OS (fotos de chegada/finalização/cadeado + APR + qualidade,
// * cada foto já comprimida a ~100KB) mede ~430KB na prática; o limite
// * antigo de 1mb só sobrava por pouco até o sync passar a mandar 1 OS por
// * requisição (ver os.service.ts#executarSincronizacaoOffline) — essa
// * margem é para uma OS individual incomum (mais assinaturas, foto maior),
// * não para voltar a empacotar várias OS juntas.
app.use(express.json({ limit: "2mb" }));

app.use(cookieParser());

try {
  // ? swagger-output.json só existe depois de `npm run swagger`. Sem ele, a
  // ? API sobe normalmente — só fica sem a doc interativa em /api-docs.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerDocument = require("../swagger-output.json");
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch {
  console.warn("⚠️  swagger-output.json não encontrado — rode `npm run swagger` para gerar a doc.");
}

app.use(helmet());

// CORS: mesma lógica dev/prod do backend de referência — credentials:true
// exige origin específico (nunca "*"), então refletimos o origin permitido.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl/Postman/same-origin
      if (env.corsOrigins.includes(origin)) return callback(null, true);
      if (!env.isProd) return callback(null, true); // DEV: aceita qualquer origin
      return callback(new Error(`Origin não permitido pelo CORS: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(requestLogger);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
