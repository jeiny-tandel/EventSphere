import dayjs from 'dayjs';

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Formats an event's start and end schedule cleanly:
 * - Same date & different times: "Feb 20, 2027 · 10:00 AM – 8:00 PM"
 * - Same date & same time: "Feb 20, 2027"
 * - Different dates: "Feb 20, 2027 – Feb 22, 2027"
 */
export function formatEventDateRange(
  startDate?: string,
  endDate?: string,
): string {
  if (!startDate) return 'Date TBA';

  const start = dayjs(startDate);
  if (!start.isValid()) return 'Invalid date';

  const startDateStr = start.format('MMM D, YYYY');
  if (!endDate) return startDateStr;

  const end = dayjs(endDate);
  if (!end.isValid()) return startDateStr;

  const isSameDay = start.isSame(end, 'day');
  const isSameTime = start.format('HH:mm') === end.format('HH:mm');

  if (isSameDay) {
    if (isSameTime) {
      return startDateStr;
    }
    return `${startDateStr} · ${start.format('h:mm A')} – ${end.format('h:mm A')}`;
  }

  return `${startDateStr} – ${end.format('MMM D, YYYY')}`;
}

export function isMultiDayEvent(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return false;
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return start.isValid() && end.isValid() && !start.isSame(end, 'day');
}

export function formatTime(dateString?: string): string | null {
  if (!dateString) return null;
  const parsed = dayjs(dateString);
  return parsed.isValid() ? parsed.format('h:mm A') : null;
}
