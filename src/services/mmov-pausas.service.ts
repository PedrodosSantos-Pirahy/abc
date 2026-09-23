import { BaseService } from "./base.service";
import { MmovPausasRepository, type MmovPausasFiltros } from "../repositories/mmov-pausas.repository";
import type { MmovPausas } from "../models/mmov-pausas.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class MmovPausasService extends BaseService<MmovPausas> {
  constructor(private readonly mmovPausasRepository: MmovPausasRepository = new MmovPausasRepository()) {
    super(mmovPausasRepository);
  }

  async buscar(filtros: MmovPausasFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovPausasRepository.buscar(filtros, opcoes);
  }

  fecharAberta(numero: number, grupo: number, tentativa: number, hrFimLiteral?: string | null) {
    return this.mmovPausasRepository.fecharAberta(numero, grupo, tentativa, hrFimLiteral);
  }

  fecharComPropriaHora(numero: number, grupo: number, tentativa: number) {
    return this.mmovPausasRepository.fecharComPropriaHora(numero, grupo, tentativa);
  }

  buscarAberta(numero: number, grupo: number) {
    return this.mmovPausasRepository.buscarAberta(numero, grupo);
  }
}
