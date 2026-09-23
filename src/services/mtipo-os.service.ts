import { BaseService } from "./base.service";
import { MtipoOsRepository } from "../repositories/mtipo-os.repository";
import type { MtipoOs } from "../models/mtipo-os.model";

export class MtipoOsService extends BaseService<MtipoOs> {
  constructor(repository: MtipoOsRepository = new MtipoOsRepository()) {
    super(repository);
  }
}
