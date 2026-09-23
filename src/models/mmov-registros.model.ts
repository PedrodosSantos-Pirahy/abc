// * Tabela própria da aplicação — uma linha por OS + tentativa + grupo, com
// * todos os tempos/textos/arquivos daquele grupo de mecânicos.
// !
// ! A migração que trocaria os bytea abaixo por colunas *_arquivo_id (ver
// ! src/database/migrations/001_arquivos_e_bytea.sql) NUNCA rodou de verdade
// ! no banco — confirmado em 2026-09-21 pelo Pedro colando o `CREATE TABLE`
// ! real. Decisão (2026-09-21): não rodar a migração agora, trabalhar direto
// ! com os bytea que já existem ("Opção B" — refazer para *_arquivo_id fica
// ! pra depois). Este model reflete o schema REAL confirmado, não o
// ! pós-migração. `HR_INICIO_DESLOCAMENTO` também não existe de verdade —
// ! removida (só `auditoria.repository.ts`, código pré-existente não tocado
// ! nesta rodada, ainda referencia essa coluna — provavelmente já quebrada
// ! antes desta sessão).
export interface MmovRegistros {
  REG_ID: number; // PK serial
  N_NUMERO: number; // FK -> manut."MMOVMAN".M_NUMERO (o "osId" usado em todo o app — NÃO é MMOVEXEC.M_NR_ORD)
  tentativa: number;
  grupo: number;
  sessao: number; // * DEFAULT 1 — não fazia parte do model até agora, não usado por nenhum código atual.
  // * Coluna legada — hoje só é gravada como NULL pelo fluxo atual (grupo, não
  // * mecânico individual). `reabrirSessao`/`historicoMaquina` a usam pra
  // * distinguir a linha "resumo do grupo" (MATRICULA IS NULL) de linhas
  // * antigas por mecânico. Não confundir com MMOV_KANBAN_EQUIPE.MATRICULA.
  MATRICULA: string | null;

  HR_ACEITE: Date | null;
  HR_CHEGADA_LOCAL: Date | null;
  HR_FINALIZACAO_OS: Date | null; // gravado quando o mecânico termina (antes da revisão do PCM)
  HR_INICIO_MANUTENCAO: Date | null;
  HR_FIM_MANUTENCAO: Date | null;
  HR_APROVACAO_PCM: Date | null; // ! só isso define "CONCLUIDA" — nunca HR_FINALIZACAO_OS
  CREATED_AT: Date | null;

  CAUSA_PROBLEMA: string | null;
  SOLUCAO_APLICADA: string | null;
  UTI_MATERIAL: string | null;
  SOL_MATERIAL: string | null;
  concluido: boolean;
  motivo_reprovacao: string | null;

  // * bytea reais — NUNCA voltam em SELECT/RETURNING genérico (ver
  // * `colunasSelect` no repository), só via `buscarArquivo`/`salvarArquivo`,
  // * um registro por vez, pra não inundar o JSON de list/board com binário.
  FOTO_CHEGADA: Buffer | null;
  FOTO_FINALIZACAO: Buffer | null;
  FOTO_CADEADO: Buffer | null;
  PDF_APR: Buffer | null;
  PDF_QUALIDADE: Buffer | null;
  PDF_OS: Buffer | null; // * Não usado por nenhum código atual — registrado por completude do schema.
}
