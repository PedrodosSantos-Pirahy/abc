import { Router } from "express";
import { UequipgruController } from "../controllers/uequipgru.controller";

const router = Router();
const controller = new UequipgruController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:codigo/:local/:empresa", controller.getById);
router.post("/", controller.create);
router.put("/:codigo/:local/:empresa", controller.update);
router.delete("/:codigo/:local/:empresa", controller.remove);

export default router;
