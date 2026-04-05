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

### B-2: Compare 페이지 컴포넌트 분리 [자동 반영]
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
