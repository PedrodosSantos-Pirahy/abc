import { BaseService } from "./base.service";
import { MmovmanRepository, type MmovmanFiltros } from "../repositories/mmovman.repository";
import type { Mmovman } from "../models/mmovman.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class MmovmanService extends BaseService<Mmovman> {
  constructor(private readonly mmovmanRepository: MmovmanRepository = new MmovmanRepository()) {
    super(mmovmanRepository);
  }

  async buscar(filtros: MmovmanFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovmanRepository.buscar(filtros, opcoes);
  }
}
