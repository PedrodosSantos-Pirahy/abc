// * Filtro genérico aceito pelo `BaseRepository.findMany` — cada chave é o
// * NOME DA COLUNA (já validado contra a lista branca de `columns` da entidade)
// * e o valor é comparado por igualdade (`=`). Para os casos especiais que uma
// * entidade precisa (intervalo de datas, OR entre colunas, etc.), o repository
// * daquela entidade sobrescreve `montarFiltrosExtras` — ver base.repository.ts.
export type FiltroIgualdade<T> = {
  [K in keyof T]?: T[K] extends object ? never : T[K];
};

export interface IntervaloData {
  de?: Date | string;
  ate?: Date | string;
}
