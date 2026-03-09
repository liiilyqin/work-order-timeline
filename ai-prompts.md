# AI-Assisted Development Prompts

This file documents the key prompts used during AI-assisted development of the Work Order Schedule Timeline, along with the decisions and rationale behind each step.

---

## Prompt 1 — Implementation Planning

**Purpose:** Analyze requirements and produce a structured implementation roadmap before writing any code.

**Optimized Prompt:**
> Read `challenge.md` carefully and produce a full implementation plan for the Work Order Schedule Timeline. For each requirement, identify the Angular component responsible, the data structures needed, and any technical constraints. Then propose a step-by-step build order following the hints in the document (static render → bars → zoom → create → edit → validation → polish). Flag any ambiguous requirements upfront.

**Key Decisions Made:**
- **Angular Signals over RxJS** — The service layer uses `signal()` and `computed()` instead of `BehaviorSubject`. Simpler to reason about, no subscription management, and Angular 17's signal-based reactivity is fine-grained without the boilerplate.
- **Standalone components** — Every component uses `standalone: true` as recommended by the spec. No NgModule needed.
- **Document-based model** — Followed the `{ docId, docType, data }` wrapper from the spec exactly, enabling easy extension to other document types later.
- **`timeline.utils.ts` as pure functions** — All date/pixel math lives in a side-effect-free utility file. Easy to unit-test independently of Angular.
- **Build order follows spec hints** — Static grid first, then bars, then interactivity. Each step is independently runnable and reviewable.

---

## Prompt 2 — Framework Implementation

**Purpose:** Scaffold all components, services, and data in one pass, following the agreed architecture.

**Optimized Prompt:**
> Implement the full Angular 17 project structure for the Work Order Schedule Timeline based on the approved plan. Use standalone components, Angular Signals for state management, and strict TypeScript. Create the following in order:
> 1. TypeScript models (`WorkOrderDocument`, `WorkCenterDocument`, `ZoomLevel`, `PanelMode`)
> 2. Sample data (6 work centers, 9 work orders, all 4 statuses, dates relative to today)
> 3. `WorkOrderService` with signals for state (workOrders, workCenters, zoomLevel, panelMode), CRUD actions, and overlap detection
> 4. `timeline.utils.ts` with column generation, bar pixel positioning (`left = (startMs - firstColMs) / msPerCol * colWidth`), and `pixelToDate` for click-to-create
> 5. All 5 components with templates, SCSS, and wiring
>
> Implement overlap detection using the standard interval formula: `newStart < existingEnd && newEnd > existingStart`.

**Key Decisions Made:**
- **Pixel-based bar positioning** — Bar `left` and `width` are calculated as: `(date - firstColumn) / msPerColumn * columnWidth`. Month zoom approximates 30.44 days/column for proportional rendering.
- **Overlap formula** — Two intervals `[A, B]` and `[C, D]` overlap when `A < D && B > C`. Used in `WorkOrderService.hasOverlap()` with an `excludeId` param to support edit-without-self-overlap.
- **Relative sample dates** — All sample data dates are calculated relative to `new Date()` so the data always appears near the current date regardless of when the app is run.
- **Single panel component, two modes** — One `WorkOrderPanelComponent` handles both create and edit via a `mode: 'create' | 'edit'` flag. Form is reset/pre-populated on open. Reduces code duplication.
- **`pixelToDate`** — Converts a mouse `clientX` offset into an ISO date string, used to pre-fill the start date when clicking an empty row.

---

## Prompt 3 — Pixel-Perfect Design Pass

**Purpose:** Cross-check the running app against all design screenshots and close the visual gap systematically.

**Optimized Prompt:**
> I have 8 design screenshots in `uiux/`. Read every image carefully and compare them against the current implementation. For each visual discrepancy, list the exact change needed (component, property, value). Then implement all changes in this order:
> 1. Header: NAOLOGIC logo + replace native `<select>` with a custom indigo pill dropdown
> 2. Timeline grid: replace the today vertical line with a full-height column background highlight (`#f0f0ff`) and a "Current month/week/Today" label
> 3. Panel: move Cancel/Create buttons to the top header alongside the title; add subtitle text; reorder fields to End date → Start date; replace inline `<ngb-datepicker>` with popup mode + custom `MM.DD.YYYY` formatter
> 4. Work order bars: three-dot menu visible only on hover; status badge right-aligned; colors matched to design tokens
> 5. Row: "Click to add dates" pill tooltip that follows the mouse over empty areas

**Key Decisions Made:**
- **Custom `NgbDateParserFormatter`** — Provided at component level to format dates as `MM.DD.YYYY` (dots, not slashes). The formatter implements `parse()` and `format()` so the input field and form control stay in sync with `NgbDateStruct`.
- **Panel buttons in header** — Matches the Sketch design exactly. Removes the need for a sticky footer, simplifies panel scroll behavior.
- **Three-dot menu hover-only** — Bar component tracks `hovered` signal; menu button renders only when `hovered() || menuOpen()`. This keeps the bar clean while keeping the menu accessible if the dropdown is already open.
- **Current period column highlight** — `currentPeriodIso` computed signal returns the ISO key of the column to highlight (today for Day, week start for Week, month start for Month). The full-height `current-period-band` div is positioned absolutely behind the rows using `z-index: 1`.
- **"Click to add dates" tooltip** — Tracks `mousemove` on the row to update `tooltipX` signal; suppressed when hovering over an existing bar (`overBar` signal). Positioned with `transform: translateX(-50%)` to center on cursor.

---

## Prompt 4 — Project Bootstrap & Architecture

**Context:** Starting the project. Need to scaffold the Angular 17 app with the exact stack required by the challenge.

**Prompt:**

> I'm building a Work Order Schedule Timeline for a manufacturing ERP system as a frontend take-home challenge. The stack is fixed: Angular 17+ standalone components, TypeScript strict mode, SCSS, Reactive Forms, `@ng-select/ng-select`, and `@ng-bootstrap/ng-bootstrap` (specifically `ngb-datepicker`).
>
> Help me scaffold the project architecture. I need:
> 1. TypeScript interfaces for `WorkCenterDocument` and `WorkOrderDocument` (follow the `{ docId, docType, data: {...} }` pattern from the spec)
> 2. A `WorkOrderStatus` type union: `'open' | 'in-progress' | 'complete' | 'blocked'`
> 3. A `PanelMode` discriminated union that handles both `create` and `edit` modes in a single panel component (create carries `workCenterId` and optional `startDate`; edit carries the full `WorkOrderDocument`)
> 4. A `WorkOrderService` with in-memory signals-based state: `workCenters` signal, `workOrders` signal, and methods `addWorkOrder`, `updateWorkOrder`, `deleteWorkOrder`, `hasOverlap`, and `generateId`
> 5. A plan for which Angular components I need and what each one is responsible for
>
> Keep everything as Angular standalone components. Use `signal()` and `computed()` from `@angular/core` for reactive state. No NgRx needed.

**What this produced:**
- `src/app/models/work-order.model.ts` — full type definitions
- `src/app/services/work-order.service.ts` — signals-based state service with overlap detection
- Component breakdown: `AppComponent` → `TimelineHeaderComponent`, `TimelineComponent` → `TimelineRowComponent` → `WorkOrderBarComponent`, `WorkOrderPanelComponent`
- `src/app/data/sample-data.ts` with 5 work centers and 8+ work orders across all 4 statuses

---

## Prompt 5 — Timeline Grid, Zoom Levels & Bar Positioning

**Context:** The most technically complex part — converting dates to pixel positions and generating the right column headers for each zoom level.

**Prompt:**

> I'm implementing the timeline grid for my Angular work order scheduler. I need help with three related problems:
>
> **1. Column generation** — Write a `generateColumns()` method that, given a `ZoomLevel` (`'day' | 'week' | 'month'`), produces an array of column objects. Each column needs: `isoDate` (ISO string of the period's start), `label` (display string), and `width` (px number). Use these widths: day = 52px, week = 120px, month = 160px. Generate enough columns to cover ±90 days (day view), ±26 weeks (week view), or ±18 months (month view) centered on today.
>
> **2. Bar pixel positioning** — Given a work order's `startDate` and `endDate` ISO strings and the current column array, calculate `left` (px offset from grid start) and `width` (px span). The formula should be: find which column the date falls in, then account for the partial day offset within that column.
>
> **3. Scroll-to-today on load** — On init, I need to scroll the timeline container so today's date is visible near the left third of the viewport. Write an `afterNextRender` / `setTimeout` approach that reads the container's `scrollWidth` and scrolls to the correct offset.
>
> All logic should live in `timeline.component.ts`. The grid header and rows both use the same `columns` computed signal. The left panel (work center names) must stay fixed while the right grid scrolls horizontally — use a CSS approach with `position: sticky` or a two-column flex layout where only the right side overflows.

**What this produced:**
- `generateColumns()` using `Date` arithmetic for all three zoom levels
- `barStyle()` computed function returning `{ left: 'Xpx', width: 'Xpx' }` CSS object
- `currentPeriodIso` computed signal for highlighting today's column
- Synchronized scroll between header and rows using a shared scroll container
- `scrollToToday()` using `afterNextRender` + `queueMicrotask` to avoid ExpressionChanged errors

**Key insight from response:** For week columns, use ISO week logic (Monday-anchored); for month columns, always use the 1st of the month as the `isoDate` key. This keeps overlap detection and column lookup consistent regardless of what day the user opens the app.

---

## Prompt 6 — Work Order Panel: Forms, ngb-datepicker & ng-select

**Context:** Building the slide-out create/edit panel with reactive forms. The `ngb-datepicker` popup mode and `ng-select` status dropdown both needed careful setup.

**Prompt:**

> I'm building a work order create/edit panel in Angular 17 using Reactive Forms. The panel is a single component that handles both modes via a `PanelMode` discriminated union input. Help me implement the following:
>
> **Form setup:**
> - Fields: `name` (required text), `status` (required, `WorkOrderStatus`), `startDate` (required `NgbDateStruct`), `endDate` (required `NgbDateStruct`)
> - Cross-field validator `endAfterStart` that returns `{ endBeforeStart: true }` when end ≤ start
> - Pre-fill from `mode.workOrder.data` when in edit mode; pre-fill `startDate` from `mode.startDate` and `endDate` to `startDate + 7 days` when in create mode with a clicked date
>
> **ngb-datepicker popup mode:**
> - Use the `ngbDatepicker` directive on a readonly `<input>` with `formControlName` (NOT the inline `<ngb-datepicker>` component)
> - Display format should be `MM.DD.YYYY` — implement a custom `NgbDateParserFormatter` subclass
> - The formatter must be provided at the **application root** level in `app.config.ts` (not component-level) so the directive picks it up via DI. Component-level providers are not reliably resolved by the directive's internal injector when it acts as a Control Value Accessor
>
> **ng-select status dropdown:**
> - Options: Open, In Progress, Complete, Blocked (mapping to status union values)
> - Show a colored status badge inside each option using `ng-option-tmp` template
> - Show the selected status badge in the trigger using `ng-label-tmp` template
> - The selected option highlight color should be light indigo (`#eef2ff`) — override via `::ng-deep`
>
> **Overlap detection on submit:**
> - Call `WorkOrderService.hasOverlap(workCenterId, startIso, endIso, excludeId?)` before saving
> - If overlap, set `overlapError = true` and return early (don't close panel)
> - Clear `overlapError` on each submit attempt before re-checking

**What this produced:**
- Complete `work-order-panel.component.ts` with `buildForm()`, `endAfterStart` validator, `onSubmit()`, and `formatNgbDate()` helper
- `src/app/services/dot-date-formatter.ts` — injectable `NgbDateParserFormatter` subclass for `MM.DD.YYYY`
- `app.config.ts` updated with root-level `{ provide: NgbDateParserFormatter, useClass: DotDateFormatter }`
- Panel HTML with `ngbDatepicker` popup inputs, SVG calendar icons, ng-select with badge templates
- SCSS using a `$statuses` token map with `@each` loop for badge color variants

**Key gotcha resolved:** The Angular `ngbDatepicker` directive implements `ControlValueAccessor`. Its `writeValue()` is called during reactive form patch/init and uses the injected `NgbDateParserFormatter` for display. When the formatter is provided only at the component level, the directive's own injector (which is a child injector of the directive's host component, not the panel component) may resolve a different instance — specifically the default ISO formatter. Providing at app root ensures all `ngbDatepicker` instances app-wide share the same `DotDateFormatter`.

---

## Prompt 7 — Pixel-Perfect Design Pass (Visual QA)

**Context:** All functionality was working. This prompt drove the final visual pass to match the Sketch designs precisely. The approach was: screenshot comparison → categorized issue list → systematic per-component fixes.

**Prompt:**

> I have a working Angular work order timeline app. I need to do a pixel-perfect visual QA pass to match the provided Sketch designs. I'll describe what I see in the running app vs what the designs show. For each issue, tell me exactly what SCSS value, component file, and line to change. Group your fixes by component file so I can apply them in one pass per file.
>
> Here are the discrepancies I've identified by comparing screenshots:
>
> 1. **Timescale pill (timeline-header):** Currently filled indigo (bg `#4e46e5`, white text). Design shows outline style — light indigo background, indigo text, indigo border. Also remove the "Hour" option that doesn't appear in the design.
>
> 2. **Work center / work order names (sample-data):** Current names are generic manufacturing lines. Design uses company-name style: Genesis Hardware, Rodriques Electrics, Konsulting Inc, McMarrow Distribution, Spartan Manufacturing.
>
> 3. **"Click to add" tooltip (timeline-row):** Currently a plain dark pill with no visible border. Design shows a subtle border/frame and a slight indigo glow shadow.
>
> 4. **In-Progress bar color:** Currently too purple/violet. Design uses indigo family: bar bg `#eef2ff`, badge bg `#e0e7ff`, badge text `#4f46e5`, border `#c7d2fe`.
>
> 5. **"Current Month" label position:** Currently positioned above the column date text (absolute, `top: 8px`). Design shows it BELOW the month name, styled as a small purple pill (`background: #ede9fe`, `color: #6d28d9`, `border-radius: 100px`).
>
> 6. **Background colors:** Page bg and left panel should be `#f5f7fa` (currently white). Current period column highlight should be `#f5f4ff` (slightly warmer indigo tint, not `#f0f0ff`).
>
> 7. **Open bar color:** Currently green-ish. Design uses teal: badge bg `#ccfbf1`, text `#0d9488`, border `#99f6e4`.
>
> 8. **Delete menu item:** Currently default gray text. Design uses `color: #dc2626`, `font-weight: 600`.
>
> 9. **Work order panel:** (a) Input border-radius should be `8px` not `6px`. (b) Subtitle text must be clamped to one line with ellipsis. (c) Replace emoji calendar icon with an SVG. (d) Cancel button should be ghost style (transparent bg, no border). (e) Create/Save button should be a pill (`border-radius: 100px`).
>
> 10. **ng-select selected state:** Selected option in the status dropdown should highlight with `background: #eef2ff` (light indigo), not the default blue or gray.
>
> For each fix, be precise: exact hex values, exact property names, exact selector paths. Where multiple rules interact (e.g. `::ng-deep` for third-party components), call that out explicitly.

**What this produced:** A complete list of 10 targeted fixes across 8 files. Key patterns that worked well:

- **SCSS token maps for status colors:** Using a Sass `map` and `@each` to generate all four status variants from a single source of truth avoids color drift when fixing one status at a time.
  ```scss
  $statuses: (
    'open':        (bar: #f0fdf9, badge-bg: #ccfbf1, badge-text: #0d9488, border: #99f6e4),
    'in-progress': (bar: #eef2ff, badge-bg: #e0e7ff, badge-text: #4f46e5, border: #c7d2fe),
    'complete':    (bar: #f0fdf4, badge-bg: #dcfce7, badge-text: #16a34a, border: #86efac),
    'blocked':     (bar: #fffbeb, badge-bg: #fef3c7, badge-text: #d97706, border: #fcd34d),
  );
  @each $status, $tokens in $statuses { ... }
  ```

- **Current period label DOM order matters:** To place the label *below* the date text in a flex column, the HTML element order must be `col-date-text` first, then `current-period-label`. CSS alone (e.g. `order: 1`) can reorder visually but changing the DOM order is more reliable and accessible.

- **`::ng-deep` for third-party overrides:** Scoped to the component host to avoid global leakage:
  ```scss
  :host ::ng-deep .ng-select .ng-option.ng-option-selected {
    background-color: #eef2ff !important;
    color: #4e46e5 !important;
  }
  ```

- **Root-level DI for `NgbDateParserFormatter`:** Confirmed that providing a custom formatter at component level is insufficient for the `ngbDatepicker` directive's CVA. Always provide in `app.config.ts`.

**Verification approach after each fix:** Used `preview_inspect` with specific CSS property arrays (e.g. `['background-color', 'color', 'border-color', 'border-radius']`) to confirm computed styles matched target hex values exactly, without relying solely on visual screenshots.


## Architecture Summary

```
WorkOrderService (signals)
    ├── workCenters: Signal<WorkCenterDocument[]>
    ├── workOrders:  Signal<WorkOrderDocument[]>
    ├── zoomLevel:   Signal<ZoomLevel>
    └── panelMode:   Signal<PanelMode | null>

timeline.utils.ts (pure functions)
    ├── generateColumns(zoom) → TimelineColumn[]
    ├── getBarStyle(start, end, columns, zoom) → { left, width }
    ├── pixelToDate(px, columns, zoom) → ISO string
    └── getTodayOffset(columns, zoom) → px

Components
    TimelineComponent          ← container, orchestrates zoom + scroll
    ├── TimelineHeaderComponent   ← logo + pill zoom selector
    ├── TimelineRowComponent      ← one row per work center + tooltip
    │   └── WorkOrderBarComponent ← positioned bar + hover menu
    └── WorkOrderPanelComponent   ← create/edit form (Reactive Forms)
```
