import { BaseController } from "./base.controller";
import { MatividadeService } from "../services/matividade.service";
import type { Matividade } from "../models/matividade.model";

export class MatividadeController extends BaseController<Matividade> {
  constructor(service: MatividadeService = new MatividadeService()) {
    super(service);
  }
}
