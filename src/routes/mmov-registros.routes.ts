import { Router } from "express";
import { MmovRegistrosController } from "../controllers/mmov-registros.controller";

const router = Router();
const controller = new MmovRegistrosController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:id/arquivo/:tipo", controller.buscarArquivo);
router.put("/:id/arquivo/:tipo", controller.salvarArquivo);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
