import { Router } from "express";
import { MmovexecHorasController } from "../controllers/mmovexec-horas.controller";

const router = Router();
const controller = new MmovexecHorasController();

router.get("/", controller.list);
router.get("/:nrOrd/:local/:empresa/:data/:respons/:seq", controller.getById);
router.post("/", controller.create);
router.put("/:nrOrd/:local/:empresa/:data/:respons/:seq", controller.update);
router.delete("/:nrOrd/:local/:empresa/:data/:respons/:seq", controller.remove);

export default router;
