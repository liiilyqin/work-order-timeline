import { Injectable, signal, computed } from '@angular/core';
import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument, ZoomLevel, PanelMode } from '../models/work-order.model';
import { SAMPLE_WORK_CENTERS, SAMPLE_WORK_ORDERS } from '../data/sample-data';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  // --- State ---
  readonly workCenters = signal<WorkCenterDocument[]>([...SAMPLE_WORK_CENTERS]);
  readonly workOrders = signal<WorkOrderDocument[]>([...SAMPLE_WORK_ORDERS]);
  readonly zoomLevel = signal<ZoomLevel>('month');
  readonly panelMode = signal<PanelMode | null>(null);

  // --- Derived ---
  readonly workOrdersByCenter = computed(() => {
    const map = new Map<string, WorkOrderDocument[]>();
    for (const wc of this.workCenters()) {
      map.set(wc.docId, []);
    }
    for (const wo of this.workOrders()) {
      const list = map.get(wo.data.workCenterId);
      if (list) list.push(wo);
    }
    return map;
  });

  // --- Actions ---
  setZoomLevel(level: ZoomLevel): void {
    this.zoomLevel.set(level);
  }

  openCreatePanel(workCenterId: string, startDate: string): void {
    this.panelMode.set({ type: 'create', workCenterId, startDate });
  }

  openEditPanel(workOrder: WorkOrderDocument): void {
    this.panelMode.set({ type: 'edit', workOrder });
  }

  closePanel(): void {
    this.panelMode.set(null);
  }

  addWorkOrder(wo: WorkOrderDocument): void {
    this.workOrders.update(list => [...list, wo]);
  }

  updateWorkOrder(updated: WorkOrderDocument): void {
    this.workOrders.update(list =>
      list.map(wo => (wo.docId === updated.docId ? updated : wo))
    );
  }

  deleteWorkOrder(docId: string): void {
    this.workOrders.update(list => list.filter(wo => wo.docId !== docId));
  }

  /**
   * Check if a work order overlaps with any existing orders on the same work center.
   * excludeId: skip checking against this order (used during edit).
   */
  hasOverlap(workCenterId: string, startDate: string, endDate: string, excludeId?: string): boolean {
    const orders = this.workOrders().filter(
      wo => wo.data.workCenterId === workCenterId && wo.docId !== excludeId
    );
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return orders.some(wo => {
      const s = new Date(wo.data.startDate).getTime();
      const e = new Date(wo.data.endDate).getTime();
      // Overlap: start < e && end > s
      return start < e && end > s;
    });
  }

  generateId(): string {
    return 'wo-' + Math.random().toString(36).slice(2, 9);
  }
}
