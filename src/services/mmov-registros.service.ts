import { BaseService } from "./base.service";
import { MmovRegistrosRepository, type MmovRegistrosFiltros, type ColunaArquivoRegistros } from "../repositories/mmov-registros.repository";
import { OsRepository } from "../repositories/os.repository";
import type { MmovRegistros } from "../models/mmov-registros.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

// * `RETURNING *` do BaseRepository já traz CREATED_AT (coluna real da
// * tabela, gerada pelo Postgres) mesmo sem estar no model MmovRegistros —
// * evita ter que buscar de novo ou fazer JOIN pra saber a hora do registro.
type MmovRegistrosComCreatedAt = MmovRegistros & { CREATED_AT: Date };

export class MmovRegistrosService extends BaseService<MmovRegistros> {
  constructor(
    private readonly mmovRegistrosRepository: MmovRegistrosRepository = new MmovRegistrosRepository(),
    private readonly osRepository: OsRepository = new OsRepository(),
  ) {
    super(mmovRegistrosRepository);
  }

  async buscar(filtros: MmovRegistrosFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovRegistrosRepository.buscar(filtros, opcoes);
  }

  buscarArquivo(regId: number, coluna: ColunaArquivoRegistros) {
    return this.mmovRegistrosRepository.buscarArquivo(regId, coluna);
  }

  salvarArquivo(regId: number, coluna: ColunaArquivoRegistros, conteudo: Buffer | null) {
    return this.mmovRegistrosRepository.salvarArquivo(regId, coluna, conteudo);
  }

  protected override async afterCreate(registro: MmovRegistros): Promise<MmovRegistros> {
    await this.emitirParaErpLegadoSeAplicavel(registro);
    return registro;
  }

  protected override async afterUpdate(registro: MmovRegistros): Promise<MmovRegistros> {
    await this.emitirParaErpLegadoSeAplicavel(registro);
    return registro;
  }

  // * Ver comentário de `OsRepository.emitirParaErpLegado` — este é o
  // * gatilho: só faz sentido rodar quando a solução aplicada já existe
  // * (nas etapas anteriores, ainda vem null, e o UPDATE lá não faz nada).
  private async emitirParaErpLegadoSeAplicavel(registro: MmovRegistros): Promise<void> {
    const { N_NUMERO, SOLUCAO_APLICADA, CREATED_AT } = registro as MmovRegistrosComCreatedAt;
    if (!SOLUCAO_APLICADA) return;
    await this.osRepository.emitirParaErpLegado(N_NUMERO, CREATED_AT, SOLUCAO_APLICADA);
  }
}
