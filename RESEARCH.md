# RESEARCH.md — Technical Research Log

## Template
```
### [DATE] — [TOPIC]
**Question**: What we needed to know
**Findings**: What we learned
**Decision**: What we chose and why
**Sources**: URLs, docs, references
```

---

## 2026-04-11 리서치

**리서치 일시**: 2026-04-11 UTC
**코드베이스 상태**: 4/4 기능 pass, 420 pages, 빌드 ✅, 프로덕션 배포 완료

---

### [A] 방향/기능 제안

없음 (폴리시 세션, 기존 항목 반영 단계)

---

### [B] 코드 개선

### B-5: About 페이지 error boundary 누락 [자동 반영]
- **대상 파일**: `src/app/about/error.tsx` (파일 없음)
- **문제**: Compare, SEO landing, 루트 `app/error.tsx`는 error boundary 보유하나 About 페이지는 전용 error.tsx 없음. 루트 error.tsx가 fallback으로 동작하나 카테고리별 메시지 부재.
- **제안**: Compare/error.tsx 패턴 그대로 About 전용 error.tsx 추가.
- **위험도**: 낮음

### B-6: Compare/About 페이지 BreadcrumbSchema 누락 [자동 반영]
- **대상 파일**: `src/app/compare/page.tsx`, `src/app/about/page.tsx`
- **문제**: 시각적 breadcrumb nav는 존재하나 schema.org BreadcrumbList 구조화 데이터는 SEO landing 페이지(`/[state]/[slug]`)에만 적용됨. Compare와 About는 크롤러가 계층을 인식하지 못함.
- **제안**: 기존 `BreadcrumbSchema` 컴포넌트(`src/components/seo/breadcrumb-schema.tsx`) 재사용하여 Compare, About 페이지에도 삽입. Compare는 client component이지만 BreadcrumbSchema가 script 태그만 렌더하므로 안전.
- **위험도**: 낮음

### B-7: Compare 페이지 schema.org WebPage 데이터 누락 [자동 반영]
- **대상 파일**: `src/app/compare/page.tsx`
- **문제**: Home/SEO/About는 schema.org 구조화 데이터 포함. Compare 페이지는 BreadcrumbList도, WebPage도 없음. 이전 리서치 B-4에서 이미 제안됐으나 미반영.
- **제안**: WebPage 스키마 + BreadcrumbSchema 조합.
- **위험도**: 낮음

---

### [C] 외부 조사

[C] 항목 변경 없음. 기존 C-1/C-2/C-3 오너 확인 대기 상태 유지.

---

### [E] 개발 효율화

### E-3: 루트 error.tsx vs 페이지별 error.tsx 역할 정리
- **관찰**: Next.js App Router는 가장 가까운 `error.tsx`를 fallback으로 사용. 루트 `src/app/error.tsx` + `src/app/compare/error.tsx` + `src/app/[state]/[slug]/error.tsx`이 이미 존재. 페이지별 error.tsx는 해당 경로 메시지만 커스터마이징하는 역할.
- **적용 가능성**: About 페이지도 동일 패턴. 루트 fallback은 잘못된 contextual 메시지를 보여줄 수 있음.

---

## 2026-04-08 10:25 리서치

**리서치 일시**: 2026-04-08 10:25 UTC
**코드베이스 상태**: 4/4 기능 pass, 420 pages, 빌드 ✅, 프로덕션 배포 완료

---

### [A] 방향/기능 제안

### A-6: SEO 랜딩 페이지 콘텐츠 강화 — 시간당 요율 + 일반 수수료 표시 [자동 반영]
- **현재 상태**: SEO 랜딩 페이지(`/[state]/[slug]`)의 complexity 카드에 median cost와 range만 표시. 시간당 요율(hourly rate)과 일반 수수료(common fees)는 interactive calculator 결과에서만 표시됨.
- **제안**: complexity 카드에 hourly rate 추가, 별도 "Common Fees" 섹션 추가. SEO 콘텐츠량 증가 + 사용자가 calculator 없이도 핵심 정보 확인 가능.
- **근거**: PRD F1 AC에 "Results show hourly rate range", "Results show common fees breakdown" 명시. SEO 페이지에서도 이 정보가 직접 노출되어야 검색 엔진 크롤러가 인덱싱. 현재는 JS client-side 결과에서만 표시되어 검색 노출 안 됨.
- **구현 가이드**: `src/app/[state]/[slug]/page.tsx` complexity 카드에 hourly rate 추가, moderateCost 아래에 common fees 섹션 추가.
- **예상 작업량**: 0.5세션
- **부작용**: 없음 (UI 추가만)

### A-7: FAQ 스키마 질문 확장 (3→5+) [자동 반영]
- **현재 상태**: SEO 랜딩 페이지 FAQ 스키마에 2개 질문만 (총 비용, 시간당 요율). Google Rich Results에서 더 많은 질문이 노출되면 CTR 향상.
- **제안**: 3~4개 추가 질문: "How long does a [category] take?", "What are common [category] fees?", "Is [category] cost different by complexity?", "How to save on [category] costs?"
- **근거**: FAQ Rich Results는 질문 수에 비례하여 SERP 점유 면적 증가. 기존 데이터(duration, commonFees, complexity costs)를 활용하므로 추가 데이터 불필요.
- **구현 가이드**: `src/app/[state]/[slug]/page.tsx`의 faqQuestions 배열에 추가.
- **예상 작업량**: 15분
- **부작용**: 없음

### A-8: 스마트 404 페이지 — 유사 페이지 추천 [반영]
- **현재 상태**: 404 페이지가 generic "Page Not Found" + 홈 링크만 제공. URL 패턴을 분석하여 유사 페이지를 추천하면 이탈률 감소.
- **제안**: URL에서 state/category 패턴을 파싱하여 유사 페이지 링크 표시. 예: `/californai/divorce-cost` → "Did you mean California?" + 관련 페이지 링크.
- **근거**: PROGRESS.md "다음 세션 권장"에 "404 페이지 SEO 개선 (유사 페이지 추천)" 명시.
- **구현 가이드**: `src/app/not-found.tsx`에 URL 파싱 + 인기 페이지 링크 추가.
- **예상 작업량**: 0.5세션
- **부작용**: 없음

### A-9: 모바일 네비게이션 개선 — 햄버거 메뉴 [자동 반영]
- **현재 상태**: Header에서 모바일/데스크탑 네비게이션이 동일한 인라인 링크로 중복 구현. 3개 링크(Calculator, Compare, About)는 현재 충분하지만, 향후 Blog, Categories 등 추가 시 확장성 부족.
- **제안**: shadcn Sheet 컴포넌트로 모바일 햄버거 메뉴 구현. 데스크탑은 현재 유지.
- **근거**: DESIGN.md §6 "Mobile: Single column, stacked cards, full-width selects"에 모바일 최적화 원칙 명시. 현재 mobile nav는 화면 크기에 따라 링크가 좁아져 터치 타겟이 작아질 수 있음.
- **구현 가이드**: `src/components/layout/header.tsx`에 Sheet 컴포넌트 사용.
- **예상 작업량**: 0.5세션
- **부작용**: 없음 (shadcn Sheet은 이미 설치 가능)

---

### [B] 코드 개선

### B-4: Compare 페이지 schema.org 데이터 누락 [자동 반영]
- **대상 파일**: `src/app/compare/page.tsx`
- **문제**: Home, SEO Landing, About 페이지는 모두 schema.org 구조화 데이터를 포함하지만, Compare 페이지에는 없음. SEO 일관성 부족.
- **제안**: Compare 페이지에 WebPage 스키마 추가.
- **위험도**: 낮음

---

### [C] 외부 조사

[C] 작성 전 기존 항목 확인:
- C-1 (법률 비용 데이터 정확성 검증): git diff HEAD~10 -- PRD.md 결과 변경 없음 → [미반영 — 오너 확인 대기]
- C-2 (UPL 리스크 판례): git diff HEAD~10 -- PRD.md §10 변경 없음 → [미반영 — 오너 확인 대기]
- C-3 (Affiliate 프로그램 조건): git diff HEAD~10 -- PRD.md §3 변경 없음 → [미반영 — 오너 확인 대기]

신규 [C] 항목 없음. 기존 3개 모두 미반영 상태.

---

### [D] 시장 인사이트

### D-3: SEO 랜딩 페이지 콘텐츠 깊이와 SERP 순위 상관관계
- **발견**: YMYL 카테고리에서 Google은 "포괄적 콘텐츠"를 선호. 현재 SEO 페이지는 비용 수치 중심이며, 해설 텍스트가 적음. 시간당 요율, 일반 수수료, 비용 절감 팁 등의 텍스트 콘텐츠가 추가되면 콘텐츠 깊이 점수 향상.
- **적용 가능성**: A-6 (시간당 요율 + 일반 수수료 표시)이 직접 적용. 텍스트 콘텐츠 양 증가 → crawlable content 증가.
- **관련 기능**: A-6, A-7

---

### [E] 개발 효율화

### E-2: shadcn Sheet 컴포넌트 사전 설치
- **관찰**: 모바일 햄버거 메뉴(A-9)에 필요한 Sheet 컴포넌트가 아직 설치되지 않음.
- **제안**: `npx shadcn@latest add sheet` 실행하여 사전 준비.
- **기대 효과**: A-9 구현 시 즉시 사용 가능.

---

## 2026-04-05 02:00 리서치

**리서치 일시**: 2026-04-05 02:00 UTC
**코드베이스 상태**: 4/4 기능 pass, 419 pages, 빌드 ✅, 프로덕션 배포 완료

---

### [A] 방향/기능 제안

### A-1: Affiliate CTA 구조 추가 (SEO 랜딩 + 홈) [자동 반영]
- **현재 상태**: PRD §3에서 Affiliate(LegalZoom, Avvo, Rocket Lawyer)이 수익의 20-30%로 명시되어 있으나, 코드에 어떠한 affiliate CTA도 존재하지 않음. seed data의 sources에만 외부 URL 참조 있음.
- **제안**: 각 SEO 랜딩 페이지와 홈페이지에 "Find a Lawyer" / "Get Legal Help" CTA 섹션 추가. UTM 파라미터 포함 외부 링크 구조. 실제 affiliate URL은 constants에서 관리하여 오너가 쉽게 교체 가능.
- **근거**: PRD 명시 수익 모델. 코드 분석 결과 affiliate 관련 코드 0줄 확인. 기존 방향 강화.
- **구현 가이드**: `src/lib/constants/affiliates.ts` 생성 → `src/components/shared/affiliate-cta.tsx` 컴포넌트 → SEO page + Home에 삽입
- **예상 작업량**: 1세션
- **부작용**: 없음 (UI 추가만, 기존 기능 변경 없음)

### A-2: Home 페이지 Calculator 결과 자동 스크롤 [자동 반영]
- **현재 상태**: Calculator에서 "Calculate Cost" 클릭 시 결과가 아래에 렌더링되지만 자동 스크롤 없음. 모바일에서 결과가 화면 밖에 렌더링될 수 있음.
- **제안**: CostResult 렌더링 시 해당 영역으로 smooth scroll 추가.
- **근거**: UX 분석에서 core value delivery 경로의 마찰점으로 식별. 코드 분석 확인.
- **구현 가이드**: `cost-calculator.tsx`에서 결과 ref + scrollIntoView({ behavior: 'smooth' })
- **예상 작업량**: 0.5시간
- **부작용**: 없음

### A-3: Compare 페이지 Breadcrumb 추가 [자동 반영]
- **현재 상태**: SEO 랜딩 페이지는 breadcrumb 있으나 Compare 페이지에는 없음. 일관성 부족.
- **제안**: Compare 페이지에 `Home > Compare Costs` breadcrumb 추가.
- **근거**: UX 일관성. SEO 페이지 패턴과 동일하게 적용.
- **구현 가이드**: `src/app/compare/page.tsx` 상단에 breadcrumb nav 추가
- **예상 작업량**: 15분
- **부작용**: 없음

### A-4: Blog/CMS 기초 구조 [오너 판단 필요]
- **현재 상태**: PRD §8에서 "Monthly blog content: 4-8 articles" 명시. 코드에 blog 관련 구조 전무.
- **제안**: MDX 기반 `/blog` 라우트 + 기본 레이아웃 생성. 콘텐츠는 /content/blog/ 디렉토리에 .mdx 파일로 관리.
- **근거**: PRD SEO 전략의 핵심 요소. 하지만 아키텍처 결정(MDX vs CMS vs headless)이 필요.
- **예상 작업량**: 2-3세션
- **부작용**: 새 의존성 추가 가능 (next-mdx-remote 등)

### A-5: Ad 통합 기초 구조 [오너 판단 필요]
- **현재 상태**: PRD §3에서 Ads(AdSense → Ezoic → Mediavine)이 수익의 40-50%로 명시. 코드에 ad 관련 코드 없음.
- **제안**: 광고 슬롯 컴포넌트 생성 (placeholder). AdSense 스크립트 로더 추가.
- **근거**: PRD 최대 수익원. 하지만 AdSense 계정 + 승인이 필요하며, 광고 배치 위치는 사용자 경험에 직접 영향.
- **예상 작업량**: 1세션
- **부작용**: 페이지 로드 성능 영향 가능

---

### [B] 코드 개선

### B-1: API Route 중복 코드 추출 [자동 반영]
- **대상 파일**: `src/app/api/costs/route.ts`, `src/app/api/costs/compare/route.ts`, `src/app/api/categories/route.ts`, `src/app/api/states/route.ts`
- **문제**: IP 추출 로직(4줄)과 rate limit 처리(15줄)가 4개 API route에 중복.
- **제안**: `src/lib/utils/api-helpers.ts`에 `getClientIp()` 유틸 + `withRateLimit()` 미들웨어 추출.
- **위험도**: 낮음 (기능 변경 없음, 리팩토링만)

### B-2: Compare 페이지 컴포넌트 분리 [자동 반영] [반영]
- **대상 파일**: `src/app/compare/page.tsx`
- **문제**: 파일 크기가 큼 (코드 분석 결과). 비교 폼 UI가 인라인으로 구현되어 있어 가독성 낮음.
- **제안**: `ComparisonForm` 컴포넌트를 `src/components/compare/comparison-form.tsx`로 분리.
- **위험도**: 낮음

### B-3: Error Boundary 통합 [자동 반영]
- **대상 파일**: `src/app/error.tsx`, `src/app/[state]/[slug]/error.tsx`
- **문제**: 두 error boundary가 거의 동일한 코드. DRY 위반.
- **제안**: `src/components/shared/error-boundary-content.tsx` 공유 컴포넌트 추출.
- **위험도**: 낮음

---

### [C] 외부 조사

### C-1: 미국 법률 비용 데이터 정확성 검증
- **배경**: 현재 seed data는 프로그래밍으로 생성된 추정치. PRD §7에서 2+ 독립 소스 교차 검증을 요구하지만, 실제 데이터 소스(Martindale-Hubbell, Avvo, NOLO 등)와의 검증이 이뤄지지 않음.
- **내부 분석 결과**: 1,224 cost records가 state-adjusted 알고리즘으로 생성됨. sources[] 필드에 URL은 포함되어 있으나 실제 크롤링/검증은 수행되지 않음.
- **추가로 필요한 것**: 실제 데이터 소스의 현재 가격 범위와 비교하여 seed data의 정확도 검증.
- **질문**: "2026년 기준 미국 주요 10개 주(CA, TX, FL, NY, IL, PA, OH, GA, NC, MI)의 divorce, DUI, personal injury, bankruptcy 법률 비용 범위를 Martindale-Hubbell, Avvo, NOLO, Thumbtack 등 공신력 있는 소스에서 조사하여, LegalCostCalc의 현재 데이터와 비교 분석해 주세요."
- **결과 반영**: PRD.md §7 Data Strategy 섹션에 실제 소스별 데이터 범위 추가
- **긴급도**: 높음 (YMYL 콘텐츠 — 부정확한 데이터는 신뢰도 치명적)

### C-2: 법률 비용 계산기의 UPL(무허가 법률 서비스) 리스크 최신 판례
- **배경**: PRD §10에서 UPL 리스크를 Medium으로 평가. disclaimer를 통해 완화하고 있으나, 최근 판례나 규제 변화가 있을 수 있음.
- **내부 분석 결과**: Disclaimer가 모든 페이지 상하단에 표시됨. advice-type 기능 없음. "informational purposes only" 명시.
- **추가로 필요한 것**: 법률 비용 정보 제공 웹사이트에 대한 최신 UPL 관련 판례 또는 주(state)별 규정.
- **질문**: "미국에서 법률 비용 정보를 제공하는 웹사이트(LegalZoom, Avvo, Thumbtack 유사 서비스)에 대한 UPL(Unauthorized Practice of Law) 관련 최신 판례, FTC 가이드라인, 주별 규정을 조사해 주세요. 특히 비용 범위 제공이 법률 자문으로 간주될 수 있는 경계선을 확인해 주세요."
- **결과 반영**: PRD.md §10 Risks 섹션 업데이트
- **긴급도**: 중간

### C-3: Affiliate 프로그램 조건 비교 (LegalZoom, Avvo, Rocket Lawyer)
- **배경**: PRD §3에서 affiliate 수익을 20-30%로 예상하나, 실제 커미션율, 가입 조건, 쿠키 기간 등 구체적 정보 없음.
- **내부 분석 결과**: 코드에 affiliate 구조 미구현. PRD에 3개 서비스명만 언급.
- **추가로 필요한 것**: 각 서비스의 affiliate 프로그램 상세 조건.
- **질문**: "LegalZoom, Avvo, Rocket Lawyer의 affiliate/referral 프로그램 2026년 현재 조건을 비교해 주세요. 커미션율, 쿠키 기간, 최소 지급 금액, 가입 요건, 법률 비용 비교 사이트에 적합한 프로그램 추천을 포함해 주세요."
- **결과 반영**: PRD.md §3 Business Model에 구체적 affiliate 조건 추가
- **긴급도**: 중간

---

### [D] 시장 인사이트

### D-1: 경쟁 환경 — 법률 비용 비교 시장
- **발견**: 직접적인 "법률 비용 계산기" 경쟁자는 소수. Thumbtack은 서비스 가격 비교이지 법률 특화가 아님. LegalZoom/Avvo는 변호사 매칭이 핵심이지 비용 투명성이 아님. NOLO는 가이드 콘텐츠 중심.
- **적용 가능성**: LegalCostCalc의 "비용 투명성 + 데이터 중심" 포지셔닝은 경쟁 공백. SEO 키워드 "[category] cost in [state]"에 대한 직접 답변 제공이 핵심 차별점.
- **관련 기능**: F2 (SEO 랜딩 페이지) — 현재 408 페이지는 핵심 차별점의 실체.

### D-2: YMYL + E-E-A-T SEO 전략
- **발견**: Google의 YMYL(Your Money or Your Life) 카테고리에서 법률 비용 콘텐츠는 높은 E-E-A-T(Experience, Expertise, Authoritativeness, Trustworthiness) 요구. 소스 투명성, 전문가 인용, 데이터 최신성이 순위에 직접 영향.
- **적용 가능성**: 현재 source attribution + lastVerifiedAt 날짜 표시는 올바른 방향. 추가로 전문가 인용, 블로그 콘텐츠, "About Us" 페이지가 E-E-A-T 강화에 필요.
- **관련 기능**: A-4 Blog 구조, 새 "About" 페이지 추가 고려

---

### [E] 개발 효율화

### E-1: API Route 미들웨어 패턴 도입
- **관찰**: 4개 API route가 동일한 rate limit + error handling 패턴 반복. 새 endpoint 추가 시 동일 보일러플레이트 필요.
- **제안**: Next.js middleware 또는 wrapper 함수로 공통 로직 추출. B-1 제안과 동일.
- **기대 효과**: 새 API 추가 시 보일러플레이트 15줄 → 1줄.

(Research entries will be logged here as they occur)
