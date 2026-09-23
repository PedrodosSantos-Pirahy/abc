import { BaseService } from "./base.service";
import { MmovKanbanEquipeRepository, type MmovKanbanEquipeFiltros } from "../repositories/mmov-kanban-equipe.repository";
import type { MmovKanbanEquipe } from "../models/mmov-kanban-equipe.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class MmovKanbanEquipeService extends BaseService<MmovKanbanEquipe> {
  constructor(private readonly mmovKanbanEquipeRepository: MmovKanbanEquipeRepository = new MmovKanbanEquipeRepository()) {
    super(mmovKanbanEquipeRepository);
  }

  async buscar(filtros: MmovKanbanEquipeFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovKanbanEquipeRepository.buscar(filtros, opcoes);
  }

  async numerosAtivos() {
    return this.mmovKanbanEquipeRepository.numerosAtivos();
  }

  async numerosPorMatricula(matricula: string, page: number, pageSize: number) {
    return this.mmovKanbanEquipeRepository.numerosPorMatricula(matricula, page, pageSize);
  }
}
