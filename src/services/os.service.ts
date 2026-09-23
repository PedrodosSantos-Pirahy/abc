import { BaseService } from "./base.service";
import { OsRepository, type OsFiltros } from "../repositories/os.repository";
import type { Os } from "../models/os.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class OsService extends BaseService<Os> {
  constructor(private readonly osRepository: OsRepository = new OsRepository()) {
    super(osRepository);
  }

  // * M_DT_EMISSAO é sempre "agora" quando uma OS é emitida — não é um campo
  // * que o chamador deveria decidir manualmente.
  protected override async beforeCreate(dados: Partial<Os>): Promise<Partial<Os>> {
    return { ...dados, M_DT_EMISSAO: dados.M_DT_EMISSAO ?? new Date() };
  }

  async buscar(filtros: OsFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.osRepository.buscar(filtros, opcoes);
  }

  // ! `remove()` (herdado de BaseService) já chama o `delete` sobrescrito do
  // ! OsRepository por baixo dos panos — ou seja, já é o "devolver pra
  // ! PENDENTE" seguro, nunca um DELETE físico. Não precisa reimplementar
  // ! nada aqui; o polimorfismo resolve.
}
