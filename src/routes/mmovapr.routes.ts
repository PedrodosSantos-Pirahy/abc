import { Router } from "express";
import { MmovaprController } from "../controllers/mmovapr.controller";

const router = Router();
const controller = new MmovaprController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
