import { BaseService } from "./base.service";
import { MatividadeRepository } from "../repositories/matividade.repository";
import type { Matividade } from "../models/matividade.model";

export class MatividadeService extends BaseService<Matividade> {
  constructor(repository: MatividadeRepository = new MatividadeRepository()) {
    super(repository);
  }
}
