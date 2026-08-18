# Participant Report — Verification Evidence Pack

**Generated:** 2026-08-02  
**Scope:** Verification only — no application code changes in this folder.

---

## 1. Generated PDF (real pipeline)

**File:** [`02-generated-report.pdf`](./02-generated-report.pdf)

**How this was produced**

This PDF uses the **same code path as the live app** (`buildParticipantReportData` → `generateParticipantReportPdf` in `useGenerateReportPdf`), with **real screening input** (clinical engine + seeded patient measurements — hypertension scenario).

It was **not** generated from `DUMMY_PARTICIPANT_REPORT`.

> **Note:** To satisfy “browser application flow” strictly, open the running app at `http://localhost:5174/screening/report` after completing a screening session (see §6 below). The PDF bytes use the identical hook and mapper as that page.

---

## 2. UI screenshot (before PDF generation)

**Status:** ⚠️ **Not captured automatically** — requires an authenticated browser session.

Automated capture was blocked (no Playwright in project; login API call blocked by sandbox policy).

**Manual capture (2 minutes):**

1. Open `http://localhost:5174/` (dev server running).
2. Login: `admin@medscreen.ro` / `Admin123!` (seed DB).
3. Select campaign **Festivalul Tradiții Argeșene**.
4. Complete or restore screening for **Ion Popescu** with elevated BP measurements.
5. Navigate to **Raport participant** (`/screening/report`).
6. Screenshot `#clinical-report` **before** “PDF generat.” appears (or while visible alongside the report).

Save as: `verification-evidence/02-ui-report-before-pdf.png`

---

## 3. PDF opened in viewer

**File:** [`03-generated-pdf-render.png`](./03-generated-pdf-render.png)  
(PyMuPDF rasterization — open `02-generated-report.pdf` in Edge/Adobe for authoritative print preview.)

**Chrome headless** cannot render embedded Identity-H fonts; use a local PDF viewer for final sign-off.

---

## 4. Side-by-side comparison

| Asset | Path |
|-------|------|
| Approved design (HTML mockup screenshot) | [`01-approved-design-mockup.png`](./01-approved-design-mockup.png) |
| Generated PDF (rasterized) | [`03-generated-pdf-render.png`](./03-generated-pdf-render.png) |
| Combined view | [`04-comparison-side-by-side.png`](./04-comparison-side-by-side.png) |
| Interactive HTML | [`comparison-side-by-side.html`](./comparison-side-by-side.html) |

**Approved design source:** `packages/shared/src/pdf-v2/mock/participant-report-mockup.html`

---

## 5. Visual issues — before / after / files modified

Pre-sprint **UI screenshots** were not archived (no git history on this machine).  
**Before** column = documented pre-sprint behavior from code review.  
**After** = current implementation (see PDF render + live app).

| # | Issue | Before (pre-sprint) | After (current) | File(s) modified |
|---|-------|---------------------|-----------------|------------------|
| 1 | UI/PDF findings mismatch | UI: “Observațiile screeningului” + internal slugs | UI + PDF: “Ce a identificat screeningul” + participant labels | `clinical-report-content.ts`, `ClinicalReportSections.tsx`, `ClinicalReport.tsx` |
| 2 | Table column labels | UI: “Valori recomandate / Interpretare”; PDF: “Interval normal / Observații” | Both: “Interval de referință / Observație” (spec constants) | `ClinicalReportSections.tsx`, `render-participant-report.ts`, `participant-report.constants.ts` |
| 3 | Observation badges | UI: raw “Crescută”; PDF: mapped labels | Both use `formatMeasurementNote()` | `ClinicalReportSections.tsx`, `participant-report-mappers.ts`, `build-participant-report-data.ts` |
| 4 | Recommendations format | UI: intro + bullets; PDF: single paragraph | Both: intro + bullets (max 3) | `build-participant-report-data.ts`, `render-participant-report.ts`, `clinical-report-content.ts`, `participant-report.types.ts` |
| 5 | PDF missing findings intro | No intro line | “În urma screeningului au fost identificate următoarele:” | `render-participant-report.ts`, `participant-report.constants.ts` |
| 6 | PDF missing BP education | UI only | PDF includes section when BP abnormal | `build-participant-report-data.ts`, `render-participant-report.ts`, `participant-report.types.ts` |
| 7 | Brand colors (UI) | `#0F52BA` / `#10b981` | `#003D5B` / `#38A649` | `apps/web/tailwind.config.ts` |
| 8 | QR / logo sizing (PDF) | QR ~58pt, logo 76pt | QR 62pt (~22mm), logo 82pt | `packages/shared/src/pdf-v2/design/tokens.ts` |

---

## 6. Strict real-application flow (for your sign-off)

```
Login (web) → Select campaign → Patient + measurements + anamnesis
→ Results (API clinical evaluate) → /screening/report
→ useGenerateReportPdf() → sessionStorage PDF → Download
```

Dev servers: **web** `http://localhost:5174/` · **API** `http://localhost:3001/`

---

## Remaining gaps for approval

1. **Live UI screenshot** — capture manually (§2) or approve Playwright automation.
2. **PDF in native viewer** — PyMuPDF rasterization shows font substitution; verify `02-generated-report.pdf` in Edge print preview (A4).
3. **HTML mockup** still shows old table headers (“Interval normal”) — code uses spec constants; mockup not updated in this sprint.
