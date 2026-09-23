import { Router } from "express";
import { UsuarioController } from "../controllers/usuario.controller";

const router = Router();
const controller = new UsuarioController();

// * Tabela manut."user" — nome de rota diferente de /usuarios de propósito:
// * esse caminho já é usado (funcionario.routes.ts) pro cadastro via lookup
// * no ERP, uma ação de negócio, não o CRUD genérico desta tabela.
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
