# Requirements: 경남울산사업팀 매출 대시보드

**Defined:** 2026-03-01
**Core Value:** 오늘 매출이 목표 대비 어디에 있는지, 지난 주/지난 달 대비 어떻게 변하고 있는지를 한 페이지에서 즉시 파악할 수 있어야 한다.

## v1.2 Requirements

### 고객 유형 분석 (Customer Type)

- [ ] **CTYPE-01**: 사용자가 왕복/부름/편도 이용건수 비율을 도넛 차트로 확인할 수 있다
- [ ] **CTYPE-02**: 사용자가 왕복/부름/편도 이용건수의 일별/주차별 추이를 스택 차트로 확인할 수 있다
- [ ] **CTYPE-03**: 기간 필터(이번 주/지난 주/이번 달/지난 달) 변경 시 고객 유형 차트도 즉시 반영된다

### 매출 세분화 (Revenue Breakdown)

- [ ] **REV-01**: 사용자가 대여/PF/주행/부름/기타 매출 구성을 도넛 또는 스택 바 차트로 확인할 수 있다
- [ ] **REV-02**: 사용자가 매출 유형별 금액과 전체 대비 비율(%)을 숫자로 확인할 수 있다
- [ ] **REV-03**: 기간 필터 변경 시 매출 세분화 차트도 즉시 반영된다

### 비용 분석 (Cost Analysis)

- [ ] **COST-01**: 사용자가 운반비/유류비/주차료/점검비/감가상각비/수수료 카테고리별 합계를 확인할 수 있다
- [ ] **COST-02**: 각 비용 카테고리를 클릭하면 세부 항목(예: 운반비 → 충전/부름/존편도 운반비)이 드릴다운으로 표시된다
- [ ] **COST-03**: 기간 필터 변경 시 비용 분석도 즉시 반영된다

## v2 Requirements

### 고객 유형 고도화

- **CTYPE-04**: 고객 유형별 매출 기여도 (건수가 아닌 매출 기준 유형 분석)
- **CTYPE-05**: 고객 유형별 평균 이용시간, 이동거리 비교

### 비용 분석 고도화

- **COST-04**: 비용 항목별 전월 대비 증감 표시
- **COST-05**: 매출 대비 비용 비율 추이 차트

## Out of Scope

| Feature | Reason |
|---------|--------|
| 고객별 이용 이력 조회 | 개인정보, 대시보드는 집계 뷰만 |
| 실시간 비용 입력 | 시트 직접 편집, 대시보드는 읽기 전용 |
| 비용 예산 설정/비교 | v1.2 범위 초과 |
| 고객 유형별 매출 breakdown | 시트에 데이터 없음, v2 검토 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CTYPE-01 | Phase 10 | Pending |
| CTYPE-02 | Phase 10 | Pending |
| CTYPE-03 | Phase 10 | Pending |
| REV-01 | Phase 11 | Pending |
| REV-02 | Phase 11 | Pending |
| REV-03 | Phase 11 | Pending |
| COST-01 | Phase 12 | Pending |
| COST-02 | Phase 12 | Pending |
| COST-03 | Phase 12 | Pending |

**Coverage:**
- v1.2 requirements: 9 total
- Mapped to phases: 9 (Phase 10, 11, 12 — enabled by Phase 9 data layer)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-01*
*Traceability updated: 2026-03-01 (v1.2 roadmap)*
