import { isDemoSearchMode } from "@/lib/search/provider-mode";

export function DemoModeBanner() {
  if (!isDemoSearchMode()) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Demo mode: results come from sample public-business data. Connect a real permitted search provider before using this for live research.
    </div>
  );
}
