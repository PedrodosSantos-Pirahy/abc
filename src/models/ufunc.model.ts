// * Tabela ERP `public."UFUNC"` — funcionários (fonte da verdade de nomes/matrículas
// * vindos do ERP). NÃO confundir com `manut."user"` (usuario.model.ts), que é
// * a tabela própria desta aplicação com quem tem LOGIN no sistema.
export interface Ufunc {
  UFUN_CODIGO: number; // matrícula (integer)
  UFUN_DESCRICAO: string; // nome do funcionário
  UFUN_ATIVO: boolean; // ! sempre filtrar "= true" nas consultas
  UFUN_EMPRESA: number; // usado na FK composta de MMOVEXEC_HORAS
}
