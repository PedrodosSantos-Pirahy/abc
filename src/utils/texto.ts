// * Usado pra montar o `aviso_pdf` quando a geração de PDF falha (apr.service.ts,
// * qualidade.service.ts) sem devolver uma mensagem de erro gigante pro frontend.
export function truncar(texto: string | undefined, limite: number): string {
  return (texto ?? "").slice(0, limite);
}
