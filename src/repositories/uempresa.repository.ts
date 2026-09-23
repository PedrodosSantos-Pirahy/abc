import { BaseRepository } from "./base.repository";
import type { Uempresa } from "../models/uempresa.model";

// ? Sem coluna de ativo/inativo hoje — remove() cai no DELETE físico.
export class UempresaRepository extends BaseRepository<Uempresa> {
  protected table = 'public."UEMPRESA"';
  protected primaryKey = "EMP_COD" as const;
  protected columns = ["EMP_COD", "EMP_NOME"] as const;
}
