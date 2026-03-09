import { WorkCenterDocument } from '../models/work-center.model';
import { WorkOrderDocument } from '../models/work-order.model';

// Center sample data around today
const today = new Date();
const fmt = (d: Date): string => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number): Date => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

export const SAMPLE_WORK_CENTERS: WorkCenterDocument[] = [
  { docId: 'wc-1', docType: 'workCenter', data: { name: 'Genesis Hardware' } },
  { docId: 'wc-2', docType: 'workCenter', data: { name: 'Rodriques Electrics' } },
  { docId: 'wc-3', docType: 'workCenter', data: { name: 'Konsulting Inc' } },
  { docId: 'wc-4', docType: 'workCenter', data: { name: 'McMarrow Distribution' } },
  { docId: 'wc-5', docType: 'workCenter', data: { name: 'Spartan Manufacturing' } },
];

export const SAMPLE_WORK_ORDERS: WorkOrderDocument[] = [
  // Genesis Hardware — complete (past) + open (spans today)
  {
    docId: 'wo-1',
    docType: 'workOrder',
    data: {
      name: 'Konsulting Inc',
      workCenterId: 'wc-1',
      status: 'complete',
      startDate: fmt(addDays(today, -90)),
      endDate: fmt(addDays(today, -45)),
    },
  },
  {
    docId: 'wo-2',
    docType: 'workOrder',
    data: {
      name: 'Spartan Manufacturing',
      workCenterId: 'wc-1',
      status: 'open',
      startDate: fmt(addDays(today, -20)),
      endDate: fmt(addDays(today, 40)),
    },
  },
  // Rodriques Electrics — blocked spanning past through future
  {
    docId: 'wo-3',
    docType: 'workOrder',
    data: {
      name: 'Rodriques Electrics',
      workCenterId: 'wc-2',
      status: 'blocked',
      startDate: fmt(addDays(today, -50)),
      endDate: fmt(addDays(today, 40)),
    },
  },
  // Konsulting Inc — in-progress, spans today
  {
    docId: 'wo-4',
    docType: 'workOrder',
    data: {
      name: 'Konsulting Inc',
      workCenterId: 'wc-3',
      status: 'in-progress',
      startDate: fmt(addDays(today, -70)),
      endDate: fmt(addDays(today, 20)),
    },
  },
  // McMarrow Distribution — blocked, starting soon
  {
    docId: 'wo-5',
    docType: 'workOrder',
    data: {
      name: 'McMarrow Distribution',
      workCenterId: 'wc-4',
      status: 'blocked',
      startDate: fmt(addDays(today, 10)),
      endDate: fmt(addDays(today, 70)),
    },
  },
  // Spartan Manufacturing — complete (past) + in-progress (current)
  {
    docId: 'wo-6',
    docType: 'workOrder',
    data: {
      name: 'Genesis Hardware',
      workCenterId: 'wc-5',
      status: 'complete',
      startDate: fmt(addDays(today, -130)),
      endDate: fmt(addDays(today, -70)),
    },
  },
  {
    docId: 'wo-7',
    docType: 'workOrder',
    data: {
      name: 'Spartan Manufacturing',
      workCenterId: 'wc-5',
      status: 'in-progress',
      startDate: fmt(addDays(today, -30)),
      endDate: fmt(addDays(today, 45)),
    },
  },
];
