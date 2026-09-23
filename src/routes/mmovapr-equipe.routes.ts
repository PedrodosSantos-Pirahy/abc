import { Router } from "express";
import { MmovaprEquipeController } from "../controllers/mmovapr-equipe.controller";

const router = Router();
const controller = new MmovaprEquipeController();

router.get("/", controller.list);
router.get("/:aprId/:matricula", controller.getById);
router.post("/", controller.create);
router.put("/:aprId/:matricula", controller.update);
router.delete("/:aprId/:matricula", controller.remove);

export default router;
