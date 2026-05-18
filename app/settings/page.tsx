import { Save } from "lucide-react";
import { readSettings } from "@/lib/ai/settings";
import { Card, Input, Select } from "@/components/ui";

export default async function SettingsPage({ searchParams }: { searchParams: { error?: string } }) {
  const settings = await readSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-moss">Connect an AI provider for outreach drafts.</p>
      </div>
      {searchParams.error && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{searchParams.error}</div>
      )}
      <Card>
        <form action="/api/settings" method="post" className="space-y-5">
          <div className="rounded-md border border-line bg-paper p-4">
            <p className="text-sm font-medium">Search research</p>
            <p className="mt-1 text-sm text-moss">Agent web research is written to config/candidates.json. API keys below only affect AI outreach draft generation.</p>
          </div>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">AI provider for drafts</span>
            <Select name="provider" defaultValue={settings.provider}>
              <option value="mock">Mock provider</option>
              <option value="openai">OpenAI API</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">OpenAI API key</span>
            <Input name="apiKey" type="password" placeholder={settings.apiKeySet ? "Key already set" : "Paste API key"} />
            <span className="mt-2 block text-xs text-moss">Stored locally in .data/settings.json. Leave blank to keep the existing key.</span>
          </label>
          <details className="rounded-md border border-line p-4">
            <summary className="cursor-pointer text-sm font-medium">Advanced</summary>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-medium">Local storage path</span>
              <Input name="storagePath" defaultValue={settings.storagePath} />
            </label>
          </details>
          <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">
            <Save className="h-4 w-4" />
            Save settings
          </button>
        </form>
      </Card>
    </div>
  );
}
