# Smoke 결과 — 사이클 #1 (2026-06-27)
Vercel deployment: legalcostcalc-f71byunld (Ready) → **ROLLED BACK** to legalcostcalc-ik7i6m2e6
게이트 1 상태: 통과 (풍성도 ADEQUATE, Anti-Slop 0, 9축 0, 빌드 green)

## Smoke 결과 (배포 직후)
- `/` : 200 OK
- `/api/health` : 200 OK (신규 라우트, 배포 검증됨)
- **production 데이터 풍성도: 실패** — SEO 랜딩이 실 cost 데이터 대신 "currently being collected" fallback 렌더
  - 원인: `/api/costs` → 500 (Supabase 런타임 도달 불가)

## 근본 원인 (확정)
- Supabase 프로젝트 `legalcostcalc` (eeyqjdfwnizpsalbaaco, us-east-1) **status=INACTIVE (PAUSED)**.
- 무료 티어 ~72일 미사용 자동 일시정지. → 빌드 시 데이터 fetch 실패 → fallback 베이크.
- 구 배포(ik7i6m2e6)는 84일 전 DB 활성 시 실 데이터를 SSG로 베이크 → 여전히 실 데이터 표시.

## 조치
- `vercel rollback ik7i6m2e6 --yes` 실행 (control-plane 확인: alias→ik7i6m2e6). 실 데이터 SSG 복원.
- 엣지 캐시(SSG 1w TTL) 전파 중일 수 있음.

## 합격 판정 — 게이트 2 **FAIL** (production 데이터 검증 실패, 외부 자원 블로커)
- 사이트 UP(200) + Smoke HTTP 200이나, 핵심 데이터 미표시 → promise 미발행.

## 다음 (외부 자원)
- [PROD-RICH-001 / DB-001] Supabase `legalcostcalc` 프로젝트 resume(restore) → legal_costs 데이터 확인 → 재빌드·재배포 → 재검증.
