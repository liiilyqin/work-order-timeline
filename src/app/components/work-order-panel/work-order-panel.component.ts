import {
  Component, Input, Output, EventEmitter, OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  NgbDatepickerModule, NgbDateStruct
} from '@ng-bootstrap/ng-bootstrap';
import { PanelMode, WorkOrderStatus } from '../../models/work-order.model';
import { WorkOrderService } from '../../services/work-order.service';

interface StatusOption { label: string; value: WorkOrderStatus; }

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule],
  templateUrl: './work-order-panel.component.html',
  styleUrl: './work-order-panel.component.scss',
})
export class WorkOrderPanelComponent implements OnInit {
  @Input({ required: true }) mode!: PanelMode;
  @Output() close = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(WorkOrderService);

  readonly statusOptions: StatusOption[] = [
    { label: 'Open',        value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Complete',    value: 'complete' },
    { label: 'Blocked',     value: 'blocked' },
  ];

  form!: FormGroup;
  overlapError = false;
  submitted = false;

  get isEdit(): boolean   { return this.mode.type === 'edit'; }
  get submitLabel(): string { return this.isEdit ? 'Save' : 'Create'; }

  // Expose selected status for badge styling
  get selectedStatus(): WorkOrderStatus {
    return this.form?.get('status')?.value ?? 'open';
  }

  ngOnInit(): void { this.buildForm(); }

  private buildForm(): void {
    let name = '';
    let status: WorkOrderStatus = 'open';
    let startDate: NgbDateStruct | null = null;
    let endDate: NgbDateStruct | null = null;

    if (this.isEdit && this.mode.workOrder) {
      const d = this.mode.workOrder.data;
      name = d.name;  status = d.status;
      startDate = this.isoToNgb(d.startDate);
      endDate   = this.isoToNgb(d.endDate);
    } else if (this.mode.startDate) {
      startDate = this.isoToNgb(this.mode.startDate);
      endDate   = this.isoToNgb(this.addDays(this.mode.startDate, 7));
    }

    this.form = this.fb.group(
      {
        name:      [name,      [Validators.required]],
        status:    [status,    Validators.required],
        endDate:   [endDate,   Validators.required],   // End date first (matches design)
        startDate: [startDate, Validators.required],
      },
      { validators: this.endAfterStart }
    );
  }

  private endAfterStart(g: AbstractControl): ValidationErrors | null {
    const start = g.get('startDate')?.value as NgbDateStruct | null;
    const end   = g.get('endDate')?.value   as NgbDateStruct | null;
    if (!start || !end) return null;
    const s = new Date(start.year, start.month - 1, start.day);
    const e = new Date(end.year,   end.month - 1,   end.day);
    return e <= s ? { endBeforeStart: true } : null;
  }

  onSubmit(): void {
    this.submitted = true;
    this.overlapError = false;
    if (this.form.invalid) return;

    const val = this.form.value;
    const startIso = this.ngbToIso(val.startDate);
    const endIso   = this.ngbToIso(val.endDate);
    const workCenterId = this.isEdit
      ? this.mode.workOrder!.data.workCenterId
      : this.mode.workCenterId!;
    const excludeId = this.isEdit ? this.mode.workOrder!.docId : undefined;

    if (this.svc.hasOverlap(workCenterId, startIso, endIso, excludeId)) {
      this.overlapError = true;  return;
    }

    if (this.isEdit) {
      this.svc.updateWorkOrder({
        ...this.mode.workOrder!,
        data: { ...this.mode.workOrder!.data, name: val.name, status: val.status, startDate: startIso, endDate: endIso },
      });
    } else {
      this.svc.addWorkOrder({
        docId: this.svc.generateId(), docType: 'workOrder',
        data: { name: val.name, status: val.status, workCenterId, startDate: startIso, endDate: endIso },
      });
    }
    this.close.emit();
  }

  onCancel(): void { this.close.emit(); }
  onPanelClick(e: MouseEvent): void { e.stopPropagation(); }

  // ── Helpers ──────────────────────────────────────
  private isoToNgb(iso: string): NgbDateStruct {
    const [y, m, d] = iso.split('-').map(Number);
    return { year: y, month: m, day: d };
  }
  private ngbToIso(d: NgbDateStruct): string {
    return `${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`;
  }
  private addDays(iso: string, n: number): string {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    return dt.toISOString().split('T')[0];
  }

  get nameCtrl()      { return this.form.get('name')!; }
  get statusCtrl()    { return this.form.get('status')!; }
  get startDateCtrl() { return this.form.get('startDate')!; }
  get endDateCtrl()   { return this.form.get('endDate')!; }

  /** Format NgbDateStruct → "MM.DD.YYYY" string for display */
  formatNgbDate(val: NgbDateStruct | null): string {
    if (!val || typeof val !== 'object') return '';
    return [
      String(val.month).padStart(2, '0'),
      String(val.day).padStart(2, '0'),
      String(val.year),
    ].join('.');
  }
}
