import { ZoomLevel } from '../models/work-order.model';

export interface TimelineColumn {
  label: string;       // Display label (e.g., "Mon 3", "Week 12", "Jan")
  date: Date;          // The date this column represents (start of period)
  isoDate: string;     // YYYY-MM-DD
}

/** Column width in pixels per zoom level */
export const COLUMN_WIDTH: Record<ZoomLevel, number> = {
  day: 48,
  week: 120,
  month: 160,
};

/** How many columns to render on each side of today */
const BUFFER: Record<ZoomLevel, number> = {
  day: 21,    // ±3 weeks
  week: 12,   // ±12 weeks
  month: 12,  // ±12 months
};

/** Start-of-day helper */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Start of ISO week (Monday) */
function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d);
  r.setDate(r.getDate() + diff);
  return startOfDay(r);
}

/** Start of month */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Format ISO date string from Date */
export function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Parse ISO date string to midnight local Date */
export function parseISODate(s: string): Date {
  const [y, m, day] = s.split('-').map(Number);
  return new Date(y, m - 1, day);
}

/** Add days */
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Generate columns for the timeline */
export function generateColumns(zoom: ZoomLevel, today: Date = new Date()): TimelineColumn[] {
  const buf = BUFFER[zoom];
  const columns: TimelineColumn[] = [];

  if (zoom === 'day') {
    const origin = startOfDay(today);
    for (let i = -buf; i <= buf; i++) {
      const d = addDays(origin, i);
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      // Short day label: "Mon 9" (omit month) to avoid header overlap at small widths
      columns.push({
        label: `${weekdays[d.getDay()]} ${d.getDate()}`,
        date: d,
        isoDate: toISODate(d),
      });
    }
  } else if (zoom === 'week') {
    const origin = startOfWeek(today);
    for (let i = -buf; i <= buf; i++) {
      const d = addDays(origin, i * 7);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      // ISO week number
      const jan4 = new Date(d.getFullYear(), 0, 4);
      const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);
      columns.push({
        label: `W${weekNum} · ${months[d.getMonth()]} ${d.getDate()}`,
        date: d,
        isoDate: toISODate(d),
      });
    }
  } else {
    // month
    const origin = startOfMonth(today);
    for (let i = -buf; i <= buf; i++) {
      const d = new Date(origin.getFullYear(), origin.getMonth() + i, 1);
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      columns.push({
        label: `${months[d.getMonth()]} ${d.getFullYear()}`,
        date: d,
        isoDate: toISODate(d),
      });
    }
  }

  return columns;
}

/**
 * Given a date string and the columns array, return the left pixel offset
 * and width in pixels for a work order bar.
 */
export function getBarStyle(
  startDate: string,
  endDate: string,
  columns: TimelineColumn[],
  zoom: ZoomLevel
): { left: number; width: number } | null {
  if (!columns.length) return null;

  const colW = COLUMN_WIDTH[zoom];
  const start = parseISODate(startDate).getTime();
  const end = parseISODate(endDate).getTime();
  const firstCol = columns[0].date.getTime();

  // ms per column
  const msPerCol = zoom === 'day' ? 86400000 :
    zoom === 'week' ? 7 * 86400000 :
      // For month, approximate using 30.44 days
      30.44 * 86400000;

  const left = ((start - firstCol) / msPerCol) * colW;
  const width = ((end - start) / msPerCol) * colW;

  return { left, width: Math.max(width, colW * 0.5) };
}

/**
 * Given a pixel offset from the left of the timeline grid, return the ISO date
 * it corresponds to.
 */
export function pixelToDate(
  px: number,
  columns: TimelineColumn[],
  zoom: ZoomLevel
): string {
  if (!columns.length) return toISODate(new Date());
  const colW = COLUMN_WIDTH[zoom];
  const colIndex = Math.floor(px / colW);
  const clamped = Math.max(0, Math.min(colIndex, columns.length - 1));
  return columns[clamped].isoDate;
}

/** Return the pixel offset of "today" from the left edge of the timeline */
export function getTodayOffset(columns: TimelineColumn[], zoom: ZoomLevel): number {
  const colW = COLUMN_WIDTH[zoom];
  const today = toISODate(new Date());
  const idx = columns.findIndex(c => c.isoDate === today);
  if (idx >= 0) return idx * colW;

  // Fallback: calculate from first column date
  const msPerCol = zoom === 'day' ? 86400000 :
    zoom === 'week' ? 7 * 86400000 : 30.44 * 86400000;
  const diff = new Date().getTime() - columns[0].date.getTime();
  return (diff / msPerCol) * colW;
}
