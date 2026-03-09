import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

/** Custom date formatter that displays/parses dates as MM.DD.YYYY */
@Injectable()
export class DotDateFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct | null {
    if (!value) return null;
    const parts = value.trim().split('.');
    if (parts.length !== 3) return null;
    const [m, d, y] = parts.map(Number);
    if (!m || !d || !y || isNaN(m) || isNaN(d) || isNaN(y)) return null;
    return { year: y, month: m, day: d };
  }

  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    return [
      String(date.month).padStart(2, '0'),
      String(date.day).padStart(2, '0'),
      String(date.year),
    ].join('.');
  }
}
