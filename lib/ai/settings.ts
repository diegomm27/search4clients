import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const settingsPath = path.join(process.cwd(), ".data", "settings.json");

export type AISettings = {
  provider: "openai" | "mock";
  apiKeySet: boolean;
  apiKey?: string;
  storagePath: string;
};

export async function readSettings(): Promise<AISettings> {
  try {
    const raw = await readFile(settingsPath, "utf8");
    const parsed = JSON.parse(raw) as AISettings;
    return { ...parsed, apiKeySet: Boolean(parsed.apiKey) };
  } catch {
    return {
      provider: (process.env.AI_PROVIDER as "openai" | "mock") || "mock",
      apiKeySet: Boolean(process.env.OPENAI_API_KEY),
      apiKey: process.env.OPENAI_API_KEY,
      storagePath: "prisma/dev.db"
    };
  }
}

export async function writeSettings(input: { provider: "openai" | "mock"; apiKey?: string; storagePath?: string }) {
  await mkdir(path.dirname(settingsPath), { recursive: true });
  const existing = await readSettings();
  const next: AISettings = {
    provider: input.provider,
    apiKey: input.apiKey || existing.apiKey,
    apiKeySet: Boolean(input.apiKey || existing.apiKey),
    storagePath: input.storagePath || existing.storagePath || "prisma/dev.db"
  };
  await writeFile(settingsPath, JSON.stringify(next, null, 2), "utf8");
  return { ...next, apiKey: undefined };
}
