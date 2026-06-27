# HANDOVER — legalcostcalc 배포 인계 (2026-06-27)

## 결과 요약
- **게이트 1 (배포 준비): PASS** — lint+typecheck+build green, Anti-Slop 0, 9축 CRITICAL 0, 풍성도 ADEQUATE.
- **게이트 2 (production 검증): PASS** — Vercel Ready + Smoke 200 + 실 데이터 + runtime API + SSL.
- Production: **https://legalcostcalc.vercel.app** (배포 `legalcostcalc-qiziwq220`, prj_aO8PhXBF9EZGcERnjshxul2YMu2F).

## 빌드 / 실행 (로컬)
- 패키지 매니저: **npm** (lockfile=package-lock.json). pnpm도 설치돼 있으나 미사용.
- `npm install` → `npm run dev` (개발), `npm run build` (420 페이지 SSG; `next.config.ts`의 `experimental.cpus:4` OOM 가드).
- 검증: `npm run lint` · `npx tsc --noEmit` · `npm run design:qa:ci` (impeccable vs baseline.json).
- 로컬 `.env.local`은 **플레이스홀더 Supabase** → 로컬 빌드는 데이터 없는 fallback 렌더(정상). 실 데이터는 Vercel 원격 빌드에서만.

## 배포 절차
- 방식: `vercel deploy --prod`(원격 빌드, Vercel env의 실 Supabase 사용) → 필요 시 `vercel promote <url> --yes`로 alias 전환.
- ⚠️ **`--prebuilt` 금지**(로컬 placeholder로 데이터 없는 빌드 베이크됨). 반드시 원격 빌드.
- ⚠️ 배포 전 **Supabase 프로젝트 status=ACTIVE_HEALTHY 선확인 필수**(아래 운영 노트).
- git push(feature/mvp-prototype)→Vercel 자동배포도 동일 동작(프로젝트 기존 패턴).

## 시크릿 위치
- Vercel 프로젝트 env(Production): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (service role key는 미설정 — 앱은 anon + public RLS read만 사용).
- 로컬엔 실 시크릿 없음(.env.local 플레이스홀더). `vercel env pull`로 임시 취득 가능(.gitignore로 보호, 커밋 금지).

## 관측성 / Smoke
- Liveness: `GET /api/health` → 200 `{data:{status:"ok",service:"legalcostcalc",...}}` (의존성 없음, Supabase 다운에도 200).
- Smoke: `curl -sf -L "$URL/"` 200 + `curl -sf -L "$URL/api/health"` 200.
- 데이터 검증: `/api/costs?category=divorce&state=CA&complexity=moderate` → median 10600. 랜딩 페이지 실 $figure 렌더 + "currently being collected" 부재.

## 최종 풍성도값 (검증 방식 명시)
- **검증 방식**: 이 실행 환경은 headless Chromium 실행 불가(`spawn UNKNOWN`)로 Playwright 4-viewport 픽셀 스크린샷 미수행. → **콘텐츠/구조 분석으로 대체 검증**(측정 부풀리기 금지 원칙 준수, 방식 명시).
- Home: h1×1, FAQPage 스키마, footer, 내부 -cost 링크 58, 카드 요소 다수, 반응형 sm/md/lg 클래스 81+, disclaimer top+bottom, fallback 0.
- Landing(/california/divorce-cost): h1×1, FAQPage+Breadcrumb 스키마, 실 $figure 11종($5,900/$10,600/$17,700 등), disclaimer top+bottom, fallback 0.
- [잔여] 픽셀 단위 빈-회색 비율 측정은 브라우저 가용 환경에서 1회 수행 권장(현 환경 제약).

## 롤백 절차
- `vercel rollback <prev-deployment-url> --yes` 또는 `vercel promote <prev-url> --yes`.
- 직전 안정 배포: `legalcostcalc-ik7i6m2e6-...vercel.app` (84일 전 실데이터 SSG; 단 Supabase 의존 런타임 API는 DB 상태 따름).
- 주의: 엣지 ISR 캐시(1w) 전파 지연으로 alias 전환 후 잠시 구 콘텐츠 잔존 가능. 신규 배포 promote가 가장 확실.

## 버전 고정
- Next.js 16.2.2 · React 19.2.4 · Node 22(로컬)/24(Vercel) · Supabase Postgres 17.6 · Tailwind 4.
- Supabase 데이터: states 51 · categories 8 · legal_costs 1224(전부 sources 보유).

## 운영 노트 / 미결 이슈
- ⚠️ **Supabase 무료티어 자동 일시정지**: `legalcostcalc`(eeyqjdfwnizpsalbaaco)는 미사용 시 INACTIVE로 pause됨. pause 중엔 SSG 재빌드가 fallback을 베이크하고 `/api/costs`가 500. **배포 파이프라인은 반드시 `restore_project`→ACTIVE_HEALTHY→데이터 확인→빌드 순서**. 본 세션에서 1회 발생→해소.
- `DATA_VERSION_DATE`(`src/lib/constants/data-meta.ts`): 실 데이터 검증 시에만 수동 bump(sitemap lastmod 안정화).
- 후속 권고(DEPLOY_FIX_PLAN 큐): P1-002 테스트 인프라(Vitest), P1-004 rate-limit→KV, P1-005 sources NOT NULL 마이그레이션, P2-007 CI/vercel.json. 모두 비차단.
