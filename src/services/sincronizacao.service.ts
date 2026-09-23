import { SincronizacaoRepository } from "../repositories/sincronizacao.repository";
import { OsRepository } from "../repositories/os.repository";
import { AprService } from "./apr.service";
import { QualidadeService } from "./qualidade.service";
import { ajustarFusoRs, base64ParaBuffer } from "../utils/conversao";
import { numeroOuPadrao } from "../utils/numero";
import { GRUPO_PADRAO } from "../constants/dominio";

interface PacoteOffline {
  osId: number;
  grupo?: number;
  manutencao_concluida?: boolean;
  causa_inicial?: string;
  execucao?: { solucao?: string; utilizados?: string; solicitados?: string };
  apr?: any;
  pre_manutencao?: any;
  pos_manutencao?: any;
  pausas?: Array<{ hr_inicio?: string; hr_fim?: string; motivo?: string; sincronizado?: boolean }>;
  HR_ACEITE?: string;
  HR_CHEGADA_LOCAL?: string;
  HR_INICIO_MANUTENCAO?: string;
  HR_FIM_MANUTENCAO?: string;
  HR_FINALIZACAO_OS?: string;
  FOTO_CHEGADA?: string;
  FOTO_FINALIZACAO?: string;
  FOTO_CADEADO?: string;
}

// * Tradução de `sincronizar_offline` — o "roteador inteligente" que recebe
// * os pacotes acumulados no IndexedDB do celular enquanto ele estava sem
// * rede. Ver a nota em sincronizacao.repository.ts sobre a diferença do
// * roteamento interno (chamada direta aos services, não HTTP).
export class SincronizacaoService {
  constructor(
    private readonly sincronizacaoRepository: SincronizacaoRepository = new SincronizacaoRepository(),
    private readonly osRepository: OsRepository = new OsRepository(),
    private readonly aprService: AprService = new AprService(),
    private readonly qualidadeService: QualidadeService = new QualidadeService(),
  ) {}

  async sincronizar(pacotes: PacoteOffline[]): Promise<{ sucessos: number; erros: Array<{ osId: number; erro: string }> }> {
    let sucessos = 0;
    const erros: Array<{ osId: number; erro: string }> = [];

    for (const pacote of pacotes) {
      const osId = pacote.osId;
      if (!osId) continue;

      try {
        await this.preencherNomesVazios(pacote);

        const tentativaOffline = await this.sincronizacaoRepository.tentativaAtual(osId);
        const grupoOffline = numeroOuPadrao(pacote.grupo, GRUPO_PADRAO);
        const concluidoOffline = Boolean(pacote.manutencao_concluida);
        const execDados = pacote.execucao ?? {};

        const { createdAt, solucaoAplicada } = await this.sincronizacaoRepository.upsertRegistro({
          osId,
          tentativa: tentativaOffline,
          grupo: grupoOffline,
          hrAceite: ajustarFusoRs(pacote.HR_ACEITE),
          hrChegadaLocal: ajustarFusoRs(pacote.HR_CHEGADA_LOCAL),
          hrInicioManutencao: ajustarFusoRs(pacote.HR_INICIO_MANUTENCAO),
          hrFimManutencao: ajustarFusoRs(pacote.HR_FIM_MANUTENCAO),
          hrFinalizacaoOs: ajustarFusoRs(pacote.HR_FINALIZACAO_OS),
          fotoChegada: base64ParaBuffer(pacote.FOTO_CHEGADA),
          fotoFinalizacao: base64ParaBuffer(pacote.FOTO_FINALIZACAO),
          fotoCadeado: base64ParaBuffer(pacote.FOTO_CADEADO),
          concluido: concluidoOffline,
          causaInicial: pacote.causa_inicial || null,
          solucaoAplicada: execDados.solucao || null,
          utiMaterial: execDados.utilizados || null,
          solMaterial: execDados.solicitados || null,
        });

        // * Mesmo gatilho de mmov-registros.service.ts, pro caminho de sync
        // * offline (que grava direto via SincronizacaoRepository, sem passar
        // * pelo MmovRegistrosService/hook).
        if (solucaoAplicada) {
          await this.osRepository.emitirParaErpLegado(osId, createdAt, solucaoAplicada);
        }

        for (const pausa of pacote.pausas ?? []) {
          if (pausa.sincronizado) continue;
          const hrInicio = ajustarFusoRs(pausa.hr_inicio);
          if (!hrInicio) continue;
          const hrFim = ajustarFusoRs(pausa.hr_fim);
          const jaExiste = await this.sincronizacaoRepository.existePausaProxima(osId, grupoOffline, tentativaOffline, hrInicio);
          if (!jaExiste) {
            await this.sincronizacaoRepository.inserirPausa(osId, tentativaOffline, grupoOffline, hrInicio, hrFim, pausa.motivo || null);
          }
        }

        if (pacote.apr) {
          await this.aprService.salvar({
            osId,
            grupo: grupoOffline,
            tentativa: tentativaOffline,
            conteudo: pacote.apr,
            fotoCadeado: pacote.apr.fotoCadeado,
          });
        }
        if (pacote.pre_manutencao) {
          await this.qualidadeService.salvarPre({
            osId,
            grupo: grupoOffline,
            tentativa: tentativaOffline,
            conteudo: pacote.pre_manutencao,
          });
        }
        if (pacote.pos_manutencao) {
          await this.qualidadeService.salvarPos({
            osId,
            grupo: grupoOffline,
            tentativa: tentativaOffline,
            conteudo: pacote.pos_manutencao,
          });
        }

        sucessos++;
      } catch (erro) {
        erros.push({ osId, erro: (erro as Error).message ?? "Erro desconhecido" });
      }
    }

    return { sucessos, erros };
  }

  // * Preenche nomes vazios com base na matrícula — mesma "ideia brilhante"
  // * documentada no Flask: o celular às vezes só guardou a matrícula
  // * offline, sem ter conseguido buscar o nome online ainda.
  private async preencherNomesVazios(pacote: PacoteOffline): Promise<void> {
    const apr = pacote.apr;
    if (apr) {
      for (const m of apr.step2?.equipe ?? []) {
        if (m.matricula) {
          const nome = await this.sincronizacaoRepository.buscarNomeFuncionario(String(m.matricula));
          if (nome) m.nome = nome;
        }
      }
      for (const resp of apr.step8?.responsaveis ?? []) {
        if (resp.matricula) {
          const nome = await this.sincronizacaoRepository.buscarNomeFuncionario(String(resp.matricula));
          if (nome) resp.nome = nome;
        }
      }
    }

    const pos = pacote.pos_manutencao;
    if (pos) {
      if (pos.respMatricula) {
        const nome = await this.sincronizacaoRepository.buscarNomeFuncionario(String(pos.respMatricula));
        if (nome) pos.respNome = nome;
      }
      if (pos.manutMatricula) {
        const nome = await this.sincronizacaoRepository.buscarNomeFuncionario(String(pos.manutMatricula));
        if (nome) pos.manutNome = nome;
      }
    }
  }
}
