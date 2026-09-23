import { BaseService } from "./base.service";
import { MmovKanbanRepository, type MmovKanbanFiltros } from "../repositories/mmov-kanban.repository";
import type { MmovKanban } from "../models/mmov-kanban.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class MmovKanbanService extends BaseService<MmovKanban> {
  constructor(private readonly mmovKanbanRepository: MmovKanbanRepository = new MmovKanbanRepository()) {
    super(mmovKanbanRepository);
  }

  async buscar(filtros: MmovKanbanFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovKanbanRepository.buscar(filtros, opcoes);
  }
}
