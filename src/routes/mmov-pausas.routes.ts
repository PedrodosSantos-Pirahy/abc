import { Router } from "express";
import { MmovPausasController } from "../controllers/mmov-pausas.controller";

const router = Router();
const controller = new MmovPausasController();

router.get("/", controller.list);
router.post("/buscar", controller.buscarLote);
router.get("/aberta", controller.buscarAberta);
router.post("/fechar-aberta", controller.fecharAberta);
router.post("/fechar-com-propria-hora", controller.fecharComPropriaHora);
router.get("/:nNumero/:tentativa/:grupo/:hrInicio", controller.getById);
router.post("/", controller.create);
router.put("/:nNumero/:tentativa/:grupo/:hrInicio", controller.update);
router.delete("/:nNumero/:tentativa/:grupo/:hrInicio", controller.remove);

export default router;
