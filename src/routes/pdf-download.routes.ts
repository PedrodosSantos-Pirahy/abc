import { Router } from "express";
import { PdfDownloadController } from "../controllers/pdf-download.controller";

const router = Router();
const controller = new PdfDownloadController();

router.get("/apr/:osId", controller.baixarApr);
router.get("/qualidade/:osId", controller.baixarQualidade);

export default router;
