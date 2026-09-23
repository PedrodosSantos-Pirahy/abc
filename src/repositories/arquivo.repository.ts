import { BaseRepository } from "./base.repository";
import type { Arquivo } from "../models/arquivo.model";

export class ArquivoRepository extends BaseRepository<Arquivo> {
  protected table = "unico.files";
  protected primaryKey = "id" as const;
  protected columns = [
    "nome_original",
    "mimetype",
    "tamanho_bytes",
    "conteudo",
    "criado_em",
  ] as const;
}
