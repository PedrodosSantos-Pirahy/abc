import { BaseService } from "./base.service";
import { MambienteRepository } from "../repositories/mambiente.repository";
import type { Mambiente } from "../models/mambiente.model";

export class MambienteService extends BaseService<Mambiente> {
  constructor(repository: MambienteRepository = new MambienteRepository()) {
    super(repository);
  }
}
