import { Pipe, PipeTransform } from '@angular/core';

/** First day of full-time professional work (SalesTrendz, March 2019). */
export const CAREER_START = new Date(2019, 2, 1);

/** Whole years of professional experience as of `today` – updates itself every year. */
export function yearsOfExperience(today: Date = new Date()): number {
  let years = today.getFullYear() - CAREER_START.getFullYear();
  const anniversaryPassed =
    today.getMonth() > CAREER_START.getMonth() ||
    (today.getMonth() === CAREER_START.getMonth() && today.getDate() >= CAREER_START.getDate());
  if (!anniversaryPassed) years--;
  return years;
}

/**
 * Replaces the `%YEARS%` token in translated copy with the live years-of-experience value,
 * so the site never needs a yearly content update.
 *   {{ 'Banner.Description' | translate | years }}
 */
@Pipe({ name: 'years', standalone: true })
export class YearsPipe implements PipeTransform {
  private readonly years = yearsOfExperience();

  transform(value: string | null | undefined): string {
    return typeof value === 'string' ? value.replace(/%YEARS%/g, String(this.years)) : value ?? '';
  }
}
