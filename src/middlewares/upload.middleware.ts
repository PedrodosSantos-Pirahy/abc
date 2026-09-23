import multer from "multer";

// * Memory storage — o arquivo inteiro fica em `req.file.buffer`, pronto pra
// * ser gravado direto na coluna `bytea` de `manut.arquivos`. Suficiente pro
// * tamanho de fotos/PDFs deste sistema; se um dia precisar de arquivos bem
// * maiores, trocar por `diskStorage` + streaming.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB por arquivo
});
