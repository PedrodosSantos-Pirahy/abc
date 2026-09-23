-- ============================================================================
-- Migração 001 — módulo genérico de Arquivos + fim dos bytea espalhados
-- ============================================================================
-- ! NÃO RODAR ISSO CONTRA O BANCO DE PRODUÇÃO SEM BACKUP E SEM CONFIRMAÇÃO
-- ! EXPLÍCITA. Este arquivo é dividido em 3 passos que devem ser executados
-- ! NESSA ORDEM, com o passo 3 rodado manualmente só depois de conferir que
-- ! o backfill (scripts/backfill-arquivos.ts) migrou 100% dos dados.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- PASSO 1 (aditivo e seguro — pode rodar a qualquer momento)
-- Cria a tabela genérica de Arquivos e as colunas novas (*_arquivo_id).
-- Nada aqui apaga ou modifica dado existente.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS manut.arquivos (
  id             SERIAL PRIMARY KEY,
  nome_original  VARCHAR(255),
  mimetype       VARCHAR(127) NOT NULL,
  tamanho_bytes  INTEGER NOT NULL,
  conteudo       BYTEA NOT NULL,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MMOV_REGISTROS: substitui FOTO_CHEGADA, FOTO_FINALIZACAO, FOTO_CADEADO, PDF_APR
ALTER TABLE manut."MMOV_REGISTROS"
  ADD COLUMN IF NOT EXISTS foto_chegada_arquivo_id     INTEGER REFERENCES manut.arquivos(id),
  ADD COLUMN IF NOT EXISTS foto_finalizacao_arquivo_id INTEGER REFERENCES manut.arquivos(id),
  ADD COLUMN IF NOT EXISTS foto_cadeado_arquivo_id     INTEGER REFERENCES manut.arquivos(id),
  ADD COLUMN IF NOT EXISTS pdf_apr_arquivo_id          INTEGER REFERENCES manut.arquivos(id);

-- MMOV_QUALIDADE: substitui PDF_QUALIDADE, RESP_ASSINATURA, MANUT_ASSINATURA
ALTER TABLE manut."MMOV_QUALIDADE"
  ADD COLUMN IF NOT EXISTS pdf_qualidade_arquivo_id    INTEGER REFERENCES manut.arquivos(id),
  ADD COLUMN IF NOT EXISTS resp_assinatura_arquivo_id  INTEGER REFERENCES manut.arquivos(id),
  ADD COLUMN IF NOT EXISTS manut_assinatura_arquivo_id INTEGER REFERENCES manut.arquivos(id);

-- ? MMOVAPR também tem esse padrão (M_RESP_1_ASSINATURA / M_RESP_2_ASSINATURA),
-- ? mas isso não foi pedido nesta rodada — fica de fora de propósito.


-- ----------------------------------------------------------------------------
-- PASSO 2 (fora deste arquivo)
-- Rodar `npm run backfill:arquivos` (scripts/backfill-arquivos.ts): lê cada
-- bytea não-nulo de MMOV_REGISTROS/MMOV_QUALIDADE, insere em manut.arquivos,
-- e grava o id retornado na coluna *_arquivo_id correspondente.
-- O script IMPRIME um relatório de quantas linhas migrou por coluna — conferir
-- que bate com a contagem de bytea não-nulos ANTES de seguir pro passo 3.
-- ----------------------------------------------------------------------------


-- ----------------------------------------------------------------------------
-- PASSO 3 (DESTRUTIVO — só rodar manualmente, depois de validar o backfill)
-- Remove as colunas bytea antigas e renomeia a tabela.
-- ----------------------------------------------------------------------------
-- ALTER TABLE manut."MMOV_REGISTROS"
--   DROP COLUMN "FOTO_CHEGADA",
--   DROP COLUMN "FOTO_FINALIZACAO",
--   DROP COLUMN "FOTO_CADEADO",
--   DROP COLUMN "PDF_APR";
--
-- ALTER TABLE manut."MMOV_QUALIDADE"
--   DROP COLUMN "PDF_QUALIDADE",
--   DROP COLUMN "RESP_ASSINATURA",
--   DROP COLUMN "MANUT_ASSINATURA";
--
-- ALTER TABLE manut."MMOV_REGISTROS" RENAME TO "MMOVREGISTROS";
