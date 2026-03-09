import { Component, Input, Output, EventEmitter, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZoomLevel } from '../../models/work-order.model';

@Component({
  selector: 'app-timeline-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-header.component.html',
  styleUrl: './timeline-header.component.scss',
})
export class TimelineHeaderComponent {
  @Input() zoom: ZoomLevel = 'day';
  @Output() zoomChange = new EventEmitter<ZoomLevel>();

  private readonly elRef = inject(ElementRef);
  readonly dropdownOpen = signal(false);

  readonly zoomOptions: { label: string; value: ZoomLevel }[] = [
    { label: 'Day',   value: 'day' },
    { label: 'Week',  value: 'week' },
    { label: 'Month', value: 'month' },
  ];

  get activeLabel(): string {
    const map: Record<ZoomLevel, string> = { day: 'Day', week: 'Week', month: 'Month' };
    return map[this.zoom];
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  select(value: ZoomLevel): void {
    this.zoomChange.emit(value);
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(e.target)) {
      this.dropdownOpen.set(false);
    }
  }
}
