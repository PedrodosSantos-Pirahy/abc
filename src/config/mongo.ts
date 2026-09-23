import mongoose from "mongoose";
import { env } from "./env";

// * Mongo é usado só para o log de requisições (ver requestLogger.middleware.ts).
// * Se o Mongo cair, isso NUNCA deve derrubar a API principal — é só logging,
// * não é dado de negócio. Por isso `connect()` loga o erro em vez de propagar.
export class MongoConnection {
  static async connect(): Promise<void> {
    try {
      await mongoose.connect(env.mongoUrl);
      console.log("✅ Conectado ao MongoDB com sucesso!");
    } catch (erro) {
      console.error("❌ Falha ao conectar no MongoDB (logs de requisição ficarão só no console):", erro);
    }
  }

  static async disconnect(): Promise<void> {
    await mongoose.disconnect();
  }
}
