import { describe, it, expect, vi, beforeEach } from "vitest";
import { pgPool } from "../src/config/postgres";
import { ArquivoService } from "../src/services/arquivo.service";

describe("ArquivoService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("upload grava o buffer e devolve metadados SEM o conteúdo binário", async () => {
    const criadoEm = new Date();
    vi.spyOn(pgPool, "query").mockResolvedValue({
      rows: [
        {
          id: 1,
          nome_original: "foto.jpg",
          mimetype: "image/jpeg",
          tamanho_bytes: 4,
          conteudo: Buffer.from("test"),
          criado_em: criadoEm,
        },
      ],
    } as never);

    const service = new ArquivoService();
    const metadados = await service.upload({
      buffer: Buffer.from("test"),
      originalname: "foto.jpg",
      mimetype: "image/jpeg",
      size: 4,
    });

    expect(metadados).toEqual({
      id: 1,
      nome_original: "foto.jpg",
      mimetype: "image/jpeg",
      tamanho_bytes: 4,
      criado_em: criadoEm,
    });
    expect((metadados as Record<string, unknown>).conteudo).toBeUndefined();
  });

  it("baixar() devolve o registro completo, incluindo o binário (é usado só pro streaming de download)", async () => {
    vi.spyOn(pgPool, "query").mockResolvedValue({
      rows: [{ id: 1, mimetype: "image/jpeg", conteudo: Buffer.from("foto") }],
    } as never);

    const service = new ArquivoService();
    const arquivo = await service.baixar(1);

    expect(arquivo?.conteudo).toEqual(Buffer.from("foto"));
  });
});
