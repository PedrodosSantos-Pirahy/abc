import { Router } from "express";
import { OsController } from "../controllers/os.controller";

const router = Router();
const controller = new OsController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove); // ! não apaga a OS — devolve pra PENDENTE (ver os.repository.ts)

export default router;
