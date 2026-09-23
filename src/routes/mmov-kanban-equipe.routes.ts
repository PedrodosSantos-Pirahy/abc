import { Router } from "express";
import { MmovKanbanEquipeController } from "../controllers/mmov-kanban-equipe.controller";

const router = Router();
const controller = new MmovKanbanEquipeController();

router.get("/", controller.list);
router.get("/ativos", controller.numerosAtivos);
router.get("/numeros-por-matricula", controller.numerosPorMatricula);
router.post("/buscar", controller.buscarLote);
router.get("/:nNumero/:matricula", controller.getById);
router.post("/", controller.create);
router.put("/:nNumero/:matricula", controller.update);
router.delete("/:nNumero/:matricula", controller.remove);

export default router;
