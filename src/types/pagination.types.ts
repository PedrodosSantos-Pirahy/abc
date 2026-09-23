// * Formato padrão de paginação aceito por QUALQUER endpoint de listagem
// * (BaseController já sabe extrair isso da querystring — ver pagination.ts...
// * na verdade essa extração fica dentro do próprio base.controller.ts).
export interface OpcoesPaginacao {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDir?: "ASC" | "DESC";
}

export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const PAGINACAO_PADRAO: Readonly<{ page: number; pageSize: number }> = {
  page: 1,
  pageSize: 20,
};

// * Máximo absoluto de itens por página — impede que um cliente mal
// * intencionado (ou um bug no front) peça `pageSize=999999` e quebre o servidor.
// !
// ! Era 200 — errado pra essa arquitetura. Desde que o backend virou "um
// ! recurso por tabela, sem JOIN" (ver CLAUDE.md), o Angular passou a buscar
// ! TODA a janela de data de uma vez com `pageSize=500/2000/5000` (pra montar
// ! o relacionamento no cliente) — 200 cortava isso silenciosamente pra
// ! QUALQUER tabela com mais de 200 linhas na janela (bem comum em MMOVMAN/
// ! MMOV_REGISTROS/MMOVEXEC), fazendo o Kanban (e Workload/Dashboard/
// ! Histórico) mostrarem só uma fração dos dados reais sem erro nenhum — o
// ! bug que o Pedro reportou ("bem menos OS que no antigo kanban"). A data
// ! filtrada continua sendo o limite de custo real (ver comentário de cada
// ! repository); isto aqui é só um teto de segurança bem mais folgado.
export const PAGE_SIZE_MAXIMO = 20000;
