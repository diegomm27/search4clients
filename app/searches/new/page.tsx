import { Play } from "lucide-react";
import { Card, Input, Select, Textarea } from "@/components/ui";

export default function NewSearchPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">New guided search</h1>
        <p className="mt-2 text-sm text-moss">Answer the core questions first. The confirmation screen turns them into a structured search configuration before any research runs.</p>
      </div>
      <Card>
        <form action="/searches/confirm" className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Search name</span>
            <Input name="name" required placeholder="Spain dental clinics for web design" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Country</span>
            <Input name="country" required placeholder="Spain" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">City or region</span>
            <Input name="city" placeholder="Madrid" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Industry or business type</span>
            <Input name="industry" required placeholder="Dental clinics" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Service offered</span>
            <Input name="service_offered" required placeholder="Website redesign" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Ideal client</span>
            <Input name="target_client_type" placeholder="Small independent local businesses" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Signals to look for</span>
            <Textarea name="ideal_client_signals" placeholder="outdated website, poor mobile layout, no online booking, weak local SEO" />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium">Signals to exclude</span>
            <Textarea name="exclude_signals" placeholder="large chains, franchises, hospitals, enterprise brand" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Results</span>
            <Input name="number_of_results" type="number" min={1} max={100} defaultValue={25} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Minimum score</span>
            <Input name="minimum_score" type="number" min={0} max={100} defaultValue={70} />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Output</span>
            <Select name="output_format" defaultValue="table">
              <option value="table">Table</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
              <option value="dashboard">Dashboard</option>
            </Select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Language</span>
            <Input name="language" placeholder="Spanish" />
          </label>
          <div className="md:col-span-2">
            <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-ink">
              <Play className="h-4 w-4" />
              Review configuration
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
