import { Router } from "express";
import { MservicoAtivController } from "../controllers/mservico-ativ.controller";

const router = Router();
const controller = new MservicoAtivController();

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
