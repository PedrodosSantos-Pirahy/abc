import { BaseService } from "./base.service";
import { MservicoAtivRepository } from "../repositories/mservico-ativ.repository";
import type { MservicoAtiv } from "../models/mservico-ativ.model";

export class MservicoAtivService extends BaseService<MservicoAtiv> {
  constructor(repository: MservicoAtivRepository = new MservicoAtivRepository()) {
    super(repository);
  }
}
