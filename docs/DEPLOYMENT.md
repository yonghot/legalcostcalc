# DEPLOYMENT.md — legalcostcalc 배포 런북

## 대상
- Vercel 프로젝트: **legalcostcalc** (`prj_aO8PhXBF9EZGcERnjshxul2YMu2F`), scope `sk1597530-3914's projects`.
- 프레임워크: Next.js 16 (App Router). 빌드 워커 4개 고정(`next.config.ts` `experimental.cpus: 4`, OOM 가드).

## 배포 방식 (둘 중 하나)
### A) Git 자동배포 (프로젝트 기존 패턴 — 권장)
- `feature/mvp-prototype` 브랜치 push 시 Vercel Git 통합이 자동 빌드·배포 (PROGRESS.md 이력 다수).
- Vercel이 **자기 프로젝트 env(실 Supabase)**로 원격 빌드 → 408 SSG 페이지에 실 데이터 베이크.
- 절차: `git push origin feature/mvp-prototype` → Vercel 대시보드/`vercel ls`로 Ready 확인.

### B) Vercel CLI 원격 빌드
- `vercel link --yes`(기존 legalcostcalc 프로젝트로) → `vercel deploy --prod`.
- ⚠️ **`--prebuilt` 금지**: 로컬 빌드는 `.env.local` 플레이스홀더 Supabase로 fallback 데이터가 베이크됨. 반드시 원격 빌드(Vercel env)로.

## 필수 환경변수 (Vercel 프로젝트 Settings에 설정)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (실 Supabase 프로젝트).
- (CI 자동배포용) `VERCEL_TOKEN` — GitHub Actions secret. 로컬/대화식 배포엔 불필요(`vercel login` 세션 사용).
- 로컬 `.env.local`은 개발 전용 플레이스홀더 — production과 무관.

## Smoke (배포 직후 필수)
- `curl -sf -L "$URL/"` → 정확히 200
- `curl -sf -L "$URL/api/health"` → 정확히 200 (의존성 없는 liveness; Supabase 다운에도 200)
- 4 viewport(393/1024/1440/1920) 육안/Playwright: 실 cost 데이터 렌더 + disclaimer top+bottom + 카드 그리드.

## 롤백
- Smoke 실패 시 즉시: `vercel rollback <prev-deploy-url> --yes` (또는 대시보드 Promote 이전 배포).
- Git 방식이면 직전 정상 커밋으로 revert 후 재push.

## 데이터/SEO 운영 노트
- `DATA_VERSION_DATE` (`src/lib/constants/data-meta.ts`) — 실제 cost 데이터 검증 시에만 수동 bump (sitemap lastmod 안정화).
- Supabase RLS: `legal_costs` 테이블이 anon key에 READ-ONLY인지 대시보드에서 확인 (코드로 단언 불가).

## DNS·SSL
- 커스텀 도메인 사용 시 `vercel domains inspect "$DOMAIN"`로 `recommendedCNAME`/`recommendedIPv4` **동적 조회** 후 등록(고정값 하드코딩 금지). 현재는 `*.vercel.app` 기본 도메인.
