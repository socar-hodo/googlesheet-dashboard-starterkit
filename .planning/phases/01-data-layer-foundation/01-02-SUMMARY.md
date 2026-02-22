---
phase: 01-data-layer-foundation
plan: "02"
subsystem: database
tags: [typescript, mock-data, parser, google-sheets, korean-number]

# Dependency graph
requires:
  - phase: 01-data-layer-foundation
    plan: "01"
    provides: "DailyRecord/WeeklyRecord/TeamDashboardData 타입 계약"
provides:
  - mockDailyRecords: 28개 일별 레코드 (2026-01-26 ~ 2026-02-22)
  - mockWeeklyRecords: 8개 주차별 레코드 (1주차~8주차, weeklyTarget=6천만원)
  - mockTeamDashboardData: 통합 mock 컨테이너
  - parseKoreanNumber: ₩/% 기호/콤마 제거 후 숫자 변환 (빈값→0, NaN→null)
  - getTeamDashboardData(): Sheets 미설정→mock, API 실패→전체 mock 폴백
affects:
  - app/(dashboard)/dashboard/page.tsx
  - Phase 2 UI 컴포넌트 전체 (KPI 카드, 차트, 테이블)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "헤더 이름 기반 컬럼 매핑: buildColumnIndex로 Map 생성, 인덱스 고정 파싱 완전 배제"
    - "open-ended range: '일별!A:F' 형식 사용, 고정 범위 'A1:F30' 금지"
    - "한국어 숫자 파싱: ₩→%→콤마 순서로 제거 후 Number(), NaN이면 null 반환"
    - "2단계 폴백: 개별 시트 null→해당 mock 배열, 전체 API 실패→mockTeamDashboardData"
    - "환경변수 우선 시트 이름: GOOGLE_DAILY_SHEET_NAME ?? '일별'"

key-files:
  created: []
  modified:
    - lib/mock-data.ts
    - lib/data.ts

key-decisions:
  - "parseKoreanNumber를 export function으로 공개 — 향후 컴포넌트에서 직접 포맷팅에 재사용 가능"
  - "getTeamDashboardData catch 블록에서 fetchedAt을 현재 시각으로 갱신 — 폴백 시각 기록 보존"
  - "page.tsx의 getDashboardData 참조는 Phase 2에서 수정 예정 — 빌드 에러가 현재 허용됨"
  - "GOOGLE_DAILY_SHEET_NAME/GOOGLE_WEEKLY_SHEET_NAME 환경변수로 시트 탭명 재정의 가능"

patterns-established:
  - "헤더 이름 기반 파싱: 인덱스 고정 방식 완전 배제, DAILY_HEADERS/WEEKLY_HEADERS 상수로 관리"
  - "한국어 숫자 파서: parseKoreanNumber + safeNumber 2단계 처리 패턴"

requirements-completed: [DATA-01, DATA-02, DATA-03, DATA-04, UX-02]

# Metrics
duration: 3min
completed: 2026-02-22
---

# Phase 1 Plan 02: 팀 전용 mock 데이터 및 데이터 레이어 구현 Summary

**한국어 숫자 파서(parseKoreanNumber) + 헤더 이름 기반 Daily/Weekly 시트 파서 + Google Sheets 미설정 및 API 실패 시 mock 폴백 getTeamDashboardData()로 데이터 레이어 완성**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-22T03:33:05Z
- **Completed:** 2026-02-22T03:36:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- lib/mock-data.ts: DailyRecord 28개(2026-01-26~2026-02-22) + WeeklyRecord 8개(1~8주차) + mockTeamDashboardData export
- 가동률 55%~92% 골고루 분포하여 녹색(80%+)/주황(60~80%)/빨간(60% 미만) UI 조건부 색상 테스트 케이스 모두 포함
- lib/data.ts: parseKoreanNumber("₩1,234,567")→1234567, ("")→0, ("abc")→null 정확히 구현
- 헤더 이름 기반 컬럼 매핑(buildColumnIndex)으로 시트 구조 변경에 강건한 파서 구현
- getTeamDashboardData(): Sheets 미설정→mock 즉시 반환, API 실패→전체 mock 폴백(fetchedAt 현재 시각)
- open-ended range "일별!A:F", "주차별!A:G" 사용으로 행 수 제한 없음
- 기존 getDashboardData() 및 parseKpiFromSheet 등 e-커머스 파서 4개 완전 삭제

## Task Commits

각 태스크는 원자적으로 커밋됨:

1. **Task 1: 팀 전용 mock 데이터 작성** - `00ca5b2` (feat)
2. **Task 2: Korean 숫자 파서 + 시트 파서 + getTeamDashboardData 구현** - `607af84` (feat)

**Plan metadata:** (docs 커밋 예정)

## Files Created/Modified

- `lib/mock-data.ts` - 기존 e-커머스 mockDashboardData 삭제, 팀 전용 mockDailyRecords(28개)/mockWeeklyRecords(8개)/mockTeamDashboardData 작성
- `lib/data.ts` - 기존 파서 4개 및 getDashboardData() 삭제, parseKoreanNumber/safeNumber/buildColumnIndex/parseDailySheet/parseWeeklySheet/getTeamDashboardData() 구현

## Decisions Made

- parseKoreanNumber를 export function으로 공개: Phase 2 컴포넌트에서 표시 포맷팅에 재사용 가능하도록
- catch 블록에서 fetchedAt을 현재 시각으로 갱신: 폴백 발생 시각을 기록으로 남기기 위해
- GOOGLE_DAILY_SHEET_NAME / GOOGLE_WEEKLY_SHEET_NAME 환경변수 지원: 실제 시트 탭명이 다를 경우 코드 수정 없이 재정의 가능
- page.tsx의 getDashboardData import 오류는 Phase 2에서 수정 예정 (빌드 에러 현재 허용)

## Deviations from Plan

없음 — 플랜대로 정확히 실행됨.

## Issues Encountered

- `npm run build` 실패가 발생했으나 이는 `app/(dashboard)/dashboard/page.tsx`가 삭제된 `getDashboardData`를 import하기 때문이며, 플랜 Task 2 verify 섹션에 명시적으로 허용된 오류다. 데이터 레이어 파일(`lib/mock-data.ts`, `lib/data.ts`) 자체의 TypeScript 오류는 없다.

## User Setup Required

없음 — 외부 서비스 설정 불필요.

## Next Phase Readiness

- getTeamDashboardData()로 TeamDashboardData 반환 완료 — Phase 2 UI 컴포넌트가 즉시 사용 가능
- Phase 2에서 app/(dashboard)/dashboard/page.tsx를 getTeamDashboardData()로 교체 필요
- Phase 2에서 page.tsx에 `export const dynamic = 'force-dynamic'` 추가 필요 (UX-02 완전 충족)
- mock 데이터의 다양한 가동률 분포(55~92%)로 조건부 색상 UI 개발/테스트 즉시 가능

## Self-Check: PASSED

- FOUND: lib/mock-data.ts
- FOUND: lib/data.ts
- FOUND: .planning/phases/01-data-layer-foundation/01-02-SUMMARY.md
- FOUND: commit 00ca5b2 (feat(01-02): 팀 전용 mock 데이터 작성)
- FOUND: commit 607af84 (feat(01-02): Korean 숫자 파서 + 시트 파서 + getTeamDashboardData 구현)

---
*Phase: 01-data-layer-foundation*
*Completed: 2026-02-22*
