export function getWeekDateRange(weekNumber: number, year: number): string {
  // L'année commence le 1er janvier
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Trouve le premier lundi de l'année
  const daysOffset = firstDayOfYear.getDay() === 0 ? 1 : (8 - firstDayOfYear.getDay());
  const firstMonday = new Date(year, 0, 1 + daysOffset);
  
  // Si le 1er janvier est un lundi, mardi, mercredi ou jeudi, la semaine 1 commence le 1er janvier ou le lundi précédent
  // C'est la norme ISO 8601
  const firstDayOfFirstWeek = new Date(firstDayOfYear);
  if (firstDayOfYear.getDay() <= 4 && firstDayOfYear.getDay() !== 0) {
      firstDayOfFirstWeek.setDate(firstDayOfYear.getDate() - (firstDayOfYear.getDay() - 1));
  } else {
      firstDayOfFirstWeek.setDate(firstMonday.getDate());
  }

  // Calcule le début de la semaine ciblée
  const startOfWeek = new Date(firstDayOfFirstWeek);
  startOfWeek.setDate(startOfWeek.getDate() + (weekNumber - 1) * 7);

  // Calcule la fin de la semaine (Dimanche)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  
  return `${startOfWeek.toLocaleDateString('fr-FR', formatOptions)} - ${endOfWeek.toLocaleDateString('fr-FR', formatOptions)}`;
}
