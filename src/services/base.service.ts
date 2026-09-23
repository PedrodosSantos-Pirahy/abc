import type { BaseRepository } from "../repositories/base.repository";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

/**
 * * Camada fina entre controller e repository. Existe pra dar um lugar ÚNICO
 * * onde a regra de negócio de uma entidade específica pode ser plugada
 * * (`beforeCreate`/`afterCreate`/`beforeUpdate`) sem duplicar o CRUD
 * * genérico em cada service. Uma entidade sem regra nenhuma nem precisa
 * * sobrescrever nada — os hooks abaixo já são "no-op" por padrão.
 */
export abstract class BaseService<T extends object> {
  constructor(protected readonly repository: BaseRepository<T>) {}

  protected async beforeCreate(dados: Partial<T>): Promise<Partial<T>> {
    return dados;
  }

  protected async afterCreate(registro: T): Promise<T> {
    return registro;
  }

  protected async beforeUpdate(_id: unknown, dados: Partial<T>): Promise<Partial<T>> {
    return dados;
  }

  protected async afterUpdate(registro: T): Promise<T> {
    return registro;
  }

  async list(
    filtros: Partial<T> = {},
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<T>> {
    return this.repository.findMany(filtros, opcoes);
  }

  async getById(id: unknown): Promise<T | null> {
    return this.repository.findById(id);
  }

  async create(dados: Partial<T>): Promise<T> {
    const dadosTratados = await this.beforeCreate(dados);
    const registro = await this.repository.create(dadosTratados);
    return this.afterCreate(registro);
  }

  async update(id: unknown, dados: Partial<T>): Promise<T> {
    const dadosTratados = await this.beforeUpdate(id, dados);
    const registro = await this.repository.update(id, dadosTratados);
    return this.afterUpdate(registro);
  }

  async remove(id: unknown): Promise<void> {
    return this.repository.delete(id);
  }
}
