import { BaseRepository } from "./base.repository";
import type { MservicoAtiv } from "../models/mservico-ativ.model";

// ? Sem coluna de ativo/inativo hoje — remove() cai no DELETE físico.
export class MservicoAtivRepository extends BaseRepository<MservicoAtiv> {
  protected table = 'manut."MSERVICO_ATIV"';
  protected primaryKey = "SA_ID" as const;
  protected columns = ["SA_ID", "SA_DESCRICAO"] as const;
}
