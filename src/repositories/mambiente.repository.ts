import { BaseRepository } from "./base.repository";
import type { Mambiente } from "../models/mambiente.model";

// ? Sem coluna de ativo/inativo hoje — remove() cai no DELETE físico.
export class MambienteRepository extends BaseRepository<Mambiente> {
  protected table = 'manut."MAMBIENTE"';
  protected primaryKey = "AM_ID" as const;
  protected columns = ["AM_ID", "AM_DESCRICAO"] as const;
}
