import { describe, it, expect, vi, beforeEach } from "vitest";
import { pgPool } from "../src/config/postgres";
import { BaseRepository } from "../src/repositories/base.repository";

interface Teste extends Record<string, unknown> {
  id: number;
  nome: string;
}

// * Entidade de teste "de mentirinha" só pra exercitar o CRUD genérico sem
// * depender de nenhuma tabela real do projeto.
class TesteRepository extends BaseRepository<Teste> {
  protected table = "public.teste";
  protected primaryKey = "id" as const;
  protected columns = ["nome"] as const;
}

describe("BaseRepository", () => {
  const repo = new TesteRepository();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("findById monta o SQL certo e devolve a primeira linha", async () => {
    const queryMock = vi
      .spyOn(pgPool, "query")
      .mockResolvedValue({ rows: [{ id: 1, nome: "a" }] } as never);

    const resultado = await repo.findById(1);

    expect(resultado).toEqual({ id: 1, nome: "a" });
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('WHERE "id" = $1'), [1]);
  });

  it("findById devolve null quando não encontra nada", async () => {
    vi.spyOn(pgPool, "query").mockResolvedValue({ rows: [] } as never);
    expect(await repo.findById(999)).toBeNull();
  });

  it("create rejeita coluna fora da lista branca (evita SQL injection por nome de coluna)", async () => {
    await expect(repo.create({ outraColuna: "x" } as never)).rejects.toThrow(/lista branca/);
  });

  it("create monta o INSERT só com as colunas válidas", async () => {
    const queryMock = vi
      .spyOn(pgPool, "query")
      .mockResolvedValue({ rows: [{ id: 2, nome: "b" }] } as never);

    const resultado = await repo.create({ nome: "b" });

    expect(resultado).toEqual({ id: 2, nome: "b" });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO public.teste ("nome")'),
      ["b"],
    );
  });

  it("update com objeto vazio não altera nada — só devolve o registro atual", async () => {
    vi.spyOn(pgPool, "query").mockResolvedValue({ rows: [{ id: 1, nome: "a" }] } as never);
    expect(await repo.update(1, {})).toEqual({ id: 1, nome: "a" });
  });

  it("delete lança NotFoundError quando rowCount é 0", async () => {
    vi.spyOn(pgPool, "query").mockResolvedValue({ rowCount: 0 } as never);
    await expect(repo.delete(1)).rejects.toThrow(/não encontrado/);
  });
});
