import { describe, it, expect, vi, beforeEach } from "vitest";
import { pgPool } from "../src/config/postgres";
import { OsRepository } from "../src/repositories/os.repository";

describe("OsRepository", () => {
  const repo = new OsRepository();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ! Este é o teste mais importante do módulo Os: garante que "excluir" uma
  // ! OS NUNCA vira um DELETE de verdade em MMOVEXEC (ver a regra de
  // ! segurança documentada em os.repository.ts).
  it("delete() roda um UPDATE que zera os responsáveis — nunca um DELETE", async () => {
    const queryMock = vi.spyOn(pgPool, "query").mockResolvedValue({ rowCount: 1 } as never);

    await repo.delete(123);

    const sqlExecutado = queryMock.mock.calls[0][0] as string;
    expect(sqlExecutado).toMatch(/^\s*UPDATE/i);
    expect(sqlExecutado).not.toMatch(/DELETE/i);
    expect(sqlExecutado).toContain('"M_RESPONS" = NULL');
    expect(sqlExecutado).toContain('"M_RESPONS4" = NULL');
    expect(queryMock.mock.calls[0][1]).toEqual([123]);
  });

  it("delete() lança erro quando a OS não existe", async () => {
    vi.spyOn(pgPool, "query").mockResolvedValue({ rowCount: 0 } as never);
    await expect(repo.delete(999)).rejects.toThrow(/não encontrada/);
  });

  it("buscar() com matriculaResponsavel monta um IN entre as 4 colunas de responsável", async () => {
    const queryMock = vi.spyOn(pgPool, "query").mockImplementation(async (sql: unknown) => {
      const texto = sql as string;
      if (texto.includes("COUNT")) return { rows: [{ total: 0 }] } as never;
      return { rows: [] } as never;
    });

    await repo.buscar({ matriculaResponsavel: "5728" });

    const sqlItens = queryMock.mock.calls[0][0] as string;
    expect(sqlItens).toContain('IN ("M_RESPONS", "M_RESPONS2", "M_RESPONS3", "M_RESPONS4")');
    expect(queryMock.mock.calls[0][1]).toEqual(["5728", 20, 0]);
  });
});
