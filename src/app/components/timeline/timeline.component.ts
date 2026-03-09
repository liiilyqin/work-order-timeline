import {
  Component, OnInit, computed, inject, signal, HostListener, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderService } from '../../services/work-order.service';
import { generateColumns, COLUMN_WIDTH, getTodayOffset, TimelineColumn, toISODate } from '../../services/timeline.utils';
import { ZoomLevel } from '../../models/work-order.model';
import { TimelineHeaderComponent } from '../timeline-header/timeline-header.component';
import { TimelineRowComponent } from '../timeline-row/timeline-row.component';
import { WorkOrderPanelComponent } from '../work-order-panel/work-order-panel.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    CommonModule,
    TimelineHeaderComponent,
    TimelineRowComponent,
    WorkOrderPanelComponent,
  ],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent implements OnInit {
  readonly svc = inject(WorkOrderService);
  readonly elRef = inject(ElementRef);

  readonly zoom = this.svc.zoomLevel;
  readonly panelMode = this.svc.panelMode;
  readonly workCenters = this.svc.workCenters;

  // Expose COLUMN_WIDTH for template binding
  readonly COLUMN_WIDTH = COLUMN_WIDTH;

  // Tracks which work-center row is currently hovered (syncs left-panel highlight)
  readonly hoveredWcId = signal<string | null>(null);

  // Columns re-generated whenever zoom changes
  readonly columns = computed<TimelineColumn[]>(() => generateColumns(this.zoom()));

  readonly totalGridWidth = computed(() =>
    this.columns().length * COLUMN_WIDTH[this.zoom()]
  );

  readonly todayOffset = computed(() =>
    getTodayOffset(this.columns(), this.zoom())
  );

  /**
   * The ISO date string of the "current period" column to highlight.
   * Day → today's date, Week → start of this week, Month → start of this month.
   */
  readonly currentPeriodIso = computed<string>(() => {
    const now = new Date();
    const zoom = this.zoom();
    if (zoom === 'day') return toISODate(now);
    if (zoom === 'week') {
      const day = now.getDay(); // 0=Sun
      const diff = day === 0 ? -6 : 1 - day;
      const mon = new Date(now); mon.setDate(now.getDate() + diff);
      return toISODate(mon);
    }
    // month
    return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  });

  readonly currentPeriodLabel = computed<string>(() => {
    const map: Record<string, string> = { day: 'Today', week: 'Current week', month: 'Current month' };
    return map[this.zoom()];
  });

  /** Left-edge pixel offset of the current period column (for the full-height background band) */
  readonly currentColumnLeft = computed(() => {
    const idx = this.columns().findIndex(c => c.isoDate === this.currentPeriodIso());
    return idx < 0 ? 0 : idx * COLUMN_WIDTH[this.zoom()];
  });

  /** Create subtle month-wide vertical tint stripes by grouping consecutive columns by month */
  readonly monthStripes = computed(() => {
    const cols = this.columns();
    const colW = COLUMN_WIDTH[this.zoom()];
    if (!cols.length) return {} as Record<string,string>;

    type Group = { start: number; end: number };
    const groups: Group[] = [];
    let start = 0;
    let curMonth = cols[0].date.getMonth();
    let curYear = cols[0].date.getFullYear();
    for (let i = 1; i < cols.length; i++) {
      const d = cols[i].date;
      if (d.getMonth() !== curMonth || d.getFullYear() !== curYear) {
        groups.push({ start, end: i - 1 });
        start = i;
        curMonth = d.getMonth();
        curYear = d.getFullYear();
      }
    }
    groups.push({ start, end: cols.length - 1 });

    const layers: string[] = [];
    const sizes: string[] = [];
    const positions: string[] = [];

    for (const g of groups) {
      const left = g.start * colW;
      const width = (g.end - g.start + 1) * colW;
      // use subtle gray tint for month stripes
      layers.push('linear-gradient(90deg, rgba(0,0,0,0.04) 0 100%)');
      sizes.push(`${width}px 100%`);
      positions.push(`${left}px 0`);
    }

    return {
      'background-image': layers.join(', '),
      'background-size': sizes.join(', '),
      'background-position': positions.join(', '),
      'background-repeat': 'no-repeat'
    } as Record<string,string>;
  });

  ngOnInit(): void {
    // Scroll to center on today after view renders
    setTimeout(() => this.scrollToToday(), 50);
  }

  scrollToToday(): void {
    const grid = this.elRef.nativeElement.querySelector('.timeline-grid-scroll');
    if (!grid) return;
    const colW = COLUMN_WIDTH[this.zoom()];
    const halfView = grid.clientWidth / 2;
    grid.scrollLeft = this.todayOffset() - halfView + colW / 2;
  }

  onZoomChange(level: ZoomLevel): void {
    this.svc.setZoomLevel(level);
    setTimeout(() => this.scrollToToday(), 50);
  }

  /** Called by timeline-row on mouseenter/mouseleave to keep left panel in sync */
  onRowHover(wcId: string, hovered: boolean): void {
    this.hoveredWcId.set(hovered ? wcId : null);
  }

  closePanel(): void {
    this.svc.closePanel();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.svc.closePanel();
  }
}
