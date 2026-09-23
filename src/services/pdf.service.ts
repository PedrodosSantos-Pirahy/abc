import fs from "node:fs";
import path from "node:path";
import puppeteer, { type Browser } from "puppeteer";
import { renderAprHtml, type AprPdfContexto } from "../templates/apr.template";
import { renderRappmHtml, type RappmPdfContexto } from "../templates/rappm.template";
import { PDF_FORMATO, PDF_MARGEM_PUPPETEER } from "../templates/pdf-page";

// * Equivalente ao `HTML(string=...).write_pdf()` do weasyprint no Flask de
// * referência: renderiza o mesmo HTML/CSS já usado nos templates, só que via
// * Chromium headless (puppeteer) em vez do weasyprint. Mantém um único
// * Browser vivo entre chamadas — abrir/fechar Chromium a cada PDF é caro.
export class PdfService {
  private browserPromise: Promise<Browser> | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    }
    return this.browserPromise;
  }

  async gerarPdfDeHtml(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "load" });
      const uint8 = await page.pdf({ format: PDF_FORMATO, printBackground: true, margin: PDF_MARGEM_PUPPETEER });
      return Buffer.from(uint8);
    } finally {
      await page.close();
    }
  }

  logoBase64(): string {
    try {
      const caminho = path.join(__dirname, "..", "assets", "pirahydocumentos.png");
      return fs.readFileSync(caminho).toString("base64");
    } catch {
      return "";
    }
  }

  async gerarApr(ctx: AprPdfContexto): Promise<Buffer> {
    return this.gerarPdfDeHtml(renderAprHtml(ctx));
  }

  async gerarRappm(ctx: RappmPdfContexto): Promise<Buffer> {
    return this.gerarPdfDeHtml(renderRappmHtml(ctx));
  }

  async fechar(): Promise<void> {
    if (this.browserPromise) {
      const browser = await this.browserPromise;
      await browser.close();
      this.browserPromise = null;
    }
  }
}

// * Singleton — o resto do backend (apr.service, qualidade.service) importa
// * esta instância em vez de criar um Browser puppeteer novo por request.
export const pdfService = new PdfService();
