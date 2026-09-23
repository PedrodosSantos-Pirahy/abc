// * Espelha `ajustar_fuso_rs`/`ajustar_fuso` do main.py de referência: o
// * celular manda a hora como string ISO (ex.: "2026-05-14T10:00:00.000Z"),
// * mas o valor já É a hora local do dispositivo — não UTC de verdade. O
// * Flask ignorava o timezone (parse "naive") e subtraía 3h fixas (fuso de
// * Brasília).
// *
// * ! Devolve STRING ("YYYY-MM-DD HH:MI:SS"), não `Date`: um `Date` do JS
// * ! passado como parâmetro pro `pg` é serializado usando os getters LOCAIS
// * ! (getHours, getDate...) do processo Node — se o servidor não estiver em
// * ! UTC, isso desalinha os dígitos gravados. Construir a data via
// * ! `Date.UTC` só pra calcular o "vira-o-dia" da subtração de 3h e depois
// * ! extrair os dígitos via getters UTC (nunca os locais) mantém o resultado
// * ! igual, não importa o timezone do processo — a coluna é
// * ! `timestamp without time zone`, então uma string literal é interpretada
// * ! pelo Postgres exatamente como está escrita.
const TRES_HORAS_MS = 3 * 60 * 60 * 1000;
const REGEX_ISO_LITERAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;

function pad(n: number, tamanho = 2): string {
  return String(n).padStart(tamanho, "0");
}

/** Formata um `Date` como literal "YYYY-MM-DD HH:MI:SS" usando os getters UTC do objeto. */
export function paraTimestampLiteralUtc(data: Date): string {
  return (
    `${data.getUTCFullYear()}-${pad(data.getUTCMonth() + 1)}-${pad(data.getUTCDate())} ` +
    `${pad(data.getUTCHours())}:${pad(data.getUTCMinutes())}:${pad(data.getUTCSeconds())}`
  );
}

/**
 * * Literal "agora" no fuso do próprio processo — equivalente ao
 * * `datetime.now()` (naive, hora local do servidor) do Flask. Usa getters
 * * LOCAIS de propósito (aqui SIM é o que queremos: a hora de parede atual
 * * da máquina que está rodando o backend).
 */
export function agoraComoLiteral(): string {
  const agora = new Date();
  return (
    `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())} ` +
    `${pad(agora.getHours())}:${pad(agora.getMinutes())}:${pad(agora.getSeconds())}`
  );
}

/**
 * * Formata um `Date` que veio de uma coluna `timestamp without time zone`
 * * (leitura do `pg`) — usa getters LOCAIS de propósito: o `pg` monta esse
 * * `Date` com `new Date(ano, mes, dia, hora, ...)` (construtor local) a
 * * partir dos dígitos literais do Postgres, então os getters locais são os
 * * únicos que recuperam esses mesmos dígitos — os getters UTC viriam
 * * deslocados pelo fuso do processo.
 */
/**
 * * Equivalente a `datetime.isoformat()` do Python sobre um valor NAIVE: sem
 * * sufixo "Z", sem conversão de fuso. O Flask de referência manda essas
 * * strings assim de propósito — o Angular faz `new Date("...sem Z")` e o
 * * spec do JS trata isso como hora LOCAL do navegador, então os dígitos
 * * literais aparecem na tela sem nenhuma conversão. Usar `.toISOString()`
 * * aqui quebraria isso (adiciona "Z" e desloca os dígitos pelo fuso do
 * * processo Node).
 */
export function isoLocalSemZ(data: Date): string {
  return (
    `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T` +
    `${pad(data.getHours())}:${pad(data.getMinutes())}:${pad(data.getSeconds())}`
  );
}

export function horaMinutoLocal(data: Date): string {
  return `${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

export function dataLocalYmd(data: Date): string {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`;
}

export function dataLocalDmy(data: Date): string {
  return `${pad(data.getDate())}/${pad(data.getMonth() + 1)}/${data.getFullYear()}`;
}

export function ajustarFusoRs(isoStr?: string | null): string | null {
  if (!isoStr) return null;
  const semZ = isoStr.replace("Z", "").split(".")[0];
  const m = REGEX_ISO_LITERAL.exec(semZ);
  if (!m) return null;
  const [, ano, mes, dia, hora, min, seg] = m.map(Number);
  const utcMs = Date.UTC(ano, mes - 1, dia, hora, min, seg);
  return paraTimestampLiteralUtc(new Date(utcMs - TRES_HORAS_MS));
}

// * Espelha `base64_para_blob`/`get_blob`: aceita tanto a string base64 pura
// * quanto um data URI ("data:image/jpeg;base64,...") — nesse caso descarta
// * o prefixo antes de decodificar.
export function base64ParaBuffer(base64?: string | null): Buffer | null {
  if (!base64) return null;
  try {
    const dados = base64.includes(",") ? base64.split(",")[1] : base64;
    return Buffer.from(dados, "base64");
  } catch {
    return null;
  }
}
