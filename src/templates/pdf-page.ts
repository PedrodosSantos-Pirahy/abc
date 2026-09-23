// * Tamanho/margem de página do PDF — antes repetido em 3 lugares (os dois
// * templates via `@page {...}` no CSS, e a chamada `page.pdf()` do
// * puppeteer). Uma única fonte agora: os templates interpolam
// * `PDF_PAGE_CSS` e o pdf.service.ts usa `PDF_FORMATO`/`PDF_MARGEM_PUPPETEER`.
export const PDF_FORMATO = "A4" as const;
export const PDF_MARGEM_MM = 10;

export const PDF_PAGE_CSS = `@page { size: ${PDF_FORMATO}; margin: ${PDF_MARGEM_MM}mm; }`;

export const PDF_MARGEM_PUPPETEER = {
  top: `${PDF_MARGEM_MM}mm`,
  bottom: `${PDF_MARGEM_MM}mm`,
  left: `${PDF_MARGEM_MM}mm`,
  right: `${PDF_MARGEM_MM}mm`,
};
