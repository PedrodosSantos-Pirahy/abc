import { Router } from "express";
import { FuncionarioController } from "../controllers/funcionario.controller";

const router = Router();
const controller = new FuncionarioController();

// * Sem prefixo próprio — o Flask expõe /api/funcionario, /api/erp/funcionario
// * e /api/usuarios direto sob /api. Ver routes/index.ts.
router.get("/funcionario/usuarios-lote", controller.buscarUsuariosLote);
router.get("/funcionario/ufunc-lote", controller.buscarUfuncLote);
router.post("/funcionario/usuarios-lote", controller.buscarUsuariosLotePost);
router.post("/funcionario/ufunc-lote", controller.buscarUfuncLotePost);
router.get("/funcionario/:matricula", controller.buscarNome);
router.get("/erp/funcionario/:matricula", controller.buscarNoErp);
router.post("/usuarios", controller.cadastrarUsuario);

export default router;
