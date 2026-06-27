# Deploy Fix Plan (Ralph Loop)
마지막 갱신: 2026-06-27 (cycle #1) | 현재 모드: **DEPLOYING (게이트 1 통과)** | 세션 사이클 카운터: 1 | 누적 사이클: 1

> 대상 프로젝트: **legalcostcalc** (≠ ACTIGENCE; 프롬프트의 actigence.ai 참조는 템플릿 예시).
> Vercel 배포 타깃 검증됨: `sk1597530-3914's projects/legalcostcalc` (prj_aO8PhXBF9EZGcERnjshxul2YMu2F).

## 최신 풍성도 측정 이력
| 사이클 | 시각 | 방식 | 평가 | 비고 |
|---|---|---|---|---|
| #1 | 2026-06-27 | 정적 구조 분석(5-agent 감사) | **ADEQUATE** | 이미 배포된 미니멀 법률 제품. 일반 SaaS "풍성도 백필"은 무결성 리스크로 제외. 픽셀 측정은 실 Supabase+배포 후에만 유효(측정 부풀리기 금지) |

> ⚠️ Playwright 4-viewport 픽셀 풍성도는 로컬 Supabase 플레이스홀더로 fallback 렌더되어 무의미 → prod 배포 후 SmokeRunner에서 실측 예정.

## Anti-Slop(M.1~M.6) + 9축 CRITICAL 이력
| 사이클 | grep subset | 수동 검토 | impeccable(vs baseline) | 9축 CRITICAL | 빌드 |
|---|---|---|---|---|---|
| #1 (전) | 0 | 1 (header glassmorphism) | 1 baseline | 1 (about/loading 누락) | green |
| #1 (후) | 0 | **0** | **0 new** (1 baseline 유지) | **0** | **green** |

## Smoke 결과 이력
| 사이클 | 시각 | URL / | URL /api/health | prod 풍성도 | DNS·SSL | 전체 |
|---|---|---|---|---|---|---|
| — | — | 미실행 | 미실행 | 미실행 | 미실행 | 배포 승인 대기 |

## 게이트 상태
- **게이트 1 (배포 준비): ✅ PASS**
  - 빌드 green: `npm run lint` ✅ · `tsc --noEmit` ✅ · `next build` ✅ (420p) · test = N/A(인프라 부재, P1-002로 큐잉)
  - Anti-Slop: grep subset 0 + 수동 검토 0 + impeccable 0 new(1 baseline=정적 오탐)
  - 9축 CRITICAL: 0 (P0-001 disclaimer-on-load 해소)
  - 풍성도: 제품 특성상 ADEQUATE (brand-pack: professional-restrained)
- **게이트 2 (production 검증): ⏸️ 승인 대기**
  - Vercel CLI 인증됨(`sk1597530-3914`), 타깃 프로젝트 존재 확인. `.vercel` 로컬 링크 미생성.
  - 배포 메커니즘: 본 프로젝트는 git push(feature/mvp-prototype)→Vercel 자동배포 패턴(PROGRESS.md 이력). CLI `vercel deploy --prod`(원격 빌드, 실 Supabase env)도 가능.
  - **라이브 법률 정보 사이트 production 푸시는 outward-facing 행위 → 오너 승인 후 진행.**

## 우선순위 큐
### 보류 (즉시 검토)
- (없음)

### 게이트 2 외부 자원 / 배포 (DEPLOY-)
- [DEPLOY-001] production 배포 실행 (git push 자동배포 또는 `vercel deploy --prod`) — **오너 승인 대기**
- 외부 자원: 실 Supabase env(Vercel 프로젝트에 기설정 추정) · `vercel link` · (CI용) VERCEL_TOKEN

### P1 (적용 보류 — 근거 명시)
- [P1-002] 테스트 인프라(Vitest + disclaimer/sources/계약 테스트) — 대규모·post-MVP, 배포 비차단. 자동 강행 안 함.
- [P1-004] in-memory rate limit → Upstash/Vercel KV — 외부 인프라 필요. 멀티인스턴스 prod 전 권고.
- [P1-005] sources[]/lastVerifiedAt 검증 가드 + 마이그레이션 NOT NULL — integrity_risk. 새 마이그레이션 + 실 DB 검증 필요(현 worktree 불가). 보류.
- [P1-006] error.tsx disclaimer 커버리지 하드닝 주석 — 패턴 이미 정상. 저가치, 차기.

### P2 (선택)
- [P2-001] isSafeUrl XSS — **오탐 확정**(이미 https/http 허용목록). 단위 테스트만(P1-002에 귀속).
- [P2-006] compare category 자기비교 서버검증 — 보안 리스크 아님(동일 결과만). 저가치, 차기. (aria-live는 이미 충족: role="alert" + results aria-live="polite")
- [P2-007] vercel.json/CI/문서 — DEPLOYMENT.md ✅ 생성. vercel.json은 Next.js 자동감지가 더 견고하여 의도적 미생성. CI workflow는 차기.

### 완료 (cycle #1)
- [P0-001] ✅ `src/app/about/loading.tsx` 신설 — disclaimer-on-load (UPL CRITICAL)
- [P1-001] ✅ header glassmorphism 제거 (`backdrop-blur ...` → `bg-white`)
- [P1-003] ✅ cost-display 대비 `text-slate-400`→`text-slate-500` (WCAG AA)
- [P2-002] ✅ sanitizeForErrorMessage `\r\n` strip (로그 인젝션)
- [P2-003] ✅ cost-result 헤더 teal 그라디언트 → solid `bg-teal-600`
- [P2-004] ✅ compare emerald → teal (단일 브랜드 액센트; red/positive 의미 유지)
- [P2-005] ✅ sheet.tsx backdrop-blur 제거 + `shadow-lg`→`shadow-md`
- [+infra] ✅ `/api/health` 라우트(의존성 없는 liveness, Smoke용)

## 현재 작업 — cycle #1 — [DEPLOY-001] production 배포 승인 대기
영향 예상: 라이브 production(legalcostcalc) 전체. 변경 = 검증된 안전 폴리시(a11y/anti-slop/disclaimer-on-load).

## 최근 변경 (cycle #1)
8개 안전 폴리시(위 완료 목록) + 하네스/Ralph 상태 파일. src/ 코드 변경은 모두 1~3줄 surgical. 빌드 green, 회귀 0.

## 회귀 로그
| cycle | 회귀 영역 | 사유 | 처리 |
|---|---|---|---|
| #1 | (없음) | lint/tsc/build green, impeccable 0 new | — |

## 미니 작업 카운터: 1/5 (다음 FullAudit는 카운터 5 또는 배포 직후)

## 생성된 자원
- Vercel 프로젝트: legalcostcalc (prj_aO8PhXBF9EZGcERnjshxul2YMu2F), scope sk1597530-3914
- production URL/alias/CNAME/A: **배포 시 동적 조회 예정** (`vercel domains inspect`)

## 세션 핸드오프
- (해당 없음 — 컨텍스트 건강)

## 안전 종료 사유
- (해당 없음)

## 장애 로그
- `vercel project ls` 전수 페이지네이션 루프가 2분 타임아웃(다수 프로젝트). → `vercel project inspect legalcostcalc`로 타깃 직접 검증하여 우회.
