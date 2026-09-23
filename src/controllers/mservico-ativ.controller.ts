import { BaseController } from "./base.controller";
import { MservicoAtivService } from "../services/mservico-ativ.service";
import type { MservicoAtiv } from "../models/mservico-ativ.model";

export class MservicoAtivController extends BaseController<MservicoAtiv> {
  constructor(service: MservicoAtivService = new MservicoAtivService()) {
    super(service);
  }
}
