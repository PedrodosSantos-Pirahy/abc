import { BaseService } from "./base.service";
import { MmovexecHorasRepository, type MmovexecHorasFiltros } from "../repositories/mmovexec-horas.repository";
import type { MmovexecHoras } from "../models/mmovexec-horas.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class MmovexecHorasService extends BaseService<MmovexecHoras> {
  constructor(private readonly mmovexecHorasRepository: MmovexecHorasRepository = new MmovexecHorasRepository()) {
    super(mmovexecHorasRepository);
  }

  async buscar(filtros: MmovexecHorasFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovexecHorasRepository.buscar(filtros, opcoes);
  }
}
