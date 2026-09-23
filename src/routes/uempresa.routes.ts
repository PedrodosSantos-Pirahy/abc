import { Router } from "express";
import { UempresaController } from "../controllers/uempresa.controller";

const router = Router();
const controller = new UempresaController();

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
