import { OPT_IN_COUNTRIES } from "@/components/consent/consent-config";

const SIGNALS = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"];

const signals = (value: "denied" | "granted") => SIGNALS.map((signal) => `${signal}:'${value}'`).join(",");

export function buildConsentDefaultScript(): string {
  const region = [...OPT_IN_COUNTRIES].map((code) => `'${code}'`).join(",");
  return (
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}" +
    `gtag('consent','default',{${signals("denied")},region:[${region}],wait_for_update:500});` +
    `gtag('consent','default',{${signals("granted")}});` +
    "window.gtag=window.gtag||gtag;"
  );
}

export const CONSENT_DEFAULT_SCRIPT = buildConsentDefaultScript();
