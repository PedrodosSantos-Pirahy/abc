// * Tabela própria da aplicação — formulário de Análise de Risco (APR) de um
// * grupo numa tentativa da OS. Chave real: (N_NUMERO, grupo, tentativa).
// ! M_RESP_1_ASSINATURA/M_RESP_2_ASSINATURA continuam bytea no banco, mas
// ! este model reflete o que mmovapr.repository.ts#colunasSelect realmente
// ! devolve (flags booleanas, não o buffer) — mesmo padrão já aplicado em
// ! MMOV_REGISTROS/MMOV_QUALIDADE. Pra pegar a assinatura de verdade (base64),
// ! usa apr.repository.ts#buscarPorOs (endpoint separado, sob demanda).
export interface Mmovapr {
  APR_ID: number; // PK serial
  N_NUMERO: number; // FK -> manut."MMOVMAN".M_NUMERO (o "osId" usado em todo o app — NÃO é MMOVEXEC.M_NR_ORD)
  grupo: number;
  tentativa: number;
  TAG_EQPG: string | null;

  M_CHECK_SERVICO: boolean;
  M_R_ANIMAIS: boolean;
  M_R_RUIDO: boolean;
  M_R_CHOQUE: boolean;
  M_R_EXTENSAO: string | null;
  M_R_ESMAGAMENTO: boolean;
  M_R_ESCORREGAMENTO: boolean;
  M_SINALIZACAO: boolean;
  M_FONTE_ENERGIA: string | null;

  M_EPI_OCULOS: boolean;
  M_EPI_LUVAS: boolean;
  M_EPI_CAPACETE: boolean;
  M_EPI_CINTO: boolean;
  M_EPI_OUTROS: boolean;
  M_EPI_OUTROS_DESC: string | null;

  M_ANC_ESCADA: boolean;
  M_ANC_GUARDA_CORPO: boolean;
  M_ANC_GC_SEGURO: boolean;

  M_CLI_VENTO: boolean;
  M_CLI_CHUVA: boolean;
  M_CLI_RAIOS: boolean;

  M_CONS_RADIO: boolean;
  M_CONS_OUTROS: boolean;
  M_CONS_OUTROS_DESC: string | null;

  M_RESP_1_NOME: string | null;
  tem_resp_1_assinatura: boolean;
  M_RESP_2_NOME: string | null;
  tem_resp_2_assinatura: boolean;
}
