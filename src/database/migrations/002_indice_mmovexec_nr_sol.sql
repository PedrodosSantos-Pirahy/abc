-- ============================================================================
-- Migração 002 — índice em MMOVEXEC(M_NR_SOL, M_SR_SOL)
-- ============================================================================
-- ! Aditiva e segura — `CONCURRENTLY` evita lock de escrita na tabela.
-- ! Não pode rodar dentro de uma transação (por isso este arquivo não é
-- ! aplicado via `withTransaction`/client de app — rodar direto no psql ou
-- ! via script isolado).
--
-- Motivo: `M_NR_SOL` é a FK que liga MMOVEXEC de volta pra MMOVMAN
-- (M_NUMERO). É usada em praticamente toda consulta do Kanban/manutenções
-- (`WHERE "M_NR_SOL" = m."M_NUMERO" ORDER BY "M_NR_ORD" DESC LIMIT 1`, em
-- LATERAL joins). Sem índice, isso força uma varredura sequencial de toda a
-- MMOVEXEC (91k+ linhas em produção) para cada linha candidata de MMOVMAN —
-- é a causa raiz de `GET /api/kanban/ordens` levar minutos em vez de
-- milissegundos (medido em produção antes desta migração).
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mmovexec_nr_sol
  ON manut."MMOVEXEC" ("M_NR_SOL", "M_SR_SOL");
