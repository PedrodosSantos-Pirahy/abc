import { BaseController } from "./base.controller";
import { MambienteService } from "../services/mambiente.service";
import type { Mambiente } from "../models/mambiente.model";

export class MambienteController extends BaseController<Mambiente> {
  constructor(service: MambienteService = new MambienteService()) {
    super(service);
  }
}
