// * Tabela própria da aplicação — mecânicos atribuídos a uma OS (Kanban/PCM).
// ! Chave real é (N_NUMERO, MATRICULA) SEM grupo — a mesma matrícula não pode
// ! estar em dois grupos da mesma OS (validado hoje no frontend).
export interface MmovKanbanEquipe {
  N_NUMERO: number; // FK -> manut."MMOVMAN".M_NUMERO (o "osId" usado em todo o app — NÃO é MMOVEXEC.M_NR_ORD)
  SERIE: string;
  MATRICULA: string;
  RESPONSAVEL: boolean; // líder do grupo
  grupo: number;
  tentativa: number;
  ORDEM: number | null; // posição de exibição no Kanban
  OBS_PRIV: string | null; // observação privada do grupo
}
