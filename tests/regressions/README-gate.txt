Release gate for the AdSense $0 fix series (legalcostcalc)

Run serially, one heavy job at a time, while holding D:\ClaudeCode\AppFarm\.claude\memory\heavy.lock.
Redirect every command's output to a file and read the file; never pipe test or build output, never start a server or a background process.

1. npm exec -- eslint
2. npm exec -- tsc --noEmit
3. npm exec -- vitest run --reporter=dot
   The IndexNow tests pin INDEXNOW_ENDPOINT and INDEXNOW_BASELINE_URL to the closed local port 127.0.0.1:9, so nothing is posted.
4. npm run build, with VERCEL_ENV unset so the prebuild and postbuild IndexNow steps do nothing.
5. node scripts/scan-built-html.mjs
   Reads the prerendered pages in .next/server/app and exits 1 on any of: ad loader on the wrong page class or on a noindexed
   template, Consent Mode defaults missing or after the loader, hidden Suspense segment, thin sampled template, draft or developer wording,
   canonical count or target, robots conflict, a template in the sitemap that is noindex (or the reverse), a page prerendered for an
   unknown state or matter, a sitemap URL without a page, and page counts other than 408 matter pages, 51 state hubs, 8 category hubs.
   tests/regressions/scan-built-html.test.ts proves each check on fixtures, so a clean run on the build means something.

Record each exit code in PROGRESS.md under the series heading.

After the gates pass and the fresh-context adversarial review reports CRITICAL 0: one git push of feature/mvp-prototype.
The push is the production deploy (Vercel is git-linked); do not also run vercel --prod, and do not push anything earlier.
Rollback target: deployment dpl_9bZYvHCx, commit 561d440.

After the deploy, curl first (no JS): node D:\ClaudeCode\AppFarm\scripts\csp-live-check.mjs --domain legalcostcalc.co --strict,
/<IndexNow key>.txt answers 200 (do not print the key), a template page has the Consent Mode defaults before the loader,
/embed/california/divorce-cost has no adsbygoogle.js, an unknown matter path returns 404. At most one browser set per deploy,
with page.route recording and aborting the Google collect and ad requests.
