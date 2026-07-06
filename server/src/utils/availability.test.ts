import { describe, expect, it } from 'vitest';
import { nightsBetween } from './availability';

describe('nightsBetween', () => {
  it('counts a single night', () => {
    expect(nightsBetween('2026-08-01', '2026-08-02')).toBe(1);
  });

  it('counts multiple nights', () => {
    expect(nightsBetween('2026-08-01', '2026-08-05')).toBe(4);
  });

  it('counts nights correctly across a month boundary', () => {
    expect(nightsBetween('2026-08-30', '2026-09-02')).toBe(3);
  });
});
