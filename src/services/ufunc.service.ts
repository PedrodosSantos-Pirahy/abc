import { BaseService } from "./base.service";
import { UfuncRepository, type UfuncFiltros } from "../repositories/ufunc.repository";
import type { Ufunc } from "../models/ufunc.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class UfuncService extends BaseService<Ufunc> {
  constructor(private readonly ufuncRepository: UfuncRepository = new UfuncRepository()) {
    super(ufuncRepository);
  }

  async buscar(filtros: UfuncFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.ufuncRepository.buscar(filtros, opcoes);
  }
}
