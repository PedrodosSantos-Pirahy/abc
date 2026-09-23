import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { ValidationError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";

// * Não estende BaseController: login não é um verbo CRUD, é uma ação
// * própria — não faz sentido forçar isso no formato genérico list/create/etc.
export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  // * O frontend envia {username, password} (nomes do <form> de login) — o
  // * Flask de referência lê os mesmos nomes e por dentro trata como
  // * matrícula/senha. Mantemos o mesmo contrato pra não precisar tocar no
  // * login.component.ts.
  login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      throw new ValidationError("Matrícula e senha são obrigatórios.");
    }
    const usuario = await this.authService.login(username, password);
    res.json({ mensagem: "Login efetuado com sucesso!", usuario });
  });
}
