// * Tabela ERP `manut."MMOVMAN"` — a SS (Solicitação de Serviço), NÃO a OS.
// * A OS de verdade (com número próprio e responsáveis) só nasce quando o
// * PCM emite a SS — nesse momento uma linha em MMOVEXEC é criada (ver
// * mmovexec.model.ts). Compartilhada com outras telas do ERP — só leitura
// * ou escrita via COALESCE (nunca sobrescrever um campo do ERP com null).
export interface Mmovman {
  M_NUMERO: number; // PK — número da SS
  M_SERIE: string; // ! ver nota de SERIE no CLAUDE.md: mesmo M_NUMERO pode existir em séries diferentes
  M_DESCRICAO: string | null;
  M_DATAHR: Date | null;
  M_PRIORID: number | null;
  M_RISCO: number | null;
  M_FUNC_SOL: number | null; // FK -> public."UFUNC".UFUN_CODIGO (solicitante)
  M_EQUIP: number | null; // FK -> public."UEQUIPGRU".EQPG_CODIGO
  M_LOCAL: number | null;
  M_EMPRESA: number | null;
  M_TIPO: number | null; // FK -> manut."MTIPO_OS".TOS_ID
  M_ATIVIDADE: number | null; // FK -> manut."MATIVIDADE".A_ID
  M_AMBIENTE: number | null; // FK -> manut."MAMBIENTE".AM_ID
  M_SETOR: number | null; // FK -> public."UEQUIPSET".EQPS_CODIGO
}
