import { existsSync, copyFileSync, mkdirSync } from "fs";

mkdirSync("config", { recursive: true });
if (!existsSync("config/search.request.json")) {
  copyFileSync("config/search.request.example.json", "config/search.request.json");
  console.log("Created config/search.request.json from config/search.request.example.json");
} else {
  console.log("config/search.request.json already exists; leaving it unchanged");
}

console.log("");
console.log("Setup complete. Next step: edit config/search.request.json, then run npm run scan");
