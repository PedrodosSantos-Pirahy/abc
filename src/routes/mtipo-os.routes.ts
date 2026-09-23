import { Router } from "express";
import { MtipoOsController } from "../controllers/mtipo-os.controller";

const router = Router();
const controller = new MtipoOsController();

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
