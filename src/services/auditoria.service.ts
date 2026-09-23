import { AuditoriaRepository } from "../repositories/auditoria.repository";
import { base64ParaBuffer, isoLocalSemZ } from "../utils/conversao";
import { ValidationError } from "../utils/AppError";

export class AuditoriaService {
  constructor(private readonly auditoriaRepository: AuditoriaRepository = new AuditoriaRepository()) {}

  async registrarTempo(osId: number, etapa: string, grupo: number): Promise<string> {
    if (!osId || !etapa) throw new ValidationError("OS ID e etapa são obrigatórios.");
    const hora = await this.auditoriaRepository.registrarTempo(osId, etapa, grupo);
    return isoLocalSemZ(hora);
  }

  async registrarFoto(osId: number, coluna: string, fotoBase64: string, grupo: number): Promise<void> {
    if (!osId || !coluna || !fotoBase64) {
      throw new ValidationError("OS ID, coluna e foto são obrigatórios.");
    }
    const buffer = base64ParaBuffer(fotoBase64);
    if (!buffer) throw new ValidationError("Foto inválida.");
    await this.auditoriaRepository.registrarFoto(osId, coluna, buffer, grupo);
  }

  async registrarCausa(osId: number, causa: string, grupo: number): Promise<void> {
    const causaLimpa = (causa || "").trim();
    if (!osId || !causaLimpa) throw new ValidationError("OS ID e causa são obrigatórios.");
    await this.auditoriaRepository.registrarCausa(osId, causaLimpa, grupo);
  }
}
