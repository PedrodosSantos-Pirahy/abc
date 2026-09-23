require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT),
});

const sql = `
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
WITH os_candidatas AS (
    SELECT m."M_NUMERO", m."M_SERIE"
    FROM manut."MMOVMAN" m
    JOIN manut."MMOV_KANBAN_EQUIPE" ke ON ke."N_NUMERO" = m."M_NUMERO"
    UNION
    SELECT "M_NUMERO", "M_SERIE"
    FROM manut."MMOVMAN"
    WHERE "M_DATAHR" >= CURRENT_DATE - INTERVAL '1 month'
),
ultima_exec AS (
    SELECT DISTINCT ON (x."M_NR_SOL", x."M_SR_SOL")
        x."M_NR_SOL",
        x."M_SR_SOL",
        x."M_DT_EMISSAO",
        x."M_DT_PREV",
        x."M_DT_EFET",
        x."M_DISCRIM",
        x."M_RESPONS",
        x."M_RESPONS2",
        x."M_RESPONS3",
        x."M_RESPONS4"
    FROM manut."MMOVEXEC" x
    JOIN os_candidatas c ON c."M_NUMERO" = x."M_NR_SOL" AND c."M_SERIE"::varchar = x."M_SR_SOL"::varchar
    ORDER BY x."M_NR_SOL", x."M_SR_SOL", x."M_NR_ORD" DESC
),
app_planejamento AS (
    SELECT
        u.matricula,
        u.nome,
        COALESCE(u.setor, 'Outros') as setor,
        ke."N_NUMERO"::varchar as os_id,
        m."M_DESCRICAO" as descricao,
        COALESCE(e."EQPG_DESCRICAO", 'Equipamento') as maquina,
        ke.grupo,
        COALESCE(ke."RESPONSAVEL", false) as is_responsavel,
        COALESCE(m."M_PRIORID", 3) as prioridade_cod,
        COALESCE(ke."ORDEM", 999) as ordem,
        r_grp."HR_ACEITE",
        r_grp."HR_INICIO_MANUTENCAO",
        r_grp.concluido,
        x."M_DT_PREV" as dt_prev,
        false as erp_sem_registro,
        COALESCE(EXISTS(
            SELECT 1 FROM manut."MMOV_PAUSAS" p
            WHERE p."N_NUMERO" = ke."N_NUMERO"
              AND p.grupo = ke.grupo
              AND p.tentativa = COALESCE(r_grp.tentativa, 1)
              AND p."HR_FIM_PAUSA" IS NULL
        ), false) as em_pausa
    FROM manut."user" u
    JOIN manut."MMOV_KANBAN_EQUIPE" ke ON ke."MATRICULA"::varchar = u.matricula
        AND ke.tentativa = (
            SELECT COALESCE(MAX(t2.tentativa), 1)
            FROM manut."MMOV_KANBAN_EQUIPE" t2
            WHERE t2."N_NUMERO" = ke."N_NUMERO"
        )
    JOIN manut."MMOVMAN" m ON m."M_NUMERO" = ke."N_NUMERO"
    LEFT JOIN ultima_exec x ON x."M_NR_SOL" = m."M_NUMERO" AND x."M_SR_SOL"::varchar = m."M_SERIE"::varchar
    LEFT JOIN public."UEQUIPGRU" e ON e."EQPG_CODIGO" = m."M_EQUIP"
    LEFT JOIN LATERAL (
        SELECT tentativa, "HR_ACEITE", "HR_INICIO_MANUTENCAO", concluido, "HR_APROVACAO_PCM"
        FROM manut."MMOV_REGISTROS" r3
        WHERE r3."N_NUMERO" = ke."N_NUMERO" AND r3.grupo = ke.grupo
        ORDER BY r3.tentativa DESC LIMIT 1
    ) r_grp ON true
    WHERE
        upper(u.cargo) = ANY($1) AND u.ativo = true
        AND r_grp."HR_APROVACAO_PCM" IS NULL
        AND COALESCE(r_grp.concluido, false) = false
        AND COALESCE(x."M_DT_EMISSAO", m."M_DATAHR") >= CURRENT_DATE - INTERVAL '1 month'
        AND COALESCE(x."M_DT_EMISSAO", m."M_DATAHR") < CURRENT_DATE + INTERVAL '1 day'
),
erp_planejamento AS (
    SELECT
        COALESCE(u.matricula, resp.matricula::varchar) as matricula,
        COALESCE(u.nome, uf."UFUN_DESCRICAO", 'Não cadastrado') as nome,
        COALESCE(u.setor, 'ERP') as setor,
        x."M_NR_SOL"::varchar as os_id,
        COALESCE(x."M_DISCRIM", m."M_DESCRICAO", '') as descricao,
        COALESCE(e."EQPG_DESCRICAO", 'Equipamento') as maquina,
        1 as grupo,
        resp.ordem = 1 as is_responsavel,
        COALESCE(m."M_PRIORID", 3) as prioridade_cod,
        999 as ordem,
        NULL::timestamp as "HR_ACEITE",
        CASE WHEN x."M_RESPONS" IS NOT NULL THEN COALESCE(x."M_DT_PREV", x."M_DT_EMISSAO") ELSE NULL::timestamp END as "HR_INICIO_MANUTENCAO",
        false as concluido,
        x."M_DT_PREV" as dt_prev,
        true as erp_sem_registro,
        false as em_pausa
    FROM manut."MMOVMAN" m
    JOIN ultima_exec x ON x."M_NR_SOL" = m."M_NUMERO" AND x."M_SR_SOL"::varchar = m."M_SERIE"::varchar
    CROSS JOIN LATERAL (
        SELECT matricula, ordem
        FROM unnest(ARRAY[x."M_RESPONS", x."M_RESPONS2", x."M_RESPONS3", x."M_RESPONS4"]) WITH ORDINALITY AS r(matricula, ordem)
        WHERE matricula IS NOT NULL AND matricula > 0
    ) resp
    LEFT JOIN manut."user" u ON u.matricula = resp.matricula::varchar
    LEFT JOIN LATERAL (
        SELECT "UFUN_DESCRICAO"
        FROM public."UFUNC"
        WHERE "UFUN_CODIGO" = resp.matricula AND "UFUN_ATIVO" = true
        LIMIT 1
    ) uf ON true
    LEFT JOIN public."UEQUIPGRU" e
           ON m."M_EQUIP" = e."EQPG_CODIGO"
          AND m."M_LOCAL" = e."EQPG_LOCAL"
          AND m."M_EMPRESA" = e."EQPG_EMPRESA"
    WHERE
        m."M_DATAHR" >= CURRENT_DATE - INTERVAL '1 month'
        AND x."M_DT_EFET" IS NULL
        AND NOT EXISTS (SELECT 1 FROM manut."MMOV_REGISTROS" r WHERE r."N_NUMERO" = x."M_NR_SOL")
        AND NOT EXISTS (SELECT 1 FROM manut."MMOV_KANBAN_EQUIPE" ke WHERE ke."N_NUMERO" = x."M_NR_SOL")
),
planejamento AS (
    SELECT * FROM app_planejamento
    UNION ALL
    SELECT * FROM erp_planejamento
)
SELECT * FROM planejamento
ORDER BY
    matricula,
    CASE
        WHEN dt_prev IS NOT NULL AND dt_prev < NOW() THEN 0
        WHEN dt_prev IS NOT NULL THEN 1
        ELSE 2
    END,
    dt_prev ASC NULLS LAST,
    ordem ASC NULLS LAST,
    os_id DESC
`;

(async () => {
  try {
    const client = await pool.connect();
    await client.query("SET statement_timeout = '120s'");
    const start = Date.now();
    const r = await client.query(sql, [["MEC", "MECANICO"]]);
    console.log("Duração total (client):", Date.now() - start, "ms");
    console.log(r.rows.map((row) => row["QUERY PLAN"]).join("\n"));
    client.release();
  } catch (e) {
    console.error("ERRO:", e.message);
  } finally {
    await pool.end();
  }
})();
