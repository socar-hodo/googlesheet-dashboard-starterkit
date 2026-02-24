# Phase 3: Chart Components - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

매출·손익·가동률·이용건수/이용시간 추이 데이터를 Recharts로 시각화하는 차트 컴포넌트 4종 구현.
KPI 카드 아래 배치. Daily/Weekly 탭 전환을 지원하며 다크/라이트 테마에서 올바르게 렌더링된다.
클릭 드릴다운, 필터, 날짜 범위 선택은 이 Phase의 범위 밖이다.

</domain>

<decisions>
## Implementation Decisions

### 차트 레이아웃 배치
- KPI 카드 아래 **1열** 배치 (세로로 나열)
- Daily/Weekly 탭 모두 동일한 차트 4종 표시 (데이터만 달라짐)
- 각 차트 위에 제목 표시 (예: '매출 추이', '손익 추이')
- Daily 차트는 **최근 30일** 데이터 기준 (데이터가 적으면 있는 만큼)

### 차트별 시각 스타일
- **매출 차트**: 실적 Bar는 `--chart-1` CSS 변수(테마 포인트 색상) 사용. Weekly에서만 목표 Line 추가 표시 (Daily에서는 Line 숨김)
- **손익 차트**: 양수(+) 녹색, 음수(-) 빨간색 Bar — KPI 카드 델타 색상과 일관성 유지
- **가동률 차트**: 라인 차트 + **주황 점선** 임계선 (80% 위치). Recharts `ReferenceLine` 사용
- **이용건수/이용시간 차트**: **이중 Bar** — 이용건수(좌 Y축) / 이용시간(우 Y축)으로 구분

### Daily/Weekly 탭 분기
- **단일 컴포넌트**에 `tab` prop으로 Daily/Weekly 분기 — `KpiCards`와 동일한 패턴
- X축 레이블: Daily = 일자(M/D 형식, 예: 2/1), Weekly = 주차(예: 1주, 2주)
- Weekly 매출 차트에만 목표 Line 표시, Daily에서는 숨김

### 차트 인터랙션
- **툴팁**: 수치 + 단위만 표시 (예: '실적: ₩6,950만', '가동률: 87%')
- **애니메이션**: Recharts 기본 애니메이션(로드 시 페이드인)만 사용 — 추가 구현 없음
- **로딩 스켈레턴**: KPI 카드와 동일한 Suspense 패턴으로 탭 전환 시 스켈레턴 표시
- **클릭 이벤트**: 없음 (툴팁만으로 충분. 세부 드릴다운은 Phase 4 데이터 테이블 담당)

### Claude's Discretion
- 개별 차트 컴포넌트 파일 분리 방식 (1파일 vs 여러 파일)
- 이중 Bar Y축 레이블 포맷
- 툴팁 내부 레이아웃 및 스타일
- 스켈레턴 높이/형태
- Recharts ResponsiveContainer 높이값

</decisions>

<specifics>
## Specific Ideas

- 손익 차트 색상(녹색/빨간색)은 KPI 카드의 델타 색상 (`text-green-600`, `text-red-600`)과 동일하게 맞출 것
- 차트 색상은 Tailwind CSS 변수(`--chart-1` ~ `--chart-5`)를 활용하되, Recharts SVG 안에서는 직접 HSL 값 매핑 필요 (CLAUDE.md 기술 스택 참고)
- 기존 KpiCards와 동일하게 Server Component로 구현 (Recharts 차트 자체는 `"use client"` 필요)

</specifics>

<deferred>
## Deferred Ideas

- 날짜 범위 필터 (이번 주/지난 주/이번 달) — v2 FILT-01
- 차트 클릭 시 해당 날짜 데이터 드릴다운 — Phase 4 이후
- 미니 스파크라인 KPI 카드 내 삽입 — v2 ECHRT-01

</deferred>

---

*Phase: 03-chart-components*
*Context gathered: 2026-02-24*
