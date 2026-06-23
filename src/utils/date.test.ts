import { describe, it, expect } from 'vitest';
import { getWeekDateRange, getDateForDayOfWeek } from './date';

describe('Date Utilities', () => {
  it('getWeekDateRange should return correct format', () => {
    // La semaine 1 de 2024 commence le 1er janvier
    const range = getWeekDateRange(1, 2024);
    expect(range).toBe('1 janv. - 7 janv.');
  });

  it('getDateForDayOfWeek should return correct dates for days', () => {
    // Lundi de la semaine 1 de 2024
    const monday = getDateForDayOfWeek(1, 2024, 'MONDAY');
    expect(monday).toBe('01/01');

    // Vendredi
    const friday = getDateForDayOfWeek(1, 2024, 'FRIDAY');
    expect(friday).toBe('05/01');
  });
});
