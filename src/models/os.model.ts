import type { Mmovexec } from "./mmovexec.model";

// * "Os" é o nome que a aplicação usa no dia a dia para a entidade que, no
// * banco, é `manut."MMOVEXEC"`. Mantemos os DOIS nomes de propósito:
// * `mmovexec.model.ts` documenta o schema real (fiel ao ERP), `os.model.ts`
// * é o alias amigável usado pelas camadas de repository/service/controller.
export type Os = Mmovexec;

// * Chave primária real de uma OS — usada pelo os.repository.ts (ver 1.5 do plano).
export const OS_PRIMARY_KEY = "M_NR_ORD" as const;
