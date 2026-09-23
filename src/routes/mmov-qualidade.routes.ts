import { Router } from "express";
import { MmovQualidadeController } from "../controllers/mmov-qualidade.controller";

const router = Router();
const controller = new MmovQualidadeController();

router.get("/", controller.list);
router.get("/:nNumero/:grupo/:tentativa/arquivo/:tipo", controller.buscarArquivo);
router.put("/:nNumero/:grupo/:tentativa/arquivo/:tipo", controller.salvarArquivo);
router.get("/:nNumero/:grupo/:tentativa", controller.getById);
router.post("/", controller.create);
router.put("/:nNumero/:grupo/:tentativa", controller.update);
router.delete("/:nNumero/:grupo/:tentativa", controller.remove);

export default router;
