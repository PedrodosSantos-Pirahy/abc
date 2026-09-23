import { AprRepository } from "../repositories/apr.repository";
import { pdfService } from "./pdf.service";
import { renderAprHtml } from "../templates/apr.template";
import { base64ParaBuffer, horaMinutoLocal, dataLocalDmy } from "../utils/conversao";
import { truncar } from "../utils/texto";
import { numeroOuPadrao } from "../utils/numero";
import { GRUPO_PADRAO, TENTATIVA_PADRAO } from "../constants/dominio";
import { ValidationError, NotFoundError } from "../utils/AppError";

export interface SalvarAprBody {
  osId: number;
  grupo?: number;
  tentativa?: number;
  conteudo: any; // * shape solto vindo do wizard Angular — mesmo "c" do Flask.
  fotoCadeado?: string;
}

export class AprService {
  constructor(private readonly aprRepository: AprRepository = new AprRepository()) {}

  async salvar(body: SalvarAprBody): Promise<{ mensagem: string; aprId: number; avisoPdf?: string }> {
    const { osId } = body;
    const c = body.conteudo;
    if (!osId || !c) throw new ValidationError("Dados incompletos");

    const grupo = numeroOuPadrao(body.grupo, GRUPO_PADRAO);
    const tentativa = numeroOuPadrao(body.tentativa, TENTATIVA_PADRAO);
    const s8 = c.step8 ?? {};
    const responsaveis = s8.responsaveis ?? [];
    const resp1 = responsaveis[0] ?? {};
    const resp2 = responsaveis[1] ?? {};

    const { aprId, regIdGrupo, maquinaNome } = await this.aprRepository.salvar({
      osId,
      grupo,
      tentativa,
      tag: c.step1?.tag ?? null,
      checkServico: c.step3?.validacao === "sim",
      rAnimais: c.step4?.contatoAnimais,
      rRuido: c.step4?.ruido,
      rChoque: c.step4?.choqueEletrico,
      rExtensao: c.step4?.extensaoStatus,
      rEsmagamento: c.step4?.esmagamento,
      rEscorregamento: c.step4?.escorregamento,
      sinalizacao: c.step5?.sinalizacao,
      fonteEnergia: c.step5?.fonteEnergia,
      epiOculos: c.step5?.epiOculos,
      epiLuvas: c.step5?.epiLuvas,
      epiCapacete: c.step5?.epiCapacete,
      epiCinto: c.step5?.epiCinto,
      epiOutros: c.step5?.epiOutros,
      epiOutrosDesc: c.step5?.epiOutrosDescricao,
      ancEscada: c.step6?.escadaSegura,
      ancGuardaCorpo: c.step6?.guardaCorpo,
      ancGcSeguro: c.step6?.guardaCorpoSeguro,
      cliVento: c.step6?.ventoForte,
      cliChuva: c.step6?.chuva,
      cliRaios: c.step6?.raios,
      consRadio: c.step7?.radio,
      consOutros: c.step7?.outros,
      consOutrosDesc: c.step7?.outrosDesc,
      resp1Nome: resp1.nome ?? null,
      resp1Assinatura: base64ParaBuffer(resp1.assinaturaBase64),
      resp2Nome: resp2.nome ?? null,
      resp2Assinatura: base64ParaBuffer(resp2.assinaturaBase64),
      equipe: c.step2?.equipe ?? [],
      fotoCadeadoBuffer: base64ParaBuffer(body.fotoCadeado),
    });

    // * Geração de PDF fica FORA da transação de escrita (ver comentário em
    // * apr.repository.ts) — se falhar, os dados da APR já estão salvos; só o
    // * anexo do PDF fica pendente. Mesma tolerância que o Flask já aplica no
    // * pós-manutenção (aviso_pdf), aplicada aqui também por consistência.
    let avisoPdf: string | undefined;
    try {
      const { inicio, fim } = await this.aprRepository.horariosDoGrupo(osId, regIdGrupo);
      const html = renderAprHtml({
        logoB64: pdfService.logoBase64(),
        os: osId,
        maquina: maquinaNome,
        data: inicio ? dataLocalDmy(inicio) : "--/--/----",
        hora: inicio ? horaMinutoLocal(inicio) : "--:--",
        dataFim: fim ? dataLocalDmy(fim) : "--/--/----",
        horaFim: fim ? horaMinutoLocal(fim) : "--:--",
        equipe: c.step2?.equipe ?? [],
        c,
      });
      const pdfBuffer = await pdfService.gerarPdfDeHtml(html);
      if (regIdGrupo) {
        await this.aprRepository.salvarPdf(regIdGrupo, pdfBuffer);
      }
    } catch (erro) {
      avisoPdf = `APR salva, mas o PDF não pôde ser gerado: ${truncar((erro as Error).message, 120)}`;
    }

    return { mensagem: "APR e PDF gerados!", aprId, ...(avisoPdf ? { avisoPdf } : {}) };
  }

  async buscarPorOs(osId: number) {
    const apr = await this.aprRepository.buscarPorOs(osId);
    if (!apr) throw new NotFoundError("APR não encontrada");
    return apr;
  }
}
