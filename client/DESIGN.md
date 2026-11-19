# Design System Specification (`client/DESIGN.md`)

## 1. Direction & Philosophy
- **Identity**: A trustworthy civic-services tool — calm, clear, precise, and institutional.
- **Tone**: Professional municipal utility, not a flashy SaaS startup template or generic AI-generated aesthetic.
- **Density**: High information density where necessary (tabular grievance data, audit trails, and status timelines), balanced with generous whitespace in forms and dashboards.
- **Visual Discipline**: 
  - Flat surfaces with crisp 1px borders (`#E2E8F0`).
  - No gradients.
  - No glassmorphism / backdrop blur.
  - No glow or neon effects.
  - No purple or trendy pastel accents.
  - No emojis in UI labels or buttons (use `lucide-react` icons exclusively).

---

## 2. Design Tokens (Tailwind v4 `@theme`)

### 2.1 Color Palette
Defined in `client/src/index.css` via `@theme`:

```css
@theme {
  /* Primary Accent: Trustworthy Deep Municipal Blue */
  --color-primary-50: #EFF6FF;
  --color-primary-100: #DBEAFE;
  --color-primary-200: #BFDBFE;
  --color-primary-300: #93C5FD;
  --color-primary-400: #60A5FA;
  --color-primary-500: #2563EB;
  --color-primary-600: #1E4FD8; /* Base Primary Accent */
  --color-primary-700: #1D4ED8;
  --color-primary-800: #1E40AF;
  --color-primary-900: #172554;

  /* Neutral Surface & Structure (Slate Family) */
  --color-surface-bg: #F8FAFC;      /* App background */
  --color-surface-card: #FFFFFF;    /* White card background */
  --color-surface-subtle: #F1F5F9;  /* Table headers / input backgrounds */
  
  --color-border-subtle: #E2E8F0;   /* Standard 1px divider */
  --color-border-strong: #CBD5E1;   /* Hover / input border */

  --color-text-main: #0F172A;       /* Primary headings and body text */
  --color-text-secondary: #475569;  /* Labels, descriptions, secondary copy */
  --color-text-muted: #94A3B8;      /* Placeholder text, timestamps */
}
```

### 2.2 Status Color Tokens (`StatusBadge`)
Strictly standardized across all pages and reports:

| Status | Background | Text Color | Border Color | Meaning |
|---|---|---|---|---|
| `SUBMITTED` | `#F1F5F9` (slate-100) | `#475569` (slate-700) | `#E2E8F0` (slate-200) | Grievance received, awaiting review |
| `UNDER_REVIEW` | `#EFF6FF` (blue-50) | `#1D4ED8` (blue-700) | `#BFDBFE` (blue-200) | Assigned officer evaluating issue |
| `IN_PROGRESS` | `#FFFBEB` (amber-50) | `#B45309` (amber-700) | `#FDE68A` (amber-200) | Field work active |
| `RESOLVED` | `#F0FDF4` (emerald-50) | `#15803D` (emerald-700) | `#BBF7D0` (emerald-200) | Work complete, verified |
| `REJECTED` | `#FEF2F2` (rose-50) | `#B91C1C` (rose-700) | `#FECACA` (rose-200) | Outside jurisdiction or invalid |
| `REOPENED` | `#FFF7ED` (orange-50) | `#C2410C` (orange-700) | `#FED7AA` (orange-200) | Reopened by citizen for follow-up |

### 2.3 Priority Badges (`PriorityBadge`)
Subtler presentation with small colored indicator dot:
- `low`: Text `#475569` (slate-600), background `#F8FAFC`, border `#E2E8F0`
- `medium`: Text `#0284C7` (sky-700), background `#F0F9FF`, border `#BAE6FD`
- `high`: Text `#D97706` (amber-700), background `#FFFBEB`, border `#FDE68A`
- `urgent`: Text `#DC2626` (red-700), background `#FEF2F2`, border `#FECACA`

---

## 3. Typography
- **Font Family**: `Source Sans 3` (self-hosted via `@fontsource/source-sans-3` for complete offline support inside Electron).
- **Scale**:
  - `32px` (`text-3xl`, weight 600, leading-tight) — Landing hero & major dashboard headlines
  - `24px` (`text-2xl`, weight 600, leading-snug) — Page headers (`PageHeader` title)
  - `20px` (`text-xl`, weight 600) — Section headings, modal titles
  - `16px` (`text-base`, weight 400/500) — Standard body text, card titles
  - `14px` (`text-sm`, weight 400/500) — Form inputs, table rows, button labels, sidebar navigation
  - `12px` (`text-xs`, weight 500/600) — Badges, table header cells, captions, timestamps
- **Weights**: 400 (regular), 500 (medium), 600 (semibold). No 700+ or black weights.

---

## 4. Geometry, Elevation & Spacing
- **Border Radius**:
  - `rounded-md` (6px): Inputs, buttons, selects, badges.
  - `rounded-lg` (8px): Cards, modals, containers, tables.
  - **No pill shapes** (`rounded-full` reserved solely for circular avatar initials or status dots).
- **Elevation / Shadows**:
  - Maximum of one soft shadow: `shadow-xs` / `shadow-sm` (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`).
  - Cards default to `bg-white border border-slate-200 shadow-none`.
- **Spacing Grid**:
  - Based on 4px increments (`p-1`=4px, `p-2`=8px, `p-3`=12px, `p-4`=16px, `p-6`=24px, `p-8`=32px).
  - Consistent component padding: inputs `px-3 py-2`, cards `p-6`, tables `px-4 py-3`.

---

## 5. Layout Architecture
- **Authenticated Layout (`DashboardLayout`)**:
  - **Left Sidebar**: 240px fixed width, solid light background with right border (`border-r border-slate-200`). Navigation items with Lucide icons (size 18px), active state highlighted with `bg-primary-50 text-primary-700 font-medium`.
  - **Top Bar**: 56px height, displaying Municipal system title, online/offline status, unread notification bell, and user menu dropdown.
  - **Main Content**: `max-w-7xl mx-auto px-6 py-6`.
- **Page Header**:
  - Every view begins with `PageHeader`: Title on left with 1-line description below, primary action buttons (e.g. "File Grievance", "Add Officer") right-aligned.
- **Lists & Data Presentation**:
  - Dense tabular presentation for grievance lists (`Table` component) rather than loose cards.
  - Summary metrics use clean 4-column KPI cards (`StatCard`) with numerical value, label, and subtle icon.

---

## 6. Forms & Accessibility
- **Input Design**:
  - Label strictly positioned **above** the input element (`text-sm font-medium text-slate-700 mb-1`).
  - Input field: `h-10 px-3 bg-white border border-slate-300 rounded-md text-sm text-slate-900`.
  - Focus state: `focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600`.
  - Error state: `border-red-500 focus:ring-red-500/20 focus:border-red-600` with error text below (`text-xs text-red-600 mt-1`).
  - Helper text: `text-xs text-slate-500 mt-1`.
- **Buttons**:
  - Explicit states on every button: Default, Hover, Active, Focus-Visible, Disabled (`opacity-50 cursor-not-allowed`), and Loading (spinning `Loader2` icon + disabled).
- **Accessibility**:
  - WCAG AA contrast compliance throughout.
  - Form labels bound via `htmlFor`.
  - Visible focus outlines for keyboard navigation (`focus-visible:ring-2`).

---

## 7. Reusable Component Inventory (`client/src/components/common/`)

All UI screens must be built exclusively from these reusable components:

1. **`Button`**:
   - Variants: `primary`, `secondary`, `outline`, `danger`, `ghost`
   - Sizes: `sm` (h-8 px-3 text-xs), `md` (h-10 px-4 text-sm), `lg` (h-12 px-6 text-base)
   - Features: `loading`, `disabled`, `iconLeft`, `iconRight`
2. **`Input`**:
   - Single-line text, email, password, search, number input with label, helper, error, and optional icon.
3. **`Select`**:
   - Form select dropdown with standardized chevron icon, label, and validation state.
4. **`Textarea`**:
   - Multi-line description field with character counter and error text.
5. **`Card`**:
   - Clean 1px bordered panel: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
6. **`StatusBadge`**:
   - Exact color and text mapping for the 6 grievance lifecycle states (`SUBMITTED`, `UNDER_REVIEW`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`, `REOPENED`).
7. **`PriorityBadge`**:
   - Subtle dot-styled badge for `low`, `medium`, `high`, `urgent`.
8. **`Modal`**:
   - Accessible modal dialog for confirmations, assignments, and photo views with backdrop click & Escape key dismissal.
9. **`Table`**:
   - High-density tabular layout: `Table`, `TableHeader`, `TableHead`, `TableBody`, `TableRow`, `TableCell`.
10. **`Pagination`**:
    - Showing "Page X of Y" with previous/next controls and total records summary.
11. **`Toast` / `ToastContainer`**:
    - Context-driven alert toasts for feedback (`success`, `error`, `info`, `warning`).
12. **`Skeleton`**:
    - Loading placeholders: `SkeletonText`, `SkeletonCard`, `SkeletonTableRows`.
13. **`EmptyState`**:
    - Context-specific empty view with icon, clear title, descriptive explanation, and actionable button (e.g. "No grievances found", "You haven't filed any grievances yet").
14. **`PageHeader`**:
    - Standardized view header with title, subtitle, breadcrumb, and right-hand action container.

---

## 8. Landing Page Structure (`pages/public/Landing.jsx`)
- **Tone**: Civic municipal portal, clean white & slate background with deep blue primary accents.
- **Sections**:
  1. **Top Navigation**: Municipal logo + app name on left; "Login" and "Register" buttons on right.
  2. **Hero Section**:
     - Headline: "Civic Grievance Redressal & Tracking Portal"
     - Subtitle: "A transparent municipal platform for citizens to report public infrastructure issues, track real-time resolution progress, and verify city council accountability."
     - CTAs: Primary "Report a Grievance" (routes to `/register` or `/citizen/file`), Secondary "Sign In" (routes to `/login`).
  3. **How It Works (3 Steps)**:
     - Step 1: *File Complaint* — Submit details, category, and photo evidence.
     - Step 2: *Receive Tracking ID* — Get an atomic ID (`GRV-YYYY-XXXXXX`) for tracking.
     - Step 3: *Real-time Resolution* — Follow the live timeline until municipal work is completed.
  4. **Stakeholder Overview (3 Cards)**:
     - *Citizens*: Direct civic reporting, photo evidence upload, feedback rating.
     - *Department Officers*: Department-scoped dashboard, progress remarks, SLA timeline.
     - *Municipal Admins*: City-wide analytics, audit logs, auto-escalation of overdue cases.
  5. **Footer**:
     - Minimalist footer with municipal attribution, privacy notice, and system version.
