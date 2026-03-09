import {
  Component, Input, inject, signal, HostListener, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderDocument, ZoomLevel } from '../../models/work-order.model';
import { TimelineColumn, getBarStyle, COLUMN_WIDTH } from '../../services/timeline.utils';
import { WorkOrderService } from '../../services/work-order.service';

@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-order-bar.component.html',
  styleUrl: './work-order-bar.component.scss',
})
export class WorkOrderBarComponent {
  @Input({ required: true }) workOrder!: WorkOrderDocument;
  @Input({ required: true }) columns!: TimelineColumn[];
  @Input({ required: true }) zoom!: ZoomLevel;

  private readonly svc = inject(WorkOrderService);
  readonly elRef = inject(ElementRef);

  readonly menuOpen = signal(false);
  readonly hovered  = signal(false);

  // Recompute on each change detection to reflect plain @Input object updates
  barStyle(): Record<string, string> {
    const style = getBarStyle(
      this.workOrder.data.startDate,
      this.workOrder.data.endDate,
      this.columns,
      this.zoom
    );
    if (!style) return {};
    return {
      left: `${style.left}px`,
      width: `${style.width}px`,
    };
  }

  statusClass(): string { return `bar--${this.workOrder.data.status}`; }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  onEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.set(false);
    this.svc.openEditPanel(this.workOrder);
  }

  onDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.set(false);
    this.svc.deleteWorkOrder(this.workOrder.docId);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.menuOpen.set(false);
    }
  }
}
