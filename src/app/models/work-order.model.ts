export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';

export interface WorkOrderDocument {
  docId: string;
  docType: 'workOrder';
  data: {
    name: string;
    workCenterId: string;
    status: WorkOrderStatus;
    startDate: string; // ISO format "YYYY-MM-DD"
    endDate: string;   // ISO format "YYYY-MM-DD"
  };
}

export type ZoomLevel = 'day' | 'week' | 'month';

export interface PanelMode {
  type: 'create' | 'edit';
  workCenterId?: string;
  startDate?: string;
  workOrder?: WorkOrderDocument;
}
