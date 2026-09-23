// * Tabela própria da aplicação — observação do analista de PCM sobre a OS
// * (independe de grupo/tentativa, é um campo só por OS).
export interface MmovKanban {
  N_NUMERO: number; // PK — FK -> manut."MMOVMAN".M_NUMERO (o "osId" usado em todo o app)
  OBSERVACAO: string | null;
  grupos_config: string | null; // jsonb (como texto) — [{grupo, descricao, observacao}], descrição custom por grupo
}
