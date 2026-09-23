import { BaseService } from "./base.service";
import { MmovaprRepository, type MmovaprFiltros } from "../repositories/mmovapr.repository";
import type { Mmovapr } from "../models/mmovapr.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class MmovaprService extends BaseService<Mmovapr> {
  constructor(private readonly mmovaprRepository: MmovaprRepository = new MmovaprRepository()) {
    super(mmovaprRepository);
  }

  async buscar(filtros: MmovaprFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovaprRepository.buscar(filtros, opcoes);
  }
}
