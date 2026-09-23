import { BaseService } from "./base.service";
import { UequipgruRepository, type UequipgruFiltros } from "../repositories/uequipgru.repository";
import type { Uequipgru } from "../models/uequipgru.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class UequipgruService extends BaseService<Uequipgru> {
  constructor(private readonly uequipgruRepository: UequipgruRepository = new UequipgruRepository()) {
    super(uequipgruRepository);
  }

  async buscar(filtros: UequipgruFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.uequipgruRepository.buscar(filtros, opcoes);
  }
}
