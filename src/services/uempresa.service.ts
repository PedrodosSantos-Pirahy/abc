import { BaseService } from "./base.service";
import { UempresaRepository } from "../repositories/uempresa.repository";
import type { Uempresa } from "../models/uempresa.model";

export class UempresaService extends BaseService<Uempresa> {
  constructor(repository: UempresaRepository = new UempresaRepository()) {
    super(repository);
  }
}
