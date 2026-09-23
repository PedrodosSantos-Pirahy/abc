// * Tabela própria da aplicação — checklists de pré e pós-manutenção (qualidade)
// * de um grupo numa tentativa da OS. Chave real: (N_NUMERO, grupo, tentativa).
// !
// ! Mesma decisão de mmov-registros.model.ts (2026-09-21): a migração que
// ! trocaria os bytea abaixo por *_arquivo_id nunca rodou de verdade no
// ! banco — trabalhando direto com os bytea reais por enquanto ("Opção B").
export interface MmovQualidade {
  N_NUMERO: number; // FK -> manut."MMOVMAN".M_NUMERO (o "osId" usado em todo o app — NÃO é MMOVEXEC.M_NR_ORD)
  grupo: number;
  tentativa: number;

  PRE_PROTECAO: string | null;
  PRE_FERRAMENTAS: string | null;
  PRE_EPIS: string | null;
  PRE_LUBRIFICANTES: string | null;

  POS_LIMPEZA: string | null;
  POS_MONTAGEM: string | null;
  POS_AVALIACAO: string | null;
  POS_RESIDUOS: string | null;

  RESP_MATRICULA: string | null;
  RESP_NOME: string | null;
  MANUT_MATRICULA: string | null;
  MANUT_NOME: string | null;

  // * bytea reais — nunca voltam em SELECT/RETURNING genérico (ver
  // * colunasSelect no repository), só via buscarArquivo/salvarArquivo.
  PDF_QUALIDADE: Buffer | null;
  RESP_ASSINATURA: Buffer | null;
  MANUT_ASSINATURA: Buffer | null;
}
