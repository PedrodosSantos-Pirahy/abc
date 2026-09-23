import { BaseRepository } from "./base.repository";
import type { MtipoOs } from "../models/mtipo-os.model";

// ? Sem coluna de ativo/inativo hoje — remove() cai no DELETE físico
// ? (padrão do BaseRepository). Se isso for um problema pra um tipo de OS
// ? já usado historicamente, precisa de uma coluna nova (migração) antes de
// ? confiar em "desativar" aqui.
export class MtipoOsRepository extends BaseRepository<MtipoOs> {
  protected table = 'manut."MTIPO_OS"';
  protected primaryKey = "TOS_ID" as const;
  protected columns = ["TOS_ID", "TOS_DESCRICAO"] as const;
}
