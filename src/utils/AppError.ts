// * Erros de negócio conhecidos — o errorHandler.middleware.ts sabe
// * transformar cada um destes num status HTTP correto. Qualquer erro que
// * NÃO seja uma instância de AppError é tratado como falha inesperada (500).
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Registro não encontrado.") {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dados inválidos.") {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito com o estado atual do registro.") {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado.") {
    super(message, 401);
  }
}

// * 422 — mesmo status que o Flask usa em `/api/erp/funcionario/:matricula`
// * quando o registro existe mas não passa os critérios de cadastro
// * (inativo no ERP, empresa fora de 1/2). Diferente de ValidationError
// * (400, corpo da requisição mal formado) — aqui o INPUT está correto, o
// * dado que ele referencia é que não serve.
export class UnprocessableEntityError extends AppError {
  constructor(message = "Não foi possível processar a solicitação.") {
    super(message, 422);
  }
}
