import type { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { MmovRegistrosService } from "../services/mmov-registros.service";
import { asyncHandler } from "../utils/asyncHandler";
import { base64ParaBuffer } from "../utils/conversao";
import { NotFoundError, ValidationError } from "../utils/AppError";
import type { MmovRegistros } from "../models/mmov-registros.model";
import type { ColunaArquivoRegistros } from "../repositories/mmov-registros.repository";

// * :tipo na URL nunca é o nome real da coluna — só essas 5 chaves curtas são
// * aceitas, mapeadas aqui pro nome verdadeiro. Fecha a porta pra alguém
// * tentar ler/gravar uma coluna arbitrária da tabela via essa rota.
const COLUNA_POR_TIPO: Record<string, ColunaArquivoRegistros> = {
  chegada: "FOTO_CHEGADA",
  finalizacao: "FOTO_FINALIZACAO",
  cadeado: "FOTO_CADEADO",
  apr: "PDF_APR",
  qualidade: "PDF_QUALIDADE",
};
const MIME_POR_TIPO: Record<string, string> = {
  chegada: "image/jpeg",
  finalizacao: "image/jpeg",
  cadeado: "image/jpeg",
  apr: "application/pdf",
  qualidade: "application/pdf",
};

export class MmovRegistrosController extends BaseController<MmovRegistros> {
  constructor(private readonly mmovRegistrosService: MmovRegistrosService = new MmovRegistrosService()) {
    super(mmovRegistrosService);
  }

  // * Sobrescreve o `list` genérico: filtro por lote de N_NUMERO
  // * (`numeros=1,2,3`) não é "coluna = valor" simples.
  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros, semMatricula } = req.query as Record<string, string>;
    const resultado = await this.mmovRegistrosService.buscar(
      {
        numeros: numeros ? numeros.split(",").map(Number) : undefined,
        semMatricula: semMatricula === "true" ? true : undefined,
      },
      {
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
        sortBy,
        sortDir: sortDir === "DESC" ? "DESC" : sortDir === "ASC" ? "ASC" : undefined,
      },
    );
    res.json(resultado);
  });

  // * Mesmo filtro, lendo do corpo (POST) — `numeros` pode ter centenas/
  // * milhares de itens nas telas de lista grande, o que estoura o limite
  // * prático de uma URL GET.
  buscarLote = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, sortBy, sortDir, numeros, semMatricula } = req.body as {
      page?: number; pageSize?: number; sortBy?: string; sortDir?: "ASC" | "DESC";
      numeros?: number[]; semMatricula?: boolean;
    };
    const resultado = await this.mmovRegistrosService.buscar(
      { numeros, semMatricula },
      { page, pageSize, sortBy, sortDir },
    );
    res.json(resultado);
  });

  private resolverColuna(tipo: string): ColunaArquivoRegistros {
    const coluna = COLUNA_POR_TIPO[tipo];
    if (!coluna) throw new ValidationError(`Tipo de arquivo inválido: ${tipo}`);
    return coluna;
  }

  // * Binário sob demanda — nenhum bytea sai no list/getById genérico (ver
  // * colunasSelect em mmov-registros.repository.ts). Só baixa quando o
  // * usuário clica pra ver aquela foto/PDF específico.
  buscarArquivo = asyncHandler(async (req: Request, res: Response) => {
    const tipo = String(req.params.tipo);
    const coluna = this.resolverColuna(tipo);
    const conteudo = await this.mmovRegistrosService.buscarArquivo(Number(req.params.id), coluna);
    if (!conteudo) throw new NotFoundError("Arquivo não encontrado.");
    res.setHeader("Content-Type", MIME_POR_TIPO[tipo]);
    res.send(conteudo);
  });

  salvarArquivo = asyncHandler(async (req: Request, res: Response) => {
    const coluna = this.resolverColuna(String(req.params.tipo));
    const { base64 } = req.body as { base64?: string | null };
    await this.mmovRegistrosService.salvarArquivo(Number(req.params.id), coluna, base64ParaBuffer(base64));
    res.json({ mensagem: "Arquivo salvo." });
  });
}
