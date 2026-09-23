import { Router } from "express";
import { MmovmanController } from "../controllers/mmovman.controller";

const router = Router();
const controller = new MmovmanController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/:numero/:serie", controller.getById);
router.post("/", controller.create);
router.put("/:numero/:serie", controller.update);
router.delete("/:numero/:serie", controller.remove); // ! sempre falha de propósito — ver mmovman.repository.ts

export default router;
