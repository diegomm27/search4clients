import { redirect } from "next/navigation";

export async function POST() {
  redirect(`/searches/new?error=${encodeURIComponent("This dashboard feature is not active. Use /search4clients scan in Claude to research and score candidates.")}`);
}
