import { Router } from "express";
import { UfuncController } from "../controllers/ufunc.controller";

const router = Router();
const controller = new UfuncController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
