import { BaseController } from "./base.controller";
import { UempresaService } from "../services/uempresa.service";
import type { Uempresa } from "../models/uempresa.model";

export class UempresaController extends BaseController<Uempresa> {
  constructor(service: UempresaService = new UempresaService()) {
    super(service);
  }
}
