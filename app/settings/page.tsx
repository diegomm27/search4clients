import { Save } from "lucide-react";
import { readSettings } from "@/lib/ai/settings";
import { Card, Input, Select } from "@/components/ui";

export default async function SettingsPage() {
  const settings = await readSettings();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-moss">API keys are used server-side for research and drafting. The MVP ships with a mock provider so it can run locally without network access.</p>
      </div>
      <Card>
        <form action="/api/settings" method="post" className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">AI provider</span>
            <Select name="provider" defaultValue={settings.provider}>
              <option value="mock">Mock local provider</option>
              <option value="openai">OpenAI-compatible provider</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">API key</span>
            <Input name="apiKey" type="password" placeholder={settings.apiKeySet ? "Key already set" : "Paste API key"} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Local storage</span>
            <Input name="storagePath" defaultValue={settings.storagePath} />
          </label>
          <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">
            <Save className="h-4 w-4" />
            Save settings
          </button>
        </form>
      </Card>
    </div>
  );
}
