import {
  Component, Input, Output, EventEmitter, inject, computed, signal, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkCenterDocument } from '../../models/work-center.model';
import { WorkOrderDocument, ZoomLevel } from '../../models/work-order.model';
import { TimelineColumn, pixelToDate } from '../../services/timeline.utils';
import { WorkOrderService } from '../../services/work-order.service';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';

@Component({
  selector: 'app-timeline-row',
  standalone: true,
  imports: [CommonModule, WorkOrderBarComponent],
  templateUrl: './timeline-row.component.html',
  styleUrl: './timeline-row.component.scss',
})
export class TimelineRowComponent {
  @Input({ required: true }) workCenter!: WorkCenterDocument;
  @Input({ required: true }) columns!: TimelineColumn[];
  @Input({ required: true }) zoom!: ZoomLevel;
  /** Emits true on mouseenter, false on mouseleave — used to sync left-panel highlight */
  @Output() hoverChange = new EventEmitter<boolean>();

  private readonly svc = inject(WorkOrderService);
  readonly elRef = inject(ElementRef);

  readonly hovered    = signal(false);
  readonly tooltipX   = signal<number | null>(null);
  readonly overBar    = signal(false);

  readonly workOrders = computed<WorkOrderDocument[]>(() =>
    this.svc.workOrdersByCenter().get(this.workCenter.docId) ?? []
  );

  onMouseMove(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this.overBar.set(!!target.closest('app-work-order-bar'));
    const rowEl = this.elRef.nativeElement.querySelector('.timeline-row__bars');
    if (!rowEl) return;
    const rect = rowEl.getBoundingClientRect();
    this.tooltipX.set(event.clientX - rect.left);
  }

  onRowClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('app-work-order-bar')) return;

    const rowEl = this.elRef.nativeElement.querySelector('.timeline-row__bars');
    if (!rowEl) return;
    const rect = rowEl.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const date = pixelToDate(px, this.columns, this.zoom);
    this.svc.openCreatePanel(this.workCenter.docId, date);
  }
}
