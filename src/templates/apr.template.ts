// * Porta APR.html (Jinja2/weasyprint) pra um template literal — mesmo HTML/CSS,
// * só troca `{{ }}`/`{% %}` por interpolação JS. Mantém 100% do layout do PDF
// * de referência; o que muda é só o motor de renderização (puppeteer no lugar
// * do weasyprint, ver pdf.service.ts).
import { PDF_PAGE_CSS } from "./pdf-page";

function esc(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function simNao(valor: unknown): string {
  return valor ? "Sim" : "Não";
}

export interface AprPdfContexto {
  logoB64: string;
  os: number | string;
  maquina: string;
  data: string;
  hora: string;
  horaFim: string;
  dataFim: string;
  equipe: Array<{ matricula?: string; nome?: string }>;
  c: any; // * mesmo shape solto do dict `c` do Flask — vem direto do payload do frontend.
}

export function renderAprHtml(ctx: AprPdfContexto): string {
  const c = ctx.c ?? {};
  const step1 = c.step1 ?? {};
  const step2 = c.step2 ?? {};
  const step3 = c.step3 ?? {};
  const step4 = c.step4 ?? {};
  const step5 = c.step5 ?? {};
  const step6 = c.step6 ?? {};
  const step7 = c.step7 ?? {};
  const step8 = c.step8 ?? {};

  const equipeRows = (step2.equipe ?? [])
    .map(
      (m: any, i: number) => `
      <tr>
          <td colspan="8"><span class="font-semibold">Colaborador ${i + 1}:</span> ${esc(m.nome)}</td>
          <td colspan="4"><span class="font-semibold">Matrícula:</span> ${esc(m.matricula)}</td>
      </tr>`,
    )
    .join("");

  const extensaoStatus =
    step4.extensaoStatus === "sim"
      ? "Sim (Boas Condições)"
      : step4.extensaoStatus === "danificada"
        ? "Não (Danificada)"
        : "N/A (Não utiliza)";

  const sinalizacao = step5.sinalizacao === "sim" ? "Sim" : step5.sinalizacao === "nao" ? "Não" : "N/A";
  const escadaSegura = step6.escadaSegura === "sim" ? "Sim" : step6.escadaSegura === "nao" ? "Não" : "N/A";
  const guardaCorpo = step6.guardaCorpo === "sim" ? "Sim" : step6.guardaCorpo === "nao" ? "Não" : "N/A";
  const guardaCorpoSeguro =
    step6.guardaCorpoSeguro === "sim" ? "Sim" : step6.guardaCorpoSeguro === "nao" ? "Não" : "N/A";

  const responsaveisRows = (step8.responsaveis ?? [])
    .filter((r: any) => r?.nome)
    .map(
      (resp: any) => `
      <tr>
          <td colspan="6" style="height: 40px;"><span class="font-semibold">Nome:</span> ${esc(resp.nome)}</td>
          <td colspan="6" style="height: 40px; position: relative;">
              <span class="font-semibold" style="position: absolute; top: 4px; left: 4px;">Assinatura:</span>
              ${
                resp.assinaturaBase64
                  ? `<div style="text-align: center; margin-top: 5px;"><img src="${resp.assinaturaBase64}" style="max-height: 30px;"></div>`
                  : ""
              }
          </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        ${PDF_PAGE_CSS}
        body { font-family: Arial, sans-serif; font-size: 10px; color: black; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid black; padding: 4px; vertical-align: middle; line-height: 1.3; }
        th { font-weight: bold; text-align: center; }
        .bg-gray-200 { background-color: #e5e7eb; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .font-semibold { font-weight: 600; }
        .text-red-600 { color: #dc2626; }
        .uppercase { text-transform: uppercase; }
        .logo-title { font-weight: 900; font-size: 24px; letter-spacing: -1px; line-height: 1; margin: 0; }
        .logo-sub { font-size: 8px; letter-spacing: 2px; line-height: 1; margin-top: 2px; }
    </style>
</head>
<body>
    <table>
        <colgroup>
            <col style="width: 8.333%;"><col style="width: 8.333%;"><col style="width: 8.333%;"><col style="width: 8.333%;">
            <col style="width: 8.333%;"><col style="width: 8.333%;"><col style="width: 8.333%;"><col style="width: 8.333%;">
            <col style="width: 8.333%;"><col style="width: 8.333%;"><col style="width: 8.333%;"><col style="width: 8.333%;">
        </colgroup>
        <tbody>
            <tr>
                <td colspan="3" class="text-center">
                    <div class="text-red-600 uppercase logo-title">PIRAHY</div>
                    <div class="text-red-600 uppercase logo-sub">Alimentos</div>
                </td>
                <td colspan="9" class="text-center font-bold bg-gray-100" style="font-size: 16px;">
                    Análise Preliminar de Risco (APR)
                </td>
            </tr>

            <tr><th colspan="12" class="bg-gray-200">Identificação</th></tr>
            <tr>
                <td colspan="6"><span class="font-semibold">Local:</span> ${esc(step1.local)}</td>
                <td colspan="3"><span class="font-semibold">Hora Início:</span> ${esc(ctx.hora)}</td>
                <td colspan="3"><span class="font-semibold">Hora Término:</span> ${esc(ctx.horaFim)}</td>
            </tr>
            <tr>
                <td colspan="6"><span class="font-semibold">Nº da Ordem de Serviço:</span> ${esc(ctx.os)}</td>
                <td colspan="3"><span class="font-semibold">Data de Início:</span> ${esc(ctx.data)}</td>
                <td colspan="3"><span class="font-semibold">Data de Término:</span> ${esc(ctx.dataFim)}</td>
            </tr>
            <tr>
                <td colspan="12"><span class="font-semibold">TAG do Equipamento:</span> ${esc(step1.tag)}</td>
            </tr>

            <tr><th colspan="12" class="bg-gray-200">Trabalhadores Autorizados</th></tr>
            ${equipeRows}

            <tr>
                <td colspan="10" class="font-semibold">2 - A turma/equipe conferiu o serviço a ser executado?</td>
                <td colspan="2" class="text-center font-bold">${step3.validacao === "sim" ? "Sim" : "Não"}</td>
            </tr>

            <tr>
                <th colspan="8" class="bg-gray-200">1 - Risco</th>
                <th colspan="2" class="bg-gray-200">Resposta</th>
                <th colspan="2" class="bg-gray-200">Medidas de Controle</th>
            </tr>
            <tr>
                <td colspan="8">Existe risco de contato com animais / insetos?</td>
                <td colspan="2" class="text-center font-bold">${simNao(step4.contatoAnimais)}</td>
                <td colspan="2">Solicitar a remoção pela equipe especializada.</td>
            </tr>
            <tr>
                <td colspan="8">Existe risco de ruído?</td>
                <td colspan="2" class="text-center font-bold">${simNao(step4.ruido)}</td>
                <td colspan="2">Protetor Auricular</td>
            </tr>
            <tr>
                <td colspan="8">Existe risco de choque elétrico (trabalho com eletricidade)?</td>
                <td colspan="2" class="text-center font-bold">${simNao(step4.choqueEletrico)}</td>
                <td colspan="2">Realizar o desligamento e bloqueio com cadeado</td>
            </tr>
            <tr>
                <td colspan="8">As extensões estão em boas condições de uso?</td>
                <td colspan="2" class="text-center font-bold">${extensaoStatus}</td>
                <td colspan="2">Não - solicitar manutenção</td>
            </tr>
            <tr>
                <td colspan="8">Existe risco de esmagamento?</td>
                <td colspan="2" class="text-center font-bold">${simNao(step4.esmagamento)}</td>
                <td colspan="2">Solicitar o bloqueio e colocação c/ cadeado</td>
            </tr>
            <tr>
                <td colspan="8">Existe o risco da escada e plataformas de trabalhos estarem escorregadias?</td>
                <td colspan="2" class="text-center font-bold">${simNao(step4.escorregamento)}</td>
                <td colspan="2"></td>
            </tr>

            <tr>
                <th colspan="10" class="bg-gray-200">2 - Sinalização</th>
                <th colspan="2" class="bg-gray-200">Resposta</th>
            </tr>
            <tr>
                <td colspan="10">A área está devidamente isolada com correntes, fitas e sinalização?</td>
                <td colspan="2" class="text-center font-bold">${sinalizacao}</td>
            </tr>

            <tr>
                <th colspan="8" class="bg-gray-200">3 - Controle de Fontes de Energia.</th>
                <th colspan="2" class="bg-gray-200">Resposta</th>
                <th colspan="2" class="bg-gray-200">Medidas de Controle</th>
            </tr>
            <tr>
                <td colspan="8">Todas as fontes de energia foram identificadas sendo desligadas, bloqueadas ou aliviadas?</td>
                <td colspan="2" class="text-center font-bold">${step5.fonteEnergia === "sim" ? "Sim" : "Não"}</td>
                <td colspan="2" class="text-center">Bloqueio com cadeado</td>
            </tr>

            <tr>
                <th colspan="10" class="bg-gray-200">4 - Equipamento de Proteção Individual - EPI.</th>
                <th colspan="2" class="bg-gray-200">Resposta</th>
            </tr>
            <tr>
                <td colspan="10">Óculos Impacto /Ampla Visão/ Escuro</td>
                <td colspan="2" class="text-center font-bold">${simNao(step5.epiOculos)}</td>
            </tr>
            <tr>
                <td colspan="10">Luvas /Algodão /Látex/Vaqueta</td>
                <td colspan="2" class="text-center font-bold">${simNao(step5.epiLuvas)}</td>
            </tr>
            <tr>
                <td colspan="10">Capacete com Jugular</td>
                <td colspan="2" class="text-center font-bold">${simNao(step5.epiCapacete)}</td>
            </tr>
            <tr>
                <td colspan="10">Cinto Paraquedista / Talabarte</td>
                <td colspan="2" class="text-center font-bold">${simNao(step5.epiCinto)}</td>
            </tr>
            <tr>
                <td colspan="10"><span class="font-semibold">Outros EPIs:</span> ${esc(step5.epiOutrosDescricao || "N/A")}</td>
                <td colspan="2" class="text-center font-bold">${simNao(step5.epiOutros)}</td>
            </tr>

            <tr>
                <th colspan="10" class="bg-gray-200">5 - Ponto de Ancoramento e Meio de Acesso.</th>
                <th colspan="2" class="bg-gray-200">Resposta</th>
            </tr>
            <tr>
                <td colspan="10">A escada de acesso apresenta condições seguras de uso?</td>
                <td colspan="2" class="text-center font-bold">${escadaSegura}</td>
            </tr>
            <tr>
                <td colspan="10">O equipamento possui Guarda Corpo?</td>
                <td colspan="2" class="text-center font-bold">${guardaCorpo}</td>
            </tr>
            <tr>
                <td colspan="10">Guarda Corpo está em condições segura de uso?</td>
                <td colspan="2" class="text-center font-bold">${guardaCorpoSeguro}</td>
            </tr>

            <tr>
                <th colspan="10" class="bg-gray-200">6 - Condições Meteorológicas Adversas</th>
                <th colspan="2" class="bg-gray-200">Resposta</th>
            </tr>
            <tr>
                <td colspan="10">Tem vento forte durante a execução da atividade?</td>
                <td colspan="2" class="text-center font-bold">${step6.ventoForte === "sim" ? "Sim" : "Não"}</td>
            </tr>
            <tr>
                <td colspan="10">Está chovendo durante a execução da atividade?</td>
                <td colspan="2" class="text-center font-bold">${step6.chuva === "sim" ? "Sim" : "Não"}</td>
            </tr>
            <tr>
                <td colspan="10">Existe precipitação de descargas atmosféricas (raios)?</td>
                <td colspan="2" class="text-center font-bold">${step6.raios === "sim" ? "Sim" : "Não"}</td>
            </tr>

            <tr>
                <th colspan="10" class="bg-gray-200">7 - Outras Considerações</th>
                <th colspan="2" class="bg-gray-200">Resposta</th>
            </tr>
            <tr>
                <td colspan="10">Necessita de sistema de comunicação: Rádio?</td>
                <td colspan="2" class="text-center font-bold">${step7.radio === "sim" ? "Sim" : "Não"}</td>
            </tr>
            <tr>
                <td colspan="10"><span class="font-semibold">Outros:</span> ${esc(step7.outrosDesc || "N/A")}</td>
                <td colspan="2" class="text-center font-bold">${simNao(step7.outros)}</td>
            </tr>

            <tr>
                <th colspan="12" class="bg-gray-200">8 - Situações de Emergência e Resgate</th>
            </tr>
            <tr>
                <td colspan="12" class="text-center font-semibold" style="padding: 8px;">
                    Em caso de Situações de Emergência e resgate, seguir o procedimento de resgate conforme treinamentos.<br>
                    1 - Comunicar o setor de segurança. 2 - O técnico de segurança acionará a equipe de resgate e caso necessário solicitará ajuda externa (Bombeiros, Samu).
                </td>
            </tr>

            <tr>
                <th colspan="12" class="bg-gray-200">9 - Responsável pela APR</th>
            </tr>
            ${responsaveisRows}
        </tbody>
    </table>
</body>
</html>`;
}
