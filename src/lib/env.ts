import "server-only";
import { z } from "zod";

// Sunucu tarafı ortam değişkenlerinin şeması.
// Değerler modül yüklenirken değil, ilk kullanımda doğrulanır; böylece
// `next build` (ve CI) gizli anahtarlar olmadan da çalışabilir.
const serverEnvSchema = z.object({
  NEWS_API_KEY: z
    .string({ error: "NEWS_API_KEY tanımlı değil. .env.local dosyasına ekleyin." })
    .min(1, "NEWS_API_KEY boş olamaz."),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvError";
  }
}

export function getServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvError(parsed.error.issues.map((i) => i.message).join(" "));
  }
  return parsed.data;
}
