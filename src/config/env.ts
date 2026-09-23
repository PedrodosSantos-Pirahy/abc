import dotenv from "dotenv";

dotenv.config();

// * Lê e valida todas as variáveis de ambiente NUM lugar só. Nenhum outro
// * arquivo do projeto deve chamar `process.env.X` diretamente — assim,
// * se faltar uma variável, o servidor falha aqui no boot (rápido e com
// * mensagem clara), em vez de quebrar em runtime na primeira requisição
// * que precisar dela.
function obrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${nome}`);
  }
  return valor;
}

function numeroObrigatorio(nome: string): number {
  const valor = Number(obrigatoria(nome));
  if (!Number.isFinite(valor)) {
    throw new Error(`Variável de ambiente ${nome} precisa ser um número válido.`);
  }
  return valor;
}

export const env = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 5010),
  isProd: process.env.NODE_ENV === "production",

  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:4200")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean),

  db: {
    host: obrigatoria("DB_HOST"),
    database: obrigatoria("DB_NAME"),
    user: obrigatoria("DB_USER"),
    password: obrigatoria("DB_PASS"),
    port: numeroObrigatorio("DB_PORT"),
  },

  mongoUrl: process.env.MONGO_URL ?? "mongodb://localhost:27017/manutencao_logs",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",

  // * Série ativa no ERP — mesmo papel de SERIE_ATIVA no main.py de referência.
  // * Alterar via env quando o contador de séries do ERP for resetado de novo.
  serieAtiva: process.env.SERIE_ATIVA ?? "S",
};
