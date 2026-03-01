---
phase: 07-export
plan: 01
subsystem: ui
tags: [xlsx, sheetjs, csv, export, vitest, tdd]

# Dependency graph
requires:
  - phase: 06-period-filter
    provides: DailyRecord, WeeklyRecord 타입 정의 (types/dashboard.ts)
provides:
  - exportToCsv: DailyRecord[] | WeeklyRecord[] → .csv Blob 다운로드 (UTF-8 BOM, RFC 4180)
  - exportToXlsx: DailyRecord[] | WeeklyRecord[] → .xlsx SheetJS writeFile
  - toDateString, escapeCsvField, dailyToRows, weeklyToRows (순수 함수, 단위 테스트 포함)
affects: [07-02-ui-integration]

# Tech tracking
tech-stack:
  added: [xlsx 0.20.3 (cdn.sheetjs.com CDN tarball, 보안 취약점 회피)]
  patterns:
    - "CDN tarball 설치: npm 레지스트리 보안 취약점(0.18.5) 회피를 위해 cdn.sheetjs.com URL 사용"
    - "순수 함수 캡슐화: exportToCsv/exportToXlsx를 lib/에 분리하여 컴포넌트 결합도 최소화"
    - "TDD Red-Green: 테스트 먼저 커밋(bacd9fc), 구현 후 통과 확인(263da63)"
    - "로컬 시간 날짜 변환: toDateString이 period-utils.ts의 toISODate와 동일 이유로 UTC 오류 방지"

key-files:
  created:
    - lib/export-utils.ts
    - lib/export-utils.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "xlsx CDN tarball 설치: npm 레지스트리 0.18.5는 Denial of Service, Prototype Pollution 취약점 — cdn.sheetjs.com 0.20.3 사용"
  - "순수 함수 export (toDateString 등): 테스트 가능성을 위해 내부 헬퍼를 named export로 공개"
  - "브라우저 API 의존 함수 단위 테스트 제외: exportToCsv/exportToXlsx는 Blob/URL API 모킹 대신 브라우저 검증으로 대체"

patterns-established:
  - "lib/ 순수 함수 패턴: 기존 period-utils.ts, kpi-utils.ts와 동일한 구조로 분리"
  - "RFC 4180 CSV 이스케이프: escapeCsvField가 콤마/따옴표/줄바꿈 처리"

requirements-completed: [EXPO-01, EXPO-02, EXPO-03]

# Metrics
duration: 8min
completed: 2026-03-01
---

# Phase 7 Plan 01: Export Utils Summary

**SheetJS xlsx 0.20.3 CDN 설치 + lib/export-utils.ts 구현 — CSV(UTF-8 BOM, RFC 4180) + Excel 내보내기 순수 함수, 21개 단위 테스트 통과**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T06:10:16Z
- **Completed:** 2026-03-01T06:12:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- xlsx 0.20.3을 CDN tarball로 설치 — npm 레지스트리 보안 취약점(0.18.5) 회피
- lib/export-utils.ts 생성 — exportToCsv(UTF-8 BOM + RFC 4180) + exportToXlsx(SheetJS) 구현
- 21개 단위 테스트 통과 (toDateString, escapeCsvField, dailyToRows, weeklyToRows)
- npm run build 타입 오류 없음 확인

## Task Commits

각 태스크는 원자적으로 커밋됨:

1. **Task 1: xlsx CDN 설치** - `6c53209` (chore)
2. **Task 2: TDD Red — 단위 테스트 작성** - `bacd9fc` (test)
3. **Task 2: TDD Green — lib/export-utils.ts 구현** - `263da63` (feat)

_Note: Task 2는 TDD로 진행되어 test 커밋과 feat 커밋 두 개로 분리됨_

## Files Created/Modified

- `lib/export-utils.ts` — exportToCsv, exportToXlsx, toDateString, escapeCsvField, dailyToRows, weeklyToRows export
- `lib/export-utils.test.ts` — 순수 함수 21개 단위 테스트 (vitest)
- `package.json` — xlsx CDN tarball 의존성 추가
- `package-lock.json` — 설치 잠금 파일 업데이트

## Decisions Made

- **xlsx CDN tarball 선택:** npm install xlsx (0.18.5) 대신 cdn.sheetjs.com/xlsx-0.20.3 URL로 설치 — Denial of Service, Prototype Pollution 취약점 회피
- **toDateString을 named export로 공개:** period-utils.ts의 toISODate와 동일한 로직이지만, 단위 테스트 가능성과 향후 재사용을 위해 export 처리
- **브라우저 API 테스트 제외:** exportToCsv/exportToXlsx는 Blob, URL.createObjectURL, document.createElement 등 브라우저 API 의존 — 단위 테스트 대신 07-02 브라우저 체크포인트 검증으로 대체

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- lib/export-utils.ts 완성 — 07-02 UI 통합 플랜에서 DashboardContent에 버튼 연결 준비 완료
- exportToCsv, exportToXlsx를 `import { exportToCsv, exportToXlsx } from '@/lib/export-utils'`로 바로 사용 가능
- 브라우저 다운로드 검증은 07-02 체크포인트에서 수행

---
*Phase: 07-export*
*Completed: 2026-03-01*
