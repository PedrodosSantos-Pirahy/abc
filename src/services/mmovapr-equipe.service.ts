import { BaseService } from "./base.service";
import { MmovaprEquipeRepository, type MmovaprEquipeFiltros } from "../repositories/mmovapr-equipe.repository";
import type { MmovaprEquipe } from "../models/mmovapr-equipe.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class MmovaprEquipeService extends BaseService<MmovaprEquipe> {
  constructor(private readonly mmovaprEquipeRepository: MmovaprEquipeRepository = new MmovaprEquipeRepository()) {
    super(mmovaprEquipeRepository);
  }

  async buscar(filtros: MmovaprEquipeFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovaprEquipeRepository.buscar(filtros, opcoes);
  }
}
