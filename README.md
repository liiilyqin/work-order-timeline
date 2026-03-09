# Work Order Schedule Timeline

A pixel-perfect Angular 17 interactive timeline for visualizing and managing work orders across multiple work centers in a manufacturing ERP context.

---

## Setup & Running

```bash
# Install dependencies
npm install

# Start the dev server (opens at http://localhost:4200)
ng serve

# Production build
ng build
```

**Font dependency** — The app uses Circular Std, loaded via CDN. An internet connection is required for the font to render correctly. The `<link>` is already in `index.html`:

```html
<link rel="stylesheet" href="https://naologic-com-assets.naologic.com/fonts/circular-std/circular-std.css">
```

---

## Features

### Core
- **Timeline grid** with Day / Week / Month zoom levels (pill selector in header)
- **Work order bars** positioned by date with status color coding (Open · In Progress · Complete · Blocked)
- **Create panel** — click any empty row cell to open a slide-in form pre-filled with the clicked date
- **Edit panel** — three-dot menu → Edit re-opens the same form with existing data
- **Delete** — three-dot menu → Delete removes the work order immediately
- **Overlap detection** — creating or editing an order that overlaps another on the same work center shows an inline error
- **Form validation** — all fields required; end date must be after start date

### UX details
- Timeline auto-scrolls to center on today on load
- Current period column (today / this week / this month) is highlighted with a subtle indigo tint and a "Current day / week / month" pill label
- Hovering a row reveals a "Click to add" tooltip on the empty grid area
- Clicking outside the panel (or pressing Cancel) closes it without saving
- Date inputs use `MM.DD.YYYY` format with a popup datepicker

---

## Architecture

```
src/app/
├── models/
│   └── work-order.model.ts        # TypeScript interfaces + discriminated unions
├── services/
│   ├── work-order.service.ts      # Signals-based in-memory state (CRUD + overlap)
│   └── dot-date-formatter.ts      # NgbDateParserFormatter → MM.DD.YYYY
├── data/
│   └── sample-data.ts             # Hardcoded work centers + work orders
├── components/
│   ├── timeline-header/           # Logo, title, zoom-level pill selector
│   ├── timeline/                  # Grid layout, column generation, bar positioning
│   ├── timeline-row/              # Single work center row + hover/click handling
│   ├── work-order-bar/            # Bar rendering, status badge, three-dot menu
│   └── work-order-panel/          # Create/Edit slide-out form panel
├── app.config.ts                  # Root providers (NgbDateParserFormatter)
├── app.component.ts               # Root shell — wires header + timeline + panel
└── ai-prompts.md                  # AI prompts used during development (bonus)
```

**Component communication** follows a unidirectional flow:
- `AppComponent` owns the active `PanelMode` signal
- `TimelineRowComponent` emits `(openPanel)` with `{ type: 'create', workCenterId, startDate }`
- `WorkOrderBarComponent` emits `(edit)` / `(delete)` up to the row, then to app
- `WorkOrderPanelComponent` reads `PanelMode` as an `@Input` and emits `(close)` when done

---

## Libraries & Why

| Library | Why |
|---|---|
| **`@ng-select/ng-select`** | Required by spec. Richer dropdown than native `<select>` — supports custom label/option templates for rendering status badges inside the dropdown |
| **`@ng-bootstrap/ng-bootstrap`** | Required by spec. `ngbDatepicker` directive on `<input>` gives a popup calendar; `NgbDateParserFormatter` is cleanly extensible for custom display formats |
| **`@angular/forms` (Reactive)** | Required by spec. `FormGroup` + cross-field validator (`endAfterStart`) + `FormBuilder` keeps form state explicit and testable |
| **Bootstrap SCSS** | Provides the reset and utility layer that ng-bootstrap expects; only the SCSS API is used (no Bootstrap JS) |
| **Angular Signals** | `signal()` + `computed()` for service state and derived timeline values — avoids RxJS boilerplate for this scale of app |

---

## Key Technical Decisions

### Date → pixel positioning
Each column stores its ISO start date and a fixed pixel width. Bar `left` is the sum of all column widths before the bar's start date, plus a fractional offset for the partial period. Bar `width` is computed the same way for the end date, then `width = endOffset - left`. This keeps the math O(n columns) and zoom-level-agnostic.

### Single panel for Create & Edit
`PanelMode` is a discriminated union — `{ type: 'create', workCenterId, startDate? }` or `{ type: 'edit', workOrder }`. The panel component reads `mode.type` to decide initial form values and which service method to call on submit. This keeps a single component tree in the DOM and avoids duplicating form logic.

### `NgbDateParserFormatter` at app root
The `ngbDatepicker` directive implements `ControlValueAccessor` and resolves `NgbDateParserFormatter` from its own injector, not the host component's. Providing the custom `DotDateFormatter` at the **application root** in `app.config.ts` ensures the directive always picks up `MM.DD.YYYY` formatting regardless of where in the component tree the datepicker appears.

### Overlap detection
`hasOverlap(workCenterId, startIso, endIso, excludeId?)` filters work orders by work center, excludes the current order when editing, and checks `existingEnd > newStart && existingStart < newEnd` (standard interval overlap). Pure function on the service — no side effects.

---

## Sample Data

5 work centers · 8 work orders · all 4 status types · multiple orders on single work centers:

| Work Center | Orders |
|---|---|
| Genesis Hardware | 2 orders (complete + in-progress) |
| Rodriques Electrics | 1 order (open) |
| Konsulting Inc | 2 orders (blocked + complete) |
| McMarrow Distribution | 2 orders (in-progress + open) |
| Spartan Manufacturing | 1 order (blocked) |

Dates are relative to the current date so the timeline always loads with relevant data visible.
