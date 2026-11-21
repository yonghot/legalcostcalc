export interface GaGateInput {
  appUrl: string | undefined;
  vercelEnv: string | undefined;
  gaDebug: string | undefined;
  hostname: string | undefined;
}

export function decideGaLoad({ appUrl, vercelEnv, gaDebug, hostname }: GaGateInput): { shouldLoad: boolean; debugMode: boolean } {
  if (hostname === undefined) return { shouldLoad: false, debugMode: false };

  let canonicalHost: string;
  try {
    canonicalHost = new URL(appUrl || "https://legalcostcalc.co").hostname;
  } catch {
    canonicalHost = "legalcostcalc.co";
  }

  const isCanonicalHost = hostname === canonicalHost || hostname === `www.${canonicalHost}`;
  if (vercelEnv === "production" && isCanonicalHost) return { shouldLoad: true, debugMode: false };

  const debugEnabled = gaDebug === "1";
  return { shouldLoad: debugEnabled, debugMode: debugEnabled };
}
