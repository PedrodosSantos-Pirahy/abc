// * Tabela própria da aplicação — uma linha por pausa registrada durante a
// * execução de uma OS. Chave real: N_NUMERO + tentativa + grupo + HR_INICIO_PAUSA.
export interface MmovPausas {
  N_NUMERO: number; // FK -> manut."MMOVMAN".M_NUMERO (o "osId" usado em todo o app — NÃO é MMOVEXEC.M_NR_ORD)
  tentativa: number;
  grupo: number;
  HR_INICIO_PAUSA: Date;
  HR_FIM_PAUSA: Date | null; // null = pausa ainda ativa
  motivo: string | null;
}
