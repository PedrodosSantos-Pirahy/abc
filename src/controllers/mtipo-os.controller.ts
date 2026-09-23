import { BaseController } from "./base.controller";
import { MtipoOsService } from "../services/mtipo-os.service";
import type { MtipoOs } from "../models/mtipo-os.model";

export class MtipoOsController extends BaseController<MtipoOs> {
  constructor(service: MtipoOsService = new MtipoOsService()) {
    super(service);
  }
}
