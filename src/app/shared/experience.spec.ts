import { YearsPipe, yearsOfExperience } from './experience';

describe('yearsOfExperience', () => {
  it('counts whole years since March 2019', () => {
    expect(yearsOfExperience(new Date(2026, 9, 31))).toBe(7);
    expect(yearsOfExperience(new Date(2027, 1, 28))).toBe(7);
    expect(yearsOfExperience(new Date(2027, 2, 1))).toBe(8);
  });

  it('YearsPipe replaces every %YEARS% token', () => {
    const out = new YearsPipe().transform('%YEARS%+ years, %YEARS% total');
    expect(out).not.toContain('%YEARS%');
  });
});
