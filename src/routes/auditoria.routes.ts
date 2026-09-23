import { Router } from "express";
import { AuditoriaController } from "../controllers/auditoria.controller";

const router = Router();
const controller = new AuditoriaController();

router.post("/tempo", controller.registrarTempo);
router.post("/foto", controller.registrarFoto);
router.post("/causa", controller.registrarCausa);

export default router;
