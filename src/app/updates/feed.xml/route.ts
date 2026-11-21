import { buildUpdatesFeed } from "@/lib/updates-feed";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildUpdatesFeed(), {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
