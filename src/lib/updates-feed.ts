import { CANONICAL_ORIGIN } from "@/lib/seo";
import { PUBLISHER } from "@/lib/constants/publisher";
import { NEWEST_UPDATE_DATE, SITE_UPDATES } from "@/lib/site-updates";

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildUpdatesFeed(): string {
  const host = new URL(CANONICAL_ORIGIN).host;
  const entries = SITE_UPDATES.map(
    (u) => `  <entry>
    <id>tag:${host},${u.date}:${u.id}</id>
    <title>${escapeXml(u.title)}</title>
    <updated>${u.date}T00:00:00Z</updated>
    <link rel="alternate" type="text/html" href="${CANONICAL_ORIGIN}/updates#${u.id}"/>
    <summary>${escapeXml(u.body)}</summary>
  </entry>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${CANONICAL_ORIGIN}/updates</id>
  <title>LegalCostCalc updates</title>
  <updated>${NEWEST_UPDATE_DATE}T00:00:00Z</updated>
  <author><name>${escapeXml(PUBLISHER.name)}</name></author>
  <link rel="self" type="application/atom+xml" href="${CANONICAL_ORIGIN}/updates/feed.xml"/>
  <link rel="alternate" type="text/html" href="${CANONICAL_ORIGIN}/updates"/>
${entries}
</feed>
`;
}
