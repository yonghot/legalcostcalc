export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function aOrAn(label: string, capitalize = false): string {
  const word = /^[aeiou]/i.test(label.trim()) ? "an" : "a";
  if (!capitalize) return word;
  return word === "an" ? "An" : "A";
}

export function labelSources(urls: string[]): { url: string; label: string }[] {
  const hostOf = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  };
  const counts = new Map<string, number>();
  for (const url of urls) {
    const host = hostOf(url);
    if (host) counts.set(host, (counts.get(host) ?? 0) + 1);
  }
  return urls.map((url) => {
    const host = hostOf(url);
    if (!host) return { url, label: "cited source" };
    if ((counts.get(host) ?? 0) < 2) return { url, label: host };
    const parsed = new URL(url);
    return { url, label: `${host}${parsed.pathname.replace(/\/+$/, "")}${parsed.search}` };
  });
}

export function lowerKeepAcronyms(label: string): string {
  return label
    .split(" ")
    .map((word) => (/^[A-Z]{2,}$/.test(word) ? word : word.toLowerCase()))
    .join(" ");
}

export function formatCurrencyRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`;
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

