import { QualidadeRepository } from "../repositories/qualidade.repository";
import { pdfService } from "./pdf.service";
import { renderRappmHtml } from "../templates/rappm.template";
import { base64ParaBuffer, agoraComoLiteral } from "../utils/conversao";
import { truncar } from "../utils/texto";
import { numeroOuPadrao } from "../utils/numero";
import { GRUPO_PADRAO, TENTATIVA_PADRAO } from "../constants/dominio";
import { ValidationError } from "../utils/AppError";

export interface SalvarPreBody {
  osId: number;
  grupo?: number;
  tentativa?: number;
  conteudo: { protecao: string; ferramentas: string; epis: string; lubrificantes: string };
}

export interface SalvarPosBody {
  osId: number;
  grupo?: number;
  tentativa?: number;
  conteudo: {
    limpeza: string;
    montagem: string;
    avaliacao: string;
    residuos: string;
    respMatricula?: string;
    respNome?: string;
    manutMatricula?: string;
    manutNome?: string;
    respAssinatura?: string;
    manutAssinatura?: string;
  };
}

function rotulo(valor: unknown): string {
  const v = String(valor ?? "")
    .toLowerCase()
    .trim();
  if (v === "ok" || v === "sim") return "Sim";
  if (v === "na") return "N/A";
  if (v === "nao" || v === "não") return "Não";
  return String(valor ?? "");
}

function semPrefixoDataUri(base64?: string): string | undefined {
  if (!base64) return undefined;
  return base64.includes(",") ? base64.split(",")[1] : base64;
}

export class QualidadeService {
  constructor(private readonly qualidadeRepository: QualidadeRepository = new QualidadeRepository()) {}

  async salvarPre(body: SalvarPreBody): Promise<void> {
    const c = body.conteudo;
    if (!body.osId || !c) throw new ValidationError("OS ID e conteúdo obrigatórios.");
    await this.qualidadeRepository.salvarPre({
      osId: body.osId,
      grupo: numeroOuPadrao(body.grupo, GRUPO_PADRAO),
      tentativa: numeroOuPadrao(body.tentativa, TENTATIVA_PADRAO),
      protecao: c.protecao,
      ferramentas: c.ferramentas,
      epis: c.epis,
      lubrificantes: c.lubrificantes,
    });
  }

  async salvarPos(body: SalvarPosBody): Promise<{ mensagem: string; avisoPdf?: string }> {
    const { osId } = body;
    const c = body.conteudo;
    if (!osId || !c) throw new ValidationError("OS ID e conteúdo são obrigatórios.");
    const grupo = numeroOuPadrao(body.grupo, GRUPO_PADRAO);
    const tentativa = numeroOuPadrao(body.tentativa, TENTATIVA_PADRAO);

    const respAssinaturaBuffer = base64ParaBuffer(c.respAssinatura);
    const manutAssinaturaBuffer = base64ParaBuffer(c.manutAssinatura);

    await this.qualidadeRepository.salvarPos({
      osId,
      grupo,
      tentativa,
      limpeza: c.limpeza,
      montagem: c.montagem,
      avaliacao: c.avaliacao,
      residuos: c.residuos,
      respMatricula: c.respMatricula ?? null,
      respNome: c.respNome ?? null,
      manutMatricula: c.manutMatricula ?? null,
      manutNome: c.manutNome ?? null,
      respAssinatura: respAssinaturaBuffer,
      manutAssinatura: manutAssinaturaBuffer,
    });

    const dbDados = await this.qualidadeRepository.buscarDadosCompletos(osId, grupo, tentativa);
    if (!dbDados) {
      throw new Error(`Dados da OS ${osId} grupo ${grupo} tentativa ${tentativa} não encontrados após upsert.`);
    }

    let avisoPdf: string | undefined;
    try {
      const html = renderRappmHtml({
        logoUrl: pdfService.logoBase64(),
        elaboradoEm: agoraComoLiteral(),
        status: "Aprovado",
        revisao: "04",
        dataEmissao: agoraComoLiteral(),
        d: {
          N_NUMERO: osId,
          maquina_nome: dbDados.maquina_nome || "Equipamento Geral",
          PRE_PROTECAO: rotulo(dbDados.PRE_PROTECAO),
          PRE_FERRAMENTAS: rotulo(dbDados.PRE_FERRAMENTAS),
          PRE_EPIS: rotulo(dbDados.PRE_EPIS),
          PRE_LUBRIFICANTES: rotulo(dbDados.PRE_LUBRIFICANTES),
          POS_LIMPEZA: rotulo(dbDados.POS_LIMPEZA),
          POS_MONTAGEM: rotulo(dbDados.POS_MONTAGEM),
          POS_AVALIACAO: rotulo(dbDados.POS_AVALIACAO),
          POS_RESIDUOS: rotulo(dbDados.POS_RESIDUOS),
          RESP_NOME: (dbDados.RESP_NOME || "").toUpperCase(),
          MANUT_NOME: (dbDados.MANUT_NOME || "").toUpperCase(),
          RESP_ASSINATURA: semPrefixoDataUri(c.respAssinatura) ?? null,
          MANUT_ASSINATURA: semPrefixoDataUri(c.manutAssinatura) ?? null,
        },
      });
      const pdfBuffer = await pdfService.gerarPdfDeHtml(html);
      await this.qualidadeRepository.salvarPdf(osId, grupo, tentativa, pdfBuffer);
    } catch (erro) {
      avisoPdf = `Dados salvos, mas o relatório RAPPM não pôde ser gerado: ${truncar((erro as Error).message, 120)}`;
    }

    return { mensagem: "Dados salvos com sucesso!", ...(avisoPdf ? { avisoPdf } : {}) };
  }
}
