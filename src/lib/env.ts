// Same public publisher id that ads.txt and the served loader already expose; used when the env value is empty.
const PUBLIC_ADSENSE_CLIENT = "ca-pub-1378312299412437";

export function firstConfigured(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function resolveAdsenseClient(): string {
  const id = firstConfigured(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID, PUBLIC_ADSENSE_CLIENT) as string;
  return id.startsWith("ca-") ? id : `ca-${id}`;
}
