import { Router } from "express";
import { MatividadeController } from "../controllers/matividade.controller";

const router = Router();
const controller = new MatividadeController();

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
