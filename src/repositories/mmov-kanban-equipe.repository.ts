import { BaseRepository } from "./base.repository";
import type { MmovKanbanEquipe } from "../models/mmov-kanban-equipe.model";
import type { OpcoesPaginacao, ResultadoPaginado } from "../types/pagination.types";

// * N_NUMERO/MATRICULA formam a chave (não são geradas pelo banco), por isso
// * entram na lista branca também.
const COLUNAS_MMOV_KANBAN_EQUIPE = [
  "N_NUMERO",
  "MATRICULA",
  "SERIE",
  "RESPONSAVEL",
  "grupo",
  "tentativa",
  "ORDEM",
  "OBS_PRIV",
] as const;

export interface MmovKanbanEquipeFiltros {
  numeros?: number[];
  matricula?: string;
}

// ? Sem coluna de ativo/inativo — remove() cai no DELETE físico (aliás já é
// ? o que `removerMecanico` em kanban.repository.ts faz hoje: tirar alguém
// ? da equipe é uma remoção de verdade, não uma "desativação").
export class MmovKanbanEquipeRepository extends BaseRepository<MmovKanbanEquipe> {
  protected table = 'manut."MMOV_KANBAN_EQUIPE"';
  protected primaryKey = ["N_NUMERO", "MATRICULA"] as const;
  protected columns = COLUNAS_MMOV_KANBAN_EQUIPE;

  async buscar(
    filtros: MmovKanbanEquipeFiltros,
    opcoes: Partial<OpcoesPaginacao> = {},
  ): Promise<ResultadoPaginado<MmovKanbanEquipe>> {
    const valores: unknown[] = [];
    const clausulas: string[] = [];

    if (filtros.numeros && filtros.numeros.length > 0) {
      valores.push(filtros.numeros);
      clausulas.push(`"N_NUMERO" = ANY($${valores.length}::int[])`);
    }
    if (filtros.matricula) {
      valores.push(filtros.matricula);
      clausulas.push(`"MATRICULA"::varchar = $${valores.length}`);
    }

    return this.paginar(clausulas.join(" AND "), valores, { ...opcoes, pageSize: opcoes.pageSize ?? 5000 });
  }

  // * Única consulta deste repository que cruza outra tabela (MMOV_REGISTROS)
  // * — exceção justificada, mesmo espírito de
  // * mmov-pausas.repository.ts#buscarAberta: calcular "esta SS ainda não
  // * está 100% aprovada" no cliente exigiria arrastar a MMOV_KANBAN_EQUIPE
  // * inteira (meses/anos de histórico, nunca limpo) pro navegador só pra
  // * descobrir isso — foi exatamente o que quebrou o board do Kanban duas
  // * vezes (URL longa demais, depois resposta grande demais pro
  // * JSON.stringify aguentar). Devolve só os N_NUMERO (lista pequena de
  // * inteiros) de SS com equipe atribuída onde AO MENOS UM grupo ainda não
  // * tem a tentativa mais recente aprovada pelo PCM — "ainda ativa", no
  // * mesmo sentido usado por calcularStatus() no frontend (CONCLUIDA exige
  // * TODO grupo aprovado).
  async numerosAtivos(): Promise<number[]> {
    const { rows } = await this.pool.query(`
      SELECT DISTINCT ke."N_NUMERO"
      FROM manut."MMOV_KANBAN_EQUIPE" ke
      WHERE NOT EXISTS (
        SELECT 1 FROM manut."MMOV_REGISTROS" r
        WHERE r."N_NUMERO" = ke."N_NUMERO" AND r.grupo = ke.grupo
          AND r.tentativa = (
            SELECT COALESCE(MAX(r2.tentativa), 0) FROM manut."MMOV_REGISTROS" r2
            WHERE r2."N_NUMERO" = ke."N_NUMERO" AND r2.grupo = ke.grupo
          )
          AND r."HR_APROVACAO_PCM" IS NOT NULL
      )
    `);
    return rows.map((r) => r.N_NUMERO);
  }

  // * Paginação de verdade pro histórico do manutentor: uma matrícula com
  // * anos de casa acumula milhares de linhas aqui (uma por grupo/tentativa
  // * de cada SS em que já trabalhou) — sem isso, o frontend tinha que puxar
  // * a carreira inteira da pessoa (pageSize=5000) só pra mostrar as últimas
  // * 50. Fica dentro desta mesma tabela (DISTINCT + ORDER BY + LIMIT/OFFSET
  // * só em MMOV_KANBAN_EQUIPE) — não é join com outra tabela, então não é
  // * a mesma exceção de numerosAtivos(). N_NUMERO desc como proxy de "mais
  // * recente" — mesmo critério já usado em toda ordenação de histórico
  // * (kanban-actions.service.ts, historico-maquina etc.).
  async numerosPorMatricula(
    matricula: string,
    page: number,
    pageSize: number,
  ): Promise<{ numeros: number[]; total: number }> {
    const offset = (Math.max(page, 1) - 1) * pageSize;
    const { rows: totalRows } = await this.pool.query(
      `SELECT COUNT(DISTINCT "N_NUMERO") as total FROM manut."MMOV_KANBAN_EQUIPE" WHERE "MATRICULA"::varchar = $1`,
      [matricula],
    );
    const { rows } = await this.pool.query(
      `
        SELECT DISTINCT "N_NUMERO" FROM manut."MMOV_KANBAN_EQUIPE"
        WHERE "MATRICULA"::varchar = $1
        ORDER BY "N_NUMERO" DESC
        LIMIT $2 OFFSET $3
      `,
      [matricula, pageSize, offset],
    );
    return { numeros: rows.map((r) => r.N_NUMERO), total: Number(totalRows[0].total) };
  }
}
