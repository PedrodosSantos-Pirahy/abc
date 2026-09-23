// * Porta RAPPM.html (Jinja2/weasyprint) — mesmo layout, motor puppeteer.
import { PDF_PAGE_CSS } from "./pdf-page";

function esc(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface RappmPdfContexto {
  logoUrl: string;
  elaboradoEm: string;
  status: string;
  revisao: string;
  dataEmissao: string;
  d: {
    N_NUMERO: number | string;
    maquina_nome: string;
    PRE_PROTECAO: string;
    PRE_FERRAMENTAS: string;
    PRE_EPIS: string;
    PRE_LUBRIFICANTES: string;
    POS_LIMPEZA: string;
    POS_MONTAGEM: string;
    POS_AVALIACAO: string;
    POS_RESIDUOS: string;
    RESP_NOME: string;
    MANUT_NOME: string;
    RESP_ASSINATURA?: string | null;
    MANUT_ASSINATURA?: string | null;
  };
}

export function renderRappmHtml(ctx: RappmPdfContexto): string {
  const { d } = ctx;
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Qualidade - OS ${esc(d.N_NUMERO)}</title>
    <style>
        ${PDF_PAGE_CSS}
        body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.3; color: #000; margin: 0; padding: 0; }
        .container { width: 100%; border: 3px solid black; box-sizing: border-box; }
        .header-table { width: 100%; border-collapse: collapse; border-bottom: 3px solid black; }
        .header-logo { width: 30%; border-right: 2px solid black; padding: 10px; text-align: center; vertical-align: middle; }
        .header-logo img { max-height: 60px; max-width: 100%; }
        .header-info { width: 70%; padding: 0; vertical-align: top; }
        .info-inner-table { width: 100%; border-collapse: collapse; height: 100%; text-align: center; }
        .info-title { border-bottom: 2px solid black; padding: 12px; font-weight: bold; font-size: 14px; }
        .bg-gray { background-color: #f3f4f6; font-weight: bold; }
        .info-cell { border-bottom: 2px solid black; border-right: 2px solid black; padding: 6px; width: 33.33%; }
        .info-cell-last { border-bottom: 2px solid black; padding: 6px; width: 33.33%; }
        .val-cell { border-right: 2px solid black; padding: 6px; }
        .os-bar { width: 100%; border-bottom: 3px solid black; background-color: #f9fafb; padding: 8px 12px; font-weight: bold; display: table; box-sizing: border-box; }
        .os-bar div { display: table-cell; width: 33%; }
        .text-red { color: #b91c1c; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .content { padding: 16px 12px; }
        .check-table { width: 100%; border-collapse: collapse; border: 2px solid black; margin-bottom: 24px; }
        .check-table th { border: 2px solid black; background-color: #e5e7eb; padding: 8px; text-align: left; font-weight: bold; }
        .check-table td { border: 2px solid black; padding: 8px; }
        .col-status { text-align: center; font-weight: bold; font-size: 14px; width: 20%; }
        .signatures { width: 100%; margin-top: 30px; margin-bottom: 20px; display: table; }
        .sig-block { display: table-cell; width: 50%; text-align: center; vertical-align: bottom; }
        .sig-content { width: 80%; margin: 0 auto; }
        .sig-img { height: 60px; margin: 0 auto 5px auto; display: block; }
        .sig-empty { height: 60px; margin-bottom: 5px; }
        .sig-line { border-top: 2px solid black; padding-top: 4px; font-weight: bold; font-size: 13px; text-transform: uppercase; }
        .sig-label { font-size: 10px; color: #4b5563; text-transform: uppercase; margin-top: 2px;}
        .footer-table { width: 100%; border-collapse: collapse; border-top: 3px solid black; font-size: 11px; }
        .footer-title { border-bottom: 2px solid black; padding: 6px; background-color: #f3f4f6; font-weight: bold; }
        .footer-td { padding: 6px; border-bottom: 2px solid black; }
        .footer-border-r { border-right: 2px solid black; text-align: center; font-weight: bold; width: 30%; }
    </style>
</head>
<body>
    <div class="container">
        <table class="header-table">
            <tr>
                <td class="header-logo">
                    <img src="data:image/png;base64,${ctx.logoUrl}" alt="Pirahy Alimentos" />
                </td>
                <td class="header-info">
                    <table class="info-inner-table">
                        <tr>
                            <td colspan="3" class="info-title">RQ-CORP-SGSA-07-011 – Registro de Avaliação de Pré e Pós Manutenção</td>
                        </tr>
                        <tr>
                            <td class="info-cell bg-gray">Elaborado em</td>
                            <td class="info-cell bg-gray">Status</td>
                            <td class="info-cell-last bg-gray">Revisão</td>
                        </tr>
                        <tr>
                            <td class="val-cell">${esc(ctx.elaboradoEm)}</td>
                            <td class="val-cell">${esc(ctx.status)}</td>
                            <td style="padding: 6px;">${esc(ctx.revisao)}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="content">
            <table class="check-table">
                <tr>
                    <th>1. Antes da Manutenção</th>
                    <th style="text-align: center;">Verificação Realizada</th>
                </tr>
                <tr>
                    <td>Verificar a proteção adequada para a manutenção em superfícies de contato (plásticos, barreiras, etc.).</td>
                    <td class="col-status">${esc(d.PRE_PROTECAO)}</td>
                </tr>
                <tr>
                    <td>Verificação de uso de ferramentas e materiais limpos e apropriados.</td>
                    <td class="col-status">${esc(d.PRE_FERRAMENTAS)}</td>
                </tr>
                <tr>
                    <td>Uso de EPIs adequados pelos técnicos (luvas, toucas, aventais, etc.).</td>
                    <td class="col-status">${esc(d.PRE_EPIS)}</td>
                </tr>
                <tr>
                    <td>Lubrificantes e materiais utilizados são de grau alimentício, se aplicável.</td>
                    <td class="col-status">${esc(d.PRE_LUBRIFICANTES)}</td>
                </tr>
            </table>

            <table class="check-table">
                <tr>
                    <th>2. Após a Manutenção</th>
                    <th style="text-align: center;">Verificação Realizada</th>
                </tr>
                <tr>
                    <td>Limpeza completa da área (remoção de resíduos, peças, ferramentas).</td>
                    <td class="col-status">${esc(d.POS_LIMPEZA)}</td>
                </tr>
                <tr>
                    <td>Montagem do equipamento, verificação de partes substituídas e inspeção da integridade das ferramentas.</td>
                    <td class="col-status">${esc(d.POS_MONTAGEM)}</td>
                </tr>
                <tr>
                    <td>Avaliação final do responsável pela emissão do serviço antes da liberação do equipamento.</td>
                    <td class="col-status">${esc(d.POS_AVALIACAO)}</td>
                </tr>
                <tr>
                    <td>Os resíduos da manutenção (peças velhas, panos) foram removidos da área?</td>
                    <td class="col-status">${esc(d.POS_RESIDUOS)}</td>
                </tr>
            </table>

            <div class="signatures">
                <div class="sig-block">
                    <div class="sig-content">
                        ${
                          d.RESP_ASSINATURA
                            ? `<img class="sig-img" src="data:image/png;base64,${d.RESP_ASSINATURA}" alt="Assinatura" />`
                            : `<div class="sig-empty"></div>`
                        }
                        <div class="sig-line">${esc(d.RESP_NOME)}</div>
                        <div class="sig-label">Assinatura do Responsável</div>
                    </div>
                </div>

                <div class="sig-block">
                    <div class="sig-content">
                        ${
                          d.MANUT_ASSINATURA
                            ? `<img class="sig-img" src="data:image/png;base64,${d.MANUT_ASSINATURA}" alt="Assinatura" />`
                            : `<div class="sig-empty"></div>`
                        }
                        <div class="sig-line">${esc(d.MANUT_NOME)}</div>
                        <div class="sig-label">Assinatura do Manutentor</div>
                    </div>
                </div>
            </div>
        </div>

        <table class="footer-table">
            <tr>
                <td colspan="2" class="footer-title">Legenda:</td>
            </tr>
            <tr>
                <td class="footer-td footer-border-r">Sim</td>
                <td class="footer-td">Item verificado e realizado conforme o registro.</td>
            </tr>
            <tr>
                <td class="footer-td footer-border-r" style="border-bottom: none;">N/A (Não se aplica)</td>
                <td class="footer-td" style="border-bottom: none;">Áreas que não estão em contato com o alimento ou item não aplicável.</td>
            </tr>
        </table>
    </div>
</body>
</html>`;
}
