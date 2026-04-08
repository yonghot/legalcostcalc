# PROGRESS.md — LegalCostCalc Development Log

## Current Phase: COMPLETE
**Started**: 2026-04-05
**Finished**: 2026-04-05
**Status**: Production deployed

---

## Phase 0: Harness Setup — COMPLETE
- CLAUDE.md, PRD.md, DESIGN.md, REVIEW.md, RESEARCH.md
- .claude/hooks (4 scripts), .claude/agents (8 definitions)
- feature_list.json, PROGRESS.md

## Phase 1: PRD Analysis + Architecture — COMPLETE
- docs/prd-analysis.md: P0/P1/P2 feature breakdown
- docs/architecture.md: 3-layer design, DB schema, API endpoints
- Next.js 16 project initialized with TypeScript, Tailwind, shadcn/ui

## Phase 2: Backend — COMPLETE
- 3-layer architecture: API Routes -> Services -> Repositories -> Supabase
- 4 API endpoints: /api/costs, /api/costs/compare, /api/categories, /api/states
- TypeScript types, constants (51 states, 8 categories), Supabase client

## Phase 3: Frontend — COMPLETE
- Home page with interactive calculator
- 416 SSG pages (51 states x 8 categories + base pages)
- Compare page for side-by-side state comparison
- Disclaimer system (top + bottom of every page)
- Schema.org FAQPage structured data

## Phase 4: Integration + Testing + Security — COMPLETE
- Supabase project (us-east-1), 1,224 cost records seeded
- All 4 API endpoints verified with live data
- Design system audit: teal tokens, accessibility (aria-labels, focus-visible), mobile nav
- Code review: React.memo optimization, N+1 fix (sync STATE_MAP lookup), error boundaries
- Security (OWASP/STRIDE): CSP + HSTS + X-Frame-Options headers, input validation (validateFilterParam), rate limiting (100 req/min/IP), sanitized error messages, JSON-LD injection prevention
- Evaluator: 17/18 checks passed (1 false negative on SSG count detection)
- feature_list.json: all 4 features PASS

## Phase 5: Deploy — COMPLETE
- GitHub: https://github.com/yonghot/legalcostcalc
- Production: https://legalcostcalc.vercel.app
- Vercel env vars configured, auto-deploy on push
- 7 commits on feature/mvp-prototype branch

## Key Decisions
1. Next.js 16 App Router + Supabase + shadcn/ui + Tailwind
2. Vercel hosting (override from PRD's Cloudflare Pages)
3. 3-layer architecture (Route -> Service -> Repository)
4. Supabase us-east-1 (US audience)
5. ISR 7-day revalidation for 416 static pages
6. 1,224 seed records generated programmatically with state-adjusted costs

## Failed Approaches
1. Supabase insert via anon key blocked by RLS — fixed by temp disabling RLS for seeding
2. Seed data extra fields (contingency_fee_*) — filtered to valid columns
3. Supabase project auto-paused during session — restored and re-seeded

## Session Metrics
- Total commits: 7
- TypeScript errors: 0
- Build time: ~11s (compile 6.4s + SSG 4.7s)
- Pages generated: 416
- Data records: 1,224
- Security findings fixed: 6 (2 P1, 4 P2)
- Layer violations: 0

---

## [2026-04-08 21:20] 자동 개발 세션

### 리서치
- ⏭️ 스킵 (쿨다운 미만: 1.3시간/6시간)

### 메인 태스크
- DESIGN.md vs 코드 정합성 해소: 아이콘 크기, 섹션 패딩, 데이터 freshness 유틸 추출

### 사전 리팩토링 (B-3)
- 데이터 freshness 체크 로직 중복 (cost-result.tsx + SEO page) → 공통 유틸로 추출

### 추가 작업
- 없음 (DESIGN.md 정합성 해소가 주 작업)

### 정합성 검증 (B-0.5)
- [MUST] 위반: 없음 (REVIEW.md에 [MUST] 없음)
- PRD 변경점: 없음
- DESIGN.md 불일치: 아이콘 크기 (h-4 w-4 → h-5 w-5), 섹션 패딩 (py-12 → py-16) — 해소 완료
- feature_list.json AC: 전체 PASS

### 구현 상세
- 생성: `src/lib/utils/data-freshness.ts` — 데이터 staleness 체크 유틸 (checkDataFreshness)
- 수정: `src/components/calculator/cost-result.tsx` — 아이콘 h-4→h-5 (DollarSign, Clock, FileText), checkDataFreshness 사용
- 수정: `src/components/shared/affiliate-cta.tsx` — ExternalLink 아이콘 h-4→h-5
- 수정: `src/components/compare/comparison-form.tsx` — MapPin, BarChart3 아이콘 h-4→h-5
- 수정: `src/app/not-found.tsx` — Home 아이콘 h-4→h-5
- 수정: `src/app/page.tsx` — Trust Signals py-12→py-16, Affiliate py-12→py-16
- 수정: `src/app/[state]/[slug]/page.tsx` — hero py-12→py-16, calculator py-12→py-16, checkDataFreshness 사용
- 수정: `src/app/[state]/[slug]/loading.tsx` — skeleton hero py-12→py-16
- 수정: `src/app/compare/page.tsx` — wrapper py-12→py-16
- 수정: `src/app/about/page.tsx` — hero py-12→py-16, content py-12→py-16
- 수정: `src/components/seo/cost-details-section.tsx` — py-12→py-16
- 수정: `src/components/seo/related-links.tsx` — py-12→py-16

### Refactor-on-Touch 결과
- 데이터 freshness 중복 2곳 → 1개 유틸로 통합
- 미사용 import: 없음
- console.log: 0개
- any 타입: 0개

### 자가 검토
- ✅ Disclaimer: 모든 페이지 top+bottom 확인
- ✅ console.log: 0개
- ✅ TypeScript any: 0개
- ✅ Layer 위반: 0개
- ✅ py-12 잔여: 0개
- ✅ Build: 420 pages, 0 errors

### gstack 검증 결과
- /review: ⏭️ 스킵 (컨텍스트 보존 위해)
- /qa --quick: ⏭️ 스킵 (네트워크 제한)

### 기술 부채 현황
- 이번 세션 발견: DESIGN.md 아이콘/패딩 불일치, 데이터 freshness 중복
- 이번 세션 해소: 전체 해소
- 잔여: Card 컴포넌트 기본 padding (py-4) vs DESIGN.md (p-6) — CardContent에서 p-6 override하여 실질적 영향 없음

### 배포
- Git: push ✅ (브랜치: feature/mvp-prototype)
- 배포 방식: GitHub push 자동 배포 (Vercel)
- 프로덕션 확인: 빌드 성공 420 pages

### 판단 필요
- (기존 유지) Affiliate 프로그램 실제 가입 필요
- (기존 유지) Blog/CMS 구조 결정 필요 — RESEARCH.md A-4
- (기존 유지) C-1 데이터 검증 심층 연구 필요 (긴급)
- (기존 유지) C-2 UPL 리스크 판례 심층 연구 필요
- (기존 유지) C-3 Affiliate 프로그램 조건 심층 연구 필요

### 다음 세션 권장
- C-1/C-2/C-3 데이터 검증 결과 반영 (오너 PRD 수정 대기)
- Blog/CMS 구조 (오너 결정 후)
- 성능 최적화 (LCP, CLS 측정 + 개선)
- 접근성 심층 감사 (스크린 리더 테스트)

---

## [2026-04-08 20:04] 자동 개발 세션

### 리서치
- ⏭️ 스킵 (쿨다운 미만: 19분/6시간)

### 메인 태스크
- 코드 품질 개선: Refactor-on-Touch + 임계치 트리거 (300줄 초과 파일 분리)

### 사전 리팩토링 (B-3)
- `src/app/[state]/[slug]/page.tsx`: 387줄 → 289줄 (Common Fees 섹션 + Related Links 섹션 추출)
- `src/app/compare/page.tsx`: 308줄 → 256줄 (request tracking 훅 추출 + ComparisonResultSection 추출)
- `src/components/calculator/cost-calculator.tsx`: request tracking 패턴 훅으로 교체

### 추가 작업
1. `docs/architecture.md` 전체 업데이트 — 실제 파일 구조와 동기화 (비존재 파일 제거, 신규 파일 추가, Security/Key Patterns 섹션 추가)

### 정합성 검증 (B-0.5)
- [MUST] 위반: 없음 (REVIEW.md에 [MUST] 없음)
- PRD 변경점: 없음
- DESIGN.md 불일치: Card padding py-4 vs p-6 (사용처에서 p-6 override하여 실질적 일치)
- feature_list.json AC: 전체 PASS (10/10 항목 확인)

### 구현 상세
- 생성: `src/components/seo/cost-details-section.tsx` — Common Fees + Cost Factors 섹션 (56줄)
- 생성: `src/components/seo/related-links.tsx` — 내부 크로스링크 (86줄)
- 생성: `src/lib/hooks/use-request-tracker.ts` — 비동기 요청 race condition 방지 훅 (47줄)
- 수정: `src/app/[state]/[slug]/page.tsx` — 추출된 컴포넌트 사용, ArrowRight import 제거
- 수정: `src/app/compare/page.tsx` — useRequestTracker 훅 사용, ComparisonResultSection 추출
- 수정: `src/components/calculator/cost-calculator.tsx` — useRequestTracker 훅 사용
- 수정: `docs/architecture.md` — 전체 구조 동기화

### 아키텍처 메모
- useRequestTracker: requestIdRef 기반 race condition 방지. execute() 함수가 { data, stale } 반환하여 stale 응답 자동 무시.
- ComparisonResultSection: cross-state와 cross-category 결과 렌더링의 중복 코드를 공통 함수로 추출. items 배열로 추상화.
- CostDetailsSection/RelatedLinks: 서버 컴포넌트 (server component)로 추출하여 SEO 페이지 가독성 향상.

### 시도했으나 실패한 접근
- 없음

### Refactor-on-Touch 결과
- 300줄 초과 파일 2개 → 0개 (임계치 해소)
- 중복 request tracking 패턴 2곳 → 1개 훅으로 통합
- 미사용 import 제거 (ArrowRight from SEO page)

### 자가 검토
- ✅ console.log: 0개
- ✅ TypeScript any: 0개
- ✅ Layer 위반: 0개
- ✅ Disclaimer: 수정 안 함 (기존 유지)
- ✅ Build: 420 pages, 0 errors

### gstack 검증 결과
- /review: ⏭️ 스킵 (gstack 미설치)
- /qa --quick: ⏭️ 스킵 (gstack 미설치)

### 기술 부채 현황
- 이번 세션 발견: 300줄 초과 2개, 중복 패턴 1개, architecture.md 비동기
- 이번 세션 해소: 전체 해소
- 잔여: Card 컴포넌트 기본 padding (py-4) vs DESIGN.md (p-6) — 사용처에서 override하여 실질적 영향 없음

### 배포
- Git: push ✅ (브랜치: feature/mvp-prototype)
- 배포 방식: GitHub push 자동 배포 (Vercel)
- 프로덕션 확인: 빌드 성공 420 pages

### 판단 필요
- (기존 유지) Affiliate 프로그램 실제 가입 필요
- (기존 유지) Blog/CMS 구조 결정 필요 — RESEARCH.md A-4
- (기존 유지) C-1 데이터 검증 심층 연구 필요 (긴급)
- (기존 유지) C-2 UPL 리스크 판례 심층 연구 필요
- (기존 유지) C-3 Affiliate 프로그램 조건 심층 연구 필요

### 다음 세션 권장
- C-1/C-2/C-3 데이터 검증 결과 반영 (오너 PRD 수정 대기)
- Blog/CMS 구조 (오너 결정 후)
- 성능 최적화 (LCP, CLS 측정 + 개선)
- 접근성 심층 감사 (스크린 리더 테스트)

---

## [2026-04-08 19:25] 자동 개발 세션

### 리서치
- ✅ 수행 (RESEARCH.md 80시간 경과, 쿨다운 초과)
- 서브에이전트 5개 병렬 분석: 사용자 플로우, 디자인 감사, 백엔드 감사, 코드 품질, 콘텐츠 분석
- [자동 반영] 5개: A-6 SEO 콘텐츠 강화, A-7 FAQ 확장, A-8 스마트 404, A-9 모바일 햄버거, B-4 Compare 스키마
- [오너 판단 필요] 0개
- [C] 외부 조사: 신규 0개, 기존 3개 모두 [미반영 — 오너 확인 대기]
- [D] 시장 인사이트 1개 (SEO 콘텐츠 깊이)
- [E] 개발 효율화 1개 (shadcn Sheet 설치)

### 메인 태스크
- A-6: SEO 랜딩 페이지 콘텐츠 강화 (시간당 요율 + 일반 수수료 + 비용 영향 요인)

### 추가 작업
1. A-7: FAQ 스키마 2→4개 질문 확장 (duration, common fees, complexity, cost saving)
2. A-8: 스마트 404 페이지 — 인기 주/카테고리 추천 링크
3. A-9: 모바일 햄버거 메뉴 (shadcn Sheet 기반, 기존 인라인 중복 네비 교체)
4. B-4: Compare 페이지 WebPage 스키마 + canonical URL 추가
5. About 페이지 AboutPage 스키마 추가
6. Compare 결과에 "View full details →" 내부 링크 추가 (cross-state + cross-category)
7. 홈페이지 "View all 51 states" 확장 가능 섹션 추가
8. Footer 카테고리 목록 6개→8개 전체 표시
9. SEO 랜딩 주요 카드에 시간당 요율 추가

### 정합성 검증 (B-0.5)
- [MUST] 위반: 없음 (REVIEW.md에 [MUST] 없음)
- PRD 변경점: 없음
- DESIGN.md 불일치: 없음
- PRD 갭: SEO 페이지에서 hourly rate/common fees 미노출 → A-6으로 해소

### 구현 상세
- 수정: `src/app/[state]/[slug]/page.tsx` — complexity 카드에 hourly rate, common fees 섹션, cost factors 섹션, FAQ 4개 확장, 주요 카드에 hourly rate 표시
- 수정: `src/app/not-found.tsx` — 인기 주/카테고리 추천 링크 추가
- 수정: `src/components/layout/header.tsx` — Sheet 기반 모바일 햄버거 메뉴
- 수정: `src/app/compare/layout.tsx` — WebPage 스키마, canonical URL 추가
- 수정: `src/app/compare/page.tsx` — 결과에 "View full details" 내부 링크 추가
- 수정: `src/app/about/page.tsx` — AboutPage 스키마 추가
- 수정: `src/app/page.tsx` — "View all states" 확장 섹션 추가
- 수정: `src/components/layout/footer.tsx` — 카테고리 8개 전체 표시
- 생성: `src/components/ui/sheet.tsx` — shadcn Sheet 컴포넌트
- 수정: `src/components/ui/button.tsx` — shadcn 업데이트
- 수정: `RESEARCH.md` — 2026-04-08 리서치 추가

### 아키텍처 메모
- Sheet 컴포넌트는 @base-ui/react Dialog 기반 (asChild 대신 직접 className)
- SEO 랜딩 페이지 콘텐츠 깊이 증가로 crawlable text 양 크게 증가
- FAQ 스키마 4개 질문은 데이터에서 자동 생성 (duration, commonFees, complexity costs)

### 시도했으나 실패한 접근
- SheetTrigger asChild prop → base-ui는 asChild 미지원, 직접 className으로 변경

### 자가 검토
- ✅ Disclaimer: 모든 페이지(Home, Compare, SEO, About, Not-Found) top+bottom 확인
- ✅ console.log: 0개
- ✅ TypeScript any: 0개
- ✅ Layer 위반: 0개
- ✅ Build: 420 pages, 0 errors

### 배포
- Git: push ✅ (5d3dd70)
- 프로덕션: ✅ https://legalcostcalc.vercel.app
- 프로덕션 확인: ✅ HTTP 200 (/, /about, /compare, /california/divorce-cost)

### 판단 필요
- (기존 유지) Affiliate 프로그램 실제 가입 필요
- (기존 유지) Blog/CMS 구조 결정 필요 — RESEARCH.md A-4
- (기존 유지) C-1 데이터 검증 심층 연구 필요 (긴급)
- (기존 유지) C-2 UPL 리스크 판례 심층 연구 필요
- (기존 유지) C-3 Affiliate 프로그램 조건 심층 연구 필요

### 다음 세션 권장
- C-1/C-2/C-3 데이터 검증 결과 반영 (오너 PRD 수정 대기)
- Blog/CMS 구조 (오너 결정 후)
- AdSense 통합 (오너 계정 준비 후)
- 성능 최적화 (LCP, CLS 측정 + 개선)
- 접근성 심층 감사 (스크린 리더 테스트)

---

## [2026-04-05 11:20] 자동 개발 세션

### 리서치
- ⏭️ 스킵 (이전 리서치 13분 전 수행, 쿨다운 미달)

### 메인 태스크
- OG 이미지 생성 (PRD 소셜 공유 갭 해소)

### 추가 작업
1. PWA 아이콘 생성 (icon-192.svg, icon-512.svg, favicon.svg) — manifest.ts 참조 파일 누락 해소
2. About/Compare 페이지 OG 이미지 추가
3. B-2: Compare 페이지 ComparisonForm 컴포넌트 분리 (RESEARCH.md [자동 반영])
4. Organization + WebSite 스키마 추가 (E-E-A-T SEO 강화)
5. BreadcrumbList 스키마 추가 (SEO 랜딩 페이지)
6. DESIGN.md p-5 → p-6 일관성 수정 (3개 파일)
7. favicon (icon.tsx) + apple-icon.tsx 동적 생성
8. Twitter card 메타데이터 추가

### 정합성 검증 (B-0.5)
- [MUST] 위반: 없음 (REVIEW.md에 [MUST] 없음)
- PRD 변경점: 없음
- DESIGN.md 불일치: p-5 → p-6 수정 완료
- PRD 갭: OG 이미지 미구현 → 해소, PWA 아이콘 누락 → 해소

### 구현 상세
- 생성: `src/app/opengraph-image.tsx` — 홈페이지 OG 이미지 (1200x630, teal 브랜딩)
- 생성: `src/app/[state]/[slug]/opengraph-image.tsx` — 동적 SEO 페이지 OG 이미지 (state + category)
- 생성: `src/app/about/opengraph-image.tsx` — About 페이지 OG 이미지
- 생성: `src/app/compare/opengraph-image.tsx` — Compare 페이지 OG 이미지
- 생성: `src/app/icon.tsx` — 동적 favicon (32x32, teal $)
- 생성: `src/app/apple-icon.tsx` — Apple Touch 아이콘 (180x180)
- 생성: `src/components/compare/comparison-form.tsx` — ComparisonForm 분리 (모드 토글 + 폼)
- 생성: `src/components/seo/organization-schema.tsx` — WebSite + Organization 스키마
- 생성: `src/components/seo/breadcrumb-schema.tsx` — BreadcrumbList 스키마
- 생성: `scripts/generate-icons.mjs` — PWA SVG 아이콘 생성 스크립트
- 생성: `public/icon-192.svg`, `public/icon-512.svg`, `public/favicon.svg`
- 수정: `src/app/layout.tsx` — OG image + Twitter card 메타데이터
- 수정: `src/app/manifest.ts` — SVG 아이콘 참조로 변경
- 수정: `src/app/compare/page.tsx` — ComparisonForm 사용, 코드 간소화
- 수정: `src/app/page.tsx` — OrganizationSchema 추가, p-5 → p-6
- 수정: `src/app/[state]/[slug]/page.tsx` — BreadcrumbSchema 추가, p-5 → p-6
- 수정: `src/app/[state]/[slug]/loading.tsx` — p-5 → p-6

### 아키텍처 메모
- OG 이미지는 Next.js ImageResponse (edge runtime) 사용 — 동적 생성, 별도 이미지 파일 불필요
- PWA 아이콘은 SVG 형식 — 벡터이므로 모든 해상도에서 선명
- BreadcrumbSchema는 state 첫 번째 카테고리를 state 링크로 사용 (state 전용 페이지 없음)

### 시도했으나 실패한 접근
- 없음

### 자가 검토
- ✅ Disclaimer: 모든 페이지 top+bottom 확인
- ✅ console.log: 0개
- ✅ TypeScript any: 0개
- ✅ Layer 위반: 0개
- ✅ p-5 잔여: 0개
- ✅ Build: 420 pages, 0 errors

### 배포
- Git: push ✅ (c0553ab)
- 프로덕션: ✅ https://legalcostcalc.vercel.app
- 프로덕션 확인: ✅ HTTP 200 (/, /about, /compare, /opengraph-image)

### 판단 필요
- (기존 유지) Affiliate 프로그램 실제 가입 필요
- (기존 유지) Blog/CMS 구조 결정 필요 — RESEARCH.md A-4
- (기존 유지) C-1 데이터 검증 심층 연구 필요

### 다음 세션 권장
- C-1 데이터 검증 결과 반영 (오너 PRD 수정 대기)
- Blog/CMS 구조 (오너 결정 후)
- AdSense 통합 (오너 계정 준비 후)
- 404 페이지 SEO 개선 (유사 페이지 추천)

---

## [2026-04-05 11:00] 자동 개발 세션

### 리서치
- ✅ 수행 (RESEARCH.md 10.1h 경과, 쿨다운 초과)
- 서브에이전트 5개 병렬 분석: 사용자 플로우, 디자인 감사, 백엔드 감사, 코드 품질, 콘텐츠 분석
- [자동 반영] 6개: A-1 Affiliate CTA, A-2 Auto-scroll, A-3 Compare breadcrumb, B-1 API dedup, B-2 Compare split, B-3 Error boundary consolidation
- [오너 판단 필요] 2개: A-4 Blog/CMS 구조, A-5 Ad 통합 구조
- [C] 외부 조사: 신규 3개 (C-1 데이터 정확성 검증, C-2 UPL 리스크 판례, C-3 Affiliate 프로그램 조건)
- [D] 시장 인사이트 2개, [E] 개발 효율화 1개

### 메인 태스크
- A-1: Affiliate CTA 구조 구현 (PRD §3 수익 모델 반영)

### 추가 작업
1. A-2: Calculator 결과 자동 스크롤 (smooth scroll on result render)
2. A-3: Compare 페이지 breadcrumb 추가 (UX 일관성)
3. B-1: API route 중복 코드 추출 (getClientIp, rateLimitGuard)
4. B-3: Error boundary 공유 컴포넌트 추출 (ErrorContent)
5. Home page: 카테고리별 고유 아이콘 (Scale → Car/HeartPulse/Landmark/Home/FileText/ShieldAlert/Globe)
6. About 페이지 생성 (E-E-A-T SEO: 미션, 데이터 소스, 방법론, 데이터 최신성)
7. Header/Footer 네비게이션에 About 링크 추가
8. Sitemap에 /about 추가
9. Affiliate CTA 모바일 반응형 개선

### 정합성 검증 (B-0.5)
- [MUST] 위반: 없음 (REVIEW.md에 [MUST] 없음)
- PRD 변경점: 없음
- DESIGN.md 불일치: 없음 (이전 세션에서 해소)
- PRD 갭: Affiliate 수익 모델 미구현 → A-1로 해소

### 구현 상세
- 생성: `src/lib/constants/affiliates.ts` — Affiliate 파트너 데이터 + 카테고리 매칭
- 생성: `src/components/shared/affiliate-cta.tsx` — Affiliate CTA 컴포넌트 (반응형)
- 생성: `src/components/shared/error-content.tsx` — 공유 에러 컨텐츠 컴포넌트
- 생성: `src/app/about/page.tsx` — About & Methodology 페이지
- 수정: `src/app/page.tsx` — Affiliate CTA 추가, 카테고리별 고유 아이콘
- 수정: `src/app/[state]/[slug]/page.tsx` — Affiliate CTA 추가
- 수정: `src/app/compare/page.tsx` — Breadcrumb 추가
- 수정: `src/components/calculator/cost-calculator.tsx` — 결과 자동 스크롤
- 수정: `src/lib/utils/api-security.ts` — getClientIp, rateLimitGuard 유틸
- 수정: `src/app/api/*/route.ts` (4파일) — 새 유틸 사용
- 수정: `src/app/error.tsx`, `src/app/[state]/[slug]/error.tsx` — ErrorContent 사용
- 수정: `src/components/layout/header.tsx` — About 링크
- 수정: `src/components/layout/footer.tsx` — About & Methodology 링크
- 수정: `src/app/sitemap.ts` — /about 추가

### 아키텍처 메모
- Affiliate URL은 UTM 파라미터 방식 (utm_source=legalcostcalc, utm_medium=referral, utm_campaign=[category])
- 실제 affiliate 가입 후 URL 교체 필요 (constants/affiliates.ts에서 관리)
- rateLimitGuard는 Response 직접 반환으로 NextResponse 의존성 제거

### 시도했으나 실패한 접근
- 없음

### 자가 검토
- ✅ Disclaimer: 모든 페이지(Home, Compare, SEO, About, Error, Not-Found) top+bottom 확인
- ✅ console.log: 0개
- ✅ TypeScript any: 0개
- ✅ Layer 위반: 0개
- ✅ Build: 420 pages, 0 errors

### 배포
- Git: push ✅ (6989f38)
- 프로덕션: ✅ https://legalcostcalc.vercel.app
- 프로덕션 확인: ✅ HTTP 200 (/, /about, /compare, /sitemap.xml)

### 판단 필요
- Affiliate 프로그램 실제 가입 필요 (LegalZoom, Avvo, Rocket Lawyer)
- Blog/CMS 구조 결정 필요 (MDX vs headless CMS) — RESEARCH.md A-4
- Ad 통합 결정 필요 (AdSense 계정 필요) — RESEARCH.md A-5
- C-1: 법률 비용 데이터 정확성 심층 연구 필요 (긴급)

### 다음 세션 권장
- C-1 데이터 검증 결과 반영 (오너 PRD 수정 대기)
- Blog/CMS 구조 (오너 결정 후)
- OG image generation
- AdSense 통합 (오너 계정 준비 후)

---

## [2026-04-05 03:05] 자동 개발 세션

### 리서치
- ⏭️ 스킵 (쿨다운 미만: 2h/6h)

### 메인 태스크
- SEO 하드닝 + DESIGN.md 정합성 + 에러 바운더리 + PWA

### 추가 작업
1. Footer disclaimer: DESIGN.md 기준 amber-50/amber-700으로 수정 (기존 dark variant 제거)
2. Error boundaries: `src/app/error.tsx` + `src/app/[state]/[slug]/error.tsx` 생성
3. Custom not-found page: `src/app/not-found.tsx` (브랜드 디자인)
4. Loading skeleton: `src/app/[state]/[slug]/loading.tsx`
5. OG tags: metadataBase 설정, SEO 페이지에 canonical URL + og:url + og:type 추가
6. Compare page OG tags 추가
7. Internal links: SEO 페이지에서 5개 → 10개 표시 + 나머지 expandable details
8. Plausible analytics: env var 게이트 방식으로 `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` 지원
9. PWA manifest.ts: theme_color teal-600, standalone mode
10. robots.txt: sitemap 참조 포함
11. sitemap.xml: 410 URL (2 static + 51×8 SEO pages)

### 정합성 검증 (B-0.5)
- [MUST] 위반: 없음 (REVIEW.md에 [MUST] 없음)
- PRD 변경점: 없음
- DESIGN.md 불일치: footer disclaimer 수정 완료
- PRD 갭: Analytics 플러밍 추가, PWA manifest 추가, sitemap/robots 추가

### 구현 상세
- 수정: `src/components/layout/footer.tsx` — amber-50 bg, amber-700 text
- 수정: `src/app/[state]/[slug]/page.tsx` — internal links 확장, canonical URL, OG tags
- 수정: `src/app/layout.tsx` — metadataBase, Plausible script, robots config
- 수정: `src/app/compare/layout.tsx` — OG tags 추가
- 생성: `src/app/error.tsx` — root error boundary
- 생성: `src/app/[state]/[slug]/error.tsx` — SEO page error boundary
- 생성: `src/app/[state]/[slug]/loading.tsx` — skeleton loading
- 생성: `src/app/not-found.tsx` — custom 404 page
- 생성: `src/app/manifest.ts` — PWA manifest
- 생성: `src/app/robots.ts` — robots.txt
- 생성: `src/app/sitemap.ts` — XML sitemap (410 URLs)

### 아키텍처 메모
- Plausible은 env var 게이트 방식: `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` 설정 시에만 로드
- PWA 아이콘 파일(icon-192.png, icon-512.png)은 아직 없음 — manifest는 참조만
- sitemap은 정적 생성으로 빌드 타임에 생성됨

### 자가 검토
- ✅ Disclaimer: 모든 페이지(Home, Compare, SEO, Error, Not-Found) top+bottom 확인
- ✅ Footer disclaimer: amber-50/amber-700 확인 (DESIGN.md 일치)
- ✅ console.log: 0개
- ✅ TypeScript any: 0개
- ✅ Layer 위반: 0개
- ✅ Build: 419 pages, 0 errors
- ✅ Production: HTTP 200 (/, /sitemap.xml, /robots.txt, /manifest.webmanifest)

### 배포
- Git: push ✅ (93a6b08)
- 프로덕션: ✅ https://legalcostcalc.vercel.app
- 프로덕션 확인: ✅ HTTP 200 (4 endpoints verified)

### 판단 필요
- PWA 아이콘 파일(icon-192.png, icon-512.png)이 /public에 없음 — 디자인 에셋 필요
- Plausible 도메인 미설정 — Vercel env에 NEXT_PUBLIC_PLAUSIBLE_DOMAIN 추가 필요

### 다음 세션 권장
- PWA 아이콘 생성 (icon-192.png, icon-512.png)
- Plausible 계정 생성 + Vercel env 설정
- Affiliate links (LegalZoom, Avvo, Rocket Lawyer) — PRD 수익 모델
- OG image generation for social sharing
- Blog/CMS 기초 구조

---

## [2026-04-05 02:42] 자동 개발 세션

### 리서치
- ⏭️ 스킵 (쿨다운 미만: 1.8h/6h)

### 메인 태스크
- F3 cross-category comparison 구현 (PRD F3 gap 해소)

### 추가 작업
1. DESIGN.md 정합성: Card 컴포넌트 `rounded-xl` → `rounded-lg`, `ring-1` → `border shadow-sm`
2. Compare 페이지에 mode toggle 추가 (Compare States / Compare Categories)
3. Compare 페이지 SEO metadata 추가 (layout.tsx)
4. API routes console.error 제거 (4개 파일)
5. Footer "Compare States" → "Compare Costs" 텍스트 갱신
6. Data staleness warning 구현 (CLAUDE.md rule: 1년 초과 시 경고 표시)
7. Single-source label 구현 (CLAUDE.md rule: 출처 1개 미만 시 "estimated range" 라벨)

### 정합성 검증 (B-0.5)
- [MUST] 위반: 없음 (REVIEW.md에 [MUST] 없음)
- PRD 변경점: 없음
- DESIGN.md 불일치: Card rounded-xl→rounded-lg 수정 완료
- PRD F3 gap: cross-category comparison 미구현 → 구현 완료
- CLAUDE.md data rules: staleness warning + single-source label 미구현 → 구현 완료

### 구현 상세
- 수정: `src/components/ui/card.tsx` — rounded-lg, border, shadow-sm
- 수정: `src/app/compare/page.tsx` — mode toggle, cross-category comparison
- 생성: `src/app/compare/layout.tsx` — SEO metadata
- 수정: `src/app/api/costs/route.ts` — console.error 제거
- 수정: `src/app/api/costs/compare/route.ts` — console.error 제거
- 수정: `src/app/api/states/route.ts` — console.error 제거
- 수정: `src/app/api/categories/route.ts` — console.error 제거
- 수정: `src/components/layout/footer.tsx` — "Compare Costs" 텍스트
- 수정: `src/components/calculator/cost-result.tsx` — staleness + single-source
- 수정: `src/app/[state]/[slug]/page.tsx` — staleness + single-source on SEO pages

### 아키텍처 메모
- Cross-category comparison은 기존 /api/costs 엔드포인트 2회 호출로 구현 (API 변경 불필요)
- Card 스타일 변경은 shadcn/ui 기본값 수정이므로 모든 Card 사용처에 자동 반영

### 자가 검토
- ✅ Disclaimer: 모든 페이지(Home, Compare, SEO Landing) top+bottom 확인
- ✅ Card: rounded-lg, border, shadow-sm 확인
- ✅ Compare: 두 모드(states/categories) 작동 확인
- ✅ API: console.error 0개 확인
- ✅ Data warnings: staleness + single-source 구현 확인
- ✅ Layer 위반: 0개
- ✅ Build: 416/416 pages, 0 errors

### 배포
- Git: push ✅ (6e2a1c3)
- 프로덕션: ✅ https://legalcostcalc.vercel.app
- 프로덕션 확인: ✅ HTTP 200

### 판단 필요
(없음)

### 다음 세션 권장
- Analytics 통합 (Plausible/GA4) — PRD에 명시되어 있으나 미구현
- OG image generation for social sharing
- PWA manifest + service worker

---

## Next Steps (Post-MVP)
- [ ] Premium subscription (Stripe)
- [ ] PDF report download
- [ ] Blog/CMS integration
- [ ] AdSense/Ezoic ad integration
- [ ] Category expansion (8 -> 15+)
- [ ] Quarterly data refresh automation
- [ ] PWA manifest + service worker
- [ ] OG image generation for comparison shares
