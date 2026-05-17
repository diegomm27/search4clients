import { existsSync, copyFileSync, mkdirSync } from "fs";
import { spawnSync } from "child_process";

function run(command: string, args: string[]) {
  const result = process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", [command, ...args].join(" ")], { stdio: "inherit" })
    : spawnSync(command, args, { stdio: "inherit" });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

mkdirSync("config", { recursive: true });
if (!existsSync("config/search.request.json")) {
  copyFileSync("config/search.request.example.json", "config/search.request.json");
  console.log("Created config/search.request.json from config/search.request.example.json");
} else {
  console.log("config/search.request.json already exists; leaving it unchanged");
}

run("npm", ["run", "db:push"]);

console.log("");
console.log("Setup complete. Next step: edit config/search.request.json, then run npm run scan");
