import swaggerAutogen from "swagger-autogen";
import { env } from "./env";

// * Gera `swagger-output.json` a partir dos comentários/rotas do app.
// * Rodar com `npm run swagger` sempre que uma rota nova for adicionada.
// * Host lido de `env.ts` — antes era um "localhost:5010" fixo, que ficava
// * desalinhado se o `PORT` default mudasse (a doc gerada continuaria
// * apontando pra porta antiga).
const doc = {
  info: {
    title: "API — Sistema de Manutenção",
    description: "Backend Node.js/TypeScript do Sistema de Manutenção (Pirahy).",
  },
  host: `localhost:${env.port}`,
  basePath: "/api",
  schemes: ["http", "https"],
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/routes/index.ts"];

swaggerAutogen()(outputFile, endpointsFiles, doc);
