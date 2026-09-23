import { BaseService } from "./base.service";
import { UequipsetRepository, type UequipsetFiltros } from "../repositories/uequipset.repository";
import type { Uequipset } from "../models/uequipset.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class UequipsetService extends BaseService<Uequipset> {
  constructor(private readonly uequipsetRepository: UequipsetRepository = new UequipsetRepository()) {
    super(uequipsetRepository);
  }

  async buscar(filtros: UequipsetFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.uequipsetRepository.buscar(filtros, opcoes);
  }
}
