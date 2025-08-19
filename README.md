# Samanta CRM — React + Vite + TypeScript + Tailwind + shadcn/ui + json-server

A minimal CRM sample with **Leads** and **Opportunities**.

- Leads table (only **score** is sortable), filters, pagination.
- Lead editor (edit **email** and **status**) via a slide-in sheet.
- Convert Lead → Opportunity with **duplicate guard by `leadId`**.
- Opportunities table (creation from conversion).
- Minimal header with logo and menu (mobile menu included).
- Toasts via **sonner**, with a `notify.promise<T>` helper returning the same typed Promise.

---

## Stack

- **Frontend:** React + Vite + TypeScript  
- **UI:** Tailwind CSS + shadcn/ui  
- **Toasts:** sonner (`notify.success/error/info/promise<T>`)  
- **API (mock):** json-server (REST)  
- **Code style:** strict TypeScript (no `any`, no unsafe casts)

---

## Getting Started

### 1) Install
```bash
npm i
```

### 2) API (json-server)

Use the provided `db.json` (≈100 leads):

```bash
npm run server
# or
npx json-server -p 3001 ./db.json
```

### 3) Environment
Create `.env` at the project root:
```
VITE_API_URL=http://localhost:3001
```

### 4) Run the app
```bash
npm run dev
# optional: run app + API together
npm run dev:all
```

Open http://localhost:5173

---

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # production build
npm run preview   # serve the built app locally
npm run server    # json-server on port 3001

# optional helpers
npm run dev:web   # only web
npm run dev:api   # only API
npm run dev:all   # web + API (requires concurrently)
```

---

## Project Structure (short)

```
src/
  components/
    layout/
      header
    table/
      LeadTable.tsx
      OpportunitiesTable.tsx
    sheet/
      LeadEditorSheet.tsx
      OpportunityCreateSheet.tsx
  hooks/
    useBreakpoint.ts
    useLeadsSearch.ts
    useOpportunitiesSearch.ts
  lib/
    toast.ts        # notify.success / error / info / promise<T>
    utils.ts        # date formatting helpers
  services/
    http.ts         # fetchJson, fetchOk, withQuery
    leads.service.ts
    opportunities.service.ts
  types/
    api.ts          # ListResult
    lead.ts         # Lead, ALLOWED_STATUS, ALLOWED_SOURCES
    opportunity.ts  # Opportunity, ALLOWED_OPP_STAGES
  pages/
    MainPage.tsx     # tabs: Leads / Opportunities
```

---

## API (json-server)

### `leads`
```ts
{
  id: string,           // "L-001"
  name: string,
  company: string,
  email: string,
  source: "Web" | "Referral" | "Ads" | "Event",
  score: number,        // 0..100
  status: "Active" | "Pending" | "Inactive",
  createdAt: string,    // ISO
  updatedAt: string     // ISO
}
```

Examples:
```
GET /leads?_page=1&_limit=10&_sort=score&_order=desc
GET /leads?name_like=ana&company_like=acme&_page=1&_limit=10
GET /leads?status=Active
PATCH /leads/L-001
PUT   /leads/L-001
```

### `opportunities`
```ts
{
  id: string,
  name: string,
  account: string,
  contactEmail: string,
  amount: number,
  stage: "Qualification" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost",
  closeDate: string,    // yyyy-mm-dd
  createdAt: string,    // ISO
  updatedAt: string,    // ISO
  leadId: string        // foreign to lead.id
}
```

Examples:
```
GET /opportunities?_page=1&_limit=10
GET /opportunities?stage=Qualification
GET /opportunities?title_like=roadmap&account_like=acme
POST /opportunities
```

> Duplicate prevention for opportunities is enforced on the frontend by querying `leadId` before create.

---

## Flows

### Leads
- Toolbar: search by **name/company**, status filter, page size.
- Table: only **score** is sortable.
- Row click → **LeadEditorSheet** (edit email/status).
- Save → validates email, `PATCH` to `/leads/:id`, toast feedback.
- Convert → **OpportunityCreateSheet** (prefilled from lead).

### Opportunities
- Create from conversion: requires **Title**, **Account**, **Stage**.
- Duplicate guard: checks by `leadId` before `POST`.
- On success: close sheet + refresh the table.

---

## Conventions

- Strong TS types; avoid casts.  
- Lead editor only patches **email** and **status**.  
- `http.ts`:
  - `fetchJson<T>(path, { method, body })` — JSON-in/out, returns `{ data, headers }`.
  - `fetchOk(path, { method })` — for endpoints without a body (e.g., `DELETE`).
  - `withQuery(path, params)` — builds query strings (supports arrays, skips empty).
- Toasts (`sonner`): `notify.promise<T>(p, { loading, success, error })` **returns `Promise<T>`**.

---

## Troubleshooting

- **Unexpected non-JSON response** → ensure `VITE_API_URL` points to `json-server` and it’s running.  
- **Type error when using toast promise** → use the provided `notify.promise<T>` helper and `await` it.  
- **Sorting vs searching** → server-side sorting for numeric columns; when doing client-only filtering, keep the UX consistent.

---

## License

MIT
