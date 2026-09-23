// * Tabela própria da aplicação — formulário de Análise de Risco (APR) de um
// * grupo numa tentativa da OS. Chave real: (N_NUMERO, grupo, tentativa).
// ?
// ? M_RESP_1_ASSINATURA / M_RESP_2_ASSINATURA continuam `bytea` — o mesmo
// ? padrão de migração pra `manut.arquivos` poderia ser aplicado aqui depois,
// ? mas isso não foi pedido nesta rodada (só MMOV_REGISTROS e MMOV_QUALIDADE).
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
  M_RESP_1_ASSINATURA: Buffer | null; // ? candidato a virar arquivo_id numa fase futura
  M_RESP_2_NOME: string | null;
  M_RESP_2_ASSINATURA: Buffer | null; // ? candidato a virar arquivo_id numa fase futura
}
