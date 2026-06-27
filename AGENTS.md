# Agent Learnings (Ralph Loop 누적)

## 메타
- 프로젝트: **legalcostcalc** (Next.js 16 App Router · TS strict · Tailwind 4 · shadcn/ui · Supabase). 패키지 매니저 **npm** (pnpm도 설치돼 있으나 lockfile은 package-lock.json).
- 목표: 게이트 1(풍성도 적정 + Anti-Slop 0 + 9축 CRITICAL 0 + 빌드 green) + 게이트 2(Vercel prod 배포 후 Smoke 200 OK + prod 풍성도).
- **중대 제약**: 이 프로젝트는 ACTIGENCE가 아니라 legalcostcalc다. 프롬프트의 actigence.ai/ACTIGENCE 참조는 템플릿 예시이며, 실제 대상에 맞춰 적용한다.

## 부트스트랩 결정·가정 (cycle #0, 2026-06-27)
- **풍성도 프레임워크 적용 방식**: 본 제품은 이미 배포 완료된 미니멀 법률 비용 계산기(F1~F4 전부 pass)다. 일반 SaaS용 "풍성도 극대화"(hero 일러스트, 통계 배너, social proof, 시드 다양성)를 그대로 적용하면 제품 무결성을 해친다. → `design/brand-pack.md`를 **professional-restrained**로 정의하고, 풍성도 = "완전·신뢰성"으로 재정의. **가짜 비용 데이터/출처/후기/통계 생성 절대 금지** (CLAUDE.md Data Rules + UPL + design/forbidden.md 위반).
- **테스트 인프라 부재**: package.json에 `test`/`typecheck` 스크립트 없음, 테스트 파일 0개. 게이트 1의 "test green"은 인프라 부재로 N/A 처리. typecheck는 `npx tsc --noEmit`로 직접 실행(green 확인됨). [가정] 신규 테스트 인프라 도입은 별도 P1 권고로만 큐잉, 자동 강행 안 함.
- **패키지 매니저**: 프롬프트는 pnpm 가정. 실제 lockfile은 npm. → npm 사용(회귀 위험 회피). 둘 다 설치돼 있음.
- **/api/health 부재 → 추가**: Smoke가 `/api/health` 200을 요구. 의존성 없는(Supabase 미접촉) liveness 라우트 `src/app/api/health/route.ts` 신설. 안전·표준·슬롭 아님.

## 게이트 2 외부 자원 블로커 (cycle #0 확인)
- **VERCEL_TOKEN UNSET** + **.vercel 미연결** → `vercel deploy --prod` 비대화식 불가. 프롬프트 규약상 "BLOCKED 아님, `vercel login`/토큰 후 재개 대기" 일시 정지 대상.
- **Supabase 플레이스홀더**(`your-project.supabase.co`) → 실데이터 렌더 불가 → 로컬 Playwright 픽셀 풍성도 측정 무의미(fallback 렌더). 측정 부풀리기 금지 원칙에 따라 prod 풍성도는 실제 배포 후에만 측정.

## 누적 학습
### cycle #0 (2026-06-27) — 부트스트랩
- 성공: 클론·하네스 보강 완료 상태에서 lint·typecheck green 확인, anti-slop grep subset 0 위반, /api/health 추가, Ralph 상태 파일·brand-pack 생성.
- 실패: (없음)
- 발견 제약: Gate 2는 외부 크리덴셜(Vercel 토큰/링크 + 실 Supabase)에 막힘 — 코드로 해소 불가.
- 다음에 시도: 빌드 green 최종 확인 → 감사 워크플로 결과로 큐 확정 → 무결성 안전한 P0만 적용 → Gate 2는 크리덴셜 확보 시 재개.

### cycle #1 (2026-06-27) — Gate-1 폴리시 + 게이트 판정
- 성공:
  - 5-에이전트 병렬 read-only 감사(33 raw → 14 큐)로 Gate 1 정직 판정. 감사가 **오탐 자가수정**(isSafeUrl XSS는 이미 https/http 허용목록으로 방어됨)까지 수행.
  - 무결성 안전 폴리시 8건 적용 후 lint/tsc/build green 유지, impeccable 0 new, anti-slop 수동 0. 회귀 0.
  - **풍성도 프레임워크의 함정 회피**: 감사가 home use-case/social-proof/FAQ 백필을 integrity_risk로 제외 판정. 법률 제품에 가짜 통계·후기·데이터를 넣는 것은 CLAUDE.md Data Rules + UPL 위반 → 절대 금지 재확인.
- 실패: (없음 — 회귀 없음)
- 발견 제약(중요 정정):
  - **이전 cycle #0 가정 정정**: `vercel whoami` → `sk1597530-3914` 로 **Vercel CLI는 이미 인증됨**(미인증 아님). `vercel project inspect legalcostcalc` 로 production 타깃 프로젝트 존재 확인(prj_aO8PhXBF9EZGcERnjshxul2YMu2F). 즉 Gate 2는 크리덴셜로 막힌 게 아니라 **라이브 법률 사이트 production 푸시라는 outward-facing 승인 경계**에 있음.
  - 로컬 Supabase는 플레이스홀더 → 로컬 prebuilt 배포 금지(데이터 없는 빌드). 반드시 원격 빌드(Vercel env=실 Supabase) 또는 git push 자동배포 사용.
  - 본 프로젝트 배포 패턴 = git push(feature/mvp-prototype)→Vercel 자동배포(PROGRESS.md 다수 기록). 즉 `git push`가 곧 production 배포.
- 다음에 시도: 오너가 production 배포(DEPLOY-001) 승인 시 → 원격 빌드 배포 → SmokeRunner(/ + /api/health 200 + prod 풍성도 실측) → 실패 시 `vercel rollback`. P1-002/004/005는 별도 후속.
