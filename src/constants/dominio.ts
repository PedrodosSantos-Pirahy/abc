// * Fonte única de verdade para pequenos "domínios" de negócio que existiam
// * duplicados (às vezes com grafia levemente diferente) em mais de um lugar
// * do backend. Qualquer alteração de regra — novo cargo equivalente a
// * mecânico, nova empresa autorizada no ERP, novo nível de risco — muda só
// * aqui, nunca em SQL solto espalhado por repositories diferentes.

export const GRUPO_PADRAO = 1;
export const TENTATIVA_PADRAO = 1;

// * Empresas do ERP autorizadas a cadastrar usuário no sistema web (ver
// * funcionario.service.ts#buscarNoErp).
export const EMPRESAS_ERP_VALIDAS = [1, 2];

// * Mapa de risco (MMOVMAN.M_RISCO). Usado tanto para montar o fragmento SQL
// * (`sqlCaseRisco`, abaixo) quanto — se algum dia for preciso — para
// * calcular o rótulo direto em JS sem outra query.
export const RISCO_LABELS: Readonly<Record<number, string>> = {
  0: "Infraestrutura",
  1: "Reparo",
  2: "Equipamento Parado",
  3: "Segurança Funcionários",
  4: "Contaminação Meio Ambiente",
  5: "Reparo Temporário",
};

export function descreverRisco(codigo: number | null | undefined): string {
  const c = codigo ?? 0;
  return RISCO_LABELS[c] ?? String(c);
}

/**
 * * Monta o `CASE` de risco em SQL a partir do MESMO `RISCO_LABELS` acima —
 * * ainda é texto SQL (os valores já são literais internos, não input de
 * * usuário, então não há risco de injeção), mas agora só existe UM lugar
 * * pra editar o mapeamento, mesmo aparecendo em queries diferentes.
 */
export function sqlCaseRisco(coluna: string): string {
  const casos = Object.entries(RISCO_LABELS)
    .map(([codigo, rotulo]) => `WHEN ${codigo} THEN '${rotulo.replace(/'/g, "''")}'`)
    .join("\n            ");
  return `CASE COALESCE(${coluna}, 0)
            ${casos}
            ELSE COALESCE(${coluna}::varchar, '0')
        END`;
}

// * Mapa de prioridade (MMOVMAN.M_PRIORID): 0 = Baixa, 1 = Média, >=2 = Alta.
export function descreverPrioridade(codigo: number | null | undefined): string {
  const c = codigo ?? 1;
  if (c === 0) return "Baixa";
  if (c >= 2) return "Alta";
  return "Média";
}

export function ordemPrioridade(codigo: number | null | undefined): number {
  const c = codigo ?? 1;
  if (c === 0) return 0;
  if (c >= 2) return 2;
  return 1;
}

/** Monta o `CASE` de rótulo de prioridade em SQL a partir das mesmas regras acima. */
export function sqlCasePrioridadeLabel(coluna: string): string {
  return `CASE
            WHEN ${coluna} = 0 THEN 'Baixa'
            WHEN ${coluna} >= 2 THEN 'Alta'
            ELSE 'Média'
        END`;
}

/** Monta o `CASE` de ordenação numérica de prioridade (0/1/2) a partir das mesmas regras. */
export function sqlCasePrioridadeOrdem(coluna: string): string {
  return `CASE
            WHEN ${coluna} = 0 THEN 0
            WHEN ${coluna} >= 2 THEN 2
            ELSE 1
        END`;
}
