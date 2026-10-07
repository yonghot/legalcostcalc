# Activation names (monetization and measurement)

Environment variable names only. Values live in the Vercel project settings and are never written in this repository.

With every name below unset, the result stack renders nothing: no ad frame, no affiliate block, no sponsor block, no partner table. Any affiliate, lead, call, sponsor or partner block that does render is preceded by the advertiser disclosure. Public names are inlined at build time, so a change needs a redeploy.

Status values: ON = already set in production; READY = the code works once the name is set; HOLD = do not set, legal review first (leader contract K33); DO NOT SET = no supported use on this site.

## Ads and measurement

| Name | Read by | Effect when set | Status |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | env resolver, loader, ads.txt | Publisher id for the loader, the publisher meta tag and ads.txt. An empty value falls back to the public publisher id. | ON |
| `NEXT_PUBLIC_ADSENSE_SLOT_ID` | ad slot resolver | A numeric slot id turns on the single manual unit below the calculator result. Non-numeric values are ignored. | READY |
| `NEXT_PUBLIC_GA_ID` | env resolver | GA4 measurement id. | ON |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | env resolver | Alias used only when the previous name is empty. | READY |
| `NEXT_PUBLIC_AD_PROVIDER` | ad provider | Leave unset (AdSense is the default). The value none hides the manual unit. | READY |
| `NEXT_PUBLIC_EZOIC_SCRIPT_SRC` | ad provider | Second ad network script. | DO NOT SET |
| `NEXT_PUBLIC_RAPTIVE_SITE_ID` | ad provider | Second ad network script. | DO NOT SET |
| `NEXT_PUBLIC_JOURNEY_SITE_ID` | ad provider | Second ad network script. | DO NOT SET |
| `NEXT_PUBLIC_ADSTXT_REDIRECT_URL` | ads.txt route | Redirects ads.txt away from the AdSense line. | DO NOT SET |

## Affiliate and sponsor blocks

Sign-up with each program is the owner's step. Activation happens only after the leader instructs it.

| Name | Read by | Effect when set | Status |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL` | affiliate list | Shows the LegalZoom block with disclosure. | READY |
| `NEXT_PUBLIC_AFFILIATE_ROCKETLAWYER_URL` | affiliate list | Shows the Rocket Lawyer block with disclosure. | READY |
| `NEXT_PUBLIC_AFFILIATE_LAWDEPOT_URL` | affiliate list | Shows the LawDepot block with disclosure. | READY |
| `NEXT_PUBLIC_AFFILIATE_LEGALMATCH_URL` | affiliate list | Attorney directory link. | HOLD |
| `NEXT_PUBLIC_AFFILIATE_AVVO_URL` | affiliate list | Attorney directory link. | HOLD |
| `NEXT_PUBLIC_AFFILIATE_NOLO_URL` | affiliate list | Attorney directory link. | HOLD |
| `NEXT_PUBLIC_PRIMARY_CTA_TYPE` | monetization config | Chooses the call, lead or affiliate button under the result. Leave unset. | HOLD |
| `NEXT_PUBLIC_PPC_NUMBER` | monetization config | Pay-per-call attorney line under the result. | HOLD |
| `NEXT_PUBLIC_PPC_LABEL` | monetization config | Button text for the call line. | HOLD |
| `NEXT_PUBLIC_CPL_URL` | monetization config | Cost-per-lead attorney link under the result. | HOLD |
| `NEXT_PUBLIC_CPL_LABEL` | monetization config | Button text for the lead link. | HOLD |
| `MON_FEATURED_PARTNERS` | server pages | Server-only JSON list of label, figure and link rows rendered as a partner table. Parsed on the server and passed down as a prop. | HOLD |
| `NEXT_PUBLIC_SPONSOR_HTML` | monetization config | Plain-text sponsor message with disclosure. | READY |
| `NEXT_PUBLIC_SPONSOR_BACKFILL_URL` | monetization config | Sponsor link with disclosure when no sponsor message is set. | READY |

## Email capture

| Name | Read by | Effect when set | Status |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_EMAIL_CAPTURE` | monetization config | Marketing email form under the result. No new email collection is allowed. | HOLD |
| `NEXT_PUBLIC_POSTAL_ADDRESS` | monetization config | Postal address shown with any email form. | HOLD |
| `NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED` | email results form | Transactional email-my-results form. | HOLD |
