// * Stub — nenhum job agendado ainda nesta fase (sem sincronização offline
// * nem rotinas periódicas portadas do Flask). Quando isso for necessário,
// * os jobs entram aqui usando `node-cron`, seguindo o mesmo padrão do
// * WorkerManager do backend de referência.
export class WorkerManager {
  static start(): void {
    console.log("⏱️  WorkerManager iniciado (nenhum job agendado ainda).");
  }
}
