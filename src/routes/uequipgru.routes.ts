import { Router } from "express";
import { UequipgruController } from "../controllers/uequipgru.controller";

const router = Router();
const controller = new UequipgruController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
