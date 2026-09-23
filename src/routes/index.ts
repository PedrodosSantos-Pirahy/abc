import { Router } from "express";
import osRoutes from "./os.routes";
import arquivoRoutes from "./arquivo.routes";
import authRoutes from "./auth.routes";
import aprRoutes from "./apr.routes";
import qualidadeRoutes from "./qualidade.routes";
import auditoriaRoutes from "./auditoria.routes";
import sincronizacaoRoutes from "./sincronizacao.routes";
import funcionarioRoutes from "./funcionario.routes";
import adminRoutes from "./admin.routes";
import pdfDownloadRoutes from "./pdf-download.routes";
import mmovmanRoutes from "./mmovman.routes";
import mmovRegistrosRoutes from "./mmov-registros.routes";
import mmovPausasRoutes from "./mmov-pausas.routes";
import mmovKanbanEquipeRoutes from "./mmov-kanban-equipe.routes";
import mmovKanbanRoutes from "./mmov-kanban.routes";
import ufuncRoutes from "./ufunc.routes";
import mtipoOsRoutes from "./mtipo-os.routes";
import matividadeRoutes from "./matividade.routes";
import mambienteRoutes from "./mambiente.routes";
import mservicoAtivRoutes from "./mservico-ativ.routes";
import uequipgruRoutes from "./uequipgru.routes";
import uequipsetRoutes from "./uequipset.routes";
import uempresaRoutes from "./uempresa.routes";
import usuarioRoutes from "./usuario.routes";
import mmovQualidadeRoutes from "./mmov-qualidade.routes";
import mmovaprRoutes from "./mmovapr.routes";
import mmovaprEquipeRoutes from "./mmovapr-equipe.routes";
import mmovexecHorasRoutes from "./mmovexec-horas.routes";

const router = Router();

// * Um recurso REST simples por tabela — sem JOIN entre elas aqui. O
// * relacionamento (por N_NUMERO/grupo/tentativa) é montado pelo frontend.
router.use("/mmovman", mmovmanRoutes);
router.use("/mmov-registros", mmovRegistrosRoutes);
router.use("/mmov-pausas", mmovPausasRoutes);
router.use("/mmov-kanban-equipe", mmovKanbanEquipeRoutes);
router.use("/mmov-kanban", mmovKanbanRoutes);
router.use("/ufunc", ufuncRoutes);
router.use("/mtipo-os", mtipoOsRoutes);
router.use("/matividade", matividadeRoutes);
router.use("/mambiente", mambienteRoutes);
router.use("/mservico-ativ", mservicoAtivRoutes);
router.use("/uequipgru", uequipgruRoutes);
router.use("/uequipset", uequipsetRoutes);
router.use("/uempresa", uempresaRoutes);
router.use("/manut-user", usuarioRoutes); // manut."user" — /usuarios já é usado por funcionarioRoutes (cadastro via ERP)
router.use("/mmov-qualidade", mmovQualidadeRoutes);
router.use("/mmovapr", mmovaprRoutes);
router.use("/mmovapr-equipe", mmovaprEquipeRoutes);
router.use("/mmovexec-horas", mmovexecHorasRoutes);

router.use("/os", osRoutes);
router.use("/arquivos", arquivoRoutes);
router.use("/", authRoutes); // POST /api/login — sem prefixo extra, igual ao backend Flask
router.use("/apr", aprRoutes);
router.use("/qualidade", qualidadeRoutes);
router.use("/auditoria", auditoriaRoutes);
router.use("/", sincronizacaoRoutes); // POST /api/sincronizar-offline
router.use("/", funcionarioRoutes); // /api/funcionario/:matricula, /api/erp/funcionario/:matricula, POST /api/usuarios
router.use("/admin", adminRoutes);
router.use("/pdf/download", pdfDownloadRoutes);

export default router;
