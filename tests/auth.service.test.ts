import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import { pgPool } from "../src/config/postgres";
import { AuthService } from "../src/services/auth.service";

describe("AuthService.login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("lança erro (404) quando a matrícula não existe", async () => {
    vi.spyOn(pgPool, "query").mockResolvedValue({ rows: [] } as never);
    const service = new AuthService();
    await expect(service.login("0000", "1234")).rejects.toThrow(/não encontrada/);
  });

  it("lança erro (401) quando o usuário está inativo", async () => {
    vi.spyOn(pgPool, "query").mockResolvedValue({
      rows: [{ id: 1, matricula: "5728", ativo: false, senha_hash: "x", nome: "a", cargo: "b", setor: "c" }],
    } as never);
    const service = new AuthService();
    await expect(service.login("5728", "1234")).rejects.toThrow(/inativo/);
  });

  it("lança erro (401) quando a senha não confere", async () => {
    const hash = await bcrypt.hash("senha-certa", 4);
    vi.spyOn(pgPool, "query").mockResolvedValue({
      rows: [{ id: 1, matricula: "5728", ativo: true, senha_hash: hash, nome: "a", cargo: "b", setor: "c" }],
    } as never);
    const service = new AuthService();
    await expect(service.login("5728", "senha-errada")).rejects.toThrow(/incorreta/);
  });

  it("devolve o usuário SEM senha_hash quando a senha confere", async () => {
    const hash = await bcrypt.hash("1234", 4);
    vi.spyOn(pgPool, "query").mockResolvedValue({
      rows: [
        { id: 1, matricula: "5728", ativo: true, senha_hash: hash, nome: "Pedro", cargo: "MEC", setor: "Manutenção" },
      ],
    } as never);

    const service = new AuthService();
    const usuario = await service.login("5728", "1234");

    expect(usuario).toEqual({
      id: 1,
      matricula: "5728",
      ativo: true,
      nome: "Pedro",
      cargo: "MEC",
      setor: "Manutenção",
    });
  });
});
