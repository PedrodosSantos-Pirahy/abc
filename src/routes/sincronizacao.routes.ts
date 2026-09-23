import { Router } from "express";
import { SincronizacaoController } from "../controllers/sincronizacao.controller";

const router = Router();
const controller = new SincronizacaoController();

router.post("/sincronizar-offline", controller.sincronizar);

export default router;
