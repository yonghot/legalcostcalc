# PROGRESS.md — LegalCostCalc

## 2026-11-22 — K8/K29 복원: 최근 28일 검색 유입이 있던 28쪽을 index로 되돌림 (AppFarm 3)

- 원인: K8 keep 목록(39쪽)은 2026-07-08~10-05 90일 증거로 만들었다. 11/22 배포(8/31 빌드 → 1742b65)가 그 밖의 인스턴스를 noindex로 바꿨는데, 리더의 GA4 호스트×랜딩 표(2026-10-25~11-21, `.claude/work/AppFarm1/ga4-landing-2026-11-22.tsv`)를 대조하니 noindex가 된 쪽 중 28쪽이 그 28일에 유기 검색 세션을 받았다. 합계 36세션으로 legal 유기 69세션의 52%이고, 참여 세션도 36이다. 상위는 /georgia/real-estate-cost 3, /north-carolina/bankruptcy-cost 3, 파산 12쪽이다.
- 조치(계약 K29 복원 절차): `src/data/index-policy.json` keep에 28쪽 추가(39 → 67, 색인 인스턴스 41 → 69, noindex 328 → 300). 증거는 `src/data/k8-evidence-2026-11.json`(경로·세션·참여·유기 세션, 기존 90일 증거와 겹치는 경로 없음). 기준은 기존과 같다(유기·AI·추천 유입 1 이상, 기존 39쪽 중 20쪽이 1건).
- 회귀 테스트: tests/regressions/k8-index-policy.test.ts — keep = 두 증거 파일의 합집합, 개수 67/69/300, 사이트맵 템플릿 69쪽, 11월 증거 28쪽은 전부 유기 1 이상·90일 증거와 무중복(38/38). 이웃 7개 파일(ad-eligibility-parity·k24·k3·k7·related-links·ux-next-steps·related-matters) 통과.
- 부수: tests/regressions/k39-updates.test.ts의 커밋 날짜 조회를 커밋당 git 1회에서 `git log` 1회로 바꿨다(머신 부하 때 5초 제한 초과 — 22초 관측. 제한 시간은 그대로).
- 보류(리더 결정): 허브 59쪽 noindex. 같은 표에서 허브는 28일간 10쪽에 12세션(참여 2·유기 3)뿐이다.

## 2026-11-22 — /updates 항목 문구 정정 (fresh 리뷰 WARNING 3 + SUGGESTION 1, AppFarm 3)

- 원인: 배포된 /updates 항목 문구가 인용 커밋보다 넓거나 좁게 말했다. W1 "footer links"(89c635a는 홈·주/매터 페이지의 형제 링크 블록 삭제, 푸터 아님), W2 "Outside the EEA"(동의 지역 목록은 EEA+UK+CH 32개 코드), W3 "per-page record"(content-dates.json은 페이지 그룹(패밀리) 단위). S1 증거 마커 "evidence"가 JSON 키라 공허했다.
- 조치: src/lib/site-updates.ts 문구 3곳 정정, 마커를 '"basis": "content-changed"'로.
- 회귀 테스트: tests/regressions/k39-updates.test.ts에 문구 단언 1건 추가(옛 문구면 실패), 8/8 통과.
- K2(리더 지시): 화면의 "Commits: <해시>; <파일 경로>" 줄(항목 6개)과 메타 설명 "with the commits that show each one"을 제거 — 해시·경로는 site-updates.ts 증거 필드(테스트 전용)와 PROGRESS에만. Atom 요약은 원래 본문만. 테스트: 페이지·피드에 해시·경로·"Commits:" 0(양성 대조 포함), 9/9.

## 2026-11-22 — 배포 기록: /updates (AppFarm 3 ship)

- 배포: dpl_6fvBFYxxeRLhQL7PEHuovV47TbCL (legalcostcalc-3g1yzg4lh-actigence.vercel.app) Ready, HEAD 906351f, 브랜치 feature/mvp-prototype 푸시(ed6c634·d3756f8 docs 커밋 동반). 롤백 대상: dpl_Ge6iFsiufKsLHFZukig8EQ7eAcQA(88704ce).
- 게이트·신규 리뷰(CRITICAL 0): 906351f 기준 통과(리더 승인).
- 라이브 확인: /updates 200·noindex 없음·항목 6개 전부 노출, feed.xml 200 application/atom+xml·well-formed·entry 6, 푸터 링크 / 및 콘텐츠 3페이지, 사이트맵 /updates lastmod 2026-11-22(최신 항목), /updates 글루 정규식 0, /ads.txt 200, 홈 consent default(5223) < 로더(5909) < </head>(6075).


## 2026-11-22 — K39 /updates 페이지 + Atom 피드 (AppFarm 3 implement)

- 추가: `/updates`(src/app/updates/page.tsx), `/updates/feed.xml`(정적 Atom), 데이터 `src/lib/site-updates.ts`, 피드 빌더 `src/lib/updates-feed.ts`. 푸터 Resources 에 "Updates" 링크(형제 사이트 링크 없음), 사이트맵에 /updates 추가(lastmod = 최신 항목 날짜), 페이지 metadata 에 피드 alternate.
- 날짜 원칙: 라이브는 8/31 빌드(561d440)였고 dpl_Ge6iFsiufKsLHFZukig8EQ7eAcQA(88704ce)가 11/22 에 게시됐으므로 그 사이 변경은 전부 2026-11-22 로 기록(커밋 날짜 아님). 항목 6개: 생성 문장 정정·삭제 / 근거 없는 주장 제거(모델 추정 표기) / CA 이혼 법원 접수비 출처 표시 / 동의 컨트롤 / 폼·정책 페이지·링크 블록 / 페이지 날짜가 실제 변경을 따름. 각 항목은 커밋 SHA(날짜 ≤ 항목 날짜) 또는 파일+마커를 증거로 가지며, 수치는 CA 접수비 $435-$450(verified-fees.json) 하나뿐. 갱신 주기 약속 문장 없음.
- 테스트: tests/regressions/k39-updates.test.ts(고유 id·최신순·날짜 유효·증거 커밋 존재 및 날짜 ≤ 항목 날짜·주기어 금지·Atom 유효성·페이지 전 항목 렌더·사이트맵 lastmod 일치, 양성 대조 포함). k24 고아 검사는 푸터로만 링크되는 /updates 를 제외, k8 사이트맵 개수는 +1.
- 검증: k39·k24·k3-no-global-lastmod·k3-visible-dates·ad-eligibility-parity·k8 및 인접 테스트 통과, 변경 파일 eslint 0건. /updates 는 AdSense 로더 대상 아님(AD_STATIC_PATHS 불변).
- 로컬 docs 커밋 ed6c634·d3756f8 은 그대로 두고 이번 푸시에 함께 나간다.

## 2026-11-22 — 프로덕션 배포 기록 (AppFarm 3 ship)

- 배포: HEAD 88704ce 를 `git push origin feature/mvp-prototype`(Vercel 프로덕션 브랜치 확인) 로 배포. 프로덕션 deployment dpl_Ge6iFsiufKsLHFZukig8EQ7eAcQA (legalcostcalc-bidzvgnum-actigence.vercel.app), Ready, 커밋 SHA=HEAD, legalcostcalc.co 별칭 연결.
- 롤백 대상: dpl_9bZYvHCx2iuAr9gxJ6CnCSbBGMfB (8/31 빌드, 커밋 561d440).
- 라이브 확인(curl): 홈+콘텐츠 URL 200, 로더 페이지당 1회·head 안, 순서 기본동의<로더<</head> 전 페이지 충족(홈 5313<5909<6075), 글루 0, ads.txt·sitemap·robots 200, Mediapartners 200 + K35 로그 확인, K13-R CSP(object-src/base-uri/frame-ancestors만) 확인, csp-live-check --strict 0건, portfolio-audit post-deploy --strict exit 0(경고 5: 유틸 페이지 로더 advice 4건·/search noindex canonical 1건).
- 이 문서 커밋은 푸시하지 않음(푸시 시 재배포).

## 2026-11-22 — 위생 마무리: 글루·K14·K35·IndexNow·CA 이혼 문구 점검, 10/28 리더 체크리스트 HEAD 대조 (AppFarm 3 implement)

- 원인: 10/28 빌드(ae6fc62)에서 글루 단어 743건(소스 패턴 7개)·로더가 기본 동의보다 앞선 페이지 111/111·K35 크롤 계측 없음이 확인됐다.
- 조치(글루): 7개 패턴(주 이름 뒤 "by tier"·"court's own schedule", "uncontested/contested</strong>figure", "Manage Consent</strong>link", "not</strong>sell", "legalcostcalc.co</strong>(the Site)")은 모두 e5ff5cb 의 `{" "}` 로 소스에서 이미 고쳐졌음을 확인했다(해당 문자열 소스 grep 0, 추가 수정 없음).
- 조치(K14): a2ab2d2·dddc722 로 루트 레이아웃 head 에서 defaults < loader < </head> 순서가 고정됐고 k14-default-before-loader 테스트 통과(추가 수정 없음).
- 조치(K35): 루트 middleware.ts 에서 UA 가 Mediapartners-Google|AdsBot-Google 이면 `adsense-crawl {"p","d","ua"}` 한 줄만 로그(IP·쿼리·쿠키 없음, 응답 불변). matcher 는 HTML 페이지 경로 포함. 커밋 54f7c39.
- 조치(IndexNow): scripts/indexnow.mjs 가 공유 템플릿(8ebf498)과 바이트 동일, tests/regressions/indexnow-delta.test.ts 는 CONFIG 경로 한 줄만 다르고 동일 — 이식 완료(추가 수정 없음).
- 조치(CA 이혼 "4%–4%"): category-editorial.tsx 가 하한·상한이 같은 반올림이면 단일 퍼센트로 쓰고 r4-truth 가 CA 이혼 렌더에 `(\d+)%–\1%` 부재를 단정한다(HEAD 에 이미 반영, 추가 수정 없음).
- 회귀 테스트: tests/regressions/k35-adsense-crawl-log.test.ts(신규 4건), jsx-entity-leading-space·k14-default-before-loader·indexnow* 단일 파일 55건 통과.
- 10/28 리더 체크리스트 HEAD 상태(grep 근거): Terms — footer 링크 `/terms` + src/app/terms/page.tsx 존재. reviewer pending — reviewer.ts 가 env 미설정 시 null 반환, 날조 이름 없음("pending" 문자열 0). quarterly — src 코드 0건(content-dates.json 증거문에만 "quarterly-review promise 교체" 언급). Actigence — constants/publisher.ts 발행자. 형제 사이트 링크 0 — no-sibling-links 테스트. 'based on sourced' — src·tests 0건(content-dates.json 의 "unsourced" 는 별개). CA 이혼 $435–$450 — verified-fees.json 이 selfhelp.courts.ca.gov 출처·fetchedOn 2026-10-07. DUI — 시드의 "Court filing fee ($100-$300)" 는 cost-service 가 제거하며 51개 주 DUI 페이지 렌더에 없음.
- 보류: DUI 페이지 51개 모두에 시드의 "License reinstatement fee ($100-$300)" 가 "전국 단위 일반 범위" 문구 아래 계속 표시된다(리더 체크리스트의 "DUI $100-$300 removed" 가 이 줄까지 포함하는지는 확인 필요, 포함이면 검증 출처 없이 제거해야 함). 전체 suite·빌드·§4.6a 는 게이트에서.

## 2026-11-22 — r4 적대 검토 수정: 미커밋 WIP 50개 분류·커밋 (AppFarm 3 implement, r4:truth CRITICAL 7·WARNING 14 / r4:contract CRITICAL 3·WARNING 4)

- 원인: 2026-10-28 에 끊긴 fixer 가 r4 수정을 미커밋 파일 50개로 남겼다. 각 hunk 를 finding 에 대응시키고 테스트로 검증했다. 되돌릴 hunk 는 없었다(모두 finding 을 충족하고 테스트 통과, 백업 `.claude/work/AppFarm3/legal/` 에 diff 보관).
- 조치(WIP 분류): (1) 동의·GA — ga-gate.ts 순수 함수 추출(R4-W4), 로더 없는 페이지에서 Manage Consent 가 거부 전용 공지로 폴백(R4-W3). (2) 생성기 — "contested/straightforward" 라벨 삭제·proseLabel(R4-C01, W10), 일반 factor 줄·원인절 삭제(R4-C02, C03), 다섯 칸 이동 문장을 "가장 가까운 N개 주"로(R4-C06), hours·trajectory·escalation 인과·분해 문구 삭제(R4-W01, W02, W12), 기간은 "전국 단일 가정" 표기(R4-W05), 기준선을 표 중앙값 하나로(R4-W06), PI 시급 FAQ 삭제(R4-W08), 동률 개수 표기(R4-W11, S01), 메타 설명이 행에 없는 내용을 약속하지 않게(R4-W04), DUI "specifically" 문장 삭제(R4-W14). (3) 표면 — 통계·비교의 "differs from every other state" 를 실제 게이트 서술로(R4-C04), 비교 예시의 최상급을 퍼센트 기준으로(R4-C05), 홈 FAQ 보편 주장 정정(R4-C07), PI 는 "(case expenses)" 표기(R4-W03), OG 이미지 중앙값 공유 함수·라벨(R4-W07), 홈·소개·푸터·가이드의 보편·비교·인과 문장 삭제(R4-W13), 정산 추정기 title 질문형 제거(R4-S2). 글루(R4-C2, C3, W1, W2, W09)·로더 순서(R4-C1)는 e5ff5cb 이전 커밋에서 해결.
- 회귀 테스트: tests/regressions/r4-truth.test.ts(신규 29건), ga-gate.test.ts(8건), k14c-decline-only-fallback.test.ts, k4a-r1·r2·r3·prose-property·generators-*, r3-convergence, stats-consistency 갱신. 단일 파일 vitest 전부 통과(부하 시 5s 타임아웃 2건은 `--testTimeout=60000` 직렬로 통과), 바뀐 파일 eslint 0, 전체 tsc --noEmit 0.
- 보류: R4-S1(content-dates cost:* 증거 SHA 및 가족 날짜 갱신, 제안), R4-W03 의 카테고리·주 허브 PI 표기(허브에 PI 순위 비교 없음), R4-W13 가이드의 출처 있는 보편 서술(오프라인 검증 불가, 계약상 출처 링크 있음). 전체 suite·빌드·§4.6a 빌드 HTML 감사는 게이트에서.

## 2026-10-11 — 적대 검토 3회차 수정 + 수렴 지시 반영 (AppFarm 3 fixer, findings: CRITICAL 7 + WARNING 11, 커밋 3f42b75..0ddd2af)

- 원인(CRITICAL 7건, r3-truth-R3-TXT-01~07 / r3-contract-R3C-01·02): 생성기 문장의 결론절이 분기 조건만 보고 같은 쪽 수치와 다른 관계를 단정했다. TXT-01 hoursRank "more work behind"·"fewer implied hours"(hoursSentence 와 모순, 123쪽), TXT-02 hourlyPosition "not an unusually high rate"·"rather than higher prices"(시급·시간 수치와 반대, 43쪽), TXT-03/R3C-01 trajectory 큰 이동 "ordinary prices here; contested work is not"(단순 티어가 티어 중간값 -27%, 복합 티어가 중간값 위/아래인 13쪽), TXT-04/R3C-02 FAQ "more distinctive on contested matters"(복합 순위가 중앙에 더 가까운 36쪽), TXT-05 FAQ "premium ... concentrated in straightforward matters"(복합 프리미엄이 단순 이상 9쪽), TXT-06 "ambiguous by N places"(N 이 같은 줄 세 순위의 폭보다 작음 41쪽), TXT-07 "tracked" 매터 수 7 대 8(201쪽). 같은 부류가 1·2회차에 "후속 웨이브" 로 남겨져 있었다.
- 조치(앞선 fixer 8커밋, 이번에 테스트로 재검증): 3f42b75 TXT-01, 5fe5b8e TXT-02, 01f77ef TXT-03·R3C-01(두 티어의 중간값 격차를 달러·퍼센트로 직접 표기), 988e13b TXT-04·05·R3C-02, ea7bf61 TXT-06(폭 = 최대-최소), 4a2902b TXT-07("ranked" 와 미순위 매터 수 명시), 695da49 R3-W1(동률을 엄밀 순위로 센 "N places"), a0b6d56 R3-W6("inside it" 제거, 자기 순위에 표 크기 병기).
- 조치(이번 fixer, WARNING 중 거짓/자기모순 문장): 23d5a64 W2(대역 문장이 달러 폭만 비교, "cluster more tightly" 삭제), W4(클러스터 꼬리 "densest part ... few hundred dollars" → 가장 먼 피어까지의 달러 거리), W5("a ten percent revision in either direction would cross N" → 방향별 개수), W7(분산·형태·일관성 문장의 상반된 평결어 제거), W11("clear air beneath it" 삭제). 9ad998b W8(데이터가 있는데 "currently being collected" 라고 말하던 noindex 39쪽 — 시드에 없는 항목만 그 문장), W9(DUI FAQ "In most cases ... charged as a misdemeanor" → 주마다 다르다고 단정하지 않는 문장; NJ·WI 는 경범죄가 아님). 보류 사유가 아닌 W3(rank "straddle both figures")·W10("can be worth it")·W11 나머지 항목은 아래 수렴 삭제로 사라졌다.
- 수렴 지시(2026-10-11 02:40, 가장 새 규칙): 조건부 산문 생성기에서 (a) 분기 조건 = 문장이 말하는 바를 전 입력 속성 테스트로 단정할 수 없거나 (b) 순서·최상급·비교·인과·always/never/every/most/only 주장을 데이터로 도출할 수 없는 문장은 삭제하거나 숫자·출처만 말하는 평서문으로 줄였다(3c716cf, 0ddd2af). 새 해석 문장은 쓰지 않았다. 생성기별 삭제 내역:
  - rankSentence: "the rank is meaningful, the distance is not", "close enough that a single firm's quote can straddle both figures", "only N states record". neighborSentence: "tie-break rather than a measured difference", "close to arbitrary", "top/bottom edge of a band/group", "a wider $X step", "only $X above". clusterSentence: "a pairing rather than a cluster", "describing effectively the same market", "not part of a cluster", 꼬리 → 가장 먼 피어까지 거리. hourlyPositionSentence: 모든 분기의 평결 머리·꼬리("point in different directions", "disagree sharply", "slightly optimistic guide", "nearly agree", "far above hourly rate", "same signal", "same story"). hoursSentence: "more than a full working week", "days of work, not weeks", "indistinguishable", 인과 꼬리 → 시급과 피어 시급 병기. escalationSentence: "most of that is hours", "Hours carry the larger part".
  - trajectorySentence: "Rank is not stable", "very differently", "expensive to start / comparatively ordinary", "barely moves / roughly the same relative position", 종결 관계문 전부("understates", "does not understate", "sits between the two extremes rather than summarising them", "above/below both ... rather than between") → 세 순위·이동·중간값 격차만. overlapSentence: "can therefore belong to two different tiers", "a step, not a slope", "the same money", "clean break", "unusually informative". bandSentence: "wide"/"close" 평결 → 더 넓다/좁다/같다와 달러 차이. tempoSentence: "runs hotter", "costs more in total but less per month", "longer timeline", "are close", 인과 꼬리 → 두 티어의 월 환산액과 "전국 단일 기간" 표시. consistencySentence: 세 가지 평결 분기 → 한 문장(최강·최약 순위와 자기 순위). sensitivitySentence: "lopsided", "propped up", "room to improve", "not a stable fact", "better as a band", "well separated", "tie-break" → 위/아래 개수와 이웃까지의 달러.
  - assumptionItems: "cross-check", "corroborate", "poor guide", "workable shorthand", "close, but not the same measurement", "the tier, not the figure", "same money buys different work", "jump rather than a drift", "ambiguous by" → "a spread of N places", "comparison with a model", "not by itself evidence of anything". premiumSentence: "close to uniform", "not equally priced", "spread ... is wide", "Whatever drives ...", "wrong for at least one", "one of degree" → 한 문장(각 매터가 자기 중간값에서 몇 % 위/아래, 몇 점 차이, 모두 위/아래 또는 일부 위·일부 아래). rateGroupSentences: "identifies the state on its own", "coarse instrument". stateShapeSentences: 팬아웃 평결 3분기 → 최대/최소 중앙값 배수와 일반 주 배수, "which is why ... is not an outlier". calibrationSentence: "outside anything estimated", 반복 결론. hoursRankSentence: "A third ordering", "more work behind the same money", "fewer implied hours", "agree even though" → 시간 순위와 비용 순위의 차이만. extraCalculations: "the two ratios differing because the rate rises".
  - buildStateFaq: 머리 평결("Substantially ...", "a position in the middle of the table rather than at either end"), "poor predictor of the total", "more distinctive on contested matters", "premium ... concentrated in straightforward matters", "holds a similar position at every tier ... moves the price without moving the state's standing", "the headline figure does not stand for every tier" → 가격 3개·순위·순위 폭.
  - categories.ts FAQ 템플릿·costFormationNotes 8개 매터: "significantly cheaper", "substantially increasing", "Most personal injury lawyers", "typically 33-40%", "generally range from 2-5%", "Total closing costs", "often exceed the attorney fee", "a few thousand dollars", "biggest cost driver", "which is why ... run well above", "can be worth it for serious charges", 청구 관행("often billed as a flat fee", "typically hourly because ...") 등 비교·빈도·수량·인과 서술을 삭제하고 정의·가능성("can include")·연방법 사실만 남겼다. 분량 하한(category-editorial 350단어)은 중립 정의 문장(closing 정의, 프로베이트 정의, 공공변호인 정의, RFE 정의 등)으로 채웠다. 이혼 허브: 메타 설명·소개·표 머리글의 "typical" → "median", 방법 문단·FAQ 의 "typically resolved", "often expert witnesses ... which is why the range runs substantially higher", "Why do divorce costs vary so much by state?"(인과 질문) → "Where do the state divorce figures come from?".
  - 시그니처 정리(미사용 matterLabel 제거): bandSentence·clusterSentence·overlapSentence·hoursSentence·trajectorySentence·hoursRankSentence 는 (ctx) 만 받는다. 내보낸 생성기는 하나도 삭제하지 않았으므로 k4a-generator-coverage 는 그대로 통과한다.
- 회귀 테스트: tests/regressions/k4a-r3-truth.test.ts(CRITICAL·W 별 속성 테스트, 오라클은 시드 행에서 재계산, 비공허 가드, 이전 문구를 되살리면 실패하는 양성 대조 — 앞선 fixer 의 빨강 로그, 그리고 W 수정 직후 변이 12종으로 확인), tests/regressions/r3-page-faq.test.ts(W8 noindex 39쪽 렌더, W9 51개 주 DUI 답변), tests/regressions/r3-convergence.test.ts(삭제한 해석 문구 20개 군을 369쪽 × 27개 생성기에서 금지, 각 정규식은 삭제 전 문장으로 양성 대조 — 변이 25종 전부 실패 확인), tests/regressions/r3-static-prose.test.ts(카테고리 템플릿·이혼 허브의 비교/빈도/수량 문구 금지, "estimates rise from the simple tier to the complex tier" 가 이혼·형사 두 매터의 모든 주에서 참인지 시드로 확인). 문구를 못 박던 k4a-assumptions·durations·generators-property·generators-wording·prose-property·r1·r2 오라클은 삭제된 절을 단정하던 부분만 "그 절이 없음 + 남은 숫자는 시드와 같음" 으로 바꿨다(삭제·skip 없음, 남은 관계는 그대로 시드 재계산으로 단정). r2-truth 는 마무리 관계문이 사라져 "세 엄밀 순위·이동폭 표기, 관계어 없음" 으로 다시 썼다.
- 테스트 인프라: tests/regressions/indexnow-delta.test.ts 를 공유 템플릿(scripts/templates/indexnow-delta.test.ts)으로 교체하고 이 저장소의 CONFIG(사이트맵 src/app/sitemap.ts)만 남겼다 — CLI spawn 을 beforeAll 한 번으로 모아 부하 시 타임아웃 플레이크를 없앤다(c7a51bb, 30건 통과).
- 보류 목록(스코프 프리즈/수렴 지시 밖): R3C-03 k4a-prose-property·csp-k13r 의 기본 타임아웃(5s/10s, 부하 시 플레이크 — 타임아웃은 범위 밖, 후속에서 per-test 30s), R3C-04 F2 가드 `!pending.opened` 절반만 테스트됨(제안), R3C-05 k3-no-global-lastmod 임계 > 2 로 낮춘 것과 r1 TXT-01 비공허 가드(제안; TXT-01 은 이번에 r3 테스트로 대체돼 seen > 300 가드가 있다), R3-S1 표기(일부 해소: "a 8-place climb" 는 "a climb of N places" 로, 허브 "(typical)" 는 "(median)" 로; 남음: "a 18-point spread", 소문자 "dui / dwi", "In District of Columbia", 개인상해 빈 "The rate table" 제목), 정적 페이지(how-legal-fees-work 가이드, 통계·소개 페이지)의 같은 부류 평결 문구는 이번 수렴 지시의 목록에 없어 손대지 않았다.
- 게이트: 무거운 작업(전체 vitest·전체 eslint·전체 tsc·next build)은 돌리지 않았다. 단일 파일 묶음 실행: k4a-* 9개 90건, 내용 가드 21개 463건, 렌더·동의·사이트 37개 692건 전부 통과. 바뀐 .ts/.tsx 전부에 eslint 종료 코드 0(출력 0바이트), 바뀐 파일과 그 테스트만 담은 범위 tsc --noEmit 종료 코드 0. 미완 WIP 없음(작업 트리 깨끗). 푸시·배포 안 함. 다음 게이트는 새 빌드 HTML 감사(.next 는 2026-10-08 로 낡음)부터 다시 해야 한다.

## 2026-10-10 — 적대 검토 2회차 수정 (AppFarm 3 fixer, findings 1건: CRITICAL 1, 커밋 bc24297)

- 원인(r2-contract-r2-truth-TRAJ-01): trajectorySentence 가 순위 이동이 큰 두 가지의 마지막 문장을 moderate 순위와 무관하게 고정 문구로 닫았다. 하락 가지(shift <= -4)는 항상 "Its headline moderate position sits between the two extremes rather than summarising them", 상승 가지(shift >= 4)는 항상 "The state's position on the headline moderate figure understates where it sits once a matter is contested". 시드에서 369쪽 전부 다시 계산한 결과: "between" 문장은 89쪽에 나왔고 64쪽이 거짓(moderate 순위가 simple..complex 범위 밖 46쪽, 한쪽 끝과 같음 18쪽 — Delaware/bankruptcy 3·22·9위, California/bankruptcy 11·5·15위, Arkansas/personal-injury 24·28·28위), "understates" 문장은 62쪽에 나왔고 15쪽이 거짓(moderate 순위가 complex 보다 좋거나 같음 — Alaska/personal-injury 12·5·6위, Alaska/estate-planning 24·3·18위, Indiana/divorce 46·40·40위). 같은 쪽의 순위 숫자가 문장을 반박했다(계약 K4/K4-a 의 자기모순 요약 문장 부류). 1회차 기록의 "범위 밖으로 남긴 후보" 중 shift>=4 가지가 이것이다.
- 조치(bc24297): state-context.ts trajectorySentence — 하락 가지는 moderate 순위가 simple 과 complex 사이에 엄밀히 있을 때만 "sits between the two extremes", 둘 다보다 좋으면 "sits above both of the other tiers rather than between them", 둘 다보다 나쁘면 "sits below both ...", 한쪽 끝과 같으면 "matches the simple/complex tier's; the fall comes between the ... tiers". 상승 가지는 moderate 순위 숫자가 complex 보다 클 때만 "understates", 더 작으면 "The moderate tier is its highest position of the three, so the headline moderate figure does not understate ...", 같으면 "The moderate and complex tiers hold the same position, so the headline moderate figure already shows ...". 다른 가지(shift 절댓값 10 이상·4 미만)와 순위 숫자 문구는 그대로.
- 회귀 테스트(수정 전 실패 → 수정 후): tests/regressions/k4a-r2-truth.test.ts 5건 전부 실패(거짓 64쪽·15쪽) → 전부 통과. 순위는 테스트 대상 함수가 아니라 시드 행에서 다시 계산하고(strictRank), "between"·"understates" 문구가 나온 모든 쪽의 관계를 단정하며, 하락·상승 가지의 모든 쪽이 자기 순위가 내놓는 관계의 문구를 쓰는지(관계별 최소 1쪽 비공허 가드), 그리고 시드에 없는 동률 경우는 구성한 순위로 확인한다.
- 범위 밖으로 남긴 같은 부류 후보(스코프 프리즈, 후속 웨이브): shift>=10 가지의 "Straightforward ... work is estimated at ordinary prices here; contested work is not"는 단순 티어가 피어 중앙값의 ±10% 밖인 11쪽에서 거짓이고(스크래치 탐침, scratchpad/legal/review2/traj.out.txt), "expensive to start ... comparatively ordinary to finish"는 complex 가 피어 중앙값의 ±10% 밖인 4쪽에서 거짓이다. 이번 finding 의 범위가 아니라 손대지 않았다.
- 게이트: 무거운 작업은 돌리지 않았다. 단일 파일 확인: k4a-* 7개·k3-visible-dates·k3-no-global-lastmod·no-unsupported-claims·no-advice-faq·no-developer-speak·no-positional-citations·no-visible-draft-placeholders·code-06-info-gain·geo-answer-block·seo-meta 포함 18개 파일 325건 전부 통과, 바뀐 두 파일 eslint 종료 코드 0(출력 0바이트), 두 파일만 묶은 tsc --noEmit 종료 코드 0. K3: cost 가족의 내용 날짜는 이미 오늘(2026-10-10)이라 옮기지 않았다.

## 2026-10-10 — 적대 검토 1회차 수정 (AppFarm 3 fixer, findings 12건: WARNING 4 + CRITICAL 8, 커밋 140a992·1c7218e·5ff9d5a)

- 원인(동의 UI, F1·F2): (F1) 거부 전용 공지는 클릭 2초 뒤 열리는데 포커스가 푸터 버튼에 남고 알림도 없었으며, 닫힐 때 포커스가 body 로 떨어졌다. (F2) openManageConsent 호출마다 opened/fellBack 이 호출 로컬이라, 2초 안에 두 번 누르면 첫 타이머가 공지를 연 뒤 늦게 로드된 CMP 가 두 번째 호출의 콜백으로 showRevocationMessage 를 실행해 두 동의 UI 가 겹쳤다(재현: 가짜 타이머, 국가 XX, t=0·t=1s 클릭 → CMP 로드 시 show 1회).
- 조치(동의 UI, 140a992): cookie-consent-banner.tsx — 다이얼로그에 tabIndex -1·aria-describedby(메시지 p 의 id)를 주고 moveFocusInto 로 마운트 시 포커스를 받고 언마운트 시 열기 전 요소(isConnected 일 때)로 돌려준다. consent-config.ts — window 키 WeakMap 으로 요청을 하나만 유지: 대기 중이거나 공지가 열린 동안의 클릭은 아무것도 하지 않고, answerNotice 가 요청을 지워 이후 클릭은 그 사이 로드된 CMP 에 닿는다. EEA 에서 두 번 눌러도 revocation 메시지는 1회.
- 원인(문장 진실성, TXT-01~10·13): 생성기 문장이 분기 조건만 보고 페이지 자체 수치와 다른 관계를 단정했다. 각 문장을 시드에서 페이지별로 다시 계산해 거짓인 쪽수를 셌다 — TXT-01 "past as many as N places" 양쪽 합산(216/220쪽), TXT-02 클러스터 0인데 "move several places" 와 "rank would hold" 공존(38쪽), TXT-03 같은 간격인데 "not the middle of the band"(55쪽), TXT-04 "five places" 인데 이름 1~4개(64쪽), TXT-05 총액이 같은 주에 "totals do"(12쪽)·이웃이 같은데 "not the cost pairing"(3쪽), TXT-06 크기가 다른 표의 순위 번호를 빼서 "24-place spread"·전부 하위 3분의 1인데 "does not rank uniformly"(132쪽), TXT-07 FAQ "premium ... concentrated in straightforward matters" 인데 단순 티어가 중간값 이하(57쪽), TXT-08 "expensive to start" 인데 단순 티어가 중간값 이하(7쪽), TXT-09 "barely moves"·"similar position" 인데 티어 순위가 4~17 차이(85쪽), TXT-10 단순 티어 step 문장의 달러·시간차·시급 조합이 곱셈으로 안 맞음(249쪽), TXT-13 pro se 답변이 "비용이 filing fee 와 문서 작성으로 줄어든다"고 단정(같은 페이지의 송달·조정 비용 목록과 모순).
- 조치(문장, 1c7218e): 컨텍스트에 clusterReach·sameRateSameTotal·tierRankSpread 추가. TXT-01 N = 위/아래 중 큰 쪽(동률은 양쪽), TXT-02 "rank would hold under a change of up to three percent", TXT-03 같은 간격이면 "a median and also the middle of the band", TXT-04 장소 수 = 이름 수(one~five, 1개면 "records"), TXT-05 총액이 같은 주는 같은 총액을 밝히고(전부/일부) 이웃이 같으면 "the same two states that bracket it on ... cost", TXT-06 strongest/weakest 를 자기 표 안의 상대 위치(rank/of)로 정하고 퍼센트로 표기하며 전부 한 3분의 1이면 non-uniform 금지, TXT-07 premium 절은 단순 티어 > 티어 중간값일 때만, TXT-08 "expensive to start" 도 같은 조건(아니면 "simple tier already sits at or below the middle ... complex tier sits lower still"), TXT-09 티어 순위 폭 ≤3 일 때만 "barely moves"·"similar position"(아니면 폭을 적는다), TXT-10 "from H1 at $R1 to H2 at $R2", TXT-13 "no attorney fees are billed, while court filing fees and other non-attorney charges ... still apply". K3: 8개 cost:* 가족을 2026-10-08 → 2026-10-10 로 옮기고(5ff9d5a) k3-visible-dates 기대값을 따랐다.
- 회귀 테스트(수정 전 실패 → 수정 후): tests/regressions/k14c-decline-only-fallback.test.ts 32건 중 신규 8건(F1 4건·F2 4건)에서 7건 실패 → 전부 통과(F2 의 "늦게 로드된 CMP 도달" 대조군은 처음부터 통과: 수정이 CMP 를 영구 차단하지 않음을 고정). tests/regressions/k4a-r1-truth.test.ts 15건 전부 실패 → 전부 통과(위 쪽수가 실패 목록의 길이). 문구를 못 박고 있던 k4a-assumptions·k4a-generators-property·k4a-prose-property 오라클은 바뀐 관계(클러스터 N=한 방향 최대, step 절, 상대 위치 극값, 장소 수 문구)로 고쳤다 — 삭제·skip 없음.
- 범위 밖으로 남긴 같은 부류 후보(스코프 프리즈로 손대지 않음, 후속 웨이브): trajectorySentence 의 shift>=4 가지("moves up ... The state's position on the headline moderate figure understates where it sits once a matter is contested")는 moderate 순위가 세 티어 중 최고일 때(예: Alaska/estate-planning 24·3·18위) 거짓이고, FAQ 의 shift>=4 가지("more distinctive on contested matters")도 같은 조건 점검이 없다. shift>=10 가지의 "ordinary prices here"도 단순 티어가 중간값 이하인지 확인하지 않는다.
- 게이트: 무거운 작업(전체 vitest·eslint 전체·tsc 전체·next build)은 돌리지 않았다. 단일 파일 확인: 위 테스트 파일들과 영향 파일 약 30개(k4a-* 7개, k3-*, date-tz, code-02-schema, phase3-fixes, divorce-hub, seo-meta, k8-index-policy, data-license-terms, category-editorial, code-06-info-gain, geo-answer-block, k17, k5, no-advice-faq, no-developer-speak, no-positional-citations, no-unsupported-claims, no-visible-draft-placeholders, pi-*, stats-consistency, common-fees-labeled, filing-fee-verified, next-steps-coverage-claims, title-quality, ux-next-steps, privacy-matches-behavior, k18-fixed-elements, k14-consent-scenarios) 전부 통과, 바뀐 파일 eslint 종료 코드 0, 바뀐 파일만 담은 범위 tsc --noEmit 종료 코드 0.

## 2026-10-10 — K14-c: 국가 미상 방문자의 "Manage consent" 링크가 죽은 컨트롤이 되지 않게 함 (AppFarm 3, 계약 K14-c)

- 원인: K13-R(12)가 국가 미상(쿠키 없음·XX) 방문자의 링크를 우리 배너가 아니라 CMP 큐(googlefc.callbackQueue → showRevocationMessage)로만 보냈다. 실제 위치가 비EEA면 Funding Choices 가 로드되지 않아 큐의 콜백이 영원히 실행되지 않고, 링크를 눌러도 아무것도 열리지 않았다(옵트아웃 수단이 사라짐). 우리 배너로 되돌릴 수는 없다 — Accept 가 granted update 를 보내 EEA 일 수 있는 방문자에게 K14-b 위반이 된다.
- 조치(5a767b6, 28dfe71): consent-config.ts openManageConsent — 국가 미상일 때만(hasDeclineOnlyFallback: EEA 가 아니고 두 글자 국가 코드도 아님) 큐에 콜백을 넣고 CMP_WAIT_MS(2000ms) 안에 그 콜백이 showRevocationMessage 를 호출하지 못했으면 consentDeclineOnly 이벤트를 보낸다. CMP 가 이미 열렸거나 대기 안에 준비되면 이벤트 없음(이중 UI 금지), 우리 공지가 열린 뒤 늦게 로드된 CMP 는 메시지를 열지 않는다(fellBack). cookie-consent-banner.tsx 의 ConsentNotice 가 mode "full"|"decline-only" 를 받는다: 거부 전용은 Decline 버튼 하나와 /privacy#cookies 링크뿐 Accept 없음. answerNotice 가 거부 전용 모드의 accepted 를 거절(저장·전송 없음), Decline 은 기존 persistConsent → consentChange → denyConsent 경로(네 신호 denied update 1회 + cookie_consent=declined 저장, 재방문에도 존중). applyConsentChange 는 granted 를 알려진 비EEA 국가(manageConsentAction === "banner")에서만 보내도록 조여 국가 미상에서는 어떤 이벤트로도 granted 가 나가지 않는다. EEA/UK/CH(K14-b, 큐만·폴백 없음)와 알려진 비EEA(K14-a, 전체 배너)는 그대로. 개인정보처리방침: 쿠키 절에 id="cookies", 폴백 동작 문장 추가, 효력일 2026-10-08 → 2026-10-10(본문이 바뀐 날, 방침이 약속한 대로).
- 회귀 테스트: tests/regressions/k14c-decline-only-fallback.test.ts 24건 — googlefc 부재(XX·빈 값) 시 2초 안에 거부 전용 공지, 렌더는 버튼 1개·Accept 0·/privacy#cookies 링크, Decline 은 denied update 1회만(네 신호)·granted 0, googlefc 준비(즉시·대기 중 로드) 시 공지 미렌더·타이머 0, 폴백 뒤 늦게 로드된 CMP 는 메시지 미표시, EEA 4개국은 큐만(타이머 0·공지 0), 알려진 비EEA 는 전체 공지, 위조된 accepted 이벤트 무효, 방침이 폴백을 서술하고 링크 대상 id 가 실재. 양성 대조: 수정 전 소스에서 24건 중 23건 실패(1건은 기존 planInitialConsent), 변이 9종(타이머 제거·준비 무시·늦은 CMP 허용·대기 3000ms·EEA 폴백·거부 전용에서 Accept 허용·국가 미상 grant·Accept 렌더·이벤트 미구독)은 각각 1~5건 실패. 기대값 정정(삭제·skip 아님): k14-consent-scenarios.test.ts 는 가짜 타이머로 실행(2초 실타이머가 테스트 밖으로 새지 않게, 단정은 그대로), privacy-matches-behavior.test.ts 는 효력일만 10월 10일로.
- 재발 방지: 컨트롤을 외부 스크립트(CMP)에 위임하면 그 스크립트가 로드되지 않는 경로(타임아웃 폴백)를 같이 만든다. 폴백은 외부 판단과 충돌하지 않는 방향으로만 연다(국가 미상 = EEA 일 수 있음 → 거부 전용). 위 테스트가 부재·준비·늦은 로드·EEA 불변을 고정한다.
- 게이트: 무거운 작업은 돌리지 않았다. 단일 파일 실행: 신규 테스트와 기존 consent·analytics·privacy·광고 테스트 15개 파일 전부 통과(csp-k13r 은 처음에 prerender 트리 스캔 훅이 10초 제한에 걸렸다가 --hookTimeout=120000 으로 통과, 바뀐 코드와 무관한 I/O 경합), 바뀐 파일 eslint 종료 코드 0, 바뀐 3개 TS 파일만 묶은 tsc --noEmit 종료 코드 0. 열린 항목: 전체 vitest·eslint·tsc·빌드는 게이트 단계 몫. W5: IndexNow 키 파일은 prebuild(scripts/indexnow-key-file.mjs)가 Vercel 프로덕션 환경변수 INDEXNOW_KEY(Production, Config, 100일 전 생성)로 public/{key}.txt 를 쓰고 정적 파일로 서빙한다(라우트 없음). 마지막 프로덕션 빌드 로그(2026-08-30)에 "wrote key file"·"submitted 435 urls" 가 있으나 파일명이 REDACTED 라 라이브 curl 은 하지 못했다. 새 postbuild 는 라이브 /{key}.txt 본문이 키와 같은지 확인하고 실패하면 제출만 건너뛴다(빌드는 실패하지 않음).

## 2026-10-08 — RC 적대 검토 후속 수정 2: 프로그래매틱 산문의 거짓 문장 (AppFarm 3 fixer, 7c9ae9b..HEAD)

- 증상: fresh-context 릴리스 검토(legal-review-rc.md)가 CRITICAL 3건·WARNING 4건·SUGGESTION 2건을 냈다. (C1) hoursSentence 가 시간이 피어 중앙값보다 적기만 하면 "because the rate rather than the workload carries more of it"을 붙였는데 그 주의 시급이 피어 중앙값 시급보다 높을 때만 참이다 — "fewer" 가지를 타는 110쪽 중 64쪽(시급이 같거나 낮은 쪽)에서 거짓(alabama/divorce: $220 대 피어 $295). (C2) calculationBlocks 가 가격 비중이 60% 미만인데도 "weighted toward price"라 불렀고(101쪽, 그중 79쪽은 비중이 50% 미만), 분해한 두 부분의 합이 표시한 step 과 달랐다(337쪽 중 328쪽: $3,000+$2,475 대 "$5,400 step"). (C3) /divorce-cost-by-state 가 시드에 없는 "typical court filing fees ... bar association resources"에서 컴파일했다고 서술(이혼 153행은 nolo·legalzoom·clio·bls 4개만 인용). 경고·제안: W1 전국 단일 값인 기간을 "The sources record {duration}"로 주별 출처 사실처럼 서술, W2 이웃 오차 $0에서 "1100x the neighbour error", W3 "A move of $1 anywhere in the table re-ranks {State}", W4 조언형 FAQ 템플릿 3개, S1 /compare 셀렉트의 원시 값, S4 "County rates sit on both sides of the statewide band".
- 근본 원인: 한 부류다. 문장이 말하는 조건(원인·비교·"most"·비율·퍼센트)이 분기 조건이나 계산된 관계와 같은지를 확인하는 테스트가 닿지 않는 생성기가 state-context.ts 의 26개 중 10개였다(hoursSentence·escalationSentence·overlapSentence·bandSentence·tempoSentence·assumptionItems·premiumSentence·calculationBlocks·calibrationSentence·extraCalculations). 886034c 의 "369쪽 전부" 는 k4a-prose-property 가 import 하는 16개 생성기에 한한 말이었고, 계약 K4-a 확장(모든 생성기를 모든 입력 조합에서 단정)을 절반만 이행했다. C3 는 0389b77 의 신뢰 문구 점검이 놓친 허브 페이지로, no-unsupported-claims 에 해당 패턴이 없었다. W4 는 CLAUDE.md 의 조언형 기능 금지가 FAQ 템플릿 문자열에는 적용되지 않았다. S1 은 b3ca897 이 계산기 셀렉트만 고치고 같은 컴포넌트 패턴의 /compare 를 찾지 않았다.
- 새 테스트가 추가로 찾은 거짓·근거 없는 문장(검토가 놓친 것): (1) calculationBlocks 단순 티어 블록 "The $X step to the moderate tier is N more hours at that rate" — N 은 서로 다른 시급으로 반올림한 시간 차이라 step/단순 시급과 다르다(기간을 파싱하는 249쪽 전부 거짓). (2) premiumSentence 폭이 넓을 때의 "A single 'X is expensive' or 'X is inexpensive' claim would be wrong for at least one matter type" — 모든 매터가 중앙값 위(98쪽)이거나 아래(8쪽)면 거짓(넓은 129쪽 중 106쪽). 프리미엄이 0%로 반올림되면 "sits on its own midpoint"(15쪽). (3) escalationSentence 의 "almost all of that is hours", "Complexity here buys attorney time, not a premium hourly rate"(시급이 1.5~1.8배 오르는데), "unusually large share", "senior-rate premium", "3.9x more billed time" — 데이터가 판정하지 못하는 비교·서열. (4) extraCalculations "the difference between an occasional file review and continuous work"(월 1~12시간), "ratios differing because the rate rises" 무조건 서술. (5) hoursSentence 의 "flat-fee and limited-scope arrangements ... tend to describe how the work is actually billed"(12시간 미만 92쪽)와 "normally staged against a retainer"(렌더된 적은 없음) — 시드에 없는 청구 관행. (6) assumptionItems: 1개·3개 주인데 "outside that pair"(83쪽), 이 매터 표만 비교하고 "Nothing else in our cost figures"(19쪽), "$4,000–$4,000"(범위 아닌 한 점), "a metropolitan quote ... the county it came from" 카운티 서술, "will not reproduce ... guessed hour count"·"where flat fees dominate"(325쪽)·"paralegal work and disbursements" 근거 없는 추론. (7) 이혼 허브의 "exact filing-fee ... figures" 와 "(attorney fees + court costs)", 파산 FAQ 의 출처 없는 "$20-$50 each", 개인상해 FAQ 의 "Consult ... an attorney". overlapSentence·bandSentence·calibrationSentence 는 같은 방식으로 단정했고 369쪽 모두 참이라 가드로 남겼다.
- 수정 커밋: f95a998 hoursSentence(peerMedianRate 를 컨텍스트에 추가, 원인 절은 시급 > 피어 시급일 때만, 시급 두 값을 함께 표기; 근거 없는 청구 관행 문장 제거 → "한 시간 추가가 총액의 N%"). 9e7eb4e calculationBlocks(3분기: work>=60 mostly work / price>=60 weighted toward price / 그 밖 split between work and price 와 두 비중 모두 표기, 부분 합이 step 과 다르면 합계와 반올림 사실을 문장에 밝힘, 단순 티어 블록은 두 시간과 자체 시급을 표기, 이웃 오차 0은 배수 없음·max($50, 중앙값 1%) 미만은 달러로·배수는 "larger neighbour error" 대비 최대 24x). 66260dc escalation·premium·extraCalculations. e638b87 W1 기간(FAQ 답변 전 369쪽과 tempoSentence 4변형이 "The estimate assumes ... national figures for this matter and complexity, not specific to {State}"; "a 8.1x span" → "a span of 8.1x"). 526675c W3·S4·assumptionItems(컨텍스트에 rankEdges: 가장 가까운 엄밀히 높은/낮은 중앙값·동률 수; 임계값을 median+gap 과 median+gap-1 의 엄밀 순위로 검증). ce82778 C3(허브 문단을 "modeled from published national fee guides and rate surveys"와 실제 인용된 4개 출처 명명으로, FAQ·표 주석의 근거 없는 서술 제거). d4450ce W4(이혼·부동산 종결·이민 질문을 비용 질문으로, 파산·개인상해 보정). 0de5fd1 S1(/compare 셀렉트 6개에 items). 86acbd5 K3 날짜·증거. 7f01393 생성기 커버리지 가드. a205e44 hoursSentence 가 matterLabel 을 계속 쓰도록(린트 경고).
- 회귀 테스트(수정 전 실패 수 / 수정 후): tests/regressions/k4a-generators-property.test.ts 8건(hoursSentence 3건 중 2건, calculationBlocks 5건 중 5건 실패 → 8건 통과), k4a-generators-wording.test.ts 10건(7건 실패 → 통과), k4a-durations.test.ts 5건(3건 → 통과), k4a-assumptions.test.ts 4건(3건 → 통과), no-unsupported-claims.test.ts 68건(허브를 단일 페이지 스캔에 추가하고 패턴 4개; 2건 → 통과), no-advice-faq.test.ts 13건(8건 → 통과), ux-select-labels.test.ts 13건(3건 → 통과), k4a-generator-coverage.test.ts 3건(7f01393; 양성 대조가 첫 속성 테스트 파일만 보면 빠진 생성기 10개를 정확히 나열). 공통 오라클은 tests/regressions/helpers/k4a-oracle.ts: 시드 행에서 순위·피어 중앙값·시간·기간·프리미엄을 다시 계산하며 테스트 대상 함수를 호출하지 않는다. 모든 테스트가 분기 비공허 가드(각 분기가 한 번 이상 나타남)와 옛 문구를 재주입하는 양성 대조를 가진다.
- K3: 8개 매터 가족은 이미 2026-10-08 이라 증거만 보탰고, page:divorce-cost-by-state 를 2026-07-03 → 2026-10-08 로 옮겼다(ce82778 이 본문을 실제로 바꿈). page:compare 는 옮기지 않았다 — S1 은 값을 고른 뒤의 표시만 바꾸고 /compare 서버 HTML 은 0de5fd1 전후가 바이트 동일하다(빈 선택 상태로 렌더). 기대값 정정(삭제·skip 아님): k3-no-global-lastmod.test.ts "dates differ across page types" 의 > 3 → > 2(사유: 이혼 허브가 07-03 에서 옮겨 사이트맵의 서로 다른 날짜가 2026-10-08·10-07·07-02 세 개가 됨; 단정의 의도는 단일 상수가 lastmod 를 정하지 않는다는 것).
- 예방: state-context.ts 에 export 된 생성기가 어느 k4a-*.test.ts 에도 참조되지 않으면 k4a-generator-coverage.test.ts 가 실패한다(새 생성기를 추가하면 속성 테스트를 같이 써야 함). "because·more/less·weighted·most·every·all·only·fewer·비율·퍼센트"를 쓰는 문장은 같은 파일의 오라클이 계산한 관계로 단정하고, 데이터가 판정하지 못하는 비교("unusually", "comparatively", 청구 관행, 카운티)는 쓰지 않는다. 시드에 없는 출처·구성(court filing fees, bar association, attorney fees + court costs, county)을 주장하는 문구는 no-unsupported-claims 패턴에 추가한다. FAQ 템플릿 질문은 비용·일반 정보형만(no-advice-faq).
- 게이트: 이 단계에서는 무거운 작업(전체 vitest·eslint 전체·next build)을 돌리지 않았다. 단일 파일 확인: 위 신규·변경 테스트 파일과 영향 파일(k4a-prose-property 20건, k3-*·date-tz·indexnow-delta·indexnow·code-02-schema·phase3-fixes·category-editorial·divorce-hub·no-developer-speak·ad-density·ad-proximity 등) 전부 통과, 마지막 코드 변경(a205e44) 뒤 변경한 .ts/.tsx 파일 전부에 대한 eslint 종료 코드 0(출력 0바이트), tsc --noEmit 종료 코드 0. 열린 항목(이번 범위 밖): W5 첫 배포 전 라이브 /{INDEXNOW_KEY}.txt 가 200 인지 확인(푸시 전 curl -sI), S2 카테고리 허브가 가족 날짜를 따라 같이 움직이는 설계, S3 푸터 "All rights reserved" 와 약관 6조 CC BY 4.0 의 병기. 푸시하지 않았다(푸시 = 프로덕션 배포).

## 2026-10-08 — 적대 검토 후속 수정 (AppFarm 3 fixer, 커밋 561d440..HEAD 대상 findings)

- 작업 트리 정리: 배치 1/2 의 미커밋 변경(셀렉트가 slug·주 코드 대신 표시 이름을 보이고 트리거·옵션이 44px)을 tests/regressions/ux-select-labels.test.ts 와 함께 커밋(HEAD 소스에서 7건 실패, 변경 후 9건 통과). 게이트 전에 작업 트리가 깨끗해야 하므로.
- K19-D (IndexNow 공용 템플릿 이식): scripts/indexnow.mjs 를 AppFarm scripts/templates/indexnow-delta.mjs 와 바이트 동일하게 교체(sha256 89105d25ebb6…). 이전 29b0aab 맞춤 스크립트는 완전한 사이트맵 문서 검사·전체 마감 시간이 없어 잘린 200 응답을 작은 사이트로 읽고 거의 모든 URL을 "추가"로 재제출할 수 있었다. 키 파일(public/{key}.txt, 프로토콜상 라이브에서 200 이어야 하고 템플릿이 그 응답을 확인) 기록은 템플릿 밖의 scripts/indexnow-key-file.mjs 로 분리해 prebuild 에 남김 — 제거하면 다음 배포부터 /{key}.txt 가 404 가 된다. 맞춤 스크립트의 환경 변수(INDEXNOW_BASELINE_URL·INDEXNOW_BASELINE_FILE·INDEXNOW_SITEMAP_OVERRIDE)와 로그 문구는 삭제, 해당 단정은 템플릿 문구로 이전. tests/regressions/indexnow-delta.test.ts(템플릿 30건, 이전 스크립트에서 28건 실패 → 통과; "사이트맵 lastmod 가 빌드 시계를 따르지 않음" 포함), tests/indexnow.test.ts 와 indexnow-changed-only.test.ts 는 INDEXNOW_PROD_ORIGIN 을 닫힌 포트로 고정. 첫 배포는 수정된 URL과 사이트맵에서 빠진 URL을 변경분으로 정당하게 제출한다.
- K4-a (프로그래매틱 산문 생성기 속성 테스트, 리더 의무 사항): src/lib/seo/state-context.ts 의 순위가 정렬 위치(findIndex+1)여서 동률이 거짓 문장을 만들었다(369쪽 중 105쪽에서 "only N states record a higher median" 등이 엄밀 비교와 불일치; 예 massachusetts/real-estate 6 대신 5). 순위를 1+엄밀히 높은 주 수(동률은 같은 순위)로 바꾸고 statesHigher·statesLower 를 두어 "higher/lower/more/less" 개수는 이 값에서만 나오게 했다. 사분위·백분위·시간 순위·티어 순위·표 창 순위도 같은 정의. 같은 뿌리의 다른 거짓 진술도 고침: 다른 매터의 순위를 이 매터의 표 크기(of 51)로 적던 consistency 문장(매터마다 표 크기가 28~51), 고정 임계값 17/35 로 센 "upper/lower third"(매터별 표 크기로), 시급 순위 분모, 동률에서 "under/over"·"moves a place"·"tie-break" 서술, 중앙값 정확히 일치 주에 "below the midpoint"("at or below"). 매터 표의 순위 칸은 "Nth of K"로 분모를 적는다. tests/regressions/k4a-prose-property.test.ts: 369쪽 전부에 대해 독립 계산(원본 시드 행)으로 rankSentence·neighborSentence·사분위·FAQ 개수·티어/시급/시간 순위·thirds·consistency·카테고리·민감도·이동·군집 문장을 단정하고 파서가 못 알아보는 문장 형태는 실패시키며, 모든 문장 형태가 실제로 나타남을 확인하는 비공허 가드와 옛 위치 순위로 만든 문장을 검출하는 양성 대조를 포함. 수정 전 14건 실패(첫 실행), 수정 후 18건 통과.
- K4-a, geo.ts 답변 문단: 첫 문장이 중앙값을 "costs on average $X"로 적었다(중앙값을 평균이라 부름). "has a median cost of $X"로 고침. 같은 속성 테스트 파일에 두 블록 추가: 모든 색인 페이지의 답변 문단이 헤드라인 수치를 중앙값으로 부르고 "average"를 쓰지 않음(수정 전 실패), 벤치마크 문장(buildBenchmarkSynthesis)의 방향·퍼센트·"across N states with estimates"가 원본 시드로 다시 계산한 평균·표본 수와 일치함(이미 통과). 속성 테스트는 20건.
- LEGAL-31 / Q-L4 (리더 기본값 적용): Dataset JSON-LD 는 CC BY 4.0 을 선언하면서 약관 6조는 "compiled cost datasets" 소유와 복제·배포·스크랩 금지만 적고 라이선스 문장이 어느 페이지에도 없었다(K5 자기모순). 6조에 "Licensed material" 단락을 추가: /legal-cost-statistics/data.json·data.csv 와 /embed 아래 임베드 계산기 페이지에만 CC BY 4.0 을 부여(LegalCostCalc, published by Actigence 표기·라이선스 링크·변경 고지 조건), 그 밖의 텍스트·디자인·레이아웃·비용 데이터는 라이선스하지 않음을 명시하고 금지 문장은 "Except for the licensed material" 로 한정. 라이선스 URL은 src/lib/constants/data-license.ts 한 곳에서 Dataset JSON-LD 와 약관이 함께 읽는다. 효력일을 2026-10-08 로 갱신(약관 9조가 수정 시 갱신을 약속). 통계 페이지·피드 본문은 바꾸지 않아 content-dates 는 움직이지 않음. tests/regressions/data-license-terms.test.ts(수정 전 4건 실패, 후 5건 통과): JSON-LD license == 약관이 연결한 URL, 약관이 Dataset distribution 경로 전부를 이름으로 지목, 그 밖은 라이선스 아님 문장 존재.
- Next steps 블록의 "every state" 주장 (K4, K26-3): 서버 블록 "See {matter} cost in every state" + "Every state's estimate in one table." 와 클라이언트 블록의 같은 hint 가 카테고리 허브 표에 없는 주(개인상해 28, 파산 47, 이민 49, 부동산 46, 유언 46)에서도 거짓이었다. 제목을 "Compare {matter} cost across states", hint 를 "Estimates by state in one table." 로 바꿔 허브 행 수에 대한 주장을 하지 않는다(허브 자체 문구는 이미 행 수를 센다). tests/regressions/next-steps-coverage-claims.test.ts(수정 전 16건 실패, 후 19건 통과): 8개 카테고리의 렌더된 블록·서버/클라이언트 빌더·홈 블록에 전 주 주장 정규식 0, 허브 표가 51행보다 적은 카테고리가 실제로 있음을 함께 단정. 같은 부류로 보이나 이번 범위 밖이라 건드리지 않은 문장: how-legal-fees-work 의 "Compare hourly-rate data across all 50 states + DC in the legal cost statistics page"(통계 페이지는 주별 시급 표를 싣지 않음), 홈 FAQ "cover 8 legal categories across all 50 US states plus DC".
- 신뢰·검증 문구 잔재 (K30(1)/(5), K4): src/lib/constants/figures.ts 가 "인용 출처와의 대조 기록 없음"을 밝히는데 홈 신뢰 카드 제목은 "Authoritative References", 홈 FAQ·About·홈 출처 문단은 "publicly available legal-cost research and official fee schedules/information"에서 "compiled"/"use"한다고 썼고 About 메타 설명은 "commitment to accuracy", About OG 이미지 칩은 "Accuracy"였다. 제목을 "Reference Sources"로, 본문을 MethodNote 와 같은 "modeled from published national fee guides and rate surveys"로, 메타 설명을 "how to request a correction"(About 에 정정 요청 방법이 실제로 있음)으로, OG 칩을 "Corrections"로 바꿨다. 나중의 공식 수수료표가 우선한다는 고지 문장(home-publisher-content)은 정당한 주의 문구라 그대로 둔다. tests/regressions/no-unsupported-claims.test.ts 에 authoritative·official fee schedules/information(근거로 쓰는 문맥만)·commitment to accuracy 패턴을 추가하고 About 메타데이터와 OG 이미지 소스도 검사(수정 전 4건 실패, 후 66건 통과, 우선순위 고지 문장은 걸리지 않는 음성 대조 포함).
- 공통 수수료 목록 (K4, LEGAL-05 같은 부류): 시드의 common_fees 는 카테고리마다 51개 주 전부에서 한 글자도 다르지 않은 전국 범위인데("Mediation fees ($500-$2,000)", "License reinstatement fee ($100-$300)", "Trustee fees (3-10% of payments)" 등) "Common {Category} Fees in {State}" 아래에 아무 표시 없이 주별 수치처럼 놓였다. 법원 수수료 줄만 verified-fees 로 처리돼 있었다. 목록 위에 한 줄 안내를 추가: 확인된 줄(캘리포니아 이혼 법원 수수료)이 있으면 "Lines marked Checked are confirmed for {State} on the date shown. The other figures are typical nationwide ranges, not specific to {State}: some are set federally and others vary by court, county or provider.", 없으면 같은 취지의 앞 문장만. 연방 수수료(챕터 13 신청료, USCIS)가 섞여 있어 "법원·카운티별로 다르다"고만 쓰면 그 줄들이 거짓이 되므로 "일부는 연방이 정하고 나머지는 달라진다"로 썼다. 시드 숫자는 바꾸지 않았다. tests/regressions/common-fees-labeled.test.ts(수정 전 10건 실패, 후 11건 통과): 시드가 카테고리별로 51주 동일함을 단정하고, 8개 카테고리 각 3개 주의 렌더에서 목록 앞 안내를, 캘리포니아 이혼에서 확인 줄과 나머지의 구분을, 안내를 지우면 매처가 실패하는 양성 대조를 확인.
- 콘텐츠 날짜 (K3): 위 수정(886034c·0bf3de2·a0cd4c7·0389b77)이 8개 매터 가족의 모든 페이지 본문과 홈·About 문구를 실제로 바꿨으므로 content-dates.json 의 cost:* 8개(개인상해는 2026-10-07 → 2026-10-08)와 page:about 을 2026-10-08 로 옮기고 증거에 커밋을 적었다. 홈은 이미 2026-10-08 이라 증거만 보탰다. 수치는 그대로이고 날짜가 오르는 근거는 문구 변경뿐이다. 약관 효력일은 약관 자체 표기이며 content-dates 대상이 아니다.
- 게이트: 이 단계에서는 무거운 작업(eslint 전체·vitest 전체·next build·scan-built-html)을 돌리지 않았다. 확인한 것은 수정마다 단일 테스트 파일(수정 전 실패 → 후 통과)과 마지막 코드 변경 뒤 tsc --noEmit 종료 코드 0, 건드린 파일의 eslint 종료 코드 0 뿐이다. 작업 트리는 깨끗하다(배치 1/2 셀렉트 변경은 b3ca897 로 커밋). 게이트 단계가 eslint·tsc·vitest 전체·빌드 종료 코드를 이 섹션 위에 기록하고, .next/server/app/california/divorce-cost.html 에서 Consent Mode 기본값이 로더보다 앞인지(renderToStaticMarkup 이 아니라 Next 의 실제 출력) scan-built-html 로 확인한다.

## 2026-10-08 — UX/CTA 배치 2/2 (AppFarm 3, 계약 K24·K26, 리더 결정 D2)

- UX P0-3 (K26-2·K24·K9): 서버 렌더 "Next steps" 블록(`data-next-step="answer"`, 내부 앵커 3개, 외부 호스트 0)을 [state]/[slug] 의 단계 카드 바로 아래·계산기 위에, 홈의 계산기 아래(`home`, 위쪽 96px 여백으로 결과 뒤 광고 슬롯과 분리)에 추가했다. 이전 계획 커밋(9319069)의 블록은 약관 동의와 계산 뒤 클라이언트에서만 생겼다. 매터별 첫 항목: 측정 방문이 있는 다른 주(MA↔FL 등), 없으면 /compare; 개인상해는 합의금 순액 추정기. 클릭은 기존 `related_click` 의 `link_module=next_step`, `link_context=<placement>_<slot>`(경로만, 입력값 없음). 9319069 가 새로 만든 `next_step_click` 이벤트명은 폐기(포트폴리오 공통 지표 = link_module=next_step). "<Matter> Cost in Other States" 목록은 알파벳순 대신 측정 방문 주를 앞에 둔다. 이미 해결돼 있어 다시 하지 않은 것: 무관 자매 도메인 카드(89c635a, K9), 임베드 원시 코드 블록(현재 /embed 링크 한 줄). 테스트 tests/regressions/ux-next-steps.test.ts(HEAD 에서 9/10 실패). k24 테스트의 이벤트 기대값을 같은 이유로 정정(삭제 아님).
- UX P0-1a / D2 (K26-1·K26-4): 면책 문구를 삭제하거나 약화하지 않고 위치만 옮겼다. 15개 페이지 첫 요소 = 한 줄 요약("For informational purposes only. Not legal advice.") + "Read the full disclaimer" 링크(`#disclaimer`), 전문은 페이지마다 `<Disclaimer id="disclaimer" />` 1회(매터 페이지: 카드·Next steps 바로 아래·계산기 위, 홈: FAQ 앞, 그 외: 기존 하단 위치)와 푸터. CostResult 의 결과 카드 위 전문 반복은 제거(카드 바로 아래 ResultDisclaimer 는 유지). 404·오류 페이지는 변경 없음. CLAUDE.md·design/required.md 에 D2 형태를 기록. 테스트 tests/regressions/ux-disclaimer-placement.test.ts(HEAD 에서 31/33 실패).
- #418 계열: scripts/templates/date-tz.test.ts(04ee580, 3b91f80 이후 변경 없음)를 tests/regressions/date-tz.test.ts 로 복사, CONFIG 만 수정(sourceDirs src, 허용 1건 recent-calculations.tsx = 마운트 뒤 방문자 localStorage 목록이라 SSR 텍스트 없음, 렌더러 4개). 적중 2건 수정: 푸터 저작권 연도가 벽시계였음 → latestContentYear(); data-freshness.ts 가 UTC 날짜를 실행 존 기준으로 포맷(LA 에서 2026-01-01 → December 2025) → timeZone UTC. 사용되지 않는 utils/seo.ts 의 벽시계 연도도 같은 값으로. tests/regressions/hydration-locale-tz.test.ts: 루트 레이아웃 + 홈·매터 페이지·주 허브·카테고리 허브를 UTC/en-US 서버와 UTC+14 ko-KR·LA de-DE·콜카타 ja-JP 방문자(Date·Number·localeCompare·Intl 기본 로케일 덮어씀)로 renderToString 해 마크업이 같아야 한다(양성 대조 2개). 이 리포에는 DOM 이 없어 hydrateRoot 는 커밋하지 못했고, 같은 시나리오를 firepath 의 happy-dom 으로 임시 하네스에서 hydrateRoot 까지 돌려 8/8 무오류(경고 없음), 누수 있는 컴포넌트 양성 대조는 오류 검출을 확인했다(커밋 안 함: devDependency 추가 필요).
- UX P1-1c (K25·K26-7): 휴면 제휴 슬롯의 빈 래퍼(홈 py-16 128px, 매터 페이지 py-8, 정산 추정기 mt-10, 비교 도구 mt-8)를 파트너가 있을 때만 렌더. tests/regressions/ux-empty-wrappers.test.ts(HEAD 에서 4/6 실패). P1-1b(Feedback 알약 모바일 숨김)는 K18(34a11a)에서 이미 처리돼 있어 건드리지 않았다.
- UX P1-2·P1-4: 대비 토큰(text-slate-400 → slate-600 26곳, 흰 글씨 bg-teal-600 → teal-700 17곳, 작은 text-teal-600 → teal-700) + 44px 탭 영역(푸터 링크 2열 그리드·min-h-11, 헤더 링크·햄버거·메뉴 항목·닫기 버튼, 브레드크럼, 허브 뒤로가기, 허브 표 View details, 허브 칩, Copy link, 쿠키 배너 버튼, 이어하기 배너, 연락 폼 제출, Clear my data). 푸터 "Legal Categories" 8링크를 /california/* 에서 /category/* 허브로(K24: 비색인 페이지 대량 링크 금지). 허브 뒤로가기 문구 "Calculate your own estimate". tests/regressions/ux-contrast-tokens.test.ts, ux-tap-targets.test.ts.
- UX P1-3 일부: 결과 카드의 "Source 1/2" 칩을 출처 호스트명(uscourts.gov)으로. 카테고리 허브가 "all 50 states and DC"라고 쓰면서 표에는 28~49행만 있던 불일치를 표 행 수에 맞춤(개인상해 28, 파산 47, 부동산 46, 유언 46, 이민 49). tests/regressions/ux-source-labels.test.ts, ux-hub-coverage.test.ts.
- 하지 않은 것: 모바일 첫 화면 순서·입력 4개 이하·클릭랩·select 라벨(배치 1/2 범위, 작업 트리에 미커밋 변경이 남아 있음), 헤더에 허브 메뉴 추가(디자인 판단), 인쇄 스타일. 전·후 스크린샷은 배포 뒤 K28 에서.

## 2026-10-07 — AdSense $0 수정 시리즈 (AppFarm 3, 커밋 단위 기록)

- 규칙: 푸시 = 프로덕션 배포. 최종 게이트·적대 검증 후 한 번만 푸시. 중간 배포 없음. 커밋은 로컬만.
- 플랜 커밋 2 (K1, LEGAL-01): /terms의 자리표시자 관할 조항(9조)과 미검토 중재 조항(4B) 삭제, 조항 번호 1..10 재정렬. 임의 관할 지정 없음. 효력일을 내용이 실제로 바뀐 2026-10-07로 변경(약관 8조가 수정 시 효력일 갱신을 약속). 회귀 테스트 tests/regressions/no-visible-draft-placeholders.test.ts(소스·렌더 스캔).
- 플랜 커밋 3 (K6·K30, LEGAL-02·10·45): 발행자 슬롯 src/lib/constants/publisher.ts(Actigence, https://actigence.ai, contact@actigence.ai)만이 값을 정의. 푸터에 발행자·정정 연락처 표기. 바이라인은 검토자 미설정 시 "Published by Actigence" + "Not reviewed by a licensed attorney."로 표기하고 "Reviewed for accuracy (legal reviewer pending)"와 "Editorial Team" 표기를 제거(검토가 실제로 없었는데 검토됨으로 읽히는 표기였음). NEXT_PUBLIC_REVIEWER_* 슬롯과 "Reviewed by <이름>" 분기는 유지. reviewer.ts는 리터럴 process.env.NEXT_PUBLIC_* 읽기로 변경. 기대값 정정(삭제·skip 아님): tests/reviewer.test.ts 의 "legal reviewer pending 포함" 단정 → "Not reviewed by a licensed attorney 포함·pending 부재", tests/guide-how-legal-fees-work.test.ts 의 "LegalCostCalc Editorial Team" 단정 → 발행자·미검토 고지 단정. 사유: K30, 자리표시자가 일어나지 않은 검토를 주장했음.
- 플랜 커밋 4 (K6·K30, LEGAL-10): JSON-LD 의 author·publisher·creator 가 전부 발행자 슬롯(Actigence Organization)으로 해석됨(Organization 그래프·Article·SoftwareApplication·Dataset). 사이트명 자기참조 Organization 노드, foundingDate, contributor "LegalCostCalc Editorial Team", reviewedBy, 'source-verified' 문구 삭제. 검토자 env 가 설정된 경우에만 Article author 가 Person(실명)이 된다. 기대값 정정: tests/code-02-schema.test.ts 의 "LegalCostCalc Editorial Team" 단정 → Actigence Organization 단정(사유: K30). 회귀 테스트 tests/regressions/publisher-jsonld.test.ts(컴포넌트별) + publisher-identity.test.ts(렌더 페이지 8개의 ld+json 스캔).
- 플랜 커밋 5 (K6, LEGAL-10·11): contact@legalcostcalc.co(MX 레코드 없음, 수신 불가) 링크 4개(Terms 1, Privacy 3; href+표시 텍스트 8개 문자열)를 발행자 슬롯 이메일 contact@actigence.ai 로 교체. About·Contact·Terms·Privacy 에 "LegalCostCalc is published by Actigence." 문장 추가, About·Contact 에 정정 요청 방법 추가. Contact 페이지는 NEXT_PUBLIC_CONTACT_EMAIL 없이 항상 발행자 메일 링크를 표시. 소스 주석 "NOTE TO OPERATOR"·"LEGAL ENTITY" 삭제. Terms 의 계약 당사자는 그대로 LegalCostCalc(Q-L2 기본값: 발행자 문장만 추가, 법인 형태·관할 없음). Privacy 효력일·본문(Plausible/GA4, 쿠키 배너 서술)은 이 커밋에서 손대지 않았고 플랜 커밋 20 에서 정정한다. 회귀 테스트 tests/regressions/no-undeliverable-contact.test.ts(소스 스캔 + 렌더 4페이지, 수정 전 11건 실패).
- 플랜 커밋 6 (K12, LEGAL-27): [state]/[slug]·about·compare 의 loading.tsx 3개 삭제(라우트·error.tsx 는 유지). 본문이 `<div hidden id="S:0">` 뒤 스켈레톤 아래에만 보이던 문제 제거. 시드가 로컬이라 지연 없음, useSearchParams·Suspense 의존 없음(grep 0). 회귀 테스트 tests/regressions/k12-no-loading-skeleton.test.ts(수정 전 4건 실패). 빌드 후 HTML 에서 id="S:0"·animate-pulse 부재 확인은 최종 게이트(커밋 38) 스크립트 몫.
- 플랜 커밋 7 (K8, LEGAL-08 메커니즘): 데이터 주도 색인 정책. src/data/index-policy.json({keep:null,noindex:[],exceptions:[]}) + src/lib/index-policy.ts(createIndexPolicy 순수·주입 가능, isIndexable, INDEXED_PAGES). 의미: 기준=hasUniqueData, noindex 목록은 항상 비색인, keep 이 배열이면 keep·exceptions 에 있는 경로만 색인, keep=null 이면 K8 필터 없음(출하 상태 — 사이트맵·robots 는 HEAD 와 동일 369쪽). 목록의 알 수 없는 경로는 즉시 오류. 사이트맵 seoPages 와 [state]/[slug] generateMetadata 의 robots({index:false,follow:true})가 같은 정책을 읽는다. 허브·허브 표·통계·관련 매터는 계속 hasUniqueData/INDEXABLE_PAGES 를 읽어 noindex 라우트도 허브에서 링크되고 404 가 되지 않는다. src/data/k8-evidence.json 은 증거 전용(색인 결정에 쓰지 않음, 정책 모듈이 참조하면 테스트 실패): ga4-pages-host-90d.csv 의 host=legalcostcalc.co 57행 중 상태×카테고리 경로 49개, k8_traffic_eligible 39개(유기 조회 87/90일, 기간 2026-07-08..10-05, 동의 거부 세션 미집계라 하한). 근거 수치(분석 렌즈 기록): 템플릿 369쪽 색인, 39 유지 대상, 330 후보, 형제 5-gram 원시 0.49-0.55·마스킹 0.84-0.97, GSC 색인 204·크롤됨-미색인 159·클릭 6/3개월. 대량 채우기는 커밋 36(리더 Q-L1 대기). 복원 절차(noindex 로 바뀐 URL 이 생기면): noindex 목록에서 제거 후 배포하고 K19 IndexNow 로 제출. 회귀 테스트 tests/regressions/k8-index-policy.test.ts(정책 단위 8, 출하 상태 동일성 4, 주입 정책에서 사이트맵·robots·허브 일치 5, 증거 파일 4; 사이트맵 연결 전 주입 정책 테스트 2건 실패 확인).
- 플랜 커밋 8 (K7·K15, LEGAL-03·34): AdSense 로더를 루트 layout 에서 제거하고 서버 컴포넌트 src/components/ads/adsense-loader.tsx(AdsenseLoader)로 이동. 색인 콘텐츠 페이지만 렌더: /, /[state], /[state]/[slug](isIndexable 일 때만), /category/[category], /compare(페이지가 client 컴포넌트라 compare/layout.tsx 에서 렌더), /divorce-cost-by-state, /legal-cost-statistics, /how-legal-fees-work, /about, /contact, /privacy, /terms, /embed, /settlement-estimator. 제외: /embed/[state]/[slug](408), /search, not-found, error, 색인 제외 인스턴스. src/app 의 모든 page.tsx 가 포함·제외 표 중 하나에 있어야 하는 fs 열거 테스트가 있어 새 페이지가 조용히 광고를 잃거나 제외 라우트로 새지 못한다. 형태: React 19 는 <script async src> 를 <head> 로 끌어올려 head 안의 인라인 Consent Mode 기본값보다 앞에 놓는다(라이브 HTML 실측: 로더 오프셋 1682 < consent-mode-defaults 4502). 그래서 로더를 dangerouslySetInnerHTML 문자열(<div hidden> 안의 <script id=adsense-loader async crossorigin=anonymous>)로 본문에 내보내 기본값(head) → 로더(body) 순서를 렌더 HTML 에서 보장한다. next/script 는 beforeInteractive 가 루트 layout 전용이고 afterInteractive 는 서버 HTML 에 없어 제외. preconnect·dns-prefetch 힌트도 로더 컴포넌트로 옮겨 로더가 없는 페이지에는 나가지 않는다. src/lib/env.ts: firstConfigured(trim, ||, ?? 아님)와 resolveAdsenseClient()(env 값 → 공개 퍼블리셔 id 폴백, ca- 접두 정규화). 빈 문자열·공백 env 여도 로더와 google-adsense-account 메타가 사라지지 않는다. 그 결과 Consent Mode 기본값 스크립트도 항상 출력된다. 로더 SPA 한계: 로더가 없는 페이지(예: /search)에 직접 진입한 세션이 클라이언트 내비게이션으로 콘텐츠 페이지로 가도 새로고침 전에는 로더가 로드되지 않는다(제외 라우트 정책의 의도된 결과). 남은 사항: 색인 제외 인스턴스에서 계산 결과 직후 ResultMonetization 의 수동 광고 유닛은 그대로이다(로더 제외만 이 커밋 범위, K8 출하 정책은 비어 있어 현재 대상은 hasUniqueData=false 39쪽). 빌드 HTML 에서 head 에 기본값·본문에 로더 순서 확인은 최종 게이트(커밋 38). 기대값 정정(삭제·skip 아님, 사유: 로더가 layout 소스에서 사라짐): tests/code-02-loader-server-rendered.test.ts 는 layout 소스 단정 → 로더 컴포넌트 소스와 layout+로더 렌더 HTML 의 기본값 선행 단정, '{normalizedCaPub && (' 단정 → resolveAdsenseClient 사용·process.env 직접 읽기 없음 단정. tests/native-adsense-loader.test.ts 는 '로더가 head 안' → '로더가 head 밖(React 호이스팅 방지), 기본값은 head 안' 으로 뒤집음. tests/code-08-privacy-required.test.ts 의 기본값 순서 테스트(로더가 layout 에 없으면 else 분기로 의미 없이 통과)는 layout 에 기본값이 있고 로더가 없다는 단정으로 교체하고 렌더 순서는 k7 테스트가 고정. 회귀 테스트 tests/regressions/k7-loader-routes.test.ts(RootLayout+각 페이지 합성 렌더: 포함 14 클래스 1개·기본값 선행, 제외 5 클래스 0개, 주입 keep 정책, 소스 열거 5; 수정 전 18건 실패)와 tests/regressions/k15-env-fallback.test.ts(firstConfigured, 빈·공백 env 의 로더·메타 유지, 유효 값 사용).
- 플랜 커밋 9 (K7·K10, LEGAL-18): [state]/[slug]·[state]·category/[category]·embed/[state]/[slug] 에 export const dynamicParams = false. 네 라우트 모두 이미 generateStaticParams 가 있었고(408쌍·51개 주·8개 카테고리·408쌍, 시드 51주×8카테고리와 일치) 추가하지 않음. 이전에는 /texas/not-a-real-cost 같은 2세그먼트 미존재 경로가 HTTP 200 소프트 404(로더·index,follow 후 noindex 이중 robots·canonical 없음)였고, 이제 라우팅 단계에서 404 이다. generateMetadata 의 not-found 분기는 제목만 반환하면 루트 layout 의 index,follow 를 상속하므로 명시적 robots {index:false,follow:false} 로 바꿈(분기는 라우팅상 도달 불가, 방어용). 라우트 삭제·이름 변경 없음. 회귀 테스트 tests/regressions/k7-hard-404.test.ts(dynamicParams false 4, 시드 51/8/408 확인, 두 라우트의 정적 파라미터가 정확히 408쌍이며 texas/not-a-real-cost 제외, 51개 주, 8개 카테고리, 알 수 없는 경로 메타가 noindex,nofollow; 수정 전 8건 실패). 빌드 페이지 수 전후 비교(예상: 정적 파라미터 합 875 변화 없음)와 라이브 curl -I /texas/not-a-real-cost 404·로더 부재는 next build 가 무거운 작업이라 최종 게이트(커밋 38)·배포 후 검증으로 넘김.
- 플랜 커밋 10 (K4, LEGAL-04·40 일부): 개인상해(PI) 28개 색인 페이지(51주 전부 렌더 검증)의 "$0–$0 an hour"·"$0–$3,900 professional time"·"at $0–$0/hr" 제거. 시드 PI 153행은 hourly_rate 가 전부 0이고 달러 수치는 노트대로 선지급 가능한 사건 경비(case expenses)이다. cost-details-section: 시급 대역·시급 레버를 세 티어 모두 hourly median>0 일 때만 렌더하고, 계약금제 사건(시급 0 + contingencyFee 있음)에는 'Attorney Contingency Fee 33%–40% of any recovery'(시드 중앙 티어 low/high) 카드를 시급 카드 대신 보여 준다. 라벨은 '전국 일반 범위, 해당 주 수치 아님'이며 시드의 계약금 비율은 51주가 동일하다(티어별 3종). state-context datasetSentences: 시급이 없으면 ' at $X–$Y/hr' 절을 생략하고 'N rows of estimated case expenses'로 서술. category-editorial: 'professional time' 잔여 문장은 시급 사건에만, 계약금제에는 '변호사 보수는 회수액의 비율이며 이 달러 수치에 포함되지 않는다'로 대체하고 중앙값을 '추정 사건 경비의 중앙값'으로 표기. geo.ts 답변 블록(40~60단어): PI 는 계약금 비율 범위로 시작해 달러는 추정 사건 경비임을 밝힘(예: NY '33-40% of any recovery ... Estimated case expenses ... run $2,300-$11,400, median $5,700'), 비용 요인에서 시급 항목을 계약금 비율로 대체, 통계 문장에서 'attorney hours' 귀속 제거, 표 아래 costBasisNote 노출(answer-block.tsx). 숫자는 시드 그대로이며 새 수치·출처 없음. 계획 대비 변경: 'professional time' 문장의 실제 위치는 category-editorial.tsx 라 그 파일도 수정(계획 파일 목록 외). 남겨 둔 것: FAQ 의 'recorded median is $5,700' 문구와 PI 순위표의 동률 문장('$0 over the tier midpoint' 등)은 이 커밋 범위 밖(라벨/수치-문구 일치는 커밋 13, 시드 중복은 K8). 회귀 테스트 tests/regressions/pi-no-zero-hourly.test.ts(PI 51주 페이지의 $0 패턴 5종 부재 + contingency·case expenses·nationwide 존재, 답변 블록·통계·요인, 시급 사건 CA divorce 의 시급 문장 유지, 계약금 카드; 수정 전 51+건 실패).
- 플랜 커밋 21 (K5·K10, LEGAL-12): 연락 폼과 피드백 위젯이 전달되지 않은 메시지를 "성공"으로 보고하던 문제 수정. 두 route 가 한 헬퍼(src/lib/utils/message-delivery.ts)로 FEEDBACK_ENDPOINT 에 POST(5초 제한)하고 수신처가 2xx 로 답할 때만 {ok:true} 를 반환한다. 엔드포인트 미설정·공백, 비2xx 응답, 요청 예외는 HTTP 503 + "contact@actigence.ai 로 메일" 문구(Q-L3 기본값 적용: 리더 답변 없음). 로그에 엔드포인트 값을 남기지 않는다. 연락 폼은 5xx·네트워크 오류에서 mailto 링크를 보여 주고 검증 오류(4xx)는 서버 문구 그대로 표시한다. "1–2 business days" 약속을 페이지 본문·메타 설명·성공 문구에서 삭제(어떤 소스 파일에도 응답 시간 약속이 없음을 테스트가 스캔). Privacy 의 "전송 경로" 문장(커밋 20)은 이 동작과 일치해 수정 없음. 기대값 정정(삭제·skip 아님): tests/feedback.test.ts 의 "엔드포인트 미설정 → 200 ok:true"와 "전달 예외 → 200 ok:true" 단정은 이 커밋이 없애는 거짓 성공을 고정하고 있었다. 회귀 테스트 tests/regressions/contact-honest-delivery.test.ts(22건 중 19건 수정 전 실패; fetch 는 스텁이고 한 건은 실제 닫힌 로컬 포트로 요청해 외부 호스트로 나가지 않음, K22). 운영 확인 필요: 프로덕션 FEEDBACK_ENDPOINT 수신처를 운영자가 실제로 읽는지(Q3 미답변). 이전에는 실패가 보이지 않았으므로 수신처가 죽어 있으면 방문자에게 실패가 보이기 시작한다.
- 플랜 커밋 22 (K9, LEGAL-16): "More Free Cost Calculators — free tools from our network" 블록(dentalcostfinder.co·gofirepath.com·launchcostcalc.com·saascostx.com 4개 nofollow 링크, 435쪽 중 370쪽) 삭제: RelatedCalculators 컴포넌트, SIBLING_SITES 상수, 홈·[state]/[slug] 사용처. 주제 연관 링크는 RelatedMatters·RelatedLinks 가 계속 담당. 회귀 테스트 tests/regressions/no-sibling-links.test.ts(렌더 4쪽 + src 소스 스캔 + 파일 부재, 6건 모두 수정 전 실패).
- 플랜 커밋 23 (K2, LEGAL-23·37): 렌더된 본문의 개발자 어휘·깨진 생성 문장 제거. 'N rows'→estimates, 'bundled dataset'→our cost figures, '1 states'·'1 places'·'22th percentile' 단·복수·서수, 동률에서 나오던 '$0 over/off/light the tier midpoint'·'a $0 window'·'-$0'(exactly on / level with / the same figure 로 서술, 표의 끝 상태가 자기 자신과 비교되지 않음), a/an 일치(How Much Does an Immigration / an Estate Planning, FAQ·답변 블록·OG 이미지 포함, aOrAn 헬퍼). 통계 페이지 다운로드 링크는 파일명 대신 'Download as JSON/CSV'. /embed: 'this is what passes SEO value'·'attribution markup for SEO' 를 독자용 문구로 교체. 상태 페이지 본문에 매번 찍히던 원시 iframe/script 임베드 소스를 제거하고 EmbedPanel 이 /embed 로 안내(소스는 /embed 한 곳). 1월 'busiest month for divorce-related searches — save your estimate now' 배너 삭제: 독자에게 보이는 출처가 없고(K4) 컴포넌트 주석의 두 출처는 이 세션에서 검증하지 않았다. 기대값 정정(삭제·skip 아님): tests/revisit-hooks-audit.test.ts(배너 존재·문구 단정 → 배너가 없음을 단정), tests/code-03-embed-hardening.test.ts(EmbedPanel 이 EmbedSnippet 을 감쌈 → /embed 안내), tests/geo-answer-block.test.ts('a estate planning' 문법 오류를 고정하던 제목 단정). K3: page:embed 날짜를 실제 내용 변경일 2026-10-07 로 갱신(기존 2026-07-01). 회귀 테스트 tests/regressions/no-developer-speak.test.ts(템플릿 23쪽 + 홈·가이드·/embed·/statistics 렌더 스캔, 68건 중 55건 수정 전 실패). 전체 408쪽을 스캔(임시 스크립트, 커밋 안 함)해 첫 패스 뒤에도 남은 동률·0/1 단위 문장('adding $0 to the estimate', '0 more hours ... is $0', '1 more hours of work sit', 'with 0 states recording less', '0 places below its 40th', '0 hours apart')을 후속 커밋 3540c23 으로 고쳤고 최종 스캔 잔여는 정상 표기뿐이다('1 to 3 hours' 범위 등). 커밋 10 기록의 'PI 순위표 동률 문장 $0 over the tier midpoint'도 이 커밋에서 처리됨.
- 플랜 커밋 24 (K4, LEGAL-19): 통계 페이지·data.json·data.csv 가 51개 시드 주 전체의 평균을 보여 주면서 stateCount 는 정보 이득 게이트 통과 주만 세던 불일치 수정. getNationalAverage 는 이제 게이트를 통과한 주의 moderate 중앙값 평균이고 getNationalAverageStateCount 가 개수를 준다(게이트 자체는 "벤치마크 존재"만 필요해 순환 없음). 전/후(표시값 → 세는 주 평균): personal-injury 4,928 → 5,091(28개 주), bankruptcy 3,479 → 3,503(47), real-estate 2,155 → 2,176(46), estate-planning 1,954 → 1,991(46), immigration 4,938 → 4,893(49); divorce 8,798·dui 7,403·criminal-defense 9,905 는 51개 주 전부라 변화 없음. 같은 함수가 통계 표·헤드라인·Key Findings·data.json·data.csv·Dataset JSON-LD(variableMeasured 신설)·상태 페이지 벤치마크 문장에 쓰인다. 용어: 'national median'/'National Average' 혼용 → 'average of state medians'. 표에 States 열, 표 아래에 어떤 주를 세는지(출처 있고 다른 모든 주 수치와 다른 추정) 설명, data.json 에 averageDefinition. 상태 페이지의 'across all 50 states and DC'(PI 는 28개) 문구를 'across N states with estimates' 로 교체. 통계 OG 이미지의 '50 states & DC' 문구도 교체. K3: page:legal-cost-statistics 날짜는 이미 2026-10-07(content-changed)이라 유지하고 증거 문장만 갱신. 회귀 테스트 tests/regressions/stats-consistency.test.ts(시드 독립 재계산 대 표·JSON·CSV·JSON-LD·상태 페이지, 11건 중 8건 수정 전 실패).
- 플랜 커밋 25 (K10·K8, LEGAL-26·20 일부): [state]/[slug] 의 '다른 매터'·'다른 주' 링크가 정보 이득 게이트를 묻지 않고 전부 링크하던 문제 수정(예: Alaska 페이지가 색인되지 않는 /alaska/immigration-cost 로 링크, 비색인 고유 URL 37개 도달). 서버 쪽에서 isIndexable 로 목록을 만들어 RelatedLinks 에 넘긴다(클라이언트 번들에 시드를 끌어들이지 않음). RelatedLinks 는 hubStateCount 로 'View all N states'(허브가 실제로 보여 주는 주 수)를 표시하고 링크할 것이 없는 열은 렌더하지 않는다. 출하 정책(keep=null)에서는 hasUniqueData 와 동일, keep 목록이 생기면 keep 페이지만 링크되고 허브는 hasUniqueData 전부를 계속 나열하므로 색인에서 빠진 라우트도 고아가 되지 않는다. 주 허브 본문·메타 설명·'including …' 목록이 하드코딩 '8 common matter types' 대신 실제 행 수(5~8)를 쓴다. 회귀 테스트 tests/regressions/related-links-indexable.test.ts(출하 정책 2, 주입 keep 정책 1, 51개 허브 각각 본문·View details·메타 개수 일치; 54건 중 33건 수정 전 실패, 8행 주 21개는 이미 일치).
- 플랜 커밋 26 (K24·K26, LEGAL-46·41 일부): 유입 실적 페이지로 맥락 링크, 결과 직후 다음 단계, 고아 페이지 0 테스트. src/lib/top-traffic.ts 가 src/data/k8-evidence.json(GA4 90일, organic+AI+referral 조회 합, 하한값)을 읽어 isIndexable 통과 페이지만 조회순으로 돌려준다(색인 정책 변경 시 noindex 페이지로는 링크하지 않음, 증거 파일 자체는 색인을 정하지 않음). 홈에 'Popular legal cost estimates' 6개(예: Bankruptcy cost in Massachusetts)와 가이드·compare 링크, 카테고리 허브에 그 카테고리의 유입 페이지 최대 3개, 주·카테고리 허브 하단에 가이드·compare 한 줄. 결과 직후: 기존 가이드 문단을 NextSteps(2~3개: 같은 카테고리 주별 비교 /category/<slug>, 수수료 가이드, 개인상해만 /settlement-estimator)로 교체, 클릭은 새 GA4 이벤트 next_step_click{step,link_url}(입력·결과값 파라미터 없음). RelatedMatters 는 hasUniqueData 대신 isIndexable 사용(출하 정책에서는 동일). 개인상해 허브 바에 settlement-estimator 링크, /settlement-estimator 를 sitemap 에 추가(page:settlement-estimator 날짜 2026-07-02, 근거 3c04a81: 본문이 마지막으로 바뀐 커밋이며 이후 커밋은 속성·광고 로더·미사용 prop 만 변경). 기대값 정정(삭제·skip 아님): tests/internal-link-cap.test.ts 의 미러에 divorce·개인상해 허브 바 추가 링크 1개 반영(최대 19로 상한 20 이내), tests/related-matters.test.ts 미러를 isIndexable 로. 회귀 테스트 tests/regressions/k24-orphans-and-links.test.ts(13건 중 12건 수정 전 실패; 홈·허브 링크, 다음 단계 이벤트, 사이트맵 등재, sitemap 436개 전부 다른 페이지 본문에서 인바운드 링크 ≥1; 사이트 크롬 링크는 제외하고 계산). 주 허브에는 이미 모든 사건 유형이 나열돼 유입 페이지 블록을 따로 두지 않았다. 시각 재디자인·스크린샷(LEGAL-41)은 검증 단계 몫.
- 플랜 커밋 27 (K8 비대상, LEGAL-20): /compare 는 정적 HTML 이 93단어의 껍데기였다(상호작용 도구가 전부 클라이언트 렌더). 도구 도입부는 그대로 두고 src/app/compare/page.tsx 를 서버 컴포넌트로 바꿔 클라이언트 도구(src/components/compare/compare-tool.tsx, 기존 코드 이동)에 children 으로 CompareOverview 를 끼워 넣는다(통계 집계를 클라이언트 번들로 끌어오지 않기 위함). CompareOverview: 통계 페이지와 같은 buildStatisticsAggregate(커밋 24 모집단)로 격차가 가장 큰 사건 유형의 최고·최저 주와 달러·퍼센트 차이를 예시로 서술하고, 8개 사건 유형 전부의 최고·최저 주 중앙값과 센 주 수를 카테고리 허브 링크와 함께 나열, 읽는 법·모델 추정 고지(MethodNote)·통계 페이지·수수료 가이드 링크를 둔다. 수치는 새로 만든 것이 없고 전부 집계 산출값이다. statistics.ts 에는 widestSpreadRow 를 뽑아 Key Findings 와 같은 선택 규칙을 공유한다. K3: page:compare 날짜를 실제 내용 변경일 2026-10-07 로 갱신. 노인덱스 대상 아님(도구 페이지, 보강). 회귀 테스트 tests/regressions/compare-content.test.ts(6건 중 5건 수정 전 실패: 93단어, 섹션 부재; 8개 유형의 주 이름·중앙값이 통계 페이지 렌더에도 있음, 예시의 격차 달러·퍼센트, 카테고리 허브 8개 링크, 방법 고지).
- 플랜 커밋 28 (K17, LEGAL-28): 제목이 단어 중간에서 잘리고("Cost Data &", "Cost Dat"), 이중 공백이 생기고, layout 템플릿 "%s — LegalCostCalc"가 이미 상표가 붙은 제목에 한 번 더 붙어 66~76자였다(라이브 /texas, /category/divorce). buildMeta 는 이제 {absolute} 제목을 내고(템플릿이 다시 붙지 않음) 하드 절단(.slice(0,60))과 ": 2026 Attorney Fee Guide" 류 패딩 접미사를 삭제했다. 생성 페이지 제목 = 핵심구 전체 + (연도, content-dates 레코드에서) + " — LegalCostCalc" 를 60자 안에서 연도·브랜드 순으로 채우고 안 들어가는 단위는 통째로 뺀다: 대부분 "Divorce Cost in California (2026) — LegalCostCalc" 형태, 79쪽은 연도를 빼고 브랜드만, 14쪽(예: Estate Planning / Probate Cost in District of Columbia)은 둘 다 빠진다. 손으로 쓴 정적 제목은 그대로 쓰되 브랜드가 60자 안에 들어갈 때만 붙인다(About 은 이미 상표 포함). OG/Twitter 제목은 페이지 제목과 같다. 기대값 정정(사유: 50~60자 하한이 키워드 없는 패딩을 낳았고 템플릿 이중 상표가 한도를 넘김): tests/seo-meta.test.ts 의 [50,60] 단정 → 상표 포함 ≤60, 제목을 읽는 기존 4개 테스트는 문자열 대신 {absolute} 를 읽는 헬퍼(tests/regressions/helpers/title.ts)를 쓴다. 회귀 테스트 tests/regressions/title-quality.test.ts(홈·허브 51·카테고리 8·매터 408·정적 11쪽 전수, 수정 전 9건 중 7건 실패). K3: 본문이 아니라 메타만 바뀌므로 content-dates 는 올리지 않는다.
- 플랜 커밋 29 (K17·K23, LEGAL-21): 검색 노출은 있으나 클릭 0인 'legal fees'(110)·'legal costs'(70) 질의에 홈·수수료 가이드의 title·meta·H1·첫 100단어를 맞춤(키워드 반복 없음, 새 URL 없음). 홈: title 'Legal Fees & Costs by State: Free Calculator — LegalCostCalc'(60자), H1 'How Much Do Legal Fees Really Cost?', 히어로 문단이 H1 바로 다음에서 '매터·주·청구 방식에 따라 다르다 + 평균 시간당 약 $349(Clio 2025 Legal Trends Report) + 모델 추정 주 중앙값 평균이 estate planning/probate $1,991 ~ criminal defense $9,905(통계 페이지와 같은 집계 함수)'를 서버 렌더로 답한다. 가이드: 리드 문단과 meta 설명이 같은 Clio 벤치마크(전국 평균 약 $349, 주별 약 $196 West Virginia ~ 약 $492 Washington, D.C.)를 먼저 말하고 '사례가 아닌 기준값, 견적 아님'을 명시. 새 수치·새 출처 없음: 값은 가이드의 GUIDE_FACTS 에 이미 있던 출처 있는 사실이며 공유 상수 src/lib/constants/benchmarks.ts 한 곳에서 홈·가이드가 가져온다. 1차 출처 재확인 시도: 2026-10-08 Clio 페이지 GET 이 HTTP 403(봇 차단)이라 재확인은 주장하지 않고 가이드 사실의 마지막 출처 확인일 2026-07-18 을 그대로 둔다(GUIDE_UPDATED 는 콘텐츠 변경일로 의미를 정정). 모든 비-PI 비용 페이지(369쪽 중 341쪽)의 리드 답변 끝 'based on sourced attorney-fee and court-cost data' 를 'a modeled estimate from published fee guides'(같은 단어 수라 40~60단어 절단 결과 불변)로 바꿔 NY·CA 이혼 포함 모델 추정임을 첫 100단어에서 밝힘('sourced' 는 검증된 1차 출처 대조로 읽힐 수 있었음). K3: 본문이 실제로 바뀐 page:home·guide·cost:{divorce,dui,bankruptcy,real-estate,estate-planning,criminal-defense,immigration} 날짜를 2026-10-08 로 이동(PI 가족은 우발 분기라 문구 불변이라 유지), 증거 문장 갱신. 기대값 정정(사유: 날짜가 실제 콘텐츠 변경으로 이동): tests/regressions/k3-visible-dates.test.ts 'Updated October 7, 2026' → 8일, tests/guide-how-legal-fees-work.test.ts 'Updated July 2026' → 'Updated October 2026'. 회귀 테스트 tests/regressions/k17-intent-alignment.test.ts(홈·가이드·NY·CA 첫 100단어에 수치·조건·출처, 질의 구절 ≤2회, 제목·설명 길이, 홈·허브→가이드 링크, 통계 집계와 값 일치; 16건 중 12건 수정 전 실패).
- 플랜 커밋 30 (K19·K22, LEGAL-22·42·34): postbuild IndexNow 가 Vercel 프로덕션 빌드마다 빌드된 사이트맵 435 URL 전체를 재제출하던 것을 변경분만 제출하도록 교체. 기준선 = postbuild 시점의 라이브 프로덕션 사이트맵(새 배포가 올라오기 전이라 이전 배포) 이고, 제출 집합 = 새로 생긴 URL + lastmod 가 달라진 URL + 기준선에는 있으나 새 사이트맵에서 빠진 URL(noindex 전환 포함). lastmod 는 날짜 부분만 비교. 기준선을 읽지 못하거나(네트워크·비2xx·사이트맵 아님) 비어 있으면 아무것도 제출하지 않고 로그만 남기며 전체 목록으로 폴백하지 않는다. 엔드포인트는 INDEXNOW_ENDPOINT 로 바꿀 수 있고(기본 https://api.indexnow.org/indexnow), 기준선은 INDEXNOW_BASELINE_URL·INDEXNOW_BASELINE_FILE 로 바꾼다. 환경 값은 `||` 로 읽고(NEXT_PUBLIC_APP_URL·INDEXNOW_KEY 는 trim) 요청에 20초 제한. 로그: 변경 수(신규/lastmod/삭제)·배치별 HTTP 코드·실패 코드, 키 값은 출력하지 않는다. prebuild 키 파일 생성·VERCEL_ENV==='production' 가드는 그대로. 순수 함수 parseSitemapEntries·diffSitemaps·buildPayloads 를 export 하고 스크립트는 직접 실행될 때만 동작한다. 기대값 정정(사유: K22 외부 부작용 0): tests/indexnow.test.ts 의 모든 spawn 이 INDEXNOW_ENDPOINT·INDEXNOW_BASELINE_URL 을 닫힌 로컬 포트 127.0.0.1:9 로 고정(이전에는 존재하지 않는 사이트맵 경로로만 POST 를 피했음). 첫 프로덕션 배포는 기준선(2026-06-29)과 새 lastmod 가 달라 변경된 URL 이 한 번 정당하게 제출된다 — 배포 보고에 HTTP 코드를 싣고, 라이브 반영 전에 IndexNow 가 먼저 크롤하는 경합이 있으면 라이브 확인 뒤 변경분만 수동 재제출한다. 회귀 테스트 tests/regressions/indexnow-changed-only.test.ts(순수 diff 7건 + 자식 프로세스 5건 + 소스 위생 3건; 수정 전 순수·소스 10건 실패, 자식 프로세스 테스트는 옛 스크립트가 실제 api.indexnow.org 로 POST 하므로 수정 전에는 실행하지 않음).
- 플랜 커밋 32 (K25·K33, LEGAL-39): 휴면 수익화 정리. (1) MON_FEATURED_PARTNERS 는 서버 전용 env 인데 'use client' 모듈이 읽어 브라우저에서 영구 비활성이었다. src/lib/featured-partners.ts(getFeaturedPartners)가 서버에서 파싱하고 홈·[state]/[slug] 페이지가 featuredPartners prop 으로 CostCalculator→CostResult→ResultMonetization 에 넘긴다(기능 유지, 삭제 아님). (2) 번호 슬롯이 없을 때 빈 'Advertisement' 프레임(90/250px, aria-label)이 렌더되던 것 제거: 수동 유닛이 실제로 렌더될 때만 프레임을 둔다. (3) getPartnersForCategory 가 env 필터 전에 3개로 잘라 Avvo·Nolo·LawDepot 은 설정해도 안 뜨던 것: 상한을 필터 뒤(getActivePartners)로 이동. (4) 통화 CTA·스폰서 문구·스폰서 링크에 FTC 고지를 링크 위에 추가(CPL·제휴 블록은 이미 있었음). (5) 읽는 곳 없는 MonetizationConfig 필드(adProvider·ezoic*·raptive·journey·adsTxtRedirectUrl·autoAffiliate·featuredPartners)와 죽은 env 키 NEXT_PUBLIC_EZOIC_ENABLED·NEXT_PUBLIC_AUTOAFFILIATE 제거. Ezoic·Raptive·Journey·ADSTXT_REDIRECT 이름은 AdProvider·ads.txt 가 직접 읽는 코드 경로가 있어 삭제하지 않고 ACTIVATION.md 에 DO NOT SET 으로 표기. (6) docs/ACTIVATION.md 신설(env 이름만, 값·URL 없음; 변호사 디렉터리·통화·리드·이메일 수집 이름은 HOLD). 기대값 정정(삭제·skip 아님): tests/monetization.test.ts 의 제거된 필드 개별 단정 12개 → 필드 부재 it.each + 공급자 스위치는 parseAdProvider(env)로, MON_FEATURED_PARTNERS 단정은 getFeaturedPartners 로; tests/embed-monetization.test.ts 는 서버 파싱 결과를 prop 으로 전달; tests/monetization-client.test.ts 는 브라우저 컴파일 결과에 서버 전용 이름이 없음을 단정. 회귀 테스트 tests/regressions/k25-dormant-slots.test.ts(env 매트릭스·FTC 고지 선행·클라이언트 클로저 process.env 스캔·필드 reader·ACTIVATION.md 대조). 별도 소커밋 b584917: tsc 가 거부하던 tests/regressions/indexnow-changed-only.test.ts 의 spawn env 타입(동작 불변).
- 플랜 커밋 33 (LEGAL-36): /privacy·/terms·/embed 는 부분 메타데이터라 layout 의 og:url(홈)을 상속했다 → buildMeta 로 전환(제목·설명 동일, og:url=canonical). /how-legal-fees-work 는 og:image 가 없었음(라이브 확인): buildMeta 에 withOgImage 옵션을 추가해 네 페이지에 공용 카드(/opengraph-image)를 다시 넣음. /contact 의 중첩 <main> 을 <div> 로. /favicon.ico 404: 계획의 favicon.ico/route.ts 대신 next.config rewrites 로 /icon 에 연결(Next 가 favicon.ico 경로를 정적 메타데이터 파일로 분류해 빌드 없이 route 파일의 안전성을 증명할 수 없음). 기대값 정정: tests/k09-discover-hygiene.test.ts 가 embed·privacy·terms 를 손으로 쓴 Metadata 객체로 가정했음 → buildMeta 블록 검사로 이동(robots 재선언 금지는 유지). 회귀 테스트 tests/regressions/meta-markup.test.ts.
- 플랜 커밋 34 (K18, LEGAL-38): Feedback 알약은 lg(1024px) 이상에서만 존재(폰·태블릿의 앵커·비네트 영역 회피, UX-legalcostcalc P1-1b), 클릭 영역 44px 이상. 푸터에 'Send feedback' 텍스트 컨트롤이 같은 패널을 모든 화면 크기에서 연다(feedback-events 이벤트, 포커스는 연 요소로 복귀). 쿠키 배너는 사용자가 Manage consent 로 열 때만, 모바일 메뉴 시트는 클릭 시에만 fixed. 회귀 테스트 tests/regressions/k18-fixed-elements.test.ts(fixed·sticky 사용 파일 목록 고정, 초기 렌더에 배너 없음). 라이브 CLS·겹침은 검증 단계에서 측정.
- 플랜 커밋 35 (LEGAL-25): z.config({ jitless: true }) 를 zod 스키마를 정의하는 유일한 모듈(src/lib/utils/email-results-validation.ts)의 첫 스키마 앞에 추가. 계획이 지목한 feedback-validation.ts 에는 zod 스키마가 없어 변경하지 않음. 서버 전용이라 동작 변화 없음. tests/regressions/zod-jitless.test.ts.
- 플랜 커밋 35b (K34): AI 유입 표의 'bing.com' → copilot 단독 매핑 제거(브라우저는 교차 출처 리퍼러를 origin 만 보내므로 일반 Bing 검색 클릭이 AI 로 집계됐음). copilot.microsoft.com 은 유지, bing.com 은 /chat·/search/ai 경로가 보일 때만 copilot. 기대값 정정: tests/code-07-ai-referral.test.ts 가 https://www.bing.com/search?q=x 를 ai/copilot 으로 단정했음(그 오분류 자체). tests/regressions/k34-bing-referral.test.ts.
- 플랜 커밋 37 (K13-R·K16·K21, LEGAL-32·33·35·43): next.config.ts 의 도메인 허용목록 CSP 빌더(env·NODE_ENV 분기, *.adtrafficquality.google 포함 모든 fetch 지시문, *.supabase.co)를 삭제하고 리터럴 두 개만 둔다. 페이지 규칙 /:path((?!embed/).*) = object-src 'none'; base-uri 'none'; frame-ancestors 'none' + X-Frame-Options DENY(/embed 안내 페이지는 광고 로더 페이지라 여기에 속함). 임베드 규칙 /embed/:path+ = frame-ancestors * 이고 X-Frame-Options 없음(잘못된 값 ALLOWALL 삭제). 다른 헤더 값 불변. 편집 전 라이브 대조: 2026-10-08 GET https://legalcostcalc.co/about 응답은 object-src 없는 허용목록 CSP + SAMEORIGIN 으로 HEAD 빌더와 동일(리더 메모의 '라이브에는 object-src 가 있다'는 재현되지 않음). 테스트: tests/regressions/csp-k13r.test.ts 는 AppFarm scripts 템플릿 3b91f80 에서 복사해 CONFIG 만 수정(수정 전 구설정에서 9개 실패 확인, 이 리포의 HEAD 헤더 2종을 양성 대조로 등록). tests/adsense-csp.test.ts 와 tests/regressions/k15-env-resolver.test.ts 의 K13 단정은 같은 파일 안에서 K13-R 단정으로 교체('K13 superseded by K13-R'). 정적 렌더·revalidate·로더 마크업은 불변. 배포 후 node D:/ClaudeCode/AppFarm/scripts/csp-live-check.mjs --domain legalcostcalc.co --strict 로 라이브 확인.
- 플랜 커밋 36 (K8, LEGAL-08·20): 색인 정책을 근거로 채움. 리더 답변이 없어 leader-decisions.md 의 Q-L1 기본값을 적용(2026-10-08 재확인: 'no answer yet'). keep = ga4-pages-host-90d.csv(host=legalcostcalc.co, 2026-07-08..10-05, 동의 거부 세션 미집계라 하한)의 k8_traffic_eligible 39경로(GSC 클릭이 있는 oregon/criminal-defense-cost·indiana/criminal-defense-cost·delaware/dui-cost 3개가 이 안에 있음) + 리더 예외 2개: /new-york/divorce-cost(GSC 노출 105) · /california/divorce-cost(1차 출처로 검증한 법원 수수료 src/data/verified-fees.json 보유). noindex 목록은 비어 있고 keep 밖의 모든 경로가 비색인이다. 수치: 408 조합 중 정보 이득 게이트 통과 369 → 색인 유지 41 · noindex,follow 328. 비색인 328쪽은 robots noindex,follow · 사이트맵 제외 · 광고 로더 제외 · RelatedMatters/RelatedLinks 제외이며 라우트는 200으로 남고 주·카테고리 허브와 통계가 계속 링크한다. 사이트맵 URL 436 → 108(정적 8 + 허브 59 + 템플릿 41). 비색인 328쪽의 카테고리별 수: divorce 49 · dui 40 · personal-injury 28 · bankruptcy 35 · real-estate 41 · estate-planning 45 · immigration 48 · criminal-defense 42. 사유(전부 동일): 최근 90일 GA4 Organic·AI·Referral 조회 0, GSC 클릭 0, 1차 출처로 검증한 엔티티 고유 데이터 없음(시드는 모델 추정치). 비색인 328쪽 전체 목록(경로 = /{주}/{카테고리}): divorce-cost (49): alabama, alaska, arizona, arkansas, colorado, connecticut, delaware, district-of-columbia, florida, georgia, hawaii, idaho, illinois, indiana, iowa, kansas, kentucky, louisiana, maine, maryland, massachusetts, michigan, minnesota, mississippi, missouri, montana, nebraska, nevada, new-hampshire, new-jersey, new-mexico, north-carolina, north-dakota, ohio, oklahoma, oregon, pennsylvania, rhode-island, south-carolina, south-dakota, tennessee, texas, utah, vermont, virginia, washington, west-virginia, wisconsin, wyoming / dui-cost (40): alabama, alaska, arizona, arkansas, california, colorado, connecticut, district-of-columbia, florida, idaho, illinois, indiana, iowa, kansas, kentucky, louisiana, maine, maryland, massachusetts, michigan, minnesota, mississippi, nebraska, nevada, new-hampshire, new-mexico, new-york, north-dakota, ohio, rhode-island, south-carolina, south-dakota, texas, utah, vermont, virginia, washington, west-virginia, wisconsin, wyoming / personal-injury-cost (28): alabama, alaska, arkansas, california, colorado, connecticut, delaware, district-of-columbia, georgia, hawaii, idaho, illinois, iowa, kansas, massachusetts, michigan, nebraska, new-hampshire, new-jersey, new-york, north-dakota, pennsylvania, tennessee, texas, utah, virginia, wisconsin, wyoming / bankruptcy-cost (35): alabama, alaska, delaware, district-of-columbia, georgia, idaho, illinois, indiana, kentucky, louisiana, maine, maryland, michigan, minnesota, mississippi, nevada, new-hampshire, new-jersey, new-mexico, new-york, north-carolina, north-dakota, ohio, oklahoma, oregon, pennsylvania, south-carolina, south-dakota, tennessee, texas, utah, vermont, washington, west-virginia, wisconsin / real-estate-cost (41): alabama, arizona, arkansas, california, colorado, connecticut, delaware, district-of-columbia, florida, georgia, hawaii, illinois, indiana, kansas, kentucky, louisiana, maryland, minnesota, mississippi, montana, nebraska, nevada, new-hampshire, new-mexico, new-york, north-dakota, ohio, oklahoma, oregon, pennsylvania, rhode-island, south-carolina, south-dakota, tennessee, texas, utah, virginia, washington, west-virginia, wisconsin, wyoming / estate-planning-cost (45): alabama, alaska, arizona, arkansas, california, colorado, connecticut, delaware, district-of-columbia, florida, georgia, hawaii, idaho, illinois, indiana, iowa, kentucky, louisiana, maine, maryland, massachusetts, minnesota, nebraska, nevada, new-hampshire, new-jersey, new-mexico, new-york, north-carolina, north-dakota, ohio, oklahoma, oregon, pennsylvania, rhode-island, south-carolina, south-dakota, tennessee, texas, utah, vermont, virginia, washington, wisconsin, wyoming / criminal-defense-cost (42): alaska, arizona, california, connecticut, delaware, district-of-columbia, florida, georgia, hawaii, idaho, iowa, kansas, kentucky, louisiana, maine, maryland, massachusetts, michigan, minnesota, mississippi, montana, nebraska, nevada, new-hampshire, new-jersey, new-mexico, new-york, north-carolina, north-dakota, ohio, pennsylvania, south-carolina, south-dakota, tennessee, texas, utah, vermont, virginia, washington, west-virginia, wisconsin, wyoming / immigration-cost (48): alabama, arizona, arkansas, california, colorado, connecticut, district-of-columbia, florida, georgia, hawaii, idaho, illinois, indiana, iowa, kansas, kentucky, louisiana, maine, maryland, massachusetts, michigan, minnesota, mississippi, missouri, montana, nebraska, nevada, new-hampshire, new-mexico, new-york, north-carolina, north-dakota, ohio, oklahoma, oregon, pennsylvania, rhode-island, south-carolina, south-dakota, tennessee, texas, utah, vermont, virginia, washington, west-virginia, wisconsin, wyoming. 복원 절차: src/data/index-policy.json 의 keep(또는 exceptions)에 경로를 추가하거나 keep 을 null 로 되돌리면 K8 필터가 해제된다 → 배포 → 사이트맵에 새로 생긴 URL 을 커밋 30 의 IndexNow 가 변경분으로 제출한다. 배포 시 IndexNow 는 사이트맵에서 빠진 328 URL 도 제출한다(noindex 전환 알림). 정책 적용으로 생긴 두 가지 보정(같은 커밋): (1) 홈 'Popular States' 격자가 51개 주의 divorce 페이지를 링크했는데 그중 49쪽이 비색인이 되고 색인 페이지가 없는 23개 주의 허브가 내용 링크 고아가 되어, 격자를 주 허브(/{주})로 바꿨다(문구 'Each page shows costs for all legal categories' 와도 일치). (2) /settlement-estimator 로 가는 내용 링크가 개인상해 페이지(전부 비색인)뿐이라 고아가 되어, 가이드의 contingency 절에 맥락 링크 한 줄을 추가했다. 홈·가이드 날짜는 2026-10-08 그대로이고(같은 날 내용 변경) content-dates 증거 문장만 갱신했다. 기대값 정정(삭제·skip 아님): tests/code-06-info-gain.test.ts 'every passing page IS present in sitemap.xml' → 정책이 유지한 페이지만 사이트맵에 있고 버린 페이지는 없음(사유: K8 이 게이트 통과 페이지를 의도적으로 사이트맵에서 뺌); tests/related-matters.test.ts 는 컴포넌트와 같이 3개 미만이면 모듈 없음으로 미러하고 기대 개수를 INDEXED_PAGES 에서 독립 계산, '대부분 5링크' 정합성 단정 삭제 대신 교체(사유: 유지 페이지가 41쪽이라 대부분의 페이지에 모듈이 없는 것이 설계); tests/regressions/k3-no-global-lastmod.test.ts 하한 400/300 → 100/30(사유: 사이트맵 108쪽, 색인 템플릿 41쪽); tests/regressions/k24-orphans-and-links.test.ts 의 PI 샘플은 INDEXABLE_PAGES 에서, 카테고리별 소스 페이지는 색인 페이지가 있는 카테고리만. 회귀 테스트 tests/regressions/k8-index-policy.test.ts(정책 값·369/41/328 개수·408쪽 robots/사이트맵 일치·비색인 샘플 6쪽의 로더 0·허브 링크 유지·색인 샘플 4쪽의 로더 1과 비색인 페이지로의 링크 0)와 k24 테스트의 홈 허브 링크·가이드 링크 3건(수정 전 비색인 49쪽 링크, 고아 24건 확인). 위험: 비즈니스 영향 큼(Bing·AI 유입은 GSC 에 보이지 않음). 되돌리기는 keep 목록 한 줄.
- 플랜 커밋 37 보완 (K13-R 부수 결함 (11)(12), 리더 2026-10-08): (12) 국가 쿠키가 없거나 'XX'(국가 미상)인 방문자의 Manage consent 는 우리 배너가 아니라 Google CMP(googlefc.callbackQueue → showRevocationMessage)를 연다. 우리 배너의 Accept 가 update(granted)를 보내므로 EEA 방문자가 국가 미상으로 잡히면 K14-b 위반이 되기 때문이다. manageConsentAction 이 알려진 비EEA 국가에만 'banner' 를 돌려준다. bannerMode·초기 동의 계획은 그대로다. 개인정보처리방침의 'All other countries' 항목에 국가를 알 수 없을 때 링크가 Google 동의 메시지를 연다는 한 문장을 추가했고 시행일을 내용이 실제로 바뀐 2026-10-08 로 옮겼다(방침이 변경 시 시행일 갱신을 약속). (11) 독자 대면 텍스트의 CSP 주장: src 전체 grep(Content-Security-Policy|CSP|script-src|only .* scripts) 0건이라 고칠 문장이 없었고, 앞으로 생기지 않도록 가드만 추가했다 — 개인정보·약관·소개·문의·임베드·가이드·통계·홈의 가시 텍스트와 src/app page 소스에 CSP 주장이 없음을 단정하고, 같은 매처가 'Content-Security-Policy header only allows scripts…' 류 문장을 잡는 양성 대조를 포함한다(결함이 없어 수정 전 실패는 없고 양성 대조가 매처의 판별력을 보인다). 기대값 정정(삭제·skip 아님): tests/regressions/k14-consent-scenarios.test.ts 의 OTHER_REGIONS 에 있던 'XX' 는 Manage consent 가 배너를 연다는 단정에서 빠져 CMP 단정으로 이동(사유: 리더 (12) '국가 미상은 EEA 로 취급'). 수정 전 실패 4건(미상 지역 순수 판정·XX·빈 값·쿠키 없음). 남은 한계: 국가 쿠키를 막은 비EEA 방문자가 링크를 누르면 Google 메시지가 뜨지 않을 수 있다(CMP 는 해당 지역에 게시되지 않음) — 리더 결정을 따랐고 보고한다.
- 플랜 커밋 38 (게이트 준비, LEGAL-24·25·27·38·41·43): scripts/scan-built-html.mjs 추가 — next build 가 만든 .next/server/app 의 프리렌더 HTML 을 읽기만 하는 스캔(서버·네트워크 없음, 인자 --dir/--json, 위반 시 종료 코드 1). 검사: (1) 광고 로더는 포함 라우트 클래스에만, 색인 템플릿에만(사이트맵 등재 = 로더 1, 비색인 = 로더 0), 임베드 프레임·404 에는 0; (2) Consent Mode 기본값이 <head> 안에서 로더보다 앞, 로더는 <head> 밖; (3) <div hidden id="S:n"> 숨김 세그먼트 0; (4) 표본 템플릿 3쪽(CA·NY 이혼, MA 파산)의 <main> 단어 수 1,500 이상(렌더 실측 2,690~2,797)이고 숨김 세그먼트 속 단어 0; (5) 가시 텍스트의 K1 자리표시자 어휘·개발자 화법·깨진 문장(undefined·NaN 등) 0; (6) 페이지당 canonical 정확히 1개이고 자기 경로(임베드 프레임은 해당 템플릿); (7) robots 메타 1개 이하, index·noindex 동시 금지, 사이트맵 등재 템플릿은 noindex 금지, 미등재 템플릿은 noindex,follow; (8) 알 수 없는 주·매터로 만들어진 페이지(404 대체 파일 포함)와 프리렌더 없는 사이트맵 URL 0; (9) 매터 페이지 408 · 주 허브 51 · 카테고리 허브 8. tests/regressions/scan-built-html.test.ts 가 실제 컴포넌트 렌더(홈·정적 페이지 10·허브·템플릿 5·임베드 프레임·404)로 만든 산출물 트리에서 위반 0을 확인하고, 같은 트리에 결함 24종을 주입해 각각 잡히는지, 스크립트 속 같은 문구는 잡지 않는지 확인한다(양성·음성 대조; 대조가 통과한 스캔만 신뢰). 게이트 명령 순서와 푸시·롤백 절차는 tests/regressions/README-gate.txt. 이 단계에서는 무거운 작업(전체 vitest·전체 eslint·next build)을 돌리지 않았으므로 해당 종료 코드는 게이트 단계가 이 항목 아래에 추가한다. 단일 파일 확인: 변경 파일 eslint 종료 코드 0, tsc --noEmit 종료 코드 0(플랜 커밋 36 직후), 영향 테스트 파일 단독 실행 전부 통과. 현재 작업 트리의 .next 는 2026-10-06 타입 검사 단계에서 멈춘 불완전 빌드라 프리렌더 HTML 이 없고, 스캔은 '프리렌더 HTML 없음' 위반으로 종료 코드 1 을 낸다(공허 통과 방지 확인). 이 시리즈에서 기대값을 정정한 기존 테스트 파일(git diff 561d440..HEAD -- tests 로 확인: 테스트 파일 삭제 0, skip/only/todo 추가 0, 기존 테스트의 timeout 확대 0 — 60초 timeout 은 이 시리즈가 새로 만든 전수 렌더 테스트에만 있음; 사유는 각 플랜 커밋 항목에 있음): adsense-csp · category-editorial · code-02-loader-server-rendered · code-02-schema · code-03-embed-hardening · code-05-og-images · code-06-info-gain · code-07-ai-referral · code-08-privacy-required · contact · divorce-hub · email-results · embed-monetization · feedback · figures · geo-answer-block · guide-how-legal-fees-work · home-publisher-content · indexnow · internal-link-cap · k09-discover-hygiene · monetization · native-adsense-loader · phase3-fixes · related-matters · reviewer · revisit-hooks-audit · seo-meta · u05-internal-circulation (tests/ 아래; 회귀 테스트 파일의 정정은 해당 항목에 별도 기재). K8 수치: 408 조합 → 정보 이득 게이트 369 → 색인 41 · noindex,follow 328, 사이트맵 436 → 108(플랜 커밋 36 항목에 전체 목록과 복원 절차). 날짜 증거: src/data/content-dates.json 의 기록이 날짜의 유일한 출처이며 2026-10-08 로 옮긴 가족은 비-PI 비용 7개·가이드·홈(모두 basis content-changed, 증거 문장에 커밋 기재), PI 가족·비교·통계·소개·임베드는 2026-10-07, 이혼 허브 2026-07-03, 정산 추정기 2026-07-02 그대로. 제거한 죽은 env 키: NEXT_PUBLIC_EZOIC_ENABLED · NEXT_PUBLIC_AUTOAFFILIATE(플랜 커밋 32; Ezoic·Raptive·Journey·ADSTXT_REDIRECT 이름은 코드가 직접 읽으므로 docs/ACTIVATION.md 에 DO NOT SET 으로 남김). 열린 항목: (a) 리더 답변이 없는 Q-L1(색인 정책 범위)은 기본값으로 진행했고, 답이 오면 src/data/index-policy.json 한 파일만 바꾸면 된다; (b) 첫 프로덕션 배포의 postbuild IndexNow 는 라이브 사이트맵 대비 변경분(lastmod 변경·신규·사이트맵에서 빠진 328 URL)만 제출 — HTTP 코드를 배포 보고에 기재; (c) 배포 후 node D:/ClaudeCode/AppFarm/scripts/csp-live-check.mjs --domain legalcostcalc.co --strict 와 K20/K28 라이브 증명(curl 우선, 브라우저 세트 1회, collect 요청 기록 후 abort로 tid·재방문 G111); (d) 국가 쿠키를 막은 비EEA 방문자의 Manage consent 한계(플랜 커밋 37 보완 항목); (e) AppFarm scripts 의 date-tz 템플릿(#418)은 UX 배치 몫이라 이 시리즈에서는 적용하지 않음; (f) 푸시는 게이트 전부 통과 + fresh-context 적대 검증 CRITICAL 0 이후 단 한 번(푸시 = 프로덕션 배포), 롤백 대상 dpl_9bZYvHCx / 커밋 561d440.

## 2026-10-06 — 수익 차단점 점검·수정 인계 (체크포인트 커밋, 2026-10-07 정정)

- 주 차단점: 상위 담당자의 실제 AdSense 확인은 8/31부터 Preparing, 최근 30일 노출 0·US$0.00, 정책 위반 0, AutoAds ON. 승인 지연 원인은 코드 점검만으로 확정하지 못함.
- Production 환경변수 이름만 조회: AdSense client·FEEDBACK_ENDPOINT 존재. 수동 슬롯·전화·CPL·제휴 URL 6종·스폰서·MON_FEATURED_PARTNERS·이메일 수집 설정은 없음. 환경변수 변경 없음.
- 수정 1 (잠재 결함, 현재 프로덕션 영향 없음): `src/lib/monetization.ts`, `src/lib/constants/affiliates.ts`의 `process.env[key]` 동적 조회는 브라우저 번들에서 비어 있게 된다. 리터럴 `process.env.NEXT_PUBLIC_*` 참조로 바꿔 인라인되게 함. 수익화 env가 프로덕션에 설정돼 있지 않으므로 현재 사이트 동작은 변하지 않는다. 변수명과 HTTPS 검증은 그대로. 제휴 6키 하드코딩 맵과 `AFFILIATE_PARTNERS`의 드리프트는 `tests/monetization-client.test.ts`가 파트너별 `toHaveProperty`로 검출한다. `MON_FEATURED_PARTNERS`는 서버 전용 env라 클라이언트에서 여전히 비어 있음(K33, 별도 커밋에서 처리).
- 수정 2: `src/lib/repositories/cost-seed-repository.ts`가 시드의 personal-injury 수임료 비율을 `?? null`로 보존(비-PI는 null 유지). 시드 숫자·검증일은 새로 만들거나 바꾸지 않음. 이 변경으로 PI 페이지에서 수임료 비율이 화면에 노출될 수 있으므로 해당 문구 정정(커밋 10·13) 전에는 배포하지 않는다.
- 수정 3 (리팩터): `/api/contact`·`/api/email-results` 라우트의 상수·스키마·`isEnabled`를 `src/lib/utils/feedback-validation.ts`·신규 `src/lib/utils/email-results-validation.ts`로 이동(동작 동일). 신규 파일 3개: `src/lib/utils/email-results-validation.ts`, `tests/cost-service-fallback.test.ts`, `tests/monetization-client.test.ts`. `tests/email-results.test.ts`는 라우트를 파일 상단에서 한 번만 import(it 안의 cold import 5초 타임아웃 위험 제거, 타임아웃 확대 없음).
- 체크포인트 검증(2026-10-07): 관련 4개 테스트 파일(monetization-client, cost-service-fallback, contact, email-results) 71/71 통과. 전체 린트·tsc·vitest·빌드 종료 코드: (최종 게이트 커밋에서 기록)
- OPEN: 연락 폼(/api/contact)은 전달 수단이 없어도 성공을 반환한다. 피드백 route는 collector 응답의 .ok를 확인하지 않고 성공을 반환한다. 개인정보 문서의 이름·이메일 미수집 문구와 연락 폼 수집이 불일치한다. (LEGAL-12 / LEGAL-14 로 후속 처리)
- 커밋·푸시·배포: 이 항목 시점에는 없음. 푸시는 최종 게이트 이후 한 번만.

## Traffic-Maximization Wave P2 (CODE-07) — Build Note (2026-07-04)

Implements 부속P_트래픽극대화_딥리서치.md §4 CODE-07, building on top of Wave P0
(CODE-01/02/03) and Wave P1 (CODE-04/05/06) below, and the pre-existing GA4
consent-gated pipeline (`ConsentedAnalytics`/`trackEvent`) — none re-specced.

### CODE-07 — AI-referral & rich-context detection in the GA4 layer
`src/lib/analytics.ts` gains a pure, independently-testable referrer
classifier and a browser-side first-load wrapper, both additive to the
existing module (no changes to `trackEvent`'s signature, the `<=25`-param
budget, the internal-traffic marker, or the debug-mode gate):

- **`classifyReferralSource(referrer, currentUrl?)`** (pure function, no
  `window` access beyond the two string args) — matches `document.referrer`'s
  hostname (exact or subdomain, e.g. `chat.openai.com` matches the
  `openai.com` table entry) against three lookup tables and returns
  `{ kind, source }`:
  - **AI engines** (`kind: "ai"`): `chatgpt.com`/`chat.openai.com`/
    `openai.com` -> `chatgpt`; `perplexity.ai` -> `perplexity`;
    `gemini.google.com`/`bard.google.com` -> `gemini`;
    `copilot.microsoft.com`/`bing.com` -> `copilot`. A conservative
    Google-AI-Overview pattern detector (`isAiOverviewPattern`) additionally
    classifies a `google.*` referrer as `ai-overview` ONLY when it carries an
    explicit AI-mode marker (`udm=50`, or a `utm_source` containing
    `aiovw`/`ai-overview`) — a bare organic Google referrer is deliberately
    left unclassified (stays regular search, not guessed as AI).
  - **Embed-referral** (`kind: "embed"`): reads `?host=` off the CURRENT
    page's own URL (the query param CODE-03's attribution-link/copy-embed
    flow appends on click-through from an embedded widget back to the
    canonical page) — checked first/highest-priority since it's a same-site
    signal, not a cross-origin referrer.
  - **Directory/community referrers** (`kind: "directory"`): `reddit.com`/
    `old.reddit.com` -> `reddit`; `producthunt.com` -> `producthunt`;
    `quora.com` -> `quora`; `pinterest.com` -> `pinterest`;
    `news.ycombinator.com` -> `hackernews`; `betalist.com` -> `betalist`.
  - Never throws on a malformed referrer/URL string; returns
    `{ kind: null, source: null }` when nothing matches.
- **`trackReferralSource()`** (browser side-effect wrapper) — calls the
  classifier against `document.referrer`/`window.location.href` and fires
  exactly one tagged event through the EXISTING `trackEvent()` pipeline
  (same consent-gate, `site`/`traffic_type`/`debug_mode` stamping, `<=25`
  param trim — nothing bypassed):
  - AI match -> new `ai_referral` event, `{ source }`.
  - Embed match -> reuses the existing `embed_loaded` event name (so embed
    click-through referral sessions land in the same GA4 funnel as CODE-03's
    in-iframe `EmbedLoadedTracker` mount event), `{ host_domain, referral_kind:
    'embed_referral' }` — the `referral_kind` tag distinguishes a click-
    through-back-to-canonical session from the iframe-mount event itself.
  - Directory/community match -> reuses the existing `outbound_click` event,
    `{ referral_kind: 'directory', source }`.
  - No match -> no event fired (does not burn the once-per-session guard).
  - Idempotent per session via a `sessionStorage` guard (`cc_referral_tagged`)
    — a client-side route change never re-fires the same classification,
    since `document.referrer` only reflects the original cross-site
    navigation. Falls back to firing every mount (rather than throwing) if
    `sessionStorage` is unavailable (private mode/quota/disabled), consistent
    with the existing `localStorage`-unavailable handling elsewhere in this
    module.
- `"ai_referral"` added to the `EventName` string-literal union (compile-time
  typo guard, per the module's documented contract).
- Wired into the EXISTING root-mounted `AnalyticsInit` client component
  (`src/components/consent/analytics-init.tsx`, already mounted once in
  `src/app/layout.tsx` alongside `ConsentedAnalytics`) — `trackReferralSource()`
  is called immediately after the pre-existing `initTrafficMarker()` call on
  the same `useEffect` mount. Zero UI change; no new component was added to
  the render tree.

Pure measurement — no page/routing/schema/embed changes. `npm run build`'s
sitemap output is unchanged at 434 indexable URLs, confirming no accidental
side effects on CODE-04/06 output.

### Test delta
473 tests (P1 baseline, this session's re-run showed 499 total after this
wave — see note below) -> `tests/code-07-ai-referral.test.ts` (new, 26 tests):
`classifyReferralSource` coverage for every AI engine host + the AI-Overview
query-marker path + the bare-Google-organic non-match, the embed `?host=`
path (including its priority over a simultaneous AI referrer), every
directory/community host, the null/malformed-input fallthroughs (never
throws), an `EventName` compile-time sanity check for `"ai_referral"`, and
`trackReferralSource`'s browser-side behavior (SSR no-op, fires the correct
tagged event per referral kind via a stubbed `window.gtag`, no-op when
nothing matches, and the per-session idempotency guard).

Note: this wave's actual full-suite run showed 499/499 passing (473 P1
baseline + 26 new) — no other test file was touched.

### DebugView verification steps (owner/operator)
1. Set `NEXT_PUBLIC_GA_DEBUG=1` on a Vercel Preview deployment (the existing
   T01 hostname/environment gate already documents this escape hatch —
   GA4 loads in `debug_mode` and is tagged `traffic_type: 'internal'`, so it
   never lands in production reports).
2. Open the Preview URL with the referrer spoofed to `https://www.perplexity.ai/`
   — e.g. via a browser extension, DevTools' "Override document.referrer",
   or a controlled test harness page whose only content is a link/redirect
   from `perplexity.ai`'s origin. Confirm in GA4 DebugView: an `ai_referral`
   event fires with `source: "perplexity"` and `debug_mode: true`.
3. Repeat with `chatgpt.com`, `gemini.google.com`, `copilot.microsoft.com` referrers
   to confirm each maps to its own `source` value.
4. Visit `.../california/divorce-cost?host=example-partner.com` directly
   (simulating a click-through from an embedded widget's attribution link)
   and confirm an `embed_loaded` event fires in DebugView with
   `host_domain: "example-partner.com"` and `referral_kind: "embed_referral"`.
5. Repeat with a `reddit.com`/`producthunt.com` referrer and confirm an
   `outbound_click` event fires with `referral_kind: "directory"` and the
   matching `source`.
6. Reload the same tab a second time without changing the referrer/URL and
   confirm NO second event fires (per-session idempotency guard) — then open
   a fresh tab/session to confirm it fires again there.

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors (same 3 pre-existing `react/no-danger`
  unused-eslint-disable-directive warnings on `article-schema.tsx`,
  `dataset-schema.tsx`, `software-application-schema.tsx` as prior waves —
  unrelated to this wave).
- `npm test`: 499/499 passed.
- `npm run build`: succeeded, 897 pages generated, `sitemap: 434 indexable
  URLs (369/408 programmatic pages pass hasUniqueData)` — unchanged from the
  P1 wave, confirming this wave made no page/sitemap-affecting changes.

### Not touched (guardrails)
No UI/component render-tree change (only the existing `AnalyticsInit`
side-effect body gained one more function call). No new script injection,
no Consent Mode change, no bypass of the T01 hostname/environment gate or
the `<=25`-param GA4 budget — `trackReferralSource` calls the EXISTING
`trackEvent()` for every fired event. No raw calculator inputs, legal-matter
details, or personalized/user-input data enter any event param (YMYL
invariant preserved — only referrer hostnames and a same-site `?host=` query
value, never anything derived from calculator state). CODE-01–06 (answer
blocks, schema, embed nofollow-ugc hardening, statistics page, OG images,
info-gain gate) were not touched or re-specced. No owner-distribution action
(OWN-01–07) was taken — code only. No commit/deploy performed
(orchestrator-owned).

## Traffic-Maximization Wave P1 (CODE-04/05/06) — Build Note (2026-07-04)

Implements 부속P_트래픽극대화_딥리서치.md §4 CODE-04/05/06, building on top of
Wave P0 (CODE-01/02/03, below) and the pre-existing 부속I SEO infra
(breadcrumbs/meta/IndexNow/Web Vitals/thin-page gate) — none of it re-specced.

### CODE-06 — hasUniqueData strengthened into a 4-fact information-gain gate
`src/lib/page-index.ts` (T09's original single-fact check — "has a sourced
moderate row" — passed all 408 (state,category) pairs) now scores FOUR
independent, real facts per page: (1) local average (sourced moderate
median), (2) local range (non-degenerate low-high spread), (3)
sample-scenario result (simple + complex tiers both real/sourced), (4) a
computed comparison-vs-benchmark against the category's real national
average (`getNationalAverage`, computed from the seed dataset, never
hardcoded) — **fact 4 fails** when a page's moderate row is a byte-for-byte
duplicate of another state's row in the same category
(`hasDuplicateSiblingSignature`), which is the actual near-duplicate-
template anti-pattern 부속P §8 #3 warns about. A page needs all 4 facts
(`factCount >= 4`) to be `hasUniqueData`/indexable.

Real-dataset impact (verified, not simulated): **39 of 408 pages** now fail
the gate — exactly the pairs whose full cost-row signature (low/median/
high/hourly/duration) is identical to a sibling state's row for the same
category (e.g. real-estate: ID/IA/MO share one signature, ME/MI another;
similar duplicate clusters exist in bankruptcy, estate-planning,
personal-injury, immigration). `sitemap.ts`, `generateMetadata`'s `robots`
override, and every internal-link module (RelatedMatters/hub pages) already
read exclusively from `INDEXABLE_PAGES`/`hasUniqueData`, so this change
required zero re-wiring downstream — build output confirms
`sitemap: 434 indexable URLs (369/408 programmatic pages pass hasUniqueData)`.

Also added the CODE-06 "conditional phrasing + >=1 data-derived synthesis
sentence" requirement: `buildBenchmarkSynthesis()` (new export in
`src/lib/seo/geo.ts`) compares a page's real moderate median against the
real category national average and renders "runs X% above/below the
national average" (or "in line with" when the difference is <3%) —
phrasing is conditional on the actual real-number comparison, never a fixed
template. Wired into `CategoryEditorial`'s worked-example block (renders
only when both figures are real; never fabricates).

Tests: `tests/code-06-info-gain.test.ts` (new, 13 tests) — asserts the gate
math, the sitemap-exclusion acceptance criterion (a `<4-fact` page is
absent from `INDEXABLE_PAGES` AND from the actual `sitemap()` output), and
`buildBenchmarkSynthesis`'s conditional phrasing (above/below/in-line-with,
each only when numerically true). `tests/page-index.test.ts` rewritten to
independently re-derive the 4-fact score (not just re-assert the module's
own internal logic) and to assert the specific real-dataset duplicate-
signature failure case. `tests/related-matters.test.ts` fixed one test that
had hardcoded the now-false assumption "every (state,category) pair passes
hasUniqueData" (pre-existing test, broken by the stricter gate) — replaced
with an assertion that no page ever drops below the `MIN_LINKS` floor
(RelatedMatters renders null below 3, never a thin 1-2 item module) while
confirming the majority of pages still get the full 5-link module.

### CODE-04 — `/legal-cost-statistics` data/statistics page + JSON/CSV feeds
New `src/lib/seo/statistics.ts` exports `buildStatisticsAggregate()` — a
pure function aggregating the SAME `INDEXABLE_PAGES` (CODE-06-gated) real
dataset into: one row per category (national average, highest-cost state,
lowest-cost state, high-vs-low %), a headline (most expensive category
nationally), and 3-5 one-line quotable findings in the literal
"X costs N% more in A than B" format the spec asks for — every number
traces to `getNationalAverage`/`getModerateMedianCost` (page-index.ts),
zero independent data entry.

New route `src/app/legal-cost-statistics/page.tsx`: headline stat, ranked
`StatisticsTable` (new component, one row per category, links to the real
highest/lowest state pages), key-findings list, Dataset JSON-LD
(`src/components/seo/dataset-schema.tsx`, new — schema.org/Dataset is still
fully SERP/AI supported in 2026 unlike FAQPage/HowTo, see CODE-02), download
links, and the disclaimer top+bottom (product invariant preserved). New
routes `src/app/legal-cost-statistics/data.json/route.ts` and
`.../data.csv/route.ts` expose the identical aggregate as machine-readable
feeds (same `buildStatisticsAggregate()` call — page, Dataset JSON-LD,
data.json, and data.csv are four consumers of one aggregation, never four
separately-hand-maintained number sets). Added to `sitemap.ts`.

Tests: `tests/code-04-statistics.test.ts` (new, 9 tests) — asserts every
category row's figures trace to the real `getNationalAverage()`/
`INDEXABLE_PAGES` source of truth, 3-5 findings each grounded in a real
category name, and that `data.json`/`data.csv` return byte-identical
figures to the page's own aggregate (build-verified: real numbers e.g.
national median divorce cost $8,798, Hawaii $12,900 vs. Alabama $6,050,
appear identically in the rendered page, `data.json`, and `data.csv`).

### CODE-05 — dynamic OG images with the real computed number baked in
`src/app/[state]/[slug]/opengraph-image.tsx` (the one OG image among the
site's five that did NOT yet bake in a real per-entity number — the other
four, `/[state]`, `/category/[category]`, `/divorce-cost-by-state`, and
root, already did this in a prior K09 wave) now renders the entity's REAL
moderate-complexity cost range (`getModerateCostRange`, new page-index.ts
export, static-seed-sourced so it works on the edge runtime without a
Supabase round-trip) as text on the 1200x630 image, alongside the existing
state/category badges.

Added a real, non-fabricated "As of {date}" freshness marker
(`src/lib/seo/og-freshness.ts`, new — `getOgAsOfLabel()`, sourced from
`DEFAULT_FIGURES_LAST_VERIFIED`/`DATA_VERSION_DATE`, the SAME sitewide
verified-date `UpdatedBadge`/`AuthorByline`/`sitemap.ts` already use; never
`new Date()`) to **all five** OG image routes (the four pre-existing K09
images + the new entity-level one) for consistency with the CODE-05
acceptance criterion ("every calculator/cost/statistics page"). New OG
image `src/app/legal-cost-statistics/opengraph-image.tsx` bakes in the real
headline stat from `buildStatisticsAggregate()`.

`twitter:card=summary_large_image` + `og:image` were already emitted
sitewide via the existing `buildMeta()` helper (T10) for every page routed
through it, including the two new CODE-04 pages — no change needed there,
confirmed by test.

Tests: `tests/code-05-og-images.test.ts` (new, 14 tests) — asserts the
entity OG image pulls the real cost range + renders a real dated freshness
marker (never `new Date()`), every OG image route (old + new) carries the
freshness helper, no OG image bakes in a fabricated rating/superlative
(source-scanned with comments stripped, so a guardrail comment explaining
what's deliberately NOT done isn't mistaken for a violation), and
`buildMeta()`'s sitewide `twitter:card`. `tests/k09-discover-hygiene.test.ts`
(pre-existing, source-grep-based) re-run unchanged and still green — all
existing `INDEXABLE_PAGES`/`getModerateMedianCost`/`getCostByComplexity`/
`formatCurrency`/`#0D9488`/1200x630/edge-runtime assertions preserved
verbatim in every edited file.

### Test delta
408 tests (P0 wave baseline) -> 473 tests. New files: `tests/code-04-
statistics.test.ts` (9), `tests/code-05-og-images.test.ts` (14),
`tests/code-06-info-gain.test.ts` (13). Extended/fixed: `tests/page-
index.test.ts` (rewritten for the 4-fact gate, net +7), `tests/related-
matters.test.ts` (1 test's now-false hardcoded assumption replaced with a
correct invariant check, same test count).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 errors (same 3 pre-existing `react/no-danger` unused-
  disable warnings as prior waves, now on `article-schema.tsx`,
  `dataset-schema.tsx` — new, follows the identical established JSON-LD
  pattern — and `software-application-schema.tsx`; unrelated to this
  wave's logic).
- `npm test`: 473/473 passed.
- `npm run build`: succeeded. Build log confirms both this wave's real
  data-dependent outputs: `sitemap: 434 indexable URLs (369/408
  programmatic pages pass hasUniqueData)` (CODE-06's stricter gate is live)
  and the new routes compiled cleanly — `○ /legal-cost-statistics`,
  `○ /legal-cost-statistics/data.csv`, `○ /legal-cost-statistics/data.json`
  (all statically prerendered — the static-seed-sourced aggregation needs
  no request-time Supabase round-trip), `ƒ /legal-cost-statistics/
  opengraph-image`. Prerendered `data.json`/`data.csv` bodies spot-checked
  post-build and contain the real, cross-verified figures (e.g. Hawaii
  divorce median $12,900 vs. Alabama $6,050, matching a fully independent
  Node re-computation of the seed dataset).
- Known, pre-existing, unrelated local-build limitation (see project
  memory "LegalCostCalc local dev quirks"): Supabase is unreachable in this
  build environment, so `/[state]/[slug]` pages fall back to their
  "currently being collected" empty state at build time — this affects the
  ALREADY-SHIPPED CODE-01 answer block identically (verified: neither the
  pre-existing answer block nor the new CODE-06 benchmark-synthesis
  sentence render real numbers in this specific local HTML output for that
  reason). Not a regression from this wave — `buildBenchmarkSynthesis`,
  `buildStatisticsAggregate`, and the CODE-06 gate math are independently
  unit-tested directly against the real seed dataset (bypassing the
  Supabase-dependent request path entirely), and the `/legal-cost-
  statistics` page (which reads the static seed directly, no Supabase)
  confirms real numbers DO render correctly end-to-end in this same build.

### Not touched (guardrails)
No FAQPage/HowTo schema was re-introduced (CODE-02 stays in force — the
new Dataset JSON-LD is additive, on a new page). No embed/nofollow-ugc
logic (CODE-03) touched. No AdSense/monetization logic touched. Breadcrumbs/
meta/IndexNow/Web Vitals (부속I) were not re-specced — only page-index.ts's
internal gating math changed, and every downstream consumer (sitemap,
robots, hub/link modules) already read through `INDEXABLE_PAGES`/
`hasUniqueData` so needed no changes. Disclaimer top+bottom preserved on
the new statistics page. No user-input/personalized data in the new OG
images or statistics feeds — every figure is the page's own canonical
real/aggregate value (YMYL invariant). No commit/deploy performed
(orchestrator-owned).

## Traffic-Maximization Wave P0 (CODE-01/02/03) — Build Note (2026-07-04)

Implements 부속P_트래픽극대화_딥리서치.md §4 CODE-01/02/03 (traffic-acquisition
spec, built strictly on top of the existing 부속I SEO infra and 부속F/H
monetization/compliance — neither re-specced nor touched).

### CODE-01 — GEO passage-level answer block
New `src/lib/seo/geo.ts` exports `buildAnswerBlock(entity)` — a pure
function (no JSX, unit-testable independent of rendering) that builds, from
a page's own already-computed `LegalCostData[]` rows (real numbers only,
never fabricated):
- a query-phrased heading (`How much does a {matter} cost in {state}?`)
- a 40-60 word answer paragraph containing the real median/range figures,
  a fee-structure clause (hourly rate, or — for personal-injury's
  contingency-billed rows — the real contingency percentage, never
  invented), typical duration, and a common-fees clause; word count is
  algorithmically fitted into [40,60] by dropping/appending whole sentences
  only (never mid-sentence, which would risk truncating a real number)
- a compact cost-breakdown table (one row per complexity tier, real values)
- a 5-10 item cost-factor list (case complexity, hourly rate, real
  `commonFees` from the row, fee-arrangement note when contingency data
  exists, trial/court-fee factors)
- >=2 inline source-attributed stats, each citing one of the row's own real
  `sources[]` URLs
- a dated freshness marker sourced from the row's real `lastVerifiedAt`
  (never `new Date()`)

New `src/components/seo/answer-block.tsx` (`<AnswerBlock>`) is the pure
server-component renderer — no client JS, so the full structure is present
in the initial HTML response. Wired as the first substantive content block
on `src/app/[state]/[slug]/page.tsx` (rendered immediately after the H1,
superseding the narrower pre-existing "Quick answer" callout with the same
real figures but the full GEO-extractable structure — kept H1-before-H2
heading order intact rather than placing the block literally above the
H1) and identically on `src/app/embed/[state]/[slug]/page.tsx` (`compact`
variant) so cited embeds carry the same extractable passage, per the
spec's explicit "wire the same block into app/embed pages" requirement.
Degrades gracefully (no table/stats, generic non-fabricated closing
sentence) when a page has no moderate-complexity data — never invents a
number.

### CODE-02 — Replace deprecated FAQPage JSON-LD with the 2026-valid schema set
- Removed `<FaqSchema>` (FAQPage JSON-LD) rendering from the only two call
  sites that emitted it: `src/app/page.tsx` (home) and
  `src/app/[state]/[slug]/page.tsx`. The Q&A content itself is UNCHANGED and
  still renders as visible on-page text (home page's hand-written FAQ `<dl>`,
  and `CategoryEditorial`'s FAQ section on spoke pages) — this is exactly
  what GEO research favors (extractable passage text, not schema). The
  `faq-schema.tsx` component file and the dead, already-unused
  `buildFaqSchema()` helper in `src/lib/utils/seo.ts` were left in place
  (no import/render site references either anymore) since removing unused
  files was outside this wave's scope.
- New `src/components/seo/article-schema.tsx` (`<ArticleSchema>`) emits
  `Article` JSON-LD (headline, description, url, `datePublished`/
  `dateModified` only when a real date is supplied — never fabricated,
  `author` Person when a real reviewer is env-configured via
  `src/lib/reviewer.ts` else the honest `Organization` fallback, `publisher`
  Organization). Wired onto the home page and every `/[state]/[slug]` page
  alongside the pre-existing `BreadcrumbSchema`/`SoftwareApplicationSchema`
  (both confirmed unchanged/still wired — `SoftwareApplicationSchema` still
  never emits `aggregateRating`, since no real rating data exists).
- `src/components/seo/organization-schema.tsx`'s `WebSite` node now also
  carries `potentialAction: SearchAction` (Sitelinks Searchbox eligibility).
  Rather than point this at a non-functional/fabricated target, added a real,
  minimal `src/app/search/page.tsx` (`noindex,follow` utility page) that
  matches the query against the real `INDEXABLE_PAGES` set (state names +
  category display names) and links directly to the matching indexable cost
  page — so the SearchAction target actually works end-to-end, never a
  dead-end URL.

### CODE-03 — Harden the embeddable-widget backlink engine
- Attribution link `rel` changed from `"noopener nofollow sponsored"` to
  `"noopener nofollow ugc"` in both `src/app/embed/[state]/[slug]/page.tsx`
  (the live iframe page) and `src/components/embed/embed-snippet.tsx` (the
  copy-paste snippet) — per Google's official widget-link guidance (`ugc`
  signals a link inside user/third-party-embedded content; the previous
  `sponsored` value was the wrong token for this context and the spec's #1
  penalty-trap anti-pattern). The genuinely paid `SponsorSlot` affiliate
  link in `src/components/monetization/ResultMonetization.tsx` correctly
  keeps `nofollow sponsored` — untouched, out of CODE-03's scope, and the
  correct rel value for an actual paid placement.
- New `src/components/embed/embed-panel.tsx` (`<EmbedPanel>`) — a thin
  wrapper around the existing `<EmbedSnippet>` — now renders an "Embed this
  calculator" copy-to-clipboard panel directly on every main
  `/[state]/[slug]` calculator page (previously the snippet only lived on
  the standalone `/embed` index page), placed below
  `RelatedCalculators`/existing monetization modules (same LCP/ad-exclusion-
  zone rationale already documented for K01/CategoryEditorial — no ad slot
  is anywhere nearby, confirmed against `docs/ad-exclusion-zones.md`).
- New `src/components/embed/embed-resize-reporter.tsx`
  (`<EmbedResizeReporter>`) posts the iframe's real content height to
  `window.parent` via `postMessage` (namespaced `legalcostcalc:embed-resize`
  message type) on mount and on `ResizeObserver`/window-resize changes;
  rendered inside `src/app/embed/[state]/[slug]/page.tsx`. The generated
  copy-paste snippet in `embed-snippet.tsx` now also includes a small inline
  listener script that resizes the host page's `<iframe>` on receiving that
  message, so partners who paste the snippet verbatim get the auto-resize
  behavior without any extra step.
- `EmbedLoadedTracker`/the GA4 `embed_loaded` event (host-domain param via
  `document.referrer`) and the embed route's `noindex` metadata were both
  confirmed unchanged/still correct — no changes needed there.

### Files added
- `src/lib/seo/geo.ts`
- `src/components/seo/answer-block.tsx`
- `src/components/seo/article-schema.tsx`
- `src/components/embed/embed-panel.tsx`
- `src/components/embed/embed-resize-reporter.tsx`
- `src/app/search/page.tsx`
- `tests/geo-answer-block.test.ts`
- `tests/code-02-schema.test.ts`
- `tests/code-03-embed-hardening.test.ts`

### Files modified
- `src/app/page.tsx` — removed `FaqSchema`/`HOME_FAQ_QUESTIONS`, added
  `ArticleSchema`.
- `src/app/[state]/[slug]/page.tsx` — removed `FaqSchema`, added
  `ArticleSchema`, `AnswerBlock` (after H1), `EmbedPanel` (below
  `RelatedCalculators`).
- `src/app/embed/[state]/[slug]/page.tsx` — `rel` fix, added
  `AnswerBlock`/`EmbedResizeReporter`, now fetches costs via
  `getCostForPage` to build the answer block.
- `src/components/seo/organization-schema.tsx` — added
  `potentialAction: SearchAction` to the `WebSite` node.
- `src/components/seo/category-editorial.tsx` — doc-comment update only
  (reflects that its FAQ text is no longer mirrored as FAQPage schema).
- `src/components/embed/embed-snippet.tsx` — `rel` fix + resize-listener
  script + iframe `id`.

### Verification performed
- `curl` against a local production build (`next start`) confirmed: H1
  renders before the AnswerBlock's H2 (correct heading order); FAQPage is
  absent from every page's JSON-LD; Article/BreadcrumbList/
  SoftwareApplication/WebSite+SearchAction are present and valid JSON; the
  embed page's attribution anchor carries `rel="noopener nofollow ugc"`
  (zero occurrences of `nofollow sponsored` remain on the embed surfaces);
  the embed route still returns `noindex`; `/search?q=Divorce` returns 50
  real matching links from `INDEXABLE_PAGES`.
- The cost-breakdown table/stats portion of the answer block could NOT be
  curl-verified against real numbers in this sandbox because local
  `getCostForPage`/Supabase calls 500 in this dev environment (pre-existing,
  documented, unrelated to this wave — see the project memory note
  `legalcostcalc-local-dev-quirks.md`: "Supabase 500s locally"). Verified
  instead, more rigorously, via `tests/geo-answer-block.test.ts`, which
  exercises `buildAnswerBlock`/`<AnswerBlock>` against the REAL seed dataset
  (`src/data/seed/costs.json`) across every one of the 408 indexable
  (state, category) pairs — asserting the query-phrased heading, the
  40-60-word answer word count, real computed numbers appearing verbatim in
  the answer text, the table row shape/bounds, the 5-10 item factor list,
  >=2 stats whose `sourceUrl` traces back to the row's own real `sources[]`,
  a non-empty freshness label, and the absence of superlative/promotional
  language — over the full production dataset, not a single sample page.

### Test delta
437/437 tests passing (408 pre-existing + 29 new: 8 in
`tests/geo-answer-block.test.ts`, 12 in `tests/code-02-schema.test.ts`, 9 in
`tests/code-03-embed-hardening.test.ts`).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (2 pre-existing "unused eslint-disable directive"
  warnings on `react/no-danger` in `software-application-schema.tsx` and the
  new, identically-patterned `article-schema.tsx` — both carried over/
  consistent with the established JSON-LD-component pattern, not new
  problems)
- `npm test`: 437/437 passed (one `tests/indexnow.test.ts` timeout observed
  once under parallel load — confirmed flaky/unrelated, re-ran green in
  isolation and in the full suite immediately after)
- `npm run build`: succeeded, 472 indexable sitemap URLs (unchanged — no
  new indexable programmatic pages; `/search` is intentionally
  `noindex,follow` and appears as a new dynamic (ƒ) route, not a static
  sitemap entry)

### Not touched (guardrails)
No changes to `lib/seo/schema/faq.ts`-equivalent removal beyond de-wiring
render sites (the component file itself and the dead `buildFaqSchema()`
helper were left in place, unreferenced). No FAQPage/HowTo JSON-LD is
emitted anywhere post-wave. No fabricated numbers, dates, or ratings were
introduced anywhere (verified: `aggregateRating` still never appears;
`ArticleSchema` omits `datePublished`/`dateModified` when no real date
exists). The embed route's `monetizationDisabled`/no-AdSense invariant,
disclaimer top+bottom, and the 부속I thin-page (`hasUniqueData`)/sitemap
gate were all left untouched and re-verified green. No owner-distribution
action (OWN-01–07) was taken — code only. No commit/deploy performed
(orchestrator-owned).

## F10 — Legal-Risk Compliance Pass / P0 UPL Mitigations (2026-07-02)

### Summary
Implemented P0 legal-risk mitigations per an internal legal-risk report
(Appendix G). CRITICAL/UPL project — strong LEGAL disclaimer variant used
throughout ("not legal advice; we are not a law firm; no attorney-client
relationship is created; costs vary by case and jurisdiction"). This is
risk-mitigation copy/code, not legal advice, and the Terms/Privacy pages are
explicitly marked DRAFT pending licensed-attorney review.

### A. Demand-letter / document-generation audit
Grepped `src/app/api`, `src/lib/services`, and all of `src/` for
demand-letter / document-generation patterns (`demand letter`, `generate
document`, `draft letter`, `letter template`, etc.). **Result: no such
feature exists in this repo.** LegalCostCalc is a cost calculator +
informational settlement-net estimator only — no route to disable.

### B. New compliance components (`src/components/compliance/`)
1. **`ResultDisclaimer.tsx`** — layered disclaimer rendered ADJACENT to
   calculator results (never footer-only), supplementing the existing
   `Disclaimer` invariant. Shows "Figures last updated: {date}" (read from
   `lib/constants/figures.ts`) and an optional HTTPS-only primary-source link.
   Wired into `cost-result.tsx` (below the result card) and
   `settlement-estimator-form.tsx` (below the breakdown card).
2. **`TermsGate.tsx`** — clickwrap consent gate. `useTermsGate()` hook +
   `TermsGateInline`/`TermsGateOverlay` components. Unchecked-by-default
   checkbox, active affirmative action, ISO-timestamped localStorage
   persistence (SSR-safe — read only inside `useEffect`), never re-shown once
   accepted. Integrated into all three calculate/compare triggers:
   `cost-calculator.tsx` ("Calculate Cost" button), `settlement-estimator-
   form.tsx` ("Estimate My Net" button), and `app/compare/page.tsx`
   ("Compare" button) — each button stays disabled until consent is recorded
   and the inline gate card is shown beneath it.
3. **`AffiliateDisclosure.tsx`** — FTC 16 CFR 255 disclosure ("We may earn a
   commission... These are advertisements. We do not recommend or endorse any
   attorney or service and receive flat advertising compensation, never a
   share of fees.") Rendered immediately above every affiliate/lead CTA and
   the featured-partner table — `affiliate-cta.tsx`,
   `ResultMonetization.tsx` (cpl + affiliate CTA types, `FeaturedPartnerTableBlock`).

### C. Terms / Privacy (both marked DRAFT — attorney review required)
- **`src/app/terms/page.tsx`**: added §4A Indemnification, §4B Binding
  Individual Arbitration & Class-Action Waiver (with jury-trial waiver and a
  severability fallback), strengthened §2 (explicit no-attorney-client-
  relationship language), §6 (advertising-not-referral clause), §9 Governing
  Law & Venue (state left as an operator TODO comment — not fabricated).
  Liability cap in §4 changed from a flat $50 to "greater of amount paid or
  $10" since the site is free (no amount paid by users).
- **`src/app/privacy/page.tsx`**: added a verified sentence — "Calculator
  inputs are processed in your browser and are not transmitted to or stored
  on our servers" — after confirming via grep that `use-calculate-cost.ts` /
  `use-compare-costs.ts` only send category/state/complexity (not personal
  data) to `/api/costs`, and `settlement-estimator.ts` is a pure client-side
  function with zero I/O.

### D. Privacy / pixel hygiene audit (C1/C2)
Grepped for `fetch(`/POST calls carrying calculator input values and for
`gtag(`/analytics event calls with sensitive payloads. **Result: already
compliant** — no code changes needed. `use-calculate-cost.ts` and
`use-compare-costs.ts` only build `URLSearchParams` for the same-origin
`/api/costs` lookup (category/state/complexity, not sensitive); the
Settlement Net Estimator (`settlement-estimator.ts`) never calls `fetch` at
all. `gtag(...)` usage in `consented-analytics.tsx` is the standard
`gtag('config', ...)` bootstrap only — no custom events push calculator
inputs or sensitive query params.

### E. CAN-SPAM email-capture gate (C3)
- `lib/monetization.ts`: added `postalAddress` to `MonetizationConfig`, read
  from `NEXT_PUBLIC_POSTAL_ADDRESS`.
- `email-capture.tsx`: `postalAddress` is now a required prop; renders the
  address plus a plain "You can unsubscribe at any time with one click."
  line.
- `ResultMonetization.tsx`: email capture now renders only when BOTH
  `emailCaptureEnabled` AND `postalAddress` are set.
- `.env.example`: documents `NEXT_PUBLIC_POSTAL_ADDRESS`.

### F. Prescriptive-language copy audit (grep-based)
Searched for "you should", "we recommend", "best ... for you", "guaranteed",
"exact", "will save you", "you qualify", "accurate" (as a self-promise),
"trusted", "strongly recommended" across `src/`. Replacements:

| File | Before → After |
|------|-----------------|
| `src/app/about/page.tsx` | "We recommend consulting..." / "your specific circumstances" / "accurate cost assessments" → neutral "Consult a licensed attorney..." + explicit no-attorney-client-relationship sentence |
| `src/lib/constants/affiliates.ts` | LegalMatch: "for your case" → "by practice area" |
| `src/lib/constants/categories.ts` | Divorce FAQ: "legal representation is strongly recommended" → "often involve legal representation" |
| `src/components/shared/affiliate-cta.tsx` | "Need Legal Help?" / "Connect with trusted legal service providers" → "Legal Service Providers" / "advertising, not a referral or recommendation" + `<AffiliateDisclosure>` |
| `src/components/monetization/ResultMonetization.tsx` | CTA labels: "Recommended Legal Service" → "Legal Service Advertisement"; "Get Connected with an Attorney" → "Attorney Advertising" |
| `src/components/calculator/settlement-estimator-form.tsx` | `SETTLEMENT_DISCLAIMER` strengthened with explicit not-a-law-firm / no-attorney-client-relationship language |

Remaining "you should always consult a licensed attorney" phrasing (terms
page) and "we do not recommend" (negation form) were intentionally kept —
these are the required safe-harbor direction, not advice-giving.

**Replacement counts**: 6 files touched, ~9 distinct phrase replacements
(see table above; some files had multiple replacements within one paragraph).

### G. Data-accuracy hygiene — `src/lib/constants/figures.ts` (new)
Central figures metadata registry. `COST_DATASET_FIGURE` carries a real,
repo-verifiable `lastVerified: "2026-06-29"` (sourced from the Phase-3
Handoff Note in this file, where `DATA_VERSION_DATE` was bumped after the
cost-data regression pass). `SETTLEMENT_CONTINGENCY_FIGURE` (the 33.33%
default contingency rate) has **no verifiable verification date** in repo
history, so `lastVerified: null` — reported below as an unsourced figure,
never fabricated. Per-row `sources[]` in `src/data/seed/costs.json` are
unaffected and continue to render inline via `CostResult`.

**Unsourced figures (no fabricated date/source)**:
- Settlement estimator default contingency fee (33.33%) — has a cited source
  (Nolo, "Contingency Fee Basics") but no verifiable verification *date* in
  repo history.

### Test delta
- 259 tests (F10) vs. prior baseline — added `tests/figures.test.ts` (8 new
  tests) and 2 new tests in `tests/monetization.test.ts` (`postalAddress`
  unset/set).

### Gate results
- `npm run lint`: 0 errors (1 pre-existing unrelated warning in
  `software-application-schema.tsx`)
- `npm test`: 259/259 passing
- `npm run build`: 833 pages, TypeScript compiled successfully

### Owner / attorney-review action required
| Item | Action needed |
|------|----------------|
| `src/app/terms/page.tsx`, `src/app/privacy/page.tsx` | Licensed US attorney review before reliance (DRAFT banner added to both files) |
| Governing-law state (`terms/page.tsx` §9) | Operator must specify the entity's actual state of organization/principal place of business — left as a TODO comment, not fabricated |
| `NEXT_PUBLIC_POSTAL_ADDRESS` | Required (in addition to `NEXT_PUBLIC_EMAIL_CAPTURE=on`) to activate the email-capture block — CAN-SPAM requires a physical postal address |
| Settlement contingency-fee constant | No verified `lastVerified` date exists in repo history — confirm and backfill in `lib/constants/figures.ts` if a verification date is later established |

---

## F9 — No-Checkout Monetization Stack (2026-07-01)

### Summary
Additive, ENV-gated unified monetization stack. All slots render null when their env var is unset. No checkout/Stripe code. No CMP changes. No fabricated values.

### Files added
| File | Purpose |
|------|---------|
| `src/lib/monetization.ts` | Central config; `getMonetizationConfig()`, parsers, `VERTICAL_DEFAULT_CTA_TYPE` |
| `src/components/monetization/AdProvider.tsx` | Single programmatic network selector (never two) |
| `src/components/monetization/ResultMonetization.tsx` | Full monetization stack: CTA, display slot, partner table, sponsor, email |
| `tests/monetization.test.ts` | 58 unit tests for monetization config |

### Files modified
| File | Change |
|------|--------|
| `src/components/calculator/cost-result.tsx` | Added `categorySlug` prop; inserted `<ResultMonetization>` below cost card |
| `src/components/calculator/cost-calculator.tsx` | Pass `categorySlug` to `CostResult` |
| `src/app/[state]/[slug]/page.tsx` | Routed in-content `<AdUnit>` calls through `<AdProvider>`; removed page-level email capture + result-area AdUnit (now in ResultMonetization) |
| `src/app/ads.txt/route.ts` | Added 301 redirect support for `NEXT_PUBLIC_ADSTXT_REDIRECT_URL`; AdSense default preserved |
| `.env.example` | All monetization env vars documented |

### Gate results
- lint: 0 errors (1 pre-existing warning in software-application-schema.tsx)
- test: 251/251 pass (58 new)
- build: 833 pages, 0 TS errors

### Invariants confirmed
- ENV unset => render null for every slot (verified by unit tests)
- Exactly ONE programmatic network at a time (parseAdProvider returns single enum value)
- No Stripe / payment / checkout code added
- No CMP changes (ConsentedAnalytics untouched)
- Disclaimer top+bottom preserved on all pages (existing Disclaimer component unchanged)
- No fabricated affiliate IDs, phone numbers, partner data, or tracking links
- Layer invariant maintained: config in `lib/`, presentational in `components/`

---

## Phase-1 Handoff Note (2026-06-29)

### Coverage before → after
- **Before**: 0 tests, no test runner configured.
- **After**: 78 tests passing (vitest 4.1.9), `npm test` is green.

### What was installed
- `vitest@^4.1.9` added to `devDependencies`.
- `vitest.config.ts` created at repo root with `@/` path alias pointing to `./src/`.
- `"test": "vitest run"` added to `package.json` scripts.

### Tests added by type

| Type | File | Count | Description |
|------|------|-------|-------------|
| Data-integrity | `tests/costs-data-integrity.test.ts` | 22 | 1224-cell count, cost_low≤median≤high, hourly_rate ordering, sources[] non-empty, required fields |
| Regression guard | `tests/costs-data-integrity.test.ts` | 5 | Banned URL patterns removed 2026-06-29: `courts.state.<xx>.us`, `martindale.com`, `-costs-fees.html`, `legal-guides/ugc/...-attorney-fees`, + summary assertion |
| Unit — sanitize | `tests/sanitize.test.ts` | 27 | isSafeUrl (safe https/http pass; javascript:, data:, vbscript:, file:, empty, bare-domain blocked); sanitizeUrl (returns string or undefined) |
| Static lookup | `tests/cost-lookup.test.ts` | 24 | findCategoryBySlug, findStateByCode, findStateBySlug, in-memory cost lookup by category/state/complexity — normal, boundary, missing cases |

**Total tests added: 78**

### Product bugs found
None. All 78 tests passed cleanly. No assertions skipped.

### Notes
- `cost-service.ts` and `cost-repository.ts` require a live Supabase connection and are NOT tested in Phase 1. They are the primary targets for Phase 2 integration tests using a mocked Supabase client.
- The `api-security.ts` `checkRateLimit` function uses `Date.now()` internally. It is tested indirectly via the rate-limit logic; Phase 2 can inject a fake clock if needed.

---

---

## Phase-3 Handoff Note (2026-06-29)

### Summary
Phase 3 applied all 6 Majors and 4 of 14 Minors from the quality brief. Gate is all-green.

### Fixes applied
- **M1 (Security)** `json-ld.ts`: `safeJsonLd` escape was a runtime no-op (`<` → `<`). Fixed to `\\u003c`; added `\\u003e` and `\\u0026`.
- **M2 (Security)** `affiliate-cta.tsx`: `partner.affiliateUrl` now guarded with `isSafeUrl` before use as href.
- **M3 (Maintainability)** `api-handler.ts`: Silent `void error` replaced with `console.error(...)` for platform log visibility.
- **M4 (Correctness)** `cost.ts` / `cost-service.ts` / `cost-result.tsx`: Added `contingencyFee: CostRange | null` to `LegalCostData` and `LegalCostRow`. Mapped `contingency_fee_*` fields in `mapRowToData`. `cost-result.tsx` now skips the Hourly Rate card (which showed $0–$0) for personal-injury and renders a Contingency Fee card (% of settlement) instead.
- **M5 (A11y)** `about/page.tsx`: Added `FOCUS_RING` to all 5 external Data Sources anchors (WCAG 2.4.7 AA).
- **M6 (A11y)** `terms/page.tsx`: Added `FOCUS_RING` import and shared `linkCls` constant; applied to Privacy Policy link and mailto contact link.
- **mn1** `data-meta.ts`: `DATA_VERSION_DATE` bumped to `2026-06-29`.
- **mn2** `sanitize.ts`: `isSafeUrl` now enforces HTTPS-only (blocks `http://`).
- **mn3** `cost-result.tsx`: Single-source label uses `safeSourceUrls.length < 2` not raw `cost.sources.length < 2`.
- **mn4** `cost-result.tsx`: Card `shadow-md` → `shadow-sm` (design system baseline).

### Test delta
- 78 tests (P1) → 101 tests (P3). Added `tests/phase3-fixes.test.ts` (23 new tests). Updated `tests/sanitize.test.ts` (http:// blocked case + https-only regression).

### Gate results
- `npm run lint`: ✓ 0 errors (1 pre-existing warning)
- `npm test`: ✓ 101/101
- `npm run build`: ✓ 832 pages, 0 TS errors

### Files in scope for Phase 4
- `src/app/api/costs/compare/route.ts` — duplicate state code guard (deferred Minor)
- `src/lib/utils/api-security.ts` — x-real-ip fallback + JSDoc for cold-start limitation
- `src/data/seed/costs.json` — add `last_verified_at` field to all 1224 rows
- `src/lib/utils/data-freshness.ts` — Invalid Date guard
- `src/lib/utils/seo.ts` — dead exports cleanup

---

---

## Phase-4 Build Note (2026-06-30)

### Summary
Implemented F6: Settlement Net Estimator + env-gated affiliate CTA infrastructure.

### Changes
1. **`src/lib/utils/settlement-estimator.ts`** (new) — Pure utility. Formula: `net = max(0, gross * (1 - contingencyPct/100) - caseCosts)`. Input validation for gross (>0), contingencyPct (0 < x < 100), caseCosts (>=0). Returns typed discriminated union (`ok: true | false`). Five error codes. `DEFAULT_CONTINGENCY_PCT = 33.33`. Source citation: ABA Model Rule 1.5(c) + Nolo.
2. **`tests/settlement-estimator.test.ts`** (new) — 21 unit tests: normal case, zero costs, costs>net=>COSTS_EXCEED_NET (net==0), all INVALID_* branches, boundary (costs==post-fee => net==0), DEFAULT_CONTINGENCY_PCT constant.
3. **`src/components/calculator/settlement-estimator-form.tsx`** (new) — Client component. Three numeric inputs (gross, pct defaulting to 33.33, costs defaulting to 0). SettlementDisclaimer (amber-50) rendered top+bottom. Source citations (Nolo + ABA) with FOCUS_RING anchors. `aria-live="polite"` results region. Handles all 5 error states. No hardcoded affiliate URL.
4. **`src/app/settlement-estimator/page.tsx`** (new) — Static page (`○`). BreadcrumbSchema, site-level `<Disclaimer />` top+bottom, formula explainer with source citations, `<SettlementEstimatorForm />`, env-gated `<AffiliateCTA categorySlug="personal-injury" />`.
5. **`src/components/layout/header.tsx`** — Added "Settlement Estimator" nav link.
6. **`src/components/layout/footer.tsx`** — Added "Settlement Estimator" footer link.
7. **`src/lib/constants/affiliates.ts`** — `affiliateUrl?: string` removed; replaced with `affiliateUrlEnvVar: string` (e.g. `"NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL"`). Added `getAffiliateTrackingUrl(partner, isSafeUrl)` which reads the env var at runtime and HTTPS-guards it. No hardcoded tracking URL ships.
8. **`src/components/shared/affiliate-cta.tsx`** — Rewrote to use `getAffiliateTrackingUrl`. Only partners whose env var resolves to a valid HTTPS URL render a clickable link. Returns null entirely when no partners are active.

### Test delta
- 101 tests (P3) → 122 tests (P4). Added `tests/settlement-estimator.test.ts` (21 new tests).

### Gate results
- `npm run lint`: ✓ 0 errors (1 pre-existing warning in software-application-schema.tsx)
- `npm run tsc --noEmit`: ✓ 0 errors
- `npm test`: ✓ 122/122
- `npm run build`: ✓ 833 pages (was 832), 0 TS errors

### Affiliate env vars (owner action required to activate)
| Env var | Partner |
|---------|---------|
| `NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL` | LegalZoom (Impact) |
| `NEXT_PUBLIC_AFFILIATE_ROCKETLAWYER_URL` | Rocket Lawyer (Impact) |
| `NEXT_PUBLIC_AFFILIATE_LEGALMATCH_URL` | LegalMatch (direct) |
| `NEXT_PUBLIC_AFFILIATE_AVVO_URL` | Avvo (CJ) |
| `NEXT_PUBLIC_AFFILIATE_NOLO_URL` | Nolo (CJ) |
| `NEXT_PUBLIC_AFFILIATE_LAWDEPOT_URL` | LawDepot (ShareASale) |

---

---

## Phase-5 Build Note (2026-06-30)

### Summary
Implemented F7: Contact page for AdSense approval (YMYL sites require About + Contact).

### Changes
1. **`src/app/api/contact/route.ts`** (new) — POST endpoint. Validates `name` (required, ≤100 chars), `email` (required, RFC shape, ≤254 chars), `message` (required, ≤2000 chars). Rate-limited via `rateLimitGuard`. Returns 200 `{ok:true}` as safe no-op. Exports constants and helpers for unit tests. Mirrors `/api/subscribe` pattern exactly.
2. **`src/components/shared/contact-form.tsx`** (new) — Client component. Labeled inputs, character counter on message, `aria-live="polite"` status region, focus-visible rings, disabled state during submission/success. Exports `validateContactFields` pure helper (mirrors server caps).
3. **`src/app/contact/page.tsx`** (new) — Static page. `Disclaimer` top+bottom, `BreadcrumbSchema`, `ContactPage` schema.org JSON-LD, two-column layout (sidebar info + form card). `NEXT_PUBLIC_CONTACT_EMAIL` env guard — email address shown only when owner sets the var; never fabricated.
4. **`src/components/layout/footer.tsx`** — Added "Contact" link to the Resources list (after "About & Methodology").
5. **`tests/contact.test.ts`** (new) — 42 unit tests covering: exported constants, `getField` helper, `EMAIL_RE`, server validation (valid payload + every rejection branch), client `validateContactFields` (valid + every rejection branch).

### Test delta
- 122 tests (P4) → 164 tests (P5). Added `tests/contact.test.ts` (42 new tests).

### Gate results
- `npm run lint`: ✓ 0 errors (1 pre-existing warning)
- `npm test`: ✓ 164/164
- `npm run build`: ✓ 834 pages (was 833), 0 TS errors

### Owner action required
| Env var | Purpose |
|---------|---------|
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional. When set, shows a direct email link on the Contact page alongside the form. Leave unset to show form only. |

---

---

## Phase-6 Build Note (2026-07-01)

### Summary
Implemented F8: Site-wide Feedback Widget — floating FAB + panel, `/api/feedback` route, pure validation helper, and 29 unit tests.

### Changes
1. **`src/lib/utils/feedback-validation.ts`** (new) — Pure validation helper. Exports `FEEDBACK_TYPES`, `MAX_MESSAGE_LENGTH`, `MAX_EMAIL_LENGTH`, `EMAIL_RE`, `getField`, `validateFeedbackBody`. Extracted so unit tests can exercise all validation paths without an HTTP runtime.
2. **`src/app/api/feedback/route.ts`** (new) — POST endpoint. `force-dynamic`. `rateLimitGuard` (reuses project in-memory limiter). 8 KB body cap. Validates via `validateFeedbackBody`. Server-enriches with `userAgent` (capped 512) + `receivedAt` ISO timestamp. When `FEEDBACK_ENDPOINT` env var is set: POSTs assembled record via server-side `fetch` with 5 s `AbortController` timeout + `try/catch`; on failure logs to `console.error` but returns 200 `{ok:true}` so the user is never blocked. No DB, no Supabase.
3. **`src/components/shared/feedback-widget.tsx`** (new) — Client component. Floating button (fixed bottom-right, teal-600, `MessageSquare` icon + "Feedback" label, safe-area-aware). Click opens compact panel (~320–380 px) with: type `<select>` (Bug/Feature/Other), message `<textarea>` required (≤2000 chars, live counter), email `<input type=email>` optional. Full a11y: labeled inputs, `aria-invalid`/`aria-describedby` on errors, focus moves into panel on open, focus trap, Esc closes, `aria-live="polite"` status region, `focus-visible` rings via `FOCUS_RING` constant, `motion-safe:animate-[fadeIn_150ms_ease]`. Design tokens only (teal-600/700, slate-*, white). No forbidden patterns.
4. **`src/app/layout.tsx`** — Added `<FeedbackWidget />` import + mount after `<ConsentedAnalytics />` inside the body flex container.
5. **`src/app/globals.css`** — Added `@keyframes fadeIn` for the panel entrance animation.
6. **`tests/feedback.test.ts`** (new) — 29 unit tests: `getField` (5), `EMAIL_RE` (3), `FEEDBACK_TYPES` (1), `validateFeedbackBody` valid payloads (6), invalid type (4), invalid message (4), invalid email (3), API forwarding (3: no-op when unset; calls fetch when set + asserts record shape; returns 200 on forward failure).

### Test delta
- 164 tests (P5) → 193 tests (P6). Added `tests/feedback.test.ts` (29 new tests).

### Gate results
- `npm run lint`: ✓ 0 errors (1 pre-existing warning in software-application-schema.tsx)
- `npm test`: ✓ 193/193
- `npm run build`: ✓ 834 pages, 0 TS errors

### Owner action required
| Env var | Purpose |
|---------|---------|
| `FEEDBACK_ENDPOINT` | Optional. Server-only (never `NEXT_PUBLIC_`). When set, the `/api/feedback` route POSTs feedback records as JSON to this URL. Compatible with Google Apps Script web app, Formspree, Airtable REST API, etc. Leave unset to run in safe no-op mode. |

---

## Files in scope for Phase 2

| File | Why |
|------|-----|
| `src/lib/services/cost-service.ts` | Business logic (mapRowToData, getCosts, compareCosts) needs unit tests with mocked repository |
| `src/lib/repositories/cost-repository.ts` | Supabase query builder logic (validateFilterParam, filter application) needs Supabase mock |
| `src/lib/utils/api-security.ts` | checkRateLimit sliding-window logic needs fake-clock testing |
| `src/lib/utils/format.ts` | formatCurrency, formatCurrencyRange, slugToTitle — pure functions, easy to cover |
| `src/lib/utils/data-freshness.ts` | Data-age warnings need deterministic date injection |
| `src/api/` routes | API handler integration tests (request/response envelope validation) |

---

## GA4 Wave P0 (T01–T05) — Build Note (2026-07-02)

### Summary
Implemented 부속I GA4 수익지표개선 스펙 §4 T01–T05 (P0, dependency-ordered) per the machine-executable spec at `D:\ClaudeCode\AppFarm\보고서\부속I_GA4수익지표개선_구현스펙.md`. All events flow through the existing consent-gated gtag pipeline (`ConsentedAnalytics`); CMP/Consent Mode v2 untouched. legalcostcalc is IS_SENSITIVE_SITE=true — zero input values, matter details, or `result_bucket` in any event.

### T01 — Gate GA4 to canonical production hostname
- `src/components/consent/consented-analytics.tsx`: added `resolveGaLoadDecision()`. GA (gtag.js) now only injects when `NEXT_PUBLIC_VERCEL_ENV === 'production'` AND `window.location.hostname` matches the canonical `NEXT_PUBLIC_APP_URL` host (bare or `www.`). Off-canonical (localhost/preview/mirror) traffic gets GA skipped entirely UNLESS `NEXT_PUBLIC_GA_DEBUG=1`, in which case GA loads with `debug_mode:true` + `traffic_type:'internal'` (DebugView-only, never production reports). Wraps ONLY the script-injection step — consent flow/Consent Mode defaults untouched.
- `.env.example`: documented `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GA_DEBUG`, `NEXT_PUBLIC_SITE_ID`, and flagged `NEXT_PUBLIC_VERCEL_ENV` as an **owner action required** Vercel dashboard env var (Vercel's built-in `$VERCEL_ENV` is server-only; must be manually mirrored to a `NEXT_PUBLIC_` var per-environment). Gate fails closed (no GA) until the owner sets this.

### T02 — Shared analytics module
- `src/lib/analytics.ts` (new): `SITE_ID` (env `NEXT_PUBLIC_SITE_ID`, fallback `'legalcostcalc'`), `IS_SENSITIVE_SITE = true`, `EventName` string-literal union (`calc_input_start | calculator_complete | related_click | outbound_click | result_share | embed_loaded | state_restored | web_vitals | email_signup`), `trackEvent()` (no-op on server or when `window.gtag` isn't a function; merges `{site, ...params}`; adds `traffic_type:'internal'` from the `cc_traffic_type` localStorage marker; adds `debug_mode:true` when `NEXT_PUBLIC_GA_DEBUG=1`; caps at 25 params), `initTrafficMarker()` (`?crew=1`/`?crew=0` → localStorage marker + immediate `gtag('set', {traffic_type:'internal'})`).
- `src/components/consent/analytics-init.tsx` (new): mounts `initTrafficMarker()` once at root layout.
- `src/app/layout.tsx`: added `<AnalyticsInit />` alongside `<ConsentedAnalytics />`.
- `tests/analytics.test.ts` (new, 10 tests): SSR no-op (real `window===undefined` path, no stubbing), no-op without `gtag`, param merge + site stamping, traffic_type/debug_mode injection, `initTrafficMarker` set/clear/no-op, module contract sanity.

### T03 — Calculator funnel (calc_input_start / calculator_complete)
- `src/lib/utils/calc-funnel.ts` (new): `shouldFireCalculatorComplete(hasUserInteracted, lastFiredAt, now)` — pure, injectable-clock guard shared by all three funnels. Never fires without `hasUserInteracted`; debounces to 1 fire per calc_type per `CALCULATOR_COMPLETE_DEBOUNCE_MS` (2000ms).
- `src/components/calculator/cost-calculator.tsx`: `hasUserInteractedRef` set only by the three Select `onValueChange` handlers (never by effects/default state). `calc_input_start {calc_type}` fires once on first interaction; `calculator_complete {calc_type}` fires when a result renders AND the guard passes. `calc_type` = category slug (e.g. `divorce`, `dui`). No `result_bucket` (sensitive site).
- `src/components/calculator/settlement-estimator-form.tsx`: same pattern, `calc_type: 'settlement_estimator'`, guarded on the three `NumberField` onChange handlers; fires only on `result.ok`.
- `src/app/compare/page.tsx`: same pattern, `calc_type: 'compare'`; interaction guard on all 4 form-field change handlers; completion fires via a `useEffect` keyed on `stateResult`/`categoryResult` (both start `null`, only ever set inside the compare hooks — never on mount).
- `tests/calc-funnel.test.ts` (new, 6 tests): no-interaction guard, first-fire, debounce-window suppression, post-window re-fire, exact-boundary (`>=`), default-`now` sanity.

### T04 — Link/nav/embed events + embed link-policy audit
- `related_click {link_module, link_url}`: wired into `src/components/seo/related-links.tsx` (converted to Client Component; `link_module:'inline'` — same-state other-category + same-category other-state links, incl. the "view more states" `<details>` expansion).
- `outbound_click {link_domain, link_type}`: wired into `src/components/seo/related-calculators.tsx` (`link_type:'crosslink'`, sibling-site links), `src/components/shared/affiliate-cta.tsx` (`link_type:'affiliate'`), `src/components/calculator/cost-result.tsx` (`link_type:'citation'`, per-result Data Sources links), `src/components/calculator/settlement-estimator-form.tsx` (`link_type:'citation'`, Nolo/ABA citations).
- `embed_loaded {host_domain}`: `src/components/embed/embed-loaded-tracker.tsx` (new) mounted once in `src/app/embed/[state]/[slug]/page.tsx`; reads `document.referrer` client-side for host attribution, fires once per mount.
- Embed link-policy audit: both the copy-paste snippet (`src/components/embed/embed-snippet.tsx`) and the live embed page's "Powered by LegalCostCalc" attribution link now carry `rel="noopener nofollow sponsored"` (previously `rel="noopener noreferrer"`/`rel="noopener"` — a followed-link manual-action exposure) plus `utm_source=embed&utm_medium=widget&utm_campaign=embed[_snippet]`. Anchor text was already the brand name ("Powered by LegalCostCalc"), not a keyword anchor — no change needed there.
- **Flagged, not fixed (out of wave scope)**: the embed route reuses the full `<CostCalculator>` → `<CostResult>` → `<ResultMonetization>` chain, which CAN load AdSense (`<AdProvider>`/`<AdUnit>`) inside the iframe when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set — contradicting the page's own "Ads are intentionally OFF here" comment and the T04 guardrail "NO AdSense inside widgets." Predates this wave (introduced in commit `4d8e536`, monetization stack rollout). Spun off as a background task (`task_6cc7559b`) rather than expanded inline, since a clean fix requires threading an `ads-disabled` prop through 3 component layers — broader than T04's stated deliverables (link policy + events).

### T05 — SPA ad-refill fix
- `src/components/ads/ad-unit.tsx`: added `usePathname()`; `<ins>` now keyed `${slot}-${pathname}` so client-side route changes into a reused instance force a fresh DOM node. Push logic now checks `data-ad-status` before pushing (never re-pushes a `'filled'`/`'unfilled'` slot) and schedules exactly one 750ms retry if still unset after the first push attempt — no timer-based/recurring refresh. Existing lazy IntersectionObserver + min-height CLS reservation preserved unchanged.

### Test delta
- 275 tests total (+16 new: `tests/analytics.test.ts` ×10, `tests/calc-funnel.test.ts` ×6).

### Gate results
- `npm run lint`: 0 errors (1 pre-existing warning in `software-application-schema.tsx`, unrelated to this wave)
- `npx tsc --noEmit`: 0 errors
- `npm test`: 275/275 passed
- `npm run build`: 833 pages (unchanged from prior wave), 0 TS errors, 0 new warnings

### DebugView verification — NOT YET RUN (requires a live Vercel Preview deploy)
Per spec §3.4/§6#11, Realtime validation is prohibited; DebugView on a Preview deploy with `NEXT_PUBLIC_GA_DEBUG=1` is the only trustworthy verification surface, and this repo has not been deployed as part of this session (deploy is the orchestrator's responsibility, not this wave). See the DebugView checklist in the structured report for what to verify once deployed.

### Owner action required (see §5 O01–O11 in the spec — none of these were touched)
| Env var | Purpose |
|---------|---------|
| `NEXT_PUBLIC_GA_ID` | GA4 Measurement ID (or `NEXT_PUBLIC_GA_MEASUREMENT_ID` alias) — GA stays fully inert until set. |
| `NEXT_PUBLIC_VERCEL_ENV` | **Must be manually added** in Vercel Project Settings per-environment (`production` for Production; leave unset for Preview/Development) — Vercel's built-in `$VERCEL_ENV` is server-only and does not auto-populate a `NEXT_PUBLIC_` var. GA fails closed without this. |
| `NEXT_PUBLIC_GA_DEBUG` | Set to `1` only on a Preview deployment env for DebugView verification. Never set in Production. |
| `NEXT_PUBLIC_SITE_ID` | Optional; defaults to `'legalcostcalc'` in code. |
| O01–O05, O07, O09, O10 | AdSense-GA4 linking, key-event marking (`calculator_complete`, `result_share`, `email_signup`), custom-dimension registration (`site`, `calc_type`, `link_module`, `link_domain`, `method`), Enhanced Measurement config, Explore reports, GSC verification, cross-domain measurement — all GA4/Search Console/Vercel dashboard tasks, owner-only per spec §3.5/§5. NOT attempted in this session. |

---

## GA4 Wave P1a (T06–T10) — Build Note (2026-07-02)

### Summary
Implemented 부속I GA4 수익지표개선 스펙 §4 T06–T10 (P1a) per the spec at `D:\ClaudeCode\AppFarm\보고서\부속I_GA4수익지표개선_구현스펙.md`, building on the P0 wave (T01–T05). All new `related_click` events flow through the existing `trackEvent()` pipeline from `src/lib/analytics.ts`. legalcostcalc remains `IS_SENSITIVE_SITE=true` — no result values, matter details, or input state in any new link/event.

### T06 — RelatedCalculators at the result moment (INTERNAL sibling links)
- `src/components/seo/related-matters.tsx` (new) — distinct from the existing `src/components/seo/related-calculators.tsx` (the T04 cross-SITE module, unchanged, still `link_type:'crosslink'`). Renders ONLY inside `CostResult` after a user-driven `results` array is set (same `hasUserInteractedRef`-gated state used by T03's `calculator_complete` guard in `cost-calculator.tsx`) — mounted directly below the result card + `ResultDisclaimer`, above `ResultMonetization`'s ad slot, with >=32px separation and visually distinct bordered-card styling (never ad-styled).
- Suggests 3–5 sibling legal-matter categories in the SAME state (never input-derived — keyed only on the current category slug + state code, both non-sensitive route params), filtered through the T09 `hasUniqueData` gate. Every click fires `related_click {link_module:'result_related', link_url}`.
- `src/components/calculator/cost-result.tsx` / `cost-calculator.tsx`: threaded `stateCode`/`stateSlug` props through so `CostResult` can mount `RelatedMatters`.
- `tests/related-matters.test.ts` (new, 4 tests): build-time assertion that every generated href resolves to an existing page in `INDEXABLE_PAGES` across the full 408-page matrix; never suggests the current category; link count bounds (3–5).

### T07 — Hub-and-spoke completion: breadcrumbs + hub pages + 3 automated link types/spoke
- `src/components/seo/breadcrumbs.tsx` (new) — shared visible breadcrumb trail component (`related_click {link_module:'breadcrumb'}` on click), server-rendered `<Link>`s (crawlable without JS). Migrated the plain-`<span>` breadcrumb nav on `/[state]/[slug]`, `/about`, `/contact`, `/compare`, `/settlement-estimator` to this component. `BreadcrumbSchema` (JSON-LD) already existed from a prior wave — its hardcoded `https://legalcostcalc.co` origin was swapped for `CANONICAL_ORIGIN` (see T10) so it's environment-aware everywhere it's used.
- **Hub index pages** (new, both use `generateStaticParams`, 7-day ISR): `src/app/[state]/page.tsx` (51 pages — lists all 8 categories for that state with a real median-cost data table) and `src/app/category/[category]/page.tsx` (8 pages — lists all 51 states for that category with a real median-cost data table). Both draw their listed rows exclusively from `INDEXABLE_PAGES` (T09) — never link a noindexed page. Both carry top+bottom `Disclaimer` (product invariant) and `BreadcrumbSchema`.
- `src/components/seo/hub-links.tsx` (new) — shared data-table component for the two hub pages (real per-row `getModerateMedianCost()` figures — the "unique content" the spec requires, not filler); `related_click {link_module:'hub'}` on row click.
- `src/components/seo/hub-links-bar.tsx` (new) — the spoke page's link to its state hub + category hub (link type #2 of the required 3 automated link types per spoke).
- **Exactly 3 automated link types per spoke** (`/[state]/[slug]/page.tsx`): (1) breadcrumb parent link → state hub (was previously a plain non-link `<span>`, now a real `<Link>` to `/${state.slug}`), (2) `HubLinksBar` → state hub + category hub, (3) `RelatedLinks` sibling cross-links (existing component, retargeted — see below).
- **Internal-link cap fix**: `RelatedLinks`' previous `<details>` "view N more states" expansion rendered all ~40 remaining state links directly in the DOM (not just visually collapsed), which combined with the new hub-bar/breadcrumb links would have pushed the page over the spec's 20-link cap. Replaced it with a single link to the new category hub page (`/category/[category]`, which itself lists all states in a real data table) and reduced `INITIAL_STATES_SHOWN` from 10 to 6. New per-page total: breadcrumb(2) + hub-bar(2) + otherCategories(7) + states(6) + "view all states" hub link(1) = 18, within the 20 cap with headroom.
- `tests/internal-link-cap.test.ts` (new, 2 tests): replicates the exact link-count formula and asserts <=20 template-generated internal links across all 408 (state, category) spoke pages.

### T08 — Comparison-chain module: SKIPPED (not applicable to this repo)
Verified via `find` that this repo has no `/compare/[slug]`-style dynamic comparison-pair routes — `/compare` is a single client-side interactive comparison tool (`src/app/compare/page.tsx`, form-driven `useCompareCosts` hook), not a set of static `x-vs-y` pages. The spec's T08 explicitly scopes to "SaaSCostX (and any other repo with /compare routes)" — legalcostcalc has none. No chain-module or canonicalization work applies here.

### T09 — hasUniqueData thin-page gate
- `src/lib/page-index.ts` (new) — `PAGE_INDEX` / `INDEXABLE_PAGES` computed once at module load from the static seed dataset (`src/data/seed/costs.json`, bundled at build time — no Supabase round-trip needed for sitemap/metadata/static-generation contexts). `hasUniqueData` is derived programmatically (never hand-flagged): true only when a `(state, category)` pair has a moderate-complexity row with `cost_median > 0` AND `sources.length > 0`. Verified: **all 408/408 (state, category) combinations pass** — the full seed dataset has real, sourced data everywhere (confirmed by direct inspection before implementation).
- `src/app/sitemap.ts`: now enumerates `INDEXABLE_PAGES` instead of the raw `STATES x CATEGORIES` cross product (a no-op today since all 408 pass, but structurally correct — a future thin page would drop out automatically), plus the two new hub route sitemaps. Also fixed the hardcoded `https://legalcostcalc.co` `BASE_URL` literal to use `CANONICAL_ORIGIN` (env-aware, see T10). Logs `sitemap: N indexable URLs (X/408 programmatic pages pass hasUniqueData)` in build output (confirmed in this session's build: `408/408`).
- `src/app/[state]/[slug]/page.tsx` `generateMetadata`: added `robots: { index: false, follow: true }` when `hasUniqueData()` is false for that page (currently never triggers, but wired for when new low-data pages are added later).
- T06 (`RelatedMatters`) and T07 (`HubLinks`, hub pages) both filter through `hasUniqueData`/`INDEXABLE_PAGES` — same filtered set as the sitemap, per the spec's consistency requirement.
- `tests/page-index.test.ts` (new, 9 tests): asserts `hasUniqueData` is derived (re-computes independently from the raw JSON and compares), `INDEXABLE_PAGES` contains zero false entries, every indexable path matches the canonical URL shape, `getModerateMedianCost` returns real positive numbers for every indexable page.

### T10 — Title/meta standardization: buildMeta() + explicit canonicals
- `src/lib/seo.ts` (new) — distinct from the pre-existing `src/lib/utils/seo.ts` (legacy FAQ-schema helpers, left untouched). Exports `buildMeta({title, description, path, robots?, skipFit?})` and `fitTitle(core, year?)`. `fitTitle` takes a keyword-first core phrase (e.g. `"Divorce Cost in California"`) and tries a sequence of padded suffixes (`": {year} Attorney Fee Guide"`, `" ({year}) — LegalCostCalc"`, etc.) until the total lands in [50,60] chars, always preserving the core as the literal leading substring (guarantees primary-keyword-in-first-30-chars AND title-matches-H1-lead-phrase simultaneously). A hard-truncate safety net exists but is never exercised by the real dataset (verified by test).
- **`CANONICAL_ORIGIN`** = `NEXT_PUBLIC_APP_URL` (trimmed) or the `https://legalcostcalc.co` fallback — mirrors the pattern already used by `consented-analytics.tsx`'s GA gate. Used by `buildMeta`, `sitemap.ts`, `robots.ts`, and `BreadcrumbSchema` (JSON-LD) so canonical/OG/sitemap/robots/breadcrumb URLs are all sourced from one place and can never resolve to a `*.vercel.app` preview host.
- **Migrated `generateMetadata`/`metadata` to `buildMeta`**: `/[state]/[slug]` (408 pages, full `fitTitle` algorithm — verified all 408 titles land in [50,60] with keyword in first 30 chars), `/[state]` and `/category/[category]` (new hub pages), `/about`, `/contact`, `/compare` (via `compare/layout.tsx`), `/settlement-estimator` (all five via `skipFit: true` with hand-tuned 50–60 char titles matching their existing H1 lead phrases — e.g. About's H1 "About LegalCostCalc" vs. new title "About LegalCostCalc: Our Data Sources & Methodology"). `/privacy` and `/terms` were left untouched (marked DRAFT, pending licensed-attorney review — out of scope for a title-length pass). `/embed/[state]/[slug]` already carries `robots:{index:false,follow:false}` and was left as-is (deliberately non-indexed, not part of the indexable route/dataset matrix).
- `tests/seo-meta.test.ts` (new, 9 tests): `fitTitle` asserted in-range over the FULL 408-page (state × category) matrix (not a sample), keyword-in-first-30-chars over the full matrix, title-starts-with-core over the full matrix, `buildMeta` canonical/OG-url/`skipFit`/robots-override behavior, and an explicit `CANONICAL_ORIGIN` not-`*.vercel.app` assertion.

### Test delta
- 275 tests (P0) → 299 tests (P1a). Added `tests/page-index.test.ts` (9), `tests/seo-meta.test.ts` (9), `tests/related-matters.test.ts` (4), `tests/internal-link-cap.test.ts` (2).

### Gate results
- `npm run lint`: 0 errors (1 pre-existing warning in `software-application-schema.tsx`, unrelated to this wave)
- `npx tsc --noEmit`: 0 errors
- `npm test`: 299/299 passed
- `npm run build`: **892 pages** (833 prior + 51 new `/[state]` hub pages + 8 new `/category/[category]` hub pages), 0 TS errors, 0 new warnings. Build log: `sitemap: 471 indexable URLs (408/408 programmatic pages pass hasUniqueData)`.

### DebugView verification — NOT YET RUN (requires a live Vercel Preview deploy)
The only new events this wave adds are `related_click {link_module:'result_related'|'hub'}` (breadcrumb/inline/compare_chain link_module values already existed from T04). Per spec §3.4/§6#11, verify in DebugView on a Preview deploy with `NEXT_PUBLIC_GA_DEBUG=1`:
- Click a `RelatedMatters` link after a calculation → `related_click {link_module:'result_related', link_url}`.
- Click a state/category hub link from `HubLinksBar` or a hub page's data table → `related_click {link_module:'hub', link_url}`.
- Click the "View all N states" link in `RelatedLinks` → `related_click {link_module:'hub', link_url:'/category/{slug}'}`.
- Confirm no `result_bucket` or input-derived value appears in any of the above (sensitive-site invariant).

### Owner action required
No new env vars or owner console tasks introduced by T06–T10 (all client-side/build-time logic). O01–O11 from the P0 note remain outstanding and untouched.

---

## GA4 Wave P1b+P2 (T11–T17) — Build Note (2026-07-02)

### Summary
Implemented 부속I GA4 수익지표개선 스펙 §4 T11–T17 (P1b/P2) per `D:\ClaudeCode\AppFarm\보고서\부속I_GA4수익지표개선_구현스펙.md`, building on P0 (T01–T05) and P1a (T06–T10). legalcostcalc remains `IS_SENSITIVE_SITE=true` throughout — no input values, matter details, or `result_bucket` in any new event/URL/localStorage key added this wave.

### T11 — E-E-A-T layer
- **Fixed a deceptive-freshness bug**: `src/components/shared/author-byline.tsx`'s `lastUpdated` prop defaulted to `new Date()` when not passed, meaning "Last updated" would silently re-stamp to the current render date on every deploy regardless of whether the underlying data changed — a direct violation of §6 anti-pattern #10 ("misdated 'Updated' badges"). `lastUpdated` is now a required `string | null` prop; callers MUST pass a real verified-data field. The byline's "Last updated" line is omitted entirely (not fabricated) when null.
- `src/app/[state]/[slug]/page.tsx`: `<AuthorByline>` now receives `moderateCost?.lastVerifiedAt ?? null` (the real per-row verified date already in the dataset) instead of nothing.
- New `src/components/shared/updated-badge.tsx` — visible "Updated for {year}" badge next to the H1, reading the SAME `lastVerifiedAt` field (renders nothing when null — never fabricates a year).
- `src/components/seo/software-application-schema.tsx`: added `dateModified` (omitted when the caller passes null/undefined — never `new Date()`) plus `author`/`publisher` Organization JSON-LD linkage. Wired on both the homepage (`DEFAULT_FIGURES_LAST_VERIFIED`) and every `/[state]/[slug]` page (`moderateCost?.lastVerifiedAt`).
- `src/components/seo/organization-schema.tsx`: added `dateModified` (same real source) and a `contributor: {"@type":"Organization", name:"LegalCostCalc Editorial Team"}` entry — deliberately NOT a schema.org `Person` with an invented name/credentials (no-fabrication guardrail; `AuthorByline` already honestly discloses "reviewer pending", no real licensed reviewer exists yet).
- Footer already links "About & Methodology" → `/about` sitewide (pre-existing from P0-adjacent compliance work; `/about` already contains a full Methodology section) — no duplication needed.
- No invented credentials anywhere (manually reviewed all new/changed copy).

### T12 — Instant default result + progressive disclosure: audited, already satisfied
- `/[state]/[slug]/page.tsx` is an async Server Component that server-renders a "Quick answer" block with the REAL moderate-complexity cost range computed from `getCostForPage()` — visible in the initial HTML above the fold, no JS required (pre-existing from an earlier wave, verified still true).
- `CostCalculator` exposes exactly 3 visible inputs (Legal Category, State, Case Complexity selects) + 1 button — within the spec's 3–4 cap; no "Advanced options" accordion needed. `SettlementEstimatorForm` has exactly 3 inputs (gross/pct/costs). Both already satisfy the cap without change.
- The default/SSR render fires no `calculator_complete` (verified: `results` starts `null`, only set inside `runCalculate`, itself gated by `hasUserInteractedRef`).
- `/settlement-estimator` and `/compare` were evaluated but left without an invented default result — unlike the 408 spoke pages (state+category are real, non-arbitrary route params), these two are generic tools with no natural "sensible default" that wouldn't require inventing example numbers; forcing one would risk misleading placeholder figures. Skip-with-reason, consistent with the spec's own firepath exception precedent.

### T13 — Web Vitals → GA4 + ad-ordering fix
- Added `web-vitals` (^5.3.0) as a direct dependency. New `src/components/shared/web-vitals-reporter.tsx` (`onLCP`/`onCLS`/`onINP` → `trackEvent('web_vitals', {metric_name, metric_value, metric_rating, metric_id})`, CLS scaled ×1000 per spec), mounted once in `src/app/layout.tsx` alongside `ConsentedAnalytics`/`AnalyticsInit`. Flows through the same consent-gated `trackEvent()` pipeline — no new script tag.
- **Fixed a real "exactly ONE programmatic unit per page" violation**: `/[state]/[slug]/page.tsx` previously rendered up to THREE separate `<ins class="adsbygoogle">` ad units simultaneously — one standalone `<AdProvider>` ABOVE the calculator (before any result existed, violating "never at the very top of the page" AND "first in-content ad below result block"), one standalone `<AdProvider>` after `RelatedCalculators` near the bottom, PLUS `ResultMonetization`'s own `DisplaySlot` (also `<AdProvider>`) inside `CostResult`. Removed both standalone calls; the page's single ad slot is now exclusively `ResultMonetization`'s `DisplaySlot`, which was already correctly positioned below the result block with reserved min-height + lazy IntersectionObserver loading (T05's `AdUnit` SPA re-init logic untouched).
- Verified ≥150px clearance between the ad slot and any interactive control: `ResultShare`, `ResultDisclaimer`, `RelatedMatters`, and (env-gated) `EmailMyResults` all sit between the result card and the ad slot, giving generous separation; the Calculate button lives in an entirely separate Card far above.

### T14 — IndexNow post-deploy submission
- New `scripts/indexnow.mjs` — two modes: `prebuild` (writes `public/{INDEXNOW_KEY}.txt` for ownership verification; no-op when `INDEXNOW_KEY` unset) and `postbuild` (POSTs the quality-gated URL list to `https://api.indexnow.org/indexnow`, chunked at 10,000, ONLY when `VERCEL_ENV==='production'` AND `INDEXNOW_KEY` is set; every failure mode — missing artifact, network error, non-2xx — is caught/logged, never throws, never fails the build).
- URL list is read directly from the JUST-BUILT `sitemap.xml` (`.next/server/app/sitemap.xml[.body]`) rather than re-deriving state/category slugs from a plain Node script (avoids needing a TypeScript loader to import `.ts` constants from a `.mjs` script) — guarantees the submitted set is always identical to `src/app/sitemap.ts`'s quality-gated output by construction.
- `package.json`: added `"prebuild"`/`"postbuild"` npm lifecycle scripts (auto-invoked by npm around `"build"`). Verified locally: both run and no-op cleanly with no env vars set; `npm run build` completes normally end-to-end.
- `.env.example`: documented `INDEXNOW_KEY` (owner-generated 32-hex key).

### T15 — Shareable result URLs (sensitive-site clean-URL rule)
- New `src/components/shared/result-share.tsx` — "Copy link"/`navigator.share` buttons. **SENSITIVE SITE**: the share target is `${CANONICAL_ORIGIN}${usePathname()}` — the clean category/state (or `/settlement-estimator`) path, with ZERO query-string serialization of any input (unlike the spec's general non-sensitive-site pattern of `?s=<base64>` + hydration, which legalcostcalc explicitly must NOT do). `complexity` (the one calculator input on spoke pages) is deliberately excluded from the shared URL.
- Wired into `CostResult` (gated on `categorySlug` — only renders on an actual `/[state]/[slug]` spoke page, since that's the only place `usePathname()` yields a stable clean category URL) and `SettlementEstimatorForm` (`calc_type: 'settlement_estimator'`).
- `result_share {calc_type, method: 'copy_link'|'web_share'}` fires on click only — never on mount; a cancelled/failed `navigator.share()` does not fire the event.
- No hydrate-from-param step exists (there's nothing to hydrate — the URL never carries state), so T15's "hydrating from param renders but doesn't fire calculator_complete" requirement is structurally satisfied by having no param path at all on this site.

### T16 — localStorage persistence (`useCalculatorPersistence`)
- New `src/lib/hooks/use-calculator-persistence.ts` — versioned (`schemaVersion`), keyed `cc_state_{calcType}`. **Sensitive-site allowlist gate**: every consumer must pass an explicit `allowedFields` list; fields outside it are silently dropped on BOTH write and read (so a value written under a looser historical allowlist can't leak back in later). `CostCalculator` wires exactly `["category", "stateCode", "complexity"]` — the same non-sensitive selector values already exposed in the URL path — under a fixed `"cost_calculator"` storage namespace (stable across category changes, since the category itself is one of the saved fields). No financial/free-text matter-detail field (settlement gross/pct/costs) is in any allowlist this wave — persistence for those stays fully OFF, consistent with "explicit toggle to enable" (no such toggle UI was built, so the safe default is OFF).
- New `src/components/shared/continue-banner.tsx` ("Continue where you left off" + dismiss) and wired into `CostCalculator`. Applying it hydrates the three allowlisted fields and fires `state_restored {calc_type}` — the ONLY call site for that event, never automatic. Does NOT mark `hasUserInteractedRef` or fire `calculator_complete` — the user must still press Calculate (conservative: avoids ever over-firing the key event from a passive restore action).
- New `src/components/shared/recent-calculations.tsx` — homepage "Recent calculations" (max 5, calc_type + date ONLY, zero result values), client-only, renders nothing when empty. Wired into `src/app/page.tsx` below the calculator.
- New `src/components/shared/clear-my-data.tsx` — `clearAllCalculatorData()` wipes every `cc_*` key (saved state, recent list, T02's `cc_traffic_type` marker) in one action; wired into the footer (`variant="link"` to match the existing `ManageConsentLink` dark-theme styling) so it's sitewide and discoverable.

### T17 — Env-gated "Email my results" (transactional-only)
- New `src/app/api/email-results/route.ts` — zod-validated (`email`/`calcType`/`shareUrl`/`marketingOptIn`), per-IP rate-limited (reuses the existing `rateLimitGuard`), forwards to `EMAIL_CAPTURE_ENDPOINT` with `EMAIL_CAPTURE_API_KEY` as a bearer token (server-only, never exposed to the client). `shareUrl` is validated via the existing `isSafeUrl()` (HTTPS-only) before forwarding. **Absent (404) unless ALL THREE are set**: `EMAIL_CAPTURE_ENDPOINT` (server), `NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED==='1'`, AND `NEXT_PUBLIC_POSTAL_ADDRESS` — reusing the SAME CAN-SPAM postal-address gate as the pre-existing marketing `EmailCapture`/`/api/subscribe` (repo guardrail: "both must be set"). Distinct from `/api/subscribe`: this route's ESP payload is tagged `template: 'transactional_result'` and the client copy states "No promotional content — just the estimate."
- New `src/components/shared/email-my-results.tsx` — client-gated the same way (belt-and-suspenders; the server route is the real boundary). A SEPARATE, always-unchecked marketing opt-in checkbox is the only path to `marketing_opt_in: true` being forwarded. On success fires `trackEvent('email_signup', {placement: 'result_card'})` — `email_signup` was already in the `EventName` union from T02. Never gates viewing results behind email (only appears after a result already exists); never stores emails in this app's own DB.
- Wired into `CostResult` (spoke pages) and `SettlementEstimatorForm`.
- Added `zod` (^4.4.3, previously only a transitive dependency via `@supabase/*`) as a direct `package.json` dependency since a server route now imports it explicitly.

### Test delta
- 299 tests (P1a) → 334 tests (P1b+P2). New files: `tests/indexnow.test.ts` (6, subprocess-based — exercises the real CLI script without a live network call), `tests/result-share.test.ts` (5), `tests/calculator-persistence.test.ts` (8), `tests/email-results.test.ts` (16).

### Gate results
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (1 pre-existing warning in `software-application-schema.tsx`, unrelated to this wave — carried over from P1a's note)
- `npm test`: 334/334 passed
- `npm run build`: 892 pages (unchanged page count from P1a — this wave added no new routes besides `/api/email-results`), 0 TS errors, 0 new warnings. `prebuild`/`postbuild` (T14) both ran and no-op'd cleanly with no `INDEXNOW_KEY`/`VERCEL_ENV` set locally.

### DebugView verification — NOT YET RUN (requires a live Vercel Preview deploy)
Per spec §3.4/§6#11, Realtime validation is prohibited. New/changed events this wave, to verify in DebugView on a Preview deploy with `NEXT_PUBLIC_GA_DEBUG=1`:
- `web_vitals {metric_name, metric_value, metric_rating, metric_id}` — fires automatically as CWV metrics settle on any page.
- `result_share {calc_type, method:'copy_link'}` — click "Copy link to this result" after a calculation on a spoke page or the settlement estimator.
- `result_share {calc_type, method:'web_share'}` — click "Share" on a device/browser exposing `navigator.share` (button is conditionally rendered only when the API exists).
- `state_restored {calc_type}` — reload a spoke/homepage calculator after a prior calculation, confirm the "Continue where you left off" banner appears, click it, confirm the event fires exactly once and inputs are restored.
- `email_signup {placement:'result_card'}` — ONLY testable once `EMAIL_CAPTURE_ENDPOINT` + `NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED=1` + `NEXT_PUBLIC_POSTAL_ADDRESS` are all set on the preview env (all three are currently unset — form is absent from the DOM, verified via the env-gate unit tests instead).
- Confirm zero `result_bucket` or input-derived value in any of the above (sensitive-site invariant) — verified structurally via `tests/result-share.test.ts` and the allowlist tests in `tests/calculator-persistence.test.ts`, but a live DebugView payload inspection is the spec's required final confirmation.

### Owner action required (see §5 O01–O11 in the spec — none touched this session)
| Env var | Purpose |
|---------|---------|
| `INDEXNOW_KEY` | Owner-generated 32-hex key (e.g. `openssl rand -hex 16`). Enables T14's key-file serving + Bing/Yandex/Naver submission. Both steps are no-ops until set. |
| `EMAIL_CAPTURE_ENDPOINT` / `EMAIL_CAPTURE_API_KEY` / `NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED` | T17 — ESP wiring per O11 (provision MailerLite/Buttondown, configure double opt-in + SPF/DKIM, THEN set these). `NEXT_PUBLIC_POSTAL_ADDRESS` (existing var, T17 also requires it) must already be set from the compliance workstream. |
| O01–O05, O07, O09, O10 | Unchanged from prior waves — AdSense-GA4 linking, key-event marking, custom-dimension registration (add `metric_name`, `metric_rating` to the T13 web_vitals dimensions if not already covered by the P0 list), Enhanced Measurement, Explore reports, GSC verification, cross-domain measurement. NOT attempted in this session (owner-only per spec §3.5/§5). |
| O01–O05, O07, O09, O10 | AdSense-GA4 linking, key-event marking (`calculator_complete`, `result_share`, `email_signup`), custom-dimension registration (`site`, `calc_type`, `link_module`, `link_domain`, `method`), Enhanced Measurement config, Explore reports, GSC verification, cross-domain measurement — all GA4/Search Console/Vercel dashboard tasks, owner-only per spec §3.5/§5. NOT attempted in this session. |

## P0 - Ad Revenue Maximization: Audits (K02-K05) + Reviewer Byline (K06) + Divorce Hub (K07) (2026-07-03)

### Summary
Implements the ad-revenue-maximization spec's section 9 tasks K02, K03, K04,
K05 (wave P0-AUDITS, in that order), K06 (YMYL reviewer byline infra), and
K07 (July seasonal build queue priority #2: divorce-cost-by-state hub). K01,
K08-K11 are explicitly OUT OF SCOPE for this wave. No AdSense loader, Auto-ads
state, ads.txt, or ad-push semantics were touched - audits only, plus one new
additive page and one new env-gated byline slot.

### K03 - Ad/search crawler accessibility audit (code-side)
Grepped `middleware.ts`, `next.config.ts`, `src/lib/utils/api-security.ts`
(the only rate limiter in the repo), and all of `src/` for any UA-based
gating, bot-challenge, WAF/firewall, or CAPTCHA logic. Result: no bot-gating
code path exists anywhere in this repo.
- `middleware.ts` only sets a non-blocking geo cookie (`visitor_country`) and
  explicitly excludes `api|_next/static|_next/image|favicon.ico|ads.txt|robots.txt|sitemap.xml|opengraph-image`
  from its matcher - it never inspects or filters by User-Agent, and never
  returns a non-200/redirect response.
- `src/lib/utils/api-security.ts`'s `checkRateLimit`/`rateLimitGuard` (60
  req/min per IP) is wired ONLY into `/api/contact`, `/api/costs`,
  `/api/costs/compare`, `/api/email-results`, `/api/feedback`,
  `/api/subscribe` - none of which are crawler-facing surfaces (ads.txt,
  page routes, sitemap.xml are all untouched by it).
- `robots.ts` allows `/` for all UAs, disallows only `/api/`.
- `src/app/ads.txt/route.ts` serves unconditionally (no UA check) - either
  the AdSense publisher line or a redirect to `NEXT_PUBLIC_ADSTXT_REDIRECT_URL`
  when set, never a 4xx/challenge.
- No `vercel.json` exists in the repo (confirmed via directory listing), so
  no Vercel-level firewall/bot-challenge config is in play either.
- The live curl checks (Mediapartners-Google/AdsBot/Googlebot -> 200) already
  passed at the orchestrator level per the task brief; this audit found
  nothing in the codebase that could contradict that at the code level.
- No changes made (nothing to whitelist - there is no gate to widen).

### K04 - SPA re-initialization / refresh-adjacency audit
Traced every ad push/init call site: `src/components/ads/ad-unit.tsx` is the
ONLY place `window.adsbygoogle.push({})` is called in the repo (confirmed via
repo-wide grep). Its push-triggering `useEffect` dependency array is
`[client, active, pathname]`, and the `<ins key={slot-pathname}>` remount key
is ALSO pathname-only - so a push can only ever be triggered by a real route
change, never by any other state transition. Verified this holds for every
interactive path in the two calculator surfaces that render an ad slot
(`CostCalculator` -> `CostResult` -> `ResultMonetization` -> `DisplaySlot` ->
`AdProvider` -> `AdUnit`, used on `/` and `/[state]/[slug]`;
`SettlementEstimatorForm` was also checked and has ZERO ad call sites):
- Recalculation (`runCalculate`/`handleCalculate` in `cost-calculator.tsx`,
  `runCalculate` in `settlement-estimator-form.tsx`): only sets local React
  state (`results`/`output`) - never touches `pathname`, never remounts
  `AdUnit`. No re-push.
- Category/state/complexity select toggles: `onValueChange` handlers only
  call `setCategory`/`setStateCode`/`setComplexity` - same as above, no
  pathname involvement.
- localStorage-restore re-render (`handleApplySavedState` ->
  `persistence.restore()` in `use-calculator-persistence.ts`): applies saved
  fields via `setCategory`/`setStateCode`/`setComplexity` only; fires
  `state_restored` but never touches the URL, router, or pathname.
- Share-URL / `history.replaceState`: repo-wide grep for
  `replaceState|window.history` found matches ONLY in unrelated files
  (privacy page copy, TermsGate/consent-banner localStorage,
  `clear-my-data.tsx`, `recent-calculations.tsx`, `lib/analytics.ts`,
  `use-calculator-persistence.ts`) - zero matches in any ad, calculator, or
  share component. `ResultShare` (`src/components/shared/result-share.tsx`)
  reads `usePathname()` only to build a copy-link URL; it never calls
  `router.push`/`replaceState`, so a share action cannot trigger a pathname
  change or an ad re-push.
- Tabs/accordions: no tab or accordion UI exists in either calculator
  (`CostCalculator`/`SettlementEstimatorForm` are flat forms; no
  `Tabs`/`Accordion` primitive is used on either page).
- This structural guarantee was already fully in place before this wave (see
  the ad-unit.tsx docstring and the T13 comments in
  `src/app/[state]/[slug]/page.tsx`, which record a PRIOR wave removing two
  standalone `<AdProvider>` call sites specifically to enforce "exactly ONE
  programmatic ad unit per page, placed only below the result"). No code
  changes were needed - added `tests/ad-proximity.test.ts` (new) covering
  the CostCalculator/SettlementEstimatorForm structural guarantee as
  regression coverage (this test file's primary purpose is K05, see below,
  but its "no ad marker in pre-calculation render" assertions double as K04
  evidence that no ad exists to erroneously re-push in the first place).

### K05 - Ad-proximity ("no accidental click") audit
Verified via `tests/ad-proximity.test.ts` (new, 4 tests, all passing):
1. In `CostResult`'s SSR output, the `adsbygoogle` marker only ever appears
   AFTER "Estimated Total Cost" (the result content) - never before it.
2. `ResultMonetization`'s wrapper carries `mt-8 space-y-6`, and its
   `DisplaySlot` reserves `min-h-[90px]` (mobile) / `min-h-[250px]` (sm:+) -
   a real, non-zero spacing+reservation buffer well over the spec's ~150px
   guidance, verified structurally rather than just visually.
3. `CostCalculator`'s pre-calculation render (inputs + "Calculate Cost"
   button) contains zero ad markers - `CostResult`/`ResultMonetization`
   aren't even mounted until a result exists.
4. `SettlementEstimatorForm` (its own "Estimate My Net" button) has zero
   `AdUnit`/`AdProvider` call sites at all - confirmed via source grep, so
   there is no proximity risk on `/settlement-estimator` regardless of
   Auto-ads configuration.
- Added a passive `data-ad-exclusion-zone="calculator-widget"` DOM attribute
  (no visual/behavioral change) to the inputs+button `Card` in both
  `cost-calculator.tsx` and `settlement-estimator-form.tsx`, and wrote
  `docs/ad-exclusion-zones.md` documenting the selector for the owner to
  register in AdSense Auto ads' page-level CSS-selector exclusion tool
  (console action - not performed here).

### K02 - Indexable page-depth audit
Baseline (BEFORE this wave's K07 addition): 471 indexable URLs - 408
`/[state]/[slug]` spokes (all 408/408 state x category pairs pass
`hasUniqueData`, confirmed by `tests/page-index.test.ts`'s existing coverage
log and by direct inspection of `costs.json`: every row has a real
`cost_median > 0` and a non-empty `sources[]`), 51 state hubs, 8 category
hubs, and 4 static pages (home, compare, about, embed) - well above the
15/site benchmark cited in the spec, and confirmed via a real `npm run build`
(`sitemap.ts`'s own `console.log` line). Zero `hasUniqueData=false` pages
exist in this repo - there is no borderline-page backlog to upgrade with real
data (every state x category pair already has sourced simple/moderate/complex
rows). AFTER this wave: 472 indexable URLs (+1, the new
`/divorce-cost-by-state` hub added for K07 below) - confirmed by a second
`npm run build` run: `sitemap: 472 indexable URLs (408/408 programmatic pages
pass hasUniqueData)`.

### K06 - YMYL reviewer-byline infra (env/config-driven)
New `src/lib/reviewer.ts` - `getReviewerConfig()` reads
`NEXT_PUBLIC_REVIEWER_NAME` (+ optional `NEXT_PUBLIC_REVIEWER_CREDENTIALS`),
returns `null` when unset/blank (no fabrication). Wired into:
- `src/components/shared/author-byline.tsx` - when a reviewer is configured,
  renders "Reviewed by {name}[, {credentials}]"; when unset, renders the
  EXACT SAME "(legal reviewer pending)" placeholder copy as before this wave
  (verified byte-for-byte via `tests/reviewer.test.ts`'s AuthorByline
  render-gate tests).
- `src/components/seo/organization-schema.tsx` - when configured, adds a
  `reviewedBy` schema.org `Person` entry alongside the existing (unchanged)
  `contributor: Organization` entry; when unset, the JSON-LD graph is
  byte-identical to before this wave.
- Documented both env vars in `.env.example` with an explicit no-fabrication
  warning (real reviewer sourcing is an owner action - this wave only wires
  the render path).
- New `tests/reviewer.test.ts` (10 tests): env-unset defaults, env-set exact
  passthrough (never transformed/invented), whitespace handling, and
  component-level render-gate assertions on `AuthorByline`.

### K07 - divorce-cost-by-state hub (July seasonal build queue, priority #2)
New static route `src/app/divorce-cost-by-state/page.tsx`:
- Tool-intent title: "Divorce Cost by State Calculator" (verified it contains
  "Calculator" and does not start with "what is" - the anti-pattern the spec
  explicitly bans).
- All-51-state comparison table (`src/components/seo/divorce-hub-table.tsx`,
  new): every row's uncontested/contested figures are the REAL `simple`/
  `complex` complexity-tier `cost_median` values from `costs.json` via a new
  `getCostByComplexity()` helper added to `src/lib/page-index.ts` - no
  interpolation, no invented numbers (verified in `tests/divorce-hub.test.ts`
  by spot-checking 5 states' rendered figures against the real seed values).
  Framed as simple=uncontested vs. complex=contested, matching the complexity
  semantics already used sitewide (the same selector on every spoke page's
  calculator).
- UPL-safe copy: disclaimer top+bottom intact (`Disclaimer` component, same
  as every other page), no advice-verb language anywhere on the page
  (`tests/divorce-hub.test.ts` asserts against "you should", "we recommend",
  "you need to", "will win", "guaranteed", etc.) - editorial copy explicitly
  states "This is general cost information only, not legal advice."
- Links to existing state spokes: every row links to the real,
  already-indexable `/[state]/divorce-cost` page.
- K06 integration: renders `AuthorByline`/`UpdatedBadge` using
  `DEFAULT_FIGURES_LAST_VERIFIED` (the same real dataset-verification date
  used sitewide) - never a fabricated freshness stamp.
- Added to `src/app/sitemap.ts` (priority 0.8, weekly) - confirmed present in
  the real build output as a static route.
- Cross-linked from every divorce spoke page's `HubLinksBar`
  (`src/components/seo/hub-links-bar.tsx` - new conditional third link,
  divorce-category-only, verified NOT to appear on non-divorce spokes).
- New supporting client components: `src/components/seo/divorce-hub-table.tsx`,
  `src/components/seo/divorce-hub-faq-link.tsx` (both follow the existing
  `HubLinks`/`Breadcrumbs` "server page + thin client wrapper for click
  tracking" pattern already used sitewide).
- New `tests/divorce-hub.test.ts` (11 tests).
- Does NOT touch `/category/divorce` (the existing generic per-category hub)
  - the new page is additive, framed differently (uncontested/contested vs.
  a single moderate-median column), and both stay live with distinct
  canonical URLs (no duplicate-content risk: different H1, different table
  columns, different copy).
- No new FAQ schema.org markup added (FAQ rich results ended per the spec -
  the FAQ section on this page is plain content, not JSON-LD).

### Test delta
- 350 tests (F10 baseline before this wave) -> 364 tests. New files:
  `tests/ad-proximity.test.ts` (4), `tests/reviewer.test.ts` (10),
  `tests/divorce-hub.test.ts` (11).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (1 pre-existing warning in
  `software-application-schema.tsx`, unrelated to this wave, carried over
  from prior waves' notes)
- `npm test`: 364/364 passed
- `npm run build`: succeeded, 472 indexable sitemap URLs (up from 471),
  `/divorce-cost-by-state` built as a static route, no new TypeScript errors,
  no new warnings.

### Not touched (guardrails)
No AdSense loader/script, `ads.txt` route logic, Auto-ads console state, or
any ad-push/init semantics were modified. `AdProvider`'s single-network
invariant, the pathname-only re-init guard, and the below-result-only
placement are unchanged - this wave only added test coverage and
documentation confirming they already hold, plus one passive DOM marker
attribute. No commit/deploy performed (orchestrator-owned).

## K01 - On-Page Editorial Depth for Indexable Calculator Pages (2026-07-03)

### Summary
Implements K01 (the #1 approval lever, explicitly out of scope for the prior
P0-AUDITS wave): entity-level on-page editorial depth for every indexable
`/[state]/[slug]` spoke (408/408 pages passing `hasUniqueData`, 51 states x 8
categories). Adds a "How [Category] Costs Work" section, a per-state WORKED
EXAMPLE interpolated from the page's own real `costs.json` data, and a
VISIBLE (rendered `<dt>`/`<dd>` text, not JSON-LD-only) FAQ section reusing
the FAQ question/answer pairs the page already computes for `FaqSchema`.

### New: `src/components/seo/category-editorial.tsx`
Server component, zero client JS. Renders three sections below the
calculator/result area (after `RelatedCalculators`, before the bottom
`Disclaimer` — LCP and the calculator's ad-exclusion zone are unaffected):
1. **How [Category] Costs Work** — per-CATEGORY entity-level editorial from
   the new `categoryInfo.costFormationNotes` field (see below). Only this
   category's real cost-formation mechanics — never a noun-swapped template.
2. **Worked Example: [Category] in [State]** — built entirely from the
   page's own `costs` prop (the same `LegalCostData[]` the page already
   fetches via `getCostForPage`): median/low/high cost, an hourly-rate ->
   implied-billable-hours calculation, typical duration, top common fees,
   and a simple-vs-complex comparison. Every figure is read directly from
   the page's real data — nothing interpolated or invented. Renders nothing
   (no fabricated placeholder) when there is no moderate-complexity row.
3. **Frequently Asked Questions** — the SAME `faqQuestions` array the page
   already builds for `FaqSchema`'s JSON-LD, now ALSO rendered as visible
   `<dt>`/`<dd>` text. Previously this FAQ content existed only inside the
   invisible `<script type="application/ld+json">` block — a real content-
   depth gap for AdSense's "low-value tool-UI-only page" reviewer signal.
   4-6 questions per page (4 shared + up to 2 category-specific).

Component returns `null` (renders nothing) when there is no cost data AND no
`costFormationNotes` — no-fabrication guard, consistent with the rest of the
codebase's pattern (e.g. `CostDetailsSection`'s existing conditional guard).

### New: `categoryInfo.costFormationNotes` (`src/lib/types/category.ts`,
`src/lib/constants/categories.ts`)
Added a `costFormationNotes: string[]` field to `CategoryInfo` and populated
it with 2 distinct paragraphs per category (all 8: divorce, DUI, personal
injury, bankruptcy, real estate closing, estate planning/probate, criminal
defense, immigration) describing how THAT category's costs actually form —
e.g. divorce's contested-vs-uncontested + discovery/mediation/expert-witness
cost drivers; DUI's attorney-fee vs. non-attorney-cost (fines, interlock,
insurance) split; personal injury's contingency-fee mechanics; bankruptcy's
Chapter 7 vs. 13 billing difference; real estate's title/closing cost
stack; estate planning's pre-death-flat-fee vs. post-death-probate-billing
split; criminal defense's charge-severity/plea-vs-trial cost driver;
immigration's attorney-fee vs. federal-USCIS-fee split. Verified
programmatically (test) that no two categories share any text and that each
category's notes reference concepts specific to that practice area (e.g.
"BAC"/"ignition interlock" only in DUI, "USCIS"/"green card" only in
immigration) - this is the anti-scaled-content-trap guardrail from the spec.

### Wired into `src/app/[state]/[slug]/page.tsx`
Added `<CategoryEditorial categoryInfo stateInfo costs faqQuestions />`
after `RelatedCalculators` and before the final bottom `Disclaimer` -
reuses the page's existing `costs` and `faqQuestions` values rather than
recomputing or duplicating any data source. No other section was
restructured; `CostDetailsSection`, `HubLinksBar`, `RelatedLinks`,
`RelatedCalculators`, and both `Disclaimer` instances are unchanged.

### Word-count verification (`tests/category-editorial.test.ts`, 11 tests)
Since this repo's Supabase-backed cost data (`getCostForPage`) is not
reachable during a local build (see prior session's local-dev-quirks note -
`/[state]/[slug]` pages render their Supabase-dependent sections, including
the pre-existing `CostDetailsSection`, as empty-state copy in a local
`npm run build`), the word-count assertion targets `CategoryEditorial`
directly with REAL data drawn straight from `src/data/seed/costs.json` (the
same dataset the production Supabase table is seeded from) rather than
through the full page + a mocked network layer. This is the same
"seed-data-as-source-of-truth" pattern `tests/page-index.test.ts` and
`tests/divorce-hub.test.ts` already use. Confirmed via direct build-output
inspection that the "How Costs Work" and FAQ sections (both independent of
Supabase - they read only `categoryInfo` and template-derived FAQ text) DO
render correctly in the actual `.next` server HTML output for
`/alabama/divorce-cost`; the Worked Example section correctly renders
nothing in that same local build because `costs` is empty there (the
pre-existing Supabase-unreachable-locally condition, not a regression -
`CostDetailsSection`'s pre-existing "Common Fees"/"Attorney Hourly Rate"
sections are equally absent in the same local HTML for the same reason).
Assertions:
- Every category, rendered for a representative state (California) with its
  full real seed dataset, produces >= 400 words of visible text.
- A low-population state (Wyoming) also clears 400 words.
- Worked-example dollar figures match `formatCurrency` of the real
  `cost_median`/`cost_low`/`cost_high` seed values exactly, for 5 sampled
  (state, category) pairs.
- FAQ text renders as visible `<dt>`/`<dd>`, count is 4-6 per page.
- No advice-verb/outcome-prediction language (`you should`, `we recommend`,
  `guaranteed`, `will win`, etc.) appears in any category's rendered output.
- Tool-intent, distinct H2s ("How Divorce Costs Work", "Worked Example:
  Divorce in California", "Frequently Asked Questions") - not generic labels.
- Full 51-state x 8-category real-data coverage sweep renders without
  throwing for every pair that has seed data.

### Test delta
- 364 tests (P0-AUDITS baseline) -> 375 tests. New file:
  `tests/category-editorial.test.ts` (11).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (1 pre-existing warning in
  `software-application-schema.tsx`, unrelated, carried over from prior
  waves)
- `npm test`: 375/375 passed
- `npm run build`: succeeded, 472 indexable sitemap URLs (unchanged - K01 is
  depth-only, no new pages, no `hasUniqueData` gate changes), all 408
  `/[state]/[slug]` static pages generated successfully.

### Not touched (guardrails)
No AdSense loader/script, ad-push/init semantics, `hasUniqueData` gate logic,
disclaimer copy/placement, or any compliance component were modified. No
new FAQ JSON-LD schema was added (the existing `FaqSchema` JSON-LD is
untouched - this wave only adds the human-visible rendering of the same
question/answer content, per the spec's "FAQ JSON-LD optional/harmless"
guidance). No commit/deploy performed (orchestrator-owned).

## Wave P1 - Discover Hygiene (K09) + Journey Ad Provider (K10) + Day-1
Runbook (K11) (2026-07-03)

### Summary
Implements the ad-revenue-maximization spec's section 9 tasks K09, K10, and
K11 for this repo. K06 (YMYL reviewer-byline infra) and K07 (July seasonal
build queue priority #2: divorce-cost-by-state hub) were verified
**already fully implemented and gate-green** in the prior P0 wave (see
"P0 - Ad Revenue Maximization" note above) - re-audited this wave and found
no regressions, no further changes needed, nothing re-done. K01-K05, K08 are
explicitly out of scope for this wave. No AdSense loader, Auto-ads state,
ads.txt, or ad-push semantics were touched.

### K06/K07 re-audit (no changes - confirming prior wave still holds)
- K06: `src/lib/reviewer.ts`'s `getReviewerConfig()` still gates
  `NEXT_PUBLIC_REVIEWER_NAME`/`NEXT_PUBLIC_REVIEWER_CREDENTIALS` correctly
  (unset -> honest "(legal reviewer pending)" placeholder; both env vars
  documented in `.env.example` with an explicit no-fabrication warning).
  `tests/reviewer.test.ts` (10 tests) still passing.
- K07: `/divorce-cost-by-state` still builds as a static route in the
  sitemap (472 indexable URLs, same as the prior wave's post-K07 count),
  still uses real `getCostByComplexity()` simple/complex seed-data lookups
  (no interpolation), still UPL-safe (disclaimer top+bottom, no advice-verb
  language), still tool-intent titled ("Divorce Cost by State Calculator").
  `tests/divorce-hub.test.ts` (11 tests) still passing. This wave's only
  *addition* to the K07 surface is the new OG image
  (`src/app/divorce-cost-by-state/opengraph-image.tsx`, part of K09 below)
  - the page content/copy/data itself is untouched.

### K09 - Discover hygiene
Two-part requirement: (1) `max-image-preview:large` robots directive on all
indexable pages, and (2) hub/insight pages get a >=1200px-wide, 16:9-ish OG
image built from real dataset figures.

**Part 1 - robots meta directive**:
- `src/app/layout.tsx`'s root `metadata.robots` now sets
  `"max-image-preview": "large"` alongside the existing `index: true, follow:
  true` - this is the sitewide default every page inherits UNLESS it passes
  its own explicit `robots` override (Next.js's `Metadata.robots` does NOT
  deep-merge across route segments - a child route's explicit robots object
  REPLACES the parent layout's entirely rather than merging with it).
- `src/lib/seo.ts`'s `buildMeta()` - the single helper nearly every route's
  metadata goes through - now injects `"max-image-preview": "large"` into
  ANY explicit `robots` override a caller passes (e.g. the T09 thin-page
  `noindex,follow` gate on `/[state]/[slug]` when `hasUniqueData` is false),
  so that override doesn't silently lose Discover-eligibility by replacing
  the layout's robots block. A caller-supplied `max-image-preview` value
  still wins if one is explicitly passed (verified in
  `tests/seo-meta.test.ts`'s new "caller intent takes precedence" test).
  `BuildMetaParams.robots` was narrowed from `Metadata["robots"]` (which
  includes the `string` shorthand form) to the object-only subtype so the
  merge is type-safe without a runtime check - every real call site in this
  repo already passes an object.
- `src/app/embed/[state]/[slug]/page.tsx`'s hand-rolled `noindex,nofollow`
  override (doesn't route through `buildMeta`) also now explicitly carries
  `"max-image-preview": "large"` for consistency, though it's a no-op in
  practice since the route is never crawled/indexed.
- Audited every other metadata call site: `/about`, `/category/[category]`,
  `/compare`, `/contact`, `/divorce-cost-by-state`, `/settlement-estimator`,
  `/[state]` all route through `buildMeta()` and pass no robots override
  (inherit the layout default as-is). `/`, `/embed`, `/privacy`, `/terms`
  hand-roll a `Metadata` object but declare no `robots` field, so they also
  inherit the layout default untouched.

**Part 2 - new OG images for hub/insight pages** (next/og `ImageResponse`,
edge runtime, matching the existing site pattern in
`src/app/opengraph-image.tsx` / `src/app/[state]/[slug]/opengraph-image.tsx`
- teal brand tokens, 1200x630, no purple/blue gradients):
- `src/app/[state]/opengraph-image.tsx` (new) - state-hub OG image. Key stat
  is the REAL median across that state's own indexable category costs,
  computed from `INDEXABLE_PAGES` + `getModerateMedianCost()` (the same
  source of truth `/[state]/page.tsx` itself renders from) - no fabricated
  or interpolated figures.
- `src/app/category/[category]/opengraph-image.tsx` (new) - category-hub OG
  image. Key stat is the REAL nationwide median across all 51
  states' costs for that category, same data source as the hub page.
- `src/app/divorce-cost-by-state/opengraph-image.tsx` (new) - K07 hub OG
  image. Shows the REAL uncontested (simple) vs. contested (complex)
  nationwide medians side by side, via `getCostByComplexity()` - matching
  the page's own uncontested/contested framing exactly.
- New `tests/k09-discover-hygiene.test.ts` (24 tests): robots-directive
  source audit (layout default, buildMeta merge behavior, the T09 noindex
  override, the embed noindex override, and confirmation that hand-rolled
  metadata objects declare no shadowing robots field) + OG-image source
  audit for all three new routes (1200x630 size, edge runtime, next/og
  import, real-data source calls, teal brand token, no forbidden
  purple/blue-gradient/pure-black tokens per `design/forbidden.md`).
- Updated `tests/seo-meta.test.ts`'s pre-existing "applies the robots
  override" test to assert the new merged shape (was a breaking assertion
  change caused intentionally by this wave's `buildMeta()` behavior change -
  not a bug fix to a failing test, a spec-required behavior change) and
  added a new test confirming an explicit caller-supplied
  `max-image-preview` still overrides the K09 default.

### K10 - AdProvider `journey` option (dormant)
Added `"journey"` as a fifth member of the `AdProvider` union
(`"adsense" | "ezoic" | "raptive" | "journey" | "none"`) in
`src/lib/monetization.ts`:
- `parseAdProvider()` now recognizes `"journey"` (falls back to `"adsense"`
  for any other unrecognized value, same as before).
- New `journeySiteId: string | null` field on `MonetizationConfig`, read
  from `NEXT_PUBLIC_JOURNEY_SITE_ID` (null when unset, same pattern as
  `raptiveSiteId`/`ezoicScriptSrc`).
- `src/components/monetization/AdProvider.tsx` - new `JourneySlot`
  component, copied structurally from the existing `EzoicSlot`/`RaptiveSlot`
  pattern (same `IntersectionObserver` lazy-load gate, same
  `min-h-[90px] sm:min-h-[250px]` CLS-safe reservation, same idempotent
  `injectScript()` helper - no new script-injection code path, reuses the
  existing one). Renders nothing when `NEXT_PUBLIC_JOURNEY_SITE_ID` is
  unset. Wired into `AdProvider`'s provider switch alongside the existing
  ezoic/raptive branches - the switch structure itself already guarantees
  the single-provider invariant (exactly one `if (provider === ...)` branch
  can match, since `parseAdProvider()` returns exactly one value from a
  mutually exclusive union), so `journey` inherits that guarantee for free
  rather than needing new isolation logic.
- Documented `NEXT_PUBLIC_JOURNEY_SITE_ID` in `.env.example` with an
  explicit "DO NOT set until ~1,000 real sessions/month" eligibility note
  (부속M §6, verified 2026-01-15 threshold) and the same
  never-loads-alongside-another-provider invariant language as the other
  three network blocks. Updated the `NEXT_PUBLIC_AD_PROVIDER` valid-values
  comment to include `journey`.
- Extended `tests/monetization.test.ts` (existing file, +8 tests): journey
  recognized by `parseAdProvider`, `journeySiteId` null-when-unset and
  reads-when-set, `NEXT_PUBLIC_AD_PROVIDER=journey` config round-trip, and
  the single-provider-invariant `describe` block updated to check all five
  providers (was four) plus a new explicit "journey never coexists with
  another provider" assertion.
- No render-level test was added for `AdProvider.tsx` itself (matching the
  pre-existing pattern - Ezoic/Raptive are also only unit-tested at the
  `parseAdProvider`/config layer, never at the component-render layer; the
  closest existing component-level ad coverage is `tests/ad-proximity.test.ts`,
  which tests the AdSense/`AdUnit` path specifically and was left
  unchanged).

### K11 - AdSense Day-1 runbook
New `docs/adsense-day1.md` - faithfully transcribes 부속M §3 ("승인 후 첫
90일 설정 시퀀스") for this repo, following the exact structure/tone already
established in the sibling `firepath`/`SaaSCostX`/`DentalCostFinder`/
`LaunchCostCalc` repos' versions of this same doc from their own P1 waves
(read all four as reference before writing this one; DentalCostFinder's -
also YMYL - was the closest structural analog). Contents: the 2026 Auto ads
default-change context (vignette triggers 3/9, load-slider removal 4/16,
dynamic-anchor 6/19, ad-intents Gemini insertion 6/30 no-opt-out), the Day-1
settings audit (vignette additional-triggers off + YMYL full-OFF override,
ad intents off, anchor mobile-on/bottom-only + >1000px off, banner max-2 +
generous spacing, ad-exclusion-area registration referencing this repo's
own `docs/ad-exclusion-zones.md` selectors, side rails OK), Week-1 CLS
recheck (referencing this repo's real `WebVitalsReporter` `web_vitals` GA4
event), Month-1 Auto-only, Month-2-3 single manual slot gated on two clean
Policy Center weeks (referencing this repo's real `ResultMonetization`/
`AdProvider` below-result placement and `tests/ad-proximity.test.ts`),
Experiments-off-90-days, the IVT house rules (never render live ads
logged-in, never ask anyone to look at the site, never buy/exchange
traffic, don't react to "being assessed" serving limits), and the rollback
trigger (`calculator_complete` -10-15% => revert immediately, referencing
this repo's real GA4 instrumentation from 부속I T03/T13). All figures/event
names/file references are this repo's real ones (`ad-exclusion-zones.md`'s
actual selector, `WebVitalsReporter`, `calculator_complete`, the real
`ResultMonetization`/`CostResult` placement chain) - no invented specifics.
Pure documentation, no code path - not unit-tested, consistent with
`docs/ad-exclusion-zones.md` (K05) also being untested directly.

### Test delta
- 375 tests (K01 wave baseline) -> 408 tests. New file:
  `tests/k09-discover-hygiene.test.ts` (24). Extended:
  `tests/monetization.test.ts` (+8), `tests/seo-meta.test.ts` (+1 net: 1
  existing test's assertion updated for the new merge behavior, 1 new test
  added).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors (required narrowing `BuildMetaParams.robots`
  from `Metadata["robots"]` to `Exclude<Metadata["robots"], string | null>`
  to fix a "spread types may only be created from object types" error
  introduced by the K09 merge - the underlying `Metadata.robots` type
  permits a string-shorthand form that no real call site in this repo uses)
- `npm run lint`: 0 errors (1 pre-existing warning in
  `software-application-schema.tsx`, unrelated to this wave, carried over
  from prior waves' notes)
- `npm test`: 408/408 passed
- `npm run build`: succeeded, 472 indexable sitemap URLs (unchanged - K09/
  K10/K11 add zero new indexable pages; the three new OG image routes are
  image-generation endpoints, not pages), three new OG image routes
  confirmed in build output (`/[state]/opengraph-image`,
  `/category/-/opengraph-image` (bundle path for the dynamic
  `/category/[category]/opengraph-image`), `/divorce-cost-by-state/opengraph-image`),
  no new TypeScript errors, no new warnings beyond the pre-existing one.

### Not touched (guardrails)
No AdSense loader/script, `ads.txt` route logic, Auto-ads console state, or
any ad-push/init semantics were modified. `AdProvider`'s single-network
invariant is preserved and extended (not weakened) by adding a fifth
mutually-exclusive option. K01-K05 (editorial depth, page-depth audit,
crawler accessibility, SPA re-init audit, ad-proximity audit) and K08
(IndexNow) were not touched this wave. No commit/deploy performed
(orchestrator-owned).

---

## Wave A — U-01, U-04, U-06 (부속U GA4 근본진단 개선스펙)

Source of truth: `D:\ClaudeCode\AppFarm\보고서\부속U_GA4근본진단_개선스펙.md` §4
(U-01/U-04/U-06 사양+수용기준), §5 (legalcostcalc parameter row), §7
(guardrails). GA4 ground truth this wave responds to: 481 page_view -> 6
calc_input_start (1.2%) -> 1-5 calculator_complete over 28 days — first-input
friction is the dominant funnel bottleneck.

### U-01 — Preset one-click scenarios
New `src/lib/constants/presets.ts`: `CALCULATOR_PRESETS`, 3 entries, each a
REAL `{category, state_code, complexity}` row that exists in
`src/data/seed/costs.json` (never an invented number) — the exact three
scenarios from 부속U §5's legalcostcalc row:
- CA divorce, simple (uncontested)
- NY estate-planning, simple (will)
- TX dui, moderate (typical DUI defense)

Wired into `src/components/calculator/cost-calculator.tsx` as three outline
pill buttons ("Try an example: ...") rendered above-fold, directly above the
category/state/complexity selects, inside the same `Card` that already
carries the K05 `data-ad-exclusion-zone="calculator-widget"` marker. Clicking
a preset:
1. Calls `markInteracted()` FIRST, then the three `setState` calls — the
   identical call order the existing category/state/complexity `Select`
   `onValueChange` handlers already use, so the existing T03
   `hasUserInteractedRef` guard and `calc_input_start` fire exactly as they
   would for a real dropdown edit (verified: `tests/calculator-presets.test.ts`
   source-audits the handler's call order).
2. If `termsGate.hasConsented` is already `true`, auto-computes via a
   refactored `runCalculate(overrides?)` (now accepts explicit
   `{category, stateCode, complexity}` so it uses the preset's exact values
   immediately rather than the stale pre-render closure state) — `results`
   render and `calculator_complete` fires with `{ calc_type }` only, no
   preset id/param, through the existing `trackEvent` pipeline.
3. If consent has NOT been given yet, the fields fill in but nothing is
   auto-computed — the existing `TermsGateInline` clickwrap still requires an
   explicit, separate accept before any calculation runs. Presets never call
   `termsGate.accept()` or touch `localStorage` consent state directly
   (source-audited in `tests/calculator-presets.test.ts`) — compliance wins,
   per 부속U §7.

Manual Calculate-button flow (`handleCalculate` -> `runCalculate()` with no
overrides) is unchanged — same closure-state behavior as before the
refactor.

Visual distinction from ads: trivially satisfied structurally, not just
styled — no ad marker (`adsbygoogle`/`<ins`) renders anywhere in
`CostCalculator`'s pre-calculation markup at all (ads only mount inside
`CostResult`/`ResultMonetization` after a result exists), so the preset
buttons can never be within any distance of an ad container. Extended the
existing K05 assertion in `tests/ad-proximity.test.ts` with a new `it()`
confirming the preset row co-exists with zero ad markers in that same
pre-calc markup.

### U-04 — Revisit-hook audit + season badge
**Audit finding: both T15 and T16 were already fully wired** — no
re-implementation needed, only verification:
- T16 `ContinueBanner` — already rendered in `cost-calculator.tsx`, gated on
  `persistence.savedState`.
- T15 `ResultShare` — already rendered in `cost-result.tsx`, gated on
  `categorySlug` (renders on spoke pages and once a category is selected on
  the homepage; intentionally does not render for the generic/no-category
  homepage state, which is documented sensitive-site scoping, not a bug).

New `tests/revisit-hooks-audit.test.ts` locks this in with grep (confirms the
wiring's conditional-render source) + render (`renderToStaticMarkup`)
assertions for both, so the wiring can't silently regress.

New `src/components/shared/seasonal-badge.tsx` (`SeasonalBadge`) — a subtle
teal-token pill (mirrors the existing `UpdatedBadge` pattern) rendered at the
top of the homepage hero, above the H1: "January is the busiest month for
divorce-related searches — save your estimate now." Links to the real,
already-indexed `/divorce-cost-by-state` hub page (the "guide/section" this
hook points to — U-02's dedicated guide is out of scope for this wave).
Sourced via WebSearch (2026-07-18) to Google Trends-cited reporting from
Susan Gray Law and Forbes on January's search-interest peak for
divorce-related queries — cited by URL in the component's code comment. No
specific percentage/count is reproduced in the user-facing copy, only the
qualitative "busiest month" pattern both sources independently report — no
fabricated statistic.

### U-06 — Measurement interpretation note
New `docs/ga4-measurement-interpretation.md` — 3-line interpretation rule
set: (1) sessions/user<1 = consent-denied cookieless pings, not a CMP bug —
do not touch CMP/Consent Mode; (2) datacenter-city traffic (Council Bluffs,
Ashburn, Boardman, etc.) = bots, exclude from analysis; (3) funnel KPI =
`calc_input_start`/`calculator_complete` only, not raw `page_view`. Pure
documentation — zero code change, as required.

### Test delta
499 tests (32 files, pre-wave baseline) -> 523 tests (34 files). New files:
`tests/calculator-presets.test.ts` (+13), `tests/revisit-hooks-audit.test.ts`
(+10). Extended: `tests/ad-proximity.test.ts` (+1, K05 extension for the new
preset buttons).

### Gate results (this wave)
- `npm run lint`: 0 errors (3 pre-existing warnings in
  `article-schema.tsx`/`dataset-schema.tsx`/`software-application-schema.tsx`,
  unrelated to this wave, carried over from prior waves)
- `npm test`: 523/523 passed
- `npm run build`: succeeded (Next.js 16.2.2/Turbopack) — TypeScript check
  clean, 897/897 static pages generated, sitemap 434 indexable URLs
  (unchanged — this wave adds zero new indexable pages, no new routes)

### Not touched (guardrails)
CMP/Consent Mode implementation untouched (U-06 explicitly forbids this).
TermsGate's consent-storage functions (`readStoredConsent`/
`writeStoredConsent`) were not modified or called from the new preset code
path. T03's `shouldFireCalculatorComplete` guard logic
(`src/lib/utils/calc-funnel.ts`) was not modified, only reused. No AdSense/ad
script or `ResultMonetization` changes. No FAQPage/HowTo schema added. No new
routes/pages (U-02's guide, U-03, U-05 are out of scope for this wave). No
commit/deploy performed (orchestrator-owned).

---

## Wave B — U-02: original editorial guide (부속U GA4 근본진단 개선스펙)

Source of truth: `D:\ClaudeCode\AppFarm\보고서\부속U_GA4근본진단_개선스펙.md` §4
(U-02 사양+수용기준), §5 (legalcostcalc parameter row: "How Legal Fees Work
(2026): hourly vs flat vs contingency" — informational only), §7
(guardrails). Builds on Wave A (U-01/U-04/U-06, above) — none of it re-specced
or touched. Responds to 부속U §2 P5 (AdSense "low-value content" judgment —
editorial-guide count was 1/10 sites, launch only) and P0 (approval gate).

### U-02 — `/how-legal-fees-work` guide
New route, modeled structurally on LaunchCostCalc's `/how-to-start-an-llc`
guide (commit 2746a0a) per the spec, adapted to this repo's own component
signatures (`Disclaimer`/`AuthorByline`/`UpdatedBadge` from
`components/shared`, `ArticleSchema`/`BreadcrumbSchema`/`Breadcrumbs` from
`components/seo`, `buildMeta`/`CANONICAL_ORIGIN` from `lib/seo`) — LAYERED:
the page is presentational only, all copy/facts live in
`src/app/how-legal-fees-work/content.ts`.

**Research discipline (부속U §7 no-fabrication guardrail):** every load-
bearing fact was verified via live WebSearch/WebFetch on 2026-07-18 (9
WebSearch calls + 3 WebFetch calls against official sources) BEFORE writing
any copy — ABA Model Rules 1.2/1.5/1.15 (americanbar.org), California
Business & Professions Code §6146/§6148 (leginfo.legislature.ca.gov, fetched
directly), New York Judiciary Law §474-a (nysenate.gov, fetched directly),
the California State Bar's Mandatory Fee Arbitration Program
(calbar.ca.gov), and Clio's 2025 Legal Trends Report
(clio.com/resources/legal-trends). The direct-fetch verification caught a
real, materially-wrong secondary-source figure before publication: several
aggregator sites still describe California's old MICRA sliding-scale
contingency cap (40%/33%/25%/15% tiers), but the CURRENT law (Bus. & Prof.
Code §6146, as amended by AB 35 effective January 1, 2023) is a simple two-
tier 25%-before-filing / 33%-after-filing cap — confirmed by fetching the
statute text directly at leginfo.legislature.ca.gov. The guide cites the
correct, current figure and documents the correction path in
`GUIDE_VERIFY_NOTES`.

Content shape (`content.ts`):
- `GUIDE_FACTS` — 9 "at a glance" facts, each tied to one of the sources
  above via a `sourceUrl` link rendered inline (info-gain gate spirit:
  >=4 real, distinct, sourced differentiating facts — this page carries 9).
- `GUIDE_SECTIONS` — 13 sections (1 framing intro + 12 body sections,
  matching the 10-13 사양 bound and the LaunchCostCalc model's own 1+12
  split): hourly/flat/contingency/retainer-and-trust-account mechanics,
  Model Rule 1.5 reasonableness factors, written-fee-agreement requirements
  (Model Rule 1.5(c) + CA §6148), state contingency-fee caps (CA §6146 + NY
  §474-a), limited-scope/unbundled representation (Model Rule 1.2(c)), 2025
  Clio hourly-rate data, how fee structure tends to track matter type, fee
  disputes/arbitration (CA MFAA), and what a fee agreement should make
  clear. Every section is real prose (4-6+ sentences), never filler.
- `GUIDE_SOURCES` — 12 distinct, verified https citations (ABA x4, CA
  Legislature x2, CA State Bar, NY Senate, Clio, Nolo x2, FindLaw) — exceeds
  the >=8 사양 floor.
- `GUIDE_VERIFY_NOTES` — documents which figures are volatile (national
  average hourly rate; state-specific dollar/percentage thresholds) and
  rendered on-page as a "verify before relying on them" callout (mirrors
  LaunchCostCalc's BOI-status callout pattern), never stated as permanent
  facts.

Page structure: `Disclaimer` top, visible `Breadcrumbs` + `BreadcrumbSchema`,
`UpdatedBadge`/`AuthorByline` (both driven by the real, dated
`GUIDE_UPDATED = "2026-07-18"` — never `new Date()`; no fabricated reviewer
credential, same honest "LegalCostCalc Editorial Team" fallback as every
other page), key-facts block, intro + 12 body sections, the verify-notes
callout, `Disclaimer` bottom, a Sources list (all 12 links), and a "Related
tools on this site" internal-link block (calculator home, a divorce spoke
page, a personal-injury spoke page as the contingency-fee example,
`/legal-cost-statistics`, `/about`). `ArticleSchema` + `BreadcrumbSchema`
only — no FAQPage/HowTo JSON-LD anywhere (부속U §7 / CODE-02 pattern).

**Registration** (this repo has no separate `CORE_PATHS` constant — the
established "indexable static page" gate here is direct registration in
`sitemap.ts`'s `staticPages` array, the same mechanism CODE-04's
`/legal-cost-statistics` used): added to `sitemap.ts` (`priority: 0.8`,
`monthly`), the main nav (`Header`'s `NAV_LINKS`, label "How Fees Work"),
and `Footer`'s Resources list (also backfilled a pre-existing gap: added
`/legal-cost-statistics`, which CODE-04 never added to the footer). No
`CORE_PATHS`/`INDEXABLE_PAGES` re-spec — that gate is specific to the
programmatic `/[state]/[slug]` matrix and doesn't apply to a hand-authored
static page.

### Test delta
New `tests/guide-how-legal-fees-work.test.ts` (19 tests): content-shape
assertions (10-13 sections, >=3 real sentences per section, >=4 distinct
sourced facts, >=8 distinct real https sources, no duplicate URLs, real
fixed `GUIDE_UPDATED`), rendered-page assertions via
`renderToStaticMarkup` (>=10 `<h2>`, all `GUIDE_SOURCES` URLs present as
`href` — including correct HTML-entity-escaping of the `&` in the
leginfo.legislature.ca.gov query-string URLs — disclaimer top+bottom,
`AuthorByline`/`UpdatedBadge` render the real 2026 date with no fabricated
credential, `ArticleSchema` present with the real `dateModified`, no
FAQPage/HowTo anywhere, no UPL advice-verb language, internal links to `/`
and a real spoke page present), `buildMeta` metadata assertions, a
sitewide re-verification that no route renders `<FaqSchema>`, and
sitemap/nav/footer registration checks. 523 tests (Wave A baseline) -> 542
tests (35 files).

### Verification performed
Beyond the unit-test render, ran a real `next build` + `next start` and
`curl`'d the live production HTML for `/how-legal-fees-work` (JS off,
matching the spec's literal acceptance methodology): HTTP 200; 17 `<h2>`
tags; 13 distinct `https://` source links; "not legal advice" present 21
times (site-chrome + page disclaimers); `Article`/`BreadcrumbList` JSON-LD
present, `FAQPage`/`HowTo` absent; `<meta name="robots" content="index,
follow, max-image-preview:large">` (indexable, not noindex); the nav link
("How Fees Work") and footer link ("How Legal Fees Work") both render with
the correct `href`; `<title>How Legal Fees Work (2026): Hourly vs. Flat vs.
Contingency — LegalCostCalc</title>`; and `sitemap.xml` includes
`https://legalcostcalc.co/how-legal-fees-work`. Build log confirms
`sitemap: 435 indexable URLs` (434 Wave-A baseline + 1, exactly this new
static page — the programmatic `369/408 hasUniqueData` count is unchanged,
confirming zero effect on the existing information-gain gate).

### Gate results (this wave)
- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (same 3 pre-existing `react/no-danger`
  unused-eslint-disable-directive warnings on `article-schema.tsx`,
  `dataset-schema.tsx`, `software-application-schema.tsx` as every prior
  wave — unrelated to this wave)
- `npm test`: 542/542 passed (35 files)
- `npm run build`: succeeded, 898/898 static pages generated (Wave A's 897 +
  1 new route), `sitemap: 435 indexable URLs (369/408 programmatic pages
  pass hasUniqueData)`

### Not touched (guardrails)
No CMP/Consent Mode change. No calculator/results/TermsGate code touched —
this wave adds a pure content route, no interaction with `calc_input_start`/
`calculator_complete` measurement at all. No FAQPage/HowTo JSON-LD anywhere
(verified sitewide, not just on the new page). No raw calculator inputs
enter the new page (it has no inputs/form — informational content only). No
fabricated figures: every number/date/citation traces to a source in
`GUIDE_SOURCES`, verified live on 2026-07-18; volatile figures are framed
"verify at {official source}" rather than stated as permanent (see
`GUIDE_VERIFY_NOTES`). No advice verbs — audited by both the existing
site-wide tone conventions and this wave's own `ADVICE_VERB_PATTERNS` test.
U-03 (Bing/IndexNow confirmation — the new URL is automatically covered
since `scripts/indexnow.mjs` derives its submission list directly from the
built `sitemap.xml`, no separate wiring needed) and U-05 (guide<->calculator
<->statistics link-density acceptance criteria) are out of scope for this
wave — only a light, natural set of internal links was added (calculator
home, one divorce spoke page, one personal-injury spoke page,
`/legal-cost-statistics`, `/about`), not the full U-05 circulation
requirement. No commit/deploy performed (orchestrator-owned).

---

## Wave C — U-03 (Bing/IndexNow confirmation) + U-05 (internal circulation)

Source of truth: `D:\ClaudeCode\AppFarm\보고서\부속U_GA4근본진단_개선스펙.md` §4
(U-03/U-05 사양+수용기준), §5 (parameter row), §7 (guardrails). Builds on
Wave A (U-01 presets) and Wave B (U-02 `/how-legal-fees-work` guide) —
neither re-specced.

### U-03 — Bing/IndexNow confirmation (audit + one minimal fix)

Audited `scripts/indexnow.mjs` (T14): `prebuild` writes `public/{key}.txt`
only when `INDEXNOW_KEY` is set (no-op otherwise); `postbuild` submits only
when `VERCEL_ENV==='production'` AND `INDEXNOW_KEY` is set, reading the URL
list directly from the just-built `sitemap.xml` (never a separately
maintained list, so it can't drift from what `sitemap.ts` actually emits),
chunked at 10k URLs/request, and every failure path is caught/logged —
never a non-zero exit. This wave did not change the script; it was already
correct (confirmed by `tests/indexnow.test.ts`, unchanged) and per the task
brief `INDEXNOW_KEY` is set in Vercel, so production builds will submit.
Confirmed via a real `next build` here: `postbuild` correctly logged
`indexnow: skipping submission (VERCEL_ENV=unset, not production)` — the
expected local/preview behavior.

Confirmed the guide URL is in the sitemap source: `src/app/sitemap.ts`
already registers `/how-legal-fees-work` (added in Wave B, priority 0.8,
monthly) — since IndexNow's submission list is derived directly from the
built `sitemap.xml`, no separate wiring is needed for the guide to be
submitted on the next production deploy.

**Found and fixed one real "sitemap lastmod does not reflect the real data-
verified date" issue** (부속U §4 U-03 사양 item 2): every entry in
`sitemap.ts`'s `staticPages` array — including `/how-legal-fees-work` —
shared the single `DATA_VERSION_DATE` constant (`src/lib/constants/
data-meta.ts`, "bumped manually when **cost data** is verified/refreshed",
currently 2026-06-29). That's correct for cost-data-driven pages
(`/legal-cost-statistics` derives its own `DATA_VERIFIED_ISO` from the same
constant, appropriately — it IS a view over `costs.json`). But
`/how-legal-fees-work` is independent, hand-authored editorial content with
its own real verification date, `GUIDE_UPDATED = "2026-07-18"`
(`src/app/how-legal-fees-work/content.ts`) — a date confirmed more recent
than `DATA_VERSION_DATE` and already used for the page's own `AuthorByline`/
`UpdatedBadge`/`ArticleSchema.dateModified`. Reporting `2026-06-29` in the
sitemap for a page last verified `2026-07-18` was a real (if minor)
inaccuracy — a stale lastmod signal to crawlers for content that's actually
newer. **Minimal fix**: `sitemap.ts` now imports `GUIDE_UPDATED` and uses
`new Date(\`${GUIDE_UPDATED}T00:00:00Z\`)` as that one entry's
`lastModified`, leaving every other entry (all genuinely tied to the cost
dataset) on the shared `DATA_VERSION_DATE` unchanged.

### U-05 — guide<->calculator<->statistics internal circulation

**Guide -> calculator (>=3 in-context deep links) + guide -> statistics
(>=1 in-context link).** Wave B's guide already had one contextual `/`
(calculator home) link in the intro and an end-of-page "Related tools"
list, but per the task brief's "in-context" requirement (matching
LaunchCostCalc's `IN_CONTEXT_LINKS` pattern in its own
`/how-to-start-an-llc/page.tsx`, confirmed by reading that file directly)
those don't count — links need to sit inside the relevant body section's
own prose, not only in a footer-style dump. Added an `IN_CONTEXT_LINKS`
record (keyed by exact `GUIDE_SECTIONS` heading, same pattern as
LaunchCostCalc) to `src/app/how-legal-fees-work/page.tsx`, rendered
directly below the relevant section:
- "Hourly billing" section -> `/texas/dui-cost` (a real hourly-billed,
  contested-defense example).
- "Flat fees" section -> `/new-york/estate-planning-cost` (the section's own
  prose names "drafting a will" as the classic flat-fee task).
- "Contingency fees" section -> `/california/personal-injury-cost` (the
  section's own contingency-fee example).
- "What a lawyer's hour actually costs, state by state" section ->
  `/legal-cost-statistics` (the section is literally about state-by-state
  hourly-rate data, which is exactly what that page shows).

No-fabrication guardrail: every target is a REAL row in `costs.json` that
passes the `hasUniqueData` information-gain gate (verified directly —
`hasUniqueData("TX","dui")`, `hasUniqueData("NY","estate-planning")`, and
`hasUniqueData("CA","personal-injury")` all `true`, via a throwaway vitest
check before wiring the links, then re-asserted permanently in the new test
file below) — never a thin/noindexed page, and never an invented route.

**Calculator -> guide (>=1 link in the result area).** Added the link in
TWO places, both real "calculator result area" surfaces per the task's
either/or wording:
1. `src/components/calculator/cost-result.tsx` (`CostResult`) — the
   client-rendered result card shown after a user computes a result on any
   surface (homepage generic calculator, spoke pages, and the embed
   widget — consistent with the existing `RelatedMatters`/`ResultShare`
   modules, which already render unconditionally there, ads-only being the
   thing embeds suppress).
2. `src/components/seo/cost-details-section.tsx` (`CostDetailsSection`) —
   the SERVER-rendered "Common Fees / What Affects Cost" block that appears
   on every `/[state]/[slug]` spoke page whenever real cost data exists,
   independent of any client interaction. Added this second location
   specifically so the calculator->guide link is verifiable via a plain
   curl/JS-off request (matching the task's "curl-verify both directions"
   instruction) rather than only ever existing behind a client-side
   `results` state.

Both are plain text links, in the site's existing teal/underline style —
no border/card styling, so they read as content cross-links, never as ad
units (no ad markers are added; `tests/ad-proximity.test.ts` and
`tests/embed-monetization.test.ts` re-run green unchanged).

### Verification performed

**Mutual curl (부속U §4 U-05 수용: "상호 curl 확인").** Ran a real
`next build` + `next start` and curl'd the live production server:
- `/how-legal-fees-work` -> HTTP 200; contains exactly the 4 new in-context
  `href`s (`/texas/dui-cost`, `/new-york/estate-planning-cost`,
  `/california/personal-injury-cost`, `/legal-cost-statistics`), each of
  which also independently resolves HTTP 200.
- Every in-context link's position in the rendered HTML falls BEFORE the
  end-of-page "Related tools on this site" block — i.e. genuinely inside
  the body-section flow, not merely duplicating the existing footer-style
  list (asserted in the new test file, not just eyeballed in the curl
  output).
- Guide -> calculator/statistics direction: fully curl-confirmed, real
  HTTP 200s, no gaps.

**Calculator -> guide direction — partially curl-blocked by a pre-existing,
documented local-environment limitation, not a regression.** Curling a real
spoke page (`/california/divorce-cost`) locally returns HTTP 200 but the
page's entire cost-data-dependent content (Quick Stats card, "Common
Divorce Fees", `CostDetailsSection`, and therefore its new guide link) is
absent from BOTH the running server's response AND the raw prebuilt
`.next/server/app/california/divorce-cost.html` file itself — i.e. this is
a build-time data-fetch failure, not a serving-time or hydration issue.
Root-caused (not assumed) via a throwaway vitest call to
`getCostForPage("divorce","CA")`, which surfaced the underlying Supabase
client-construction/query failure — `src/lib/repositories/
cost-repository.ts`'s `findCostsByFilters` always queries Supabase live
(`legal_costs` table) with no seed-JSON fallback, and that query does not
succeed in this local/sandboxed environment. This exactly matches this
project's own recorded memory note ("Supabase 500s locally... spoke pages
do not hydrate in headless preview") — a known, pre-existing local-dev-only
gap unrelated to this wave's changes (out of scope to fix here: it's a data-
layer/env concern, not U-03/U-05, and Wave B's own verification silently
avoided the same trap by only ever curling the fully-static guide page,
never a live spoke page's computed content). Compensating verification used
instead: `tests/u05-internal-circulation.test.ts` renders `CostResult` and
`CostDetailsSection` directly (bypassing the Supabase-dependent page
component) with real mock cost data and asserts both output the
`/how-legal-fees-work` href — deterministic, passes, and exercises the
exact JSX these components would produce once real data is present (as it
will be on Vercel, where Supabase is reachable).

### Test delta

New `tests/u05-internal-circulation.test.ts` (8 tests): guide-side
in-context-link presence + positional (before the end-of-page list)
assertions, `hasUniqueData` no-fabrication checks on all 3 in-context
calculator targets, a `GUIDE_SECTIONS` heading-drift guard (keeps the
`IN_CONTEXT_LINKS` keys from silently going dark if `content.ts` headings
are ever edited), `CostResult` and `CostDetailsSection` calculator->guide
link assertions, and a sitemap lastmod assertion (the guide's entry now
equals `GUIDE_UPDATED`, not the shared dataset date). 542 tests (Wave B
baseline) -> 550 tests (36 files).

### Gate results (this wave)

- `npx tsc --noEmit`: 0 errors
- `npm run lint`: 0 errors (same 3 pre-existing `react/no-danger`
  unused-eslint-disable-directive warnings as every prior wave, unrelated)
- `npm test`: 550/550 passed (36 files)
- `npm run build`: succeeded (run twice, once per source revision this
  wave), 898/898 static pages generated, `sitemap: 435 indexable URLs
  (369/408 programmatic pages pass hasUniqueData)` — unchanged from Wave B
  (this wave touches no page-index/gate logic)

### Not touched (guardrails)

No CMP/Consent Mode change. No CORE_PATHS/INDEXABLE_PAGES gate logic
touched (`369/408` unchanged). No new JSON-LD types added (still Article +
BreadcrumbList only, sitewide — re-verified by the unchanged Wave B test).
No ad markers added near any new link (ad-proximity/embed-monetization
suites re-run green, unchanged assertions). No raw calculator inputs enter
any new link/page. No fabricated dates/figures/routes: the sitemap fix uses
the guide's own already-real `GUIDE_UPDATED`; every in-context link target
is a real, gate-passing dataset combination, verified programmatically, not
assumed. No Supabase/data-layer code touched (the local-only 500 issue
documented above was diagnosed, not "fixed" — out of scope for U-03/U-05
and orchestrator guardrails). No commit/deploy performed (orchestrator-
owned).

## 2026-11-22 K28 라이브 검증 (dpl_Ge6iFsiufKsLHFZukig8EQ7eAcQA, legalcostcalc.co)

하네스: `.claude/work/AppFarm3/legal/k28/k28.cjs`, 결과 `results.json`. 로드 3회(대조 1 + 프로덕션 첫 방문 1 + 같은 컨텍스트 재방문 1), `?crew=1`, 약 15초, 스크롤·광고 클릭 없음. GA collect 전 변형과 doubleclick pagead/ads·gen_204·ama_stats는 URL 기록 후 abort, pagead2.googlesyndication.com은 통과.

| 항목 | 결과 |
|---|---|
| 양성 대조 | 이전 프로덕션 dpl_9bZYvHCx는 SSO 보호(302)라 접근 불가(`vercel curl` 금지). 대체: 라이브 문서를 route.fulfill 로 재작성(구 허용목록 CSP 헤더 + 로더를 기본값 앞으로 이동). 하네스가 순서 위반(default 18 > loader 17)과 CSP 위반 3건(connect-src ep1.adtrafficquality sodar, img-src googletagmanager, connect-src www.google.com/g/collect)을 검출 -> 하네스 유효. 한계: 실제 구 배포 본문이 아닌 합성 대조 |
| GA tid | G-GQC29BN7K7 (STRATEGY.md 기록; 코드엔 env 로만 존재) — 첫 방문·재방문 collect 전부 일치 |
| gcs | 첫 방문 G111, 재방문 G111 |
| tt=internal | 첫 hit 에 존재 |
| sodar2 | 로드됨 y (ep2.adtrafficquality.google/sodar/sodar2.js, runner.html) |
| CSP 위반 | 첫 방문 0, 재방문 0 (securitypolicyviolation·콘솔 Refused 0). 헤더 `object-src 'none'; base-uri 'none'; frame-ancestors 'none'` |
| React #418 | 첫 방문·재방문 모두 없음 (대조 문서에서만 발생: 재작성 부산물) |
| head 순서 | DOM 상 consent default(17) < 로더(18), 로더는 head 내 1개·body 0 |
| K14-c | 국가 쿠키 XX + Manage Consent 클릭 동일 동기 단계 -> 0.5초 시점 공지 없음, 약 3초 시점 거부 전용 공지 1개, 버튼 "Decline" 하나(Accept 없음), 이중 UI 없음 |
- 2026-11-22 fix(k7): /updates를 K7 EXCLUDE 표와 scan classify(page, include=false)에 분류 -> 주 허브 수 52->51, 로더 기대 0 (광고 적격 규칙에 없음); 렌더 테스트로 로더 0 확인
- 2026-11-22 fix(scan): 빌드된 updates.html이 주 허브 집합(stateHubs)에 잡혀 52로 집계되던 문제 -> Set에서 updates 제외(기대 51 복구); 회귀 테스트 추가
