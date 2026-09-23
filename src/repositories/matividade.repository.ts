import { BaseRepository } from "./base.repository";
import type { Matividade } from "../models/matividade.model";

// ? Sem coluna de ativo/inativo hoje — remove() cai no DELETE físico.
export class MatividadeRepository extends BaseRepository<Matividade> {
  protected table = 'manut."MATIVIDADE"';
  protected primaryKey = "A_ID" as const;
  protected columns = ["A_ID", "A_DESCRICAO"] as const;
}
