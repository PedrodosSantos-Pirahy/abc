// * Repetido em vários controllers/services como `Number(body.grupo || 1)` —
// * mesma regra do Flask (`dados.get('grupo', 1) or 1`): valor ausente OU
// * "falsy" (0, '', null, undefined) cai no padrão. Extraído pra um lugar só.
export function numeroOuPadrao(valor: unknown, padrao: number): number {
  const numero = Number(valor);
  return numero || padrao;
}
