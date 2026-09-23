import { BaseService } from "./base.service";
import {
  MmovQualidadeRepository,
  type MmovQualidadeFiltros,
  type ColunaArquivoQualidade,
  type ChaveQualidade,
} from "../repositories/mmov-qualidade.repository";
import type { MmovQualidade } from "../models/mmov-qualidade.model";
import type { OpcoesPaginacao } from "../types/pagination.types";

export class MmovQualidadeService extends BaseService<MmovQualidade> {
  constructor(private readonly mmovQualidadeRepository: MmovQualidadeRepository = new MmovQualidadeRepository()) {
    super(mmovQualidadeRepository);
  }

  async buscar(filtros: MmovQualidadeFiltros, opcoes?: Partial<OpcoesPaginacao>) {
    return this.mmovQualidadeRepository.buscar(filtros, opcoes);
  }

  buscarArquivo(chave: ChaveQualidade, coluna: ColunaArquivoQualidade) {
    return this.mmovQualidadeRepository.buscarArquivo(chave, coluna);
  }

  salvarArquivo(chave: ChaveQualidade, coluna: ColunaArquivoQualidade, conteudo: Buffer | null) {
    return this.mmovQualidadeRepository.salvarArquivo(chave, coluna, conteudo);
  }
}
