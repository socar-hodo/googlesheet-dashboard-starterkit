# Phase 1: Data Layer Foundation - Context

**Gathered:** 2026-02-21
**Status:** Ready for planning

<domain>
## Phase Boundary

팀 전용 TypeScript 타입 정의, Google Sheets 파서, mock 폴백을 구축하여 모든 UI 컴포넌트의 데이터 기반을 마련한다. Daily 시트(일자별)와 Weekly 시트(주차별) 두 가지 데이터 소스를 처리한다. UI 컴포넌트(카드, 차트, 테이블)는 별도 phase에서 구현한다.

**ROADMAP 수정 사항:** Phase 1 성공 기준 1번("Daily 시트에서 목표 데이터 파싱")은 실제 시트 구조와 다름 — 목표 데이터는 Weekly 시트에만 존재한다.

</domain>

<decisions>
## Implementation Decisions

### 타입 구조
- DailyRow, WeeklyRow를 완전히 분리된 독립 인터페이스로 정의 (공유 베이스 타입 없음)
- 목표(target) 데이터는 **WeeklyRow에만** 포함 — Daily 시트에는 목표 컬럼 없음
- 날짜 필드(일자) 및 주차 필드 형식: Claude's Discretion (코드베이스/실제 시트 형식 보고 결정)

### 파서 견고성
- 빈 셀 또는 누락 필드 → `0`으로 대체 (숫자 필드), `""` (문자열 필드)
- 한국어 숫자 형식 파싱 실패(콤마, 원화 기호 '₩', '%' 등 제거 후 변환 실패) → `null` 반환
- Google Sheets API 요청 자체 실패(네트워크 오류, 권한 오류 등) → 전체 데이터를 mock으로 폴백 (개별 시트 분기 없음)

### 시트 컬럼 매핑
- 컬럼 식별 방법, 데이터 시작 행, Sheets ID/시트 이름 위치: Claude's Discretion (기존 `lib/sheets.ts`, `.env.example` 구조를 보고 결정)

### Mock 데이터 충실도
- 실제 업무 패턴 반영: 일 매출 ~1,000만원 수준, 실제 손익/가동률 변동 포함
- 목표 초과/미달 케이스 모두 포함하여 UI 조건부 색상 테스트 가능하게
- 기간 범위: Claude's Discretion (UI 테스트에 충분한 양으로 결정)

### Claude's Discretion
- 날짜/주차 필드의 TypeScript 타입 (string vs Date vs 구조체)
- 컬럼 헤더 식별 방식 (이름 매칭 vs 인덱스 고정)
- Sheets ID와 시트 이름을 환경변수/하드코딩 중 어디에 둘지
- Mock 데이터 기간 범위

</decisions>

<specifics>
## Specific Ideas

- 한국어 숫자 파싱 시 콤마 제거 + '₩' 기호 제거 + '%' 제거 순서대로 전처리 필요
- mock 데이터는 KPI 카드의 조건부 색상(80%+/60-80%/60% 미만)을 테스트할 수 있도록 다양한 달성률 케이스 포함

</specifics>

<deferred>
## Deferred Ideas

없음 — 논의가 Phase 1 범위 내에서 진행됨

</deferred>

---

*Phase: 01-data-layer-foundation*
*Context gathered: 2026-02-21*
