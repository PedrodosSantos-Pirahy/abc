// * Tabela ERP `manut."MMOVEXEC_HORAS"` — uma linha por mecânico, por dia de
// * trabalho, numa OS. Chave real: (MH_NR_ORD, MH_LOCAL, MH_EMPRESA, MH_DATA,
// * MH_RESPONS, MH_SEQ). FK composta (MH_RESPONS, MH_EMPRESA) -> UFUNC
// * (UFUN_CODIGO, UFUN_EMPRESA) — mecânico precisa existir na UFUNC.
export interface MmovexecHoras {
  MH_NR_ORD: number; // FK -> manut."MMOVEXEC".M_NR_ORD
  MH_LOCAL: number;
  MH_EMPRESA: number;
  MH_DATA: Date; // dia do apontamento
  MH_RESPONS: string; // matrícula do mecânico
  MH_SEQ: number; // ! nunca usar 0 fixo — calcular MAX(MH_SEQ)+1 por mecânico/dia
  MH_HORAS: number; // esforço real (bruto do grupo − pausas), em horas
  MH_HRI: number | null;
  MH_HRF: number | null;
}
