import { Router } from "express";
import { UequipsetController } from "../controllers/uequipset.controller";

const router = Router();
const controller = new UequipsetController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
