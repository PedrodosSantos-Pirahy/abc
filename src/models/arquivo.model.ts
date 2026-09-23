// * Tabela NOVA `manut.arquivos` — módulo genérico de Arquivos. Qualquer foto,
// * assinatura ou PDF do sistema passa a ser gravado aqui UMA vez só, e as
// * demais tabelas guardam apenas o `id` (ver 1.4 do plano). CRUD completo
// * (é tabela nova, sem uso por outras telas do ERP — sem risco).
export interface Arquivo {
  id: number; // PK serial
  nome_original: string | null;
  mimetype: string;
  tamanho_bytes: number;
  conteudo: Buffer;
  criado_em: Date;
}

// * O que a API devolve no upload/nas listagens — nunca o `conteudo` inteiro
// * (isso vai só pelo endpoint de download, via stream).
export type ArquivoMetadados = Omit<Arquivo, "conteudo">;
