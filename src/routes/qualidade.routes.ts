import { Router } from "express";
import { QualidadeController } from "../controllers/qualidade.controller";

const router = Router();
const controller = new QualidadeController();

router.post("/pre", controller.salvarPre);
router.post("/pos", controller.salvarPos);

export default router;
