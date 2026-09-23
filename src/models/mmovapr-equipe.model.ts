// * Tabela própria da aplicação — equipe declarada dentro do formulário de APR.
export interface MmovaprEquipe {
  APR_ID: number; // FK -> manut."MMOVAPR".APR_ID
  MATRICULA: string;
  NOME: string;
}
