import { Router } from "express";
import { MmovKanbanController } from "../controllers/mmov-kanban.controller";

const router = Router();
const controller = new MmovKanbanController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
