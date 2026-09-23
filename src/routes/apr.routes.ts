import { Router } from "express";
import { AprController } from "../controllers/apr.controller";

const router = Router();
const controller = new AprController();

router.post("/", controller.salvar);
router.get("/:osId", controller.buscarPorOs);

export default router;
