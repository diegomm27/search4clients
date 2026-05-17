import { prisma } from "@/lib/storage/prisma";
import { leadsToCsv, leadsToHtml, leadsToMarkdown } from "@/lib/export/exporters";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "csv";
  const searchId = url.searchParams.get("searchId");
  const leads = await prisma.lead.findMany({
    where: searchId ? { search_id: Number(searchId) } : undefined,
    orderBy: [{ score: "desc" }, { created_at: "desc" }]
  });

  if (format === "json") {
    return new Response(JSON.stringify(leads, null, 2), {
      headers: {
        "content-type": "application/json",
        "content-disposition": "attachment; filename=search4clients-leads.json"
      }
    });
  }

  if (format === "markdown") {
    return new Response(leadsToMarkdown(leads), {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition": "attachment; filename=search4clients-leads.md"
      }
    });
  }

  if (format === "html") {
    return new Response(leadsToHtml(leads), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": "attachment; filename=search4clients-leads.html"
      }
    });
  }

  return new Response(leadsToCsv(leads), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=search4clients-leads.csv"
    }
  });
}
