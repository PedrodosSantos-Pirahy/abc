// * Tabela própria da aplicação `manut."user"` — quem tem LOGIN no sistema
// * de manutenção (mecânicos, analistas de PCM). Diferente da UFUNC (ERP),
// * que é a lista de TODOS os funcionários (inclusive quem não loga aqui).
export interface Usuario {
  id: number;
  matricula: string;
  senha_hash: string; // hash bcrypt — nunca devolver este campo em resposta HTTP
  ativo: boolean;
  nome: string;
  cargo: string;
  setor: string;
}

// * Formato devolvido pelo login — nunca inclui `senha_hash`.
export type UsuarioPublico = Omit<Usuario, "senha_hash">;
