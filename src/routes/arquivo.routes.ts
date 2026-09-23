import { Router } from "express";
import { ArquivoController } from "../controllers/arquivo.controller";
import { upload } from "../middlewares/upload.middleware";

const router = Router();
const controller = new ArquivoController();

router.get("/", controller.list); // lista paginada de metadados (sem o binário)
router.get("/:id", controller.download); // stream do binário — <img src> aponta direto pra cá
router.post("/", upload.single("arquivo"), controller.upload); // multipart/form-data, campo "arquivo" -> { id, nome, mimetype, tamanho }
router.delete("/:id", controller.remove);

export default router;
