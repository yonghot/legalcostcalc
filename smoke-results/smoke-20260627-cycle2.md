# Smoke 결과 — 사이클 #2 (2026-06-27, Supabase resume 후 재배포)

Vercel deployment: **legalcostcalc-qiziwq220** (Ready) → promote → production alias.
게이트 1 상태: 통과 (풍성도 ADEQUATE, Anti-Slop 0, 9축 0, 빌드 green)

## 선행: Supabase 복구
- `restore_project(eeyqjdfwnizpsalbaaco)` → status INACTIVE→ACTIVE_HEALTHY.
- 데이터 검증: states 51 · categories 8 · legal_costs **1224** · sources 보유 1224/1224 (전부). 데이터 보존됨(일시정지 후 복원).

## Smoke 결과 (production alias)
- `/` : **200 OK** (strict -sf pass)
- `/api/health` : **200 OK** (strict -sf pass) — 신규 라우트, 본 배포 검증
- `/api/costs?divorce&CA&moderate` : **실 데이터** (median=10600 = $10,600, F1 evidence 일치)
- `/api/states` count=51 · `/api/categories` count=8

## Production 데이터 풍성도 (실측)
- /california/divorce-cost : 200 · fallback 0 · 실 $figs 11종 · disclaimer top+bottom(2)
- /texas/dui-cost : 200 · fallback 0 · 실 $figs 12종 · disclaimer 2
- /new-york/bankruptcy-cost : 200 · fallback 0 · 실 $figs 9종 · disclaimer 2
- 핵심 페이지 / · /compare · /about : 전부 200
- 본 배포 폴리시 라이브 확인: home backdrop-blur=0 (glassmorphism 제거 반영)

## DNS·SSL
- legalcostcalc.vercel.app (Vercel 관리 도메인) · HTTPS · HSTS preload 활성. 커스텀 도메인 없음 → CNAME/A 불요.

## 합격 판정 — 게이트 2 **PASS** (4-viewport 시각 검증은 별도 기록)
- Smoke 200 OK ✓ / 실 데이터 ✓ / runtime API ✓ / SSL ✓
