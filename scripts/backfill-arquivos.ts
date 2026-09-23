// ============================================================================
// Backfill: bytea -> manut.arquivos
// ============================================================================
// ! Só rodar isso DEPOIS de aplicar o PASSO 1 da migração 001 (ver
// ! src/database/migrations/001_arquivos_e_bytea.sql) e com backup do banco
// ! feito. Este script só ACRESCENTA dado (lê os bytea antigos, cria os
// ! arquivos novos, preenche as colunas *_arquivo_id) — nunca apaga nada.
// ! O PASSO 3 da migração (dropar as colunas bytea antigas) é manual e só
// ! deve rodar depois de conferir o relatório impresso aqui.
// ============================================================================
import { pgPool } from "../src/config/postgres";

interface ColunaParaMigrar {
  tabela: string; // já com schema e aspas, ex.: manut."MMOV_REGISTROS"
  colunaBytea: string;
  colunaArquivoId: string;
  colunasChave: string[]; // usadas pra montar o WHERE do UPDATE de volta
  mimetypePadrao: string; // ? dado legado não guarda mimetype — assumido pelo tipo de conteúdo
  prefixoNome: string;
}

const COLUNAS: ColunaParaMigrar[] = [
  {
    tabela: 'manut."MMOV_REGISTROS"',
    colunaBytea: "FOTO_CHEGADA",
    colunaArquivoId: "foto_chegada_arquivo_id",
    colunasChave: ["REG_ID"],
    mimetypePadrao: "image/jpeg",
    prefixoNome: "foto_chegada",
  },
  {
    tabela: 'manut."MMOV_REGISTROS"',
    colunaBytea: "FOTO_FINALIZACAO",
    colunaArquivoId: "foto_finalizacao_arquivo_id",
    colunasChave: ["REG_ID"],
    mimetypePadrao: "image/jpeg",
    prefixoNome: "foto_finalizacao",
  },
  {
    tabela: 'manut."MMOV_REGISTROS"',
    colunaBytea: "FOTO_CADEADO",
    colunaArquivoId: "foto_cadeado_arquivo_id",
    colunasChave: ["REG_ID"],
    mimetypePadrao: "image/jpeg",
    prefixoNome: "foto_cadeado",
  },
  {
    tabela: 'manut."MMOV_REGISTROS"',
    colunaBytea: "PDF_APR",
    colunaArquivoId: "pdf_apr_arquivo_id",
    colunasChave: ["REG_ID"],
    mimetypePadrao: "application/pdf",
    prefixoNome: "apr",
  },
  {
    tabela: 'manut."MMOV_QUALIDADE"',
    colunaBytea: "PDF_QUALIDADE",
    colunaArquivoId: "pdf_qualidade_arquivo_id",
    colunasChave: ["N_NUMERO", "grupo", "tentativa"],
    mimetypePadrao: "application/pdf",
    prefixoNome: "rappm",
  },
  {
    tabela: 'manut."MMOV_QUALIDADE"',
    colunaBytea: "RESP_ASSINATURA",
    colunaArquivoId: "resp_assinatura_arquivo_id",
    colunasChave: ["N_NUMERO", "grupo", "tentativa"],
    mimetypePadrao: "image/png",
    prefixoNome: "assinatura_resp",
  },
  {
    tabela: 'manut."MMOV_QUALIDADE"',
    colunaBytea: "MANUT_ASSINATURA",
    colunaArquivoId: "manut_assinatura_arquivo_id",
    colunasChave: ["N_NUMERO", "grupo", "tentativa"],
    mimetypePadrao: "image/png",
    prefixoNome: "assinatura_manut",
  },
];

async function migrarColuna(config: ColunaParaMigrar): Promise<number> {
  const colunasChaveSql = config.colunasChave.map((coluna) => `"${coluna}"`).join(", ");
  const selectSql = `
    SELECT ${colunasChaveSql}, "N_NUMERO", "${config.colunaBytea}" AS conteudo
    FROM ${config.tabela}
    WHERE "${config.colunaBytea}" IS NOT NULL AND "${config.colunaArquivoId}" IS NULL
  `;
  const { rows } = await pgPool.query(selectSql);

  for (const linha of rows) {
    const nomeOriginal = `${config.prefixoNome}_os_${linha.N_NUMERO}`;
    const { rows: arquivoRows } = await pgPool.query(
      `INSERT INTO manut.arquivos (nome_original, mimetype, tamanho_bytes, conteudo)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nomeOriginal, config.mimetypePadrao, linha.conteudo.length, linha.conteudo],
    );
    const arquivoId = arquivoRows[0].id;

    const condicaoChave = config.colunasChave
      .map((coluna, indice) => `"${coluna}" = $${indice + 2}`)
      .join(" AND ");
    const valoresChave = config.colunasChave.map((coluna) => linha[coluna]);

    await pgPool.query(
      `UPDATE ${config.tabela} SET "${config.colunaArquivoId}" = $1 WHERE ${condicaoChave}`,
      [arquivoId, ...valoresChave],
    );
  }

  return rows.length;
}

async function main(): Promise<void> {
  console.log("🚀 Iniciando backfill de bytea -> manut.arquivos...\n");

  for (const config of COLUNAS) {
    const migradas = await migrarColuna(config);
    console.log(`✅ ${config.tabela}."${config.colunaBytea}" -> ${migradas} linha(s) migrada(s).`);
  }

  console.log(
    "\n🎉 Backfill concluído. Confira as contagens acima contra o total de bytea não-nulos " +
      "ANTES de rodar o PASSO 3 da migração (dropar as colunas antigas e renomear a tabela).",
  );
  await pgPool.end();
}

main().catch((erro) => {
  console.error("❌ Erro no backfill:", erro);
  process.exit(1);
});
