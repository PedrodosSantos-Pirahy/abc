// * Tabela ERP `manut."MMOVEXEC"` — a OS de verdade (nasce quando o PCM emite
// * a SS). Chave própria M_NR_ORD (serial). Compartilhada com outras telas do
// * ERP (ex.: tela de PENDENTE/EM_EXECUCAO usa M_RESPONS1..4 pra decidir status)
// * — por isso o repository desta entidade NUNCA apaga uma linha de verdade
// * (ver os.repository.ts).
export interface Mmovexec {
  M_NR_ORD: number; // PK serial — o "número da OS" que o manutentor vê
  M_NR_SOL: number; // FK -> manut."MMOVMAN".M_NUMERO (a SS que originou esta OS)
  M_SR_SOL: string; // ! série da SS de origem — sempre filtrar junto com M_NR_SOL
  M_LOCAL: number | null;
  M_EMPRESA: number | null;
  M_DT_EMISSAO: Date | null; // gravado quando o PCM emite a OS
  M_DISCRIM: string | null; // descrição da OS preenchida pelo PCM na emissão
  M_RESPONS: string | null; // matrícula do responsável 1 — null = OS "PENDENTE" pro ERP
  M_RESPONS2: string | null;
  M_RESPONS3: string | null;
  M_RESPONS4: string | null;
  M_HR_EFET_COLAB: number | null;
  M_IDSERVICO_ATIV: number | null; // FK -> manut."MSERVICO_ATIV".SA_ID
  M_HR_PREV: number | null; // NUMERIC(8,1) — horas decimais (ex.: 14.5 = 14:30)
  M_DT_PREV: Date | null; // previsão de término
  M_JUSTIFICATIVA: string | null;

  // Envelope real de execução — preenchido pelo fluxo de registrar-sessão / finalizar-revisão (fases futuras)
  M_DT_EFET: Date | null;
  M_HRI: number | null;
  M_DT_EFETFIM: Date | null;
  M_HRF: number | null;
  M_HR_EFET: number | null; // duração do envelope (MAX_fim − MIN_inicio), informativo — não é soma de man-hours
  M_SOLUCAO: number | null; // 3 = "Total", gravado só na aprovação final do PCM
}
