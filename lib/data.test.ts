// 경남울산사업팀 매출 대시보드 — data.ts 파서 단위 테스트
import { describe, it, expect } from 'vitest';
import {
  parseCustomerTypeFromRows,
  parseRevenueBreakdownFromRaw,
  parseCostBreakdownFromRaw,
} from './data';

// ---------------------------------------------------------------------------
// parseCustomerTypeFromRows
// ---------------------------------------------------------------------------

describe('parseCustomerTypeFromRows — 기본 동작', () => {
  const makeRows = (extraHeaders: string[] = [], extraCells: string[] = []) => [
    ['A', 'B', 'C', 'D', 'E', ...extraHeaders.map((_, i) => String.fromCharCode(70 + i))],  // 1행: 식별자
    ['일자', '회계매출', '왕복_건수', '부름_건수', '편도_건수', ...extraHeaders],               // 2행: 헤더
    ['2026-03-01', '10000000', '5', '3', '2', ...extraCells],                                 // 3행~: 데이터
  ];

  it('정상 입력 시 CustomerTypeRow 배열을 반환한다', () => {
    const result = parseCustomerTypeFromRows(makeRows(), '일자');
    expect(result).toHaveLength(1);
    expect(result[0].roundTripCount).toBe(5);
    expect(result[0].callCount).toBe(3);
    expect(result[0].oneWayCount).toBe(2);
  });

  it('일자 모드: date 필드가 있고 week는 없다', () => {
    const result = parseCustomerTypeFromRows(makeRows(), '일자');
    expect(result[0].date).toBe('2026-03-01');
    expect(result[0].week).toBeUndefined();
  });

  it('주차 모드: week 필드가 있고 date는 없다', () => {
    const weekRows = [
      ['A', 'B', 'C', 'D', 'E'],
      ['주차', '회계매출', '왕복_건수', '부름_건수', '편도_건수'],
      ['1주차', '10000000', '5', '3', '2'],
    ];
    const result = parseCustomerTypeFromRows(weekRows, '주차');
    expect(result[0].week).toBe('1주차');
    expect(result[0].date).toBeUndefined();
  });

  it('rows.length < 3이면 빈 배열을 반환한다', () => {
    expect(parseCustomerTypeFromRows([], '일자')).toEqual([]);
    expect(parseCustomerTypeFromRows([['A'], ['헤더']], '일자')).toEqual([]);
  });

  it('왕복_건수 컬럼 누락 시 roundTripCount = 0', () => {
    const rows = [
      ['A', 'B', 'C', 'D'],
      ['일자', '회계매출', '부름_건수', '편도_건수'],  // 왕복_건수 없음
      ['2026-03-01', '10000000', '3', '2'],
    ];
    const result = parseCustomerTypeFromRows(rows, '일자');
    expect(result[0].roundTripCount).toBe(0);
  });

  it('날짜 컬럼이 빈 행은 필터링된다', () => {
    const rows = [
      ['A', 'B', 'C', 'D', 'E'],
      ['일자', '회계매출', '왕복_건수', '부름_건수', '편도_건수'],
      ['2026-03-01', '10000000', '5', '3', '2'],
      ['', '', '', '', ''],  // 빈 행
    ];
    const result = parseCustomerTypeFromRows(rows, '일자');
    expect(result).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// parseRevenueBreakdownFromRaw
// ---------------------------------------------------------------------------

describe('parseRevenueBreakdownFromRaw — 기본 동작', () => {
  const makeRawRows = () => [
    ['A', 'B', 'C', 'D', 'E', 'F'],      // 1행: 식별자
    ['일자', '대여매출', 'PF매출', '주행매출', '부름매출', '기타매출'],  // 2행: 헤더
    ['2026-03-01', '5000000', '1000000', '2000000', '500000', '300000'],  // 3행: 데이터
  ];

  it('정상 입력 시 RevenueBreakdownRow 배열을 반환한다', () => {
    const result = parseRevenueBreakdownFromRaw(makeRawRows());
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-03-01');
    expect(result[0].rentalRevenue).toBe(5000000);
    expect(result[0].pfRevenue).toBe(1000000);
    expect(result[0].drivingRevenue).toBe(2000000);
    expect(result[0].callRevenue).toBe(500000);
    expect(result[0].otherRevenue).toBe(300000);
  });

  it('rows.length < 3이면 빈 배열을 반환한다', () => {
    expect(parseRevenueBreakdownFromRaw([])).toEqual([]);
  });

  it('누락된 매출 컬럼은 0으로 폴백된다', () => {
    const rows = [
      ['A', 'B'],
      ['일자', '대여매출'],  // 나머지 컬럼 없음
      ['2026-03-01', '5000000'],
    ];
    const result = parseRevenueBreakdownFromRaw(rows);
    expect(result[0].pfRevenue).toBe(0);
    expect(result[0].drivingRevenue).toBe(0);
    expect(result[0].callRevenue).toBe(0);
    expect(result[0].otherRevenue).toBe(0);
  });

  it('콤마 포함 금액을 올바르게 파싱한다', () => {
    const rows = [
      ['A', 'B', 'C', 'D', 'E', 'F'],
      ['일자', '대여매출', 'PF매출', '주행매출', '부름매출', '기타매출'],
      ['2026-03-01', '5,000,000', '1,000,000', '2,000,000', '500,000', '300,000'],
    ];
    const result = parseRevenueBreakdownFromRaw(rows);
    expect(result[0].rentalRevenue).toBe(5000000);
  });
});

// ---------------------------------------------------------------------------
// parseCostBreakdownFromRaw
// ---------------------------------------------------------------------------

describe('parseCostBreakdownFromRaw — 기본 동작', () => {
  const makeRawRows = () => [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],  // 1행: 식별자
    ['일자', '운반비', '유류비', '주차료', '점검비', '감가상각비', '수수료', '충전운반비', '부름운반비', '존편도운반비'],  // 2행
    ['2026-03-01', '300000', '150000', '50000', '80000', '200000', '100000', '100000', '120000', '80000'],
  ];

  it('정상 입력 시 CostBreakdownRow 배열을 반환한다', () => {
    const result = parseCostBreakdownFromRaw(makeRawRows());
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-03-01');
    expect(result[0].transportCost).toBe(300000);
    expect(result[0].fuelCost).toBe(150000);
    expect(result[0].parkingCost).toBe(50000);
    expect(result[0].inspectionCost).toBe(80000);
    expect(result[0].depreciationCost).toBe(200000);
    expect(result[0].commissionCost).toBe(100000);
  });

  it('드릴다운 세부 컬럼을 올바르게 파싱한다', () => {
    const result = parseCostBreakdownFromRaw(makeRawRows());
    expect(result[0].chargeTransportCost).toBe(100000);
    expect(result[0].callTransportCost).toBe(120000);
    expect(result[0].zoneOneWayTransportCost).toBe(80000);
  });

  it('rows.length < 3이면 빈 배열을 반환한다', () => {
    expect(parseCostBreakdownFromRaw([])).toEqual([]);
  });

  it('드릴다운 컬럼 누락 시 0으로 폴백된다', () => {
    const rows = [
      ['A', 'B', 'C'],
      ['일자', '운반비', '유류비'],  // 드릴다운 컬럼 없음
      ['2026-03-01', '300000', '150000'],
    ];
    const result = parseCostBreakdownFromRaw(rows);
    expect(result[0].chargeTransportCost).toBe(0);
    expect(result[0].callTransportCost).toBe(0);
    expect(result[0].zoneOneWayTransportCost).toBe(0);
  });
});
