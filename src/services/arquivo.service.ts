import { BaseService } from "./base.service";
import { ArquivoRepository } from "../repositories/arquivo.repository";
import type { Arquivo, ArquivoMetadados } from "../models/arquivo.model";

interface ArquivoRecebido {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

function paraMetadados(arquivo: Arquivo): ArquivoMetadados {
  const { conteudo: _conteudo, ...metadados } = arquivo;
  return metadados;
}

// * Módulo genérico de Arquivos: qualquer foto/assinatura/PDF do sistema
// * entra aqui UMA vez e vira um `id` — o resto do sistema para de guardar
// * `bytea` espalhado pelas próprias tabelas de negócio (ver plano, 1.4).
export class ArquivoService extends BaseService<Arquivo> {
  constructor(private readonly arquivoRepository: ArquivoRepository = new ArquivoRepository()) {
    super(arquivoRepository);
  }

  async upload(arquivo: ArquivoRecebido): Promise<ArquivoMetadados> {
    const registro = await this.arquivoRepository.create({
      nome_original: arquivo.originalname,
      mimetype: arquivo.mimetype,
      tamanho_bytes: arquivo.size,
      conteudo: arquivo.buffer,
    });
    return paraMetadados(registro);
  }

  /** Devolve o registro COMPLETO (com o binário) — só pra quem vai fazer o streaming de download. */
  async baixar(id: number): Promise<Arquivo | null> {
    return this.arquivoRepository.findById(id);
  }

  async listarMetadados(pagina?: number, tamanhoPagina?: number) {
    const resultado = await this.list({}, { page: pagina, pageSize: tamanhoPagina });
    return {
      ...resultado,
      items: resultado.items.map(paraMetadados),
    };
  }
}
