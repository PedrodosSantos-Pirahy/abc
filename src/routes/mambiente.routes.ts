import { Router } from "express";
import { MambienteController } from "../controllers/mambiente.controller";

const router = Router();
const controller = new MambienteController();

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
