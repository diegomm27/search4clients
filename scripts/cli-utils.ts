export function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean | string[]> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const next = argv[index + 1];
    const value = !next || next.startsWith("--") ? true : next;

    if (value !== true) index += 1;

    const existing = args[key];
    if (existing === undefined) {
      args[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(String(value));
    } else {
      args[key] = [String(existing), String(value)];
    }
  }

  return args;
}

export function stringArg(args: Record<string, string | boolean | string[]>, key: string) {
  const value = args[key];
  if (Array.isArray(value)) return value[value.length - 1];
  if (typeof value === "string") return value;
  return undefined;
}

export function listArg(args: Record<string, string | boolean | string[]>, key: string) {
  const value = args[key];
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  return values
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

export function numberArg(args: Record<string, string | boolean | string[]>, key: string, fallback: number) {
  const value = Number(stringArg(args, key));
  return Number.isFinite(value) ? value : fallback;
}

export function printHelp(title: string, lines: string[]) {
  console.log(title);
  console.log("");
  for (const line of lines) console.log(line);
}

export async function disconnectPrisma() {
  try {
    const { prisma } = await import("../lib/storage/prisma");
    await prisma.$disconnect();
  } catch {
    // Nothing to disconnect.
  }
}
