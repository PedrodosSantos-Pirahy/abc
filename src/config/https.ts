import fs from "node:fs";
import path from "node:path";

// * Mesmo padrão do Flask de referência: certificado autoassinado em
// * `certs/cert.pem`/`certs/key.pem` na raiz do projeto (não em `src/` — não
// * precisa passar pelo build do TypeScript, só precisa existir no disco na
// * hora que o servidor sobe). Necessário pro navegador liberar a câmera
// * (deslocamento, fotos de auditoria) em rede local, já que isso exige
// * contexto seguro (HTTPS) — HTTP simples faz o browser bloquear.
export interface OpcoesHttps {
  cert: Buffer;
  key: Buffer;
}

const CAMINHO_CERT = path.join(__dirname, "..", "..", "certs", "cert.pem");
const CAMINHO_KEY = path.join(__dirname, "..", "..", "certs", "key.pem");

export function carregarCertificadoHttps(): OpcoesHttps | null {
  if (!fs.existsSync(CAMINHO_CERT) || !fs.existsSync(CAMINHO_KEY)) {
    return null;
  }
  return {
    cert: fs.readFileSync(CAMINHO_CERT),
    key: fs.readFileSync(CAMINHO_KEY),
  };
}
