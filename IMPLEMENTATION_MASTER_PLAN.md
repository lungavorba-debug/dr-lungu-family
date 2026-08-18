# MedScreen Festival — Implementation Master Plan (STEP 4)

> **Status:** Approved blueprint — **no code until Phase 1 is explicitly authorized**  
> **Authority documents:**  
> - [`PARTICIPANT_REPORT_SPEC.md`](./PARTICIPANT_REPORT_SPEC.md) — product (frozen)  
> - [`TARGET_ARCHITECTURE.md`](./TARGET_ARCHITECTURE.md) — architecture (frozen)  
> - [`ARCHITECTURE_AUDIT.md`](./ARCHITECTURE_AUDIT.md) — as-is baseline  
> - [`FILE_MAP.md`](./FILE_MAP.md) — file inventory  

---

## How to use this document

1. **One phase at a time** — do not start Phase N+1 until Phase N validation checklist is complete and signed off.
2. **Every phase produces a verifiable artifact** — tests, golden files, or manual sign-off sheet.
3. **Production path stays working** until Phase 4/5 cutover — use feature flags or parallel code paths where noted.
4. **PARTICIPANT_REPORT_SPEC.md wins** on copy and layout conflicts; this plan wins on execution order.

---

## Global constraints (all phases)

### Must NEVER change during migration (unless phase explicitly says otherwise)

| Area | Constraint |
|------|------------|
| **Screening workflow routes** | `/screening` → measurements → results → report → signature → complete |
| **API contracts** | Auth, patients, campaigns, measurements, clinical evaluate endpoints — no breaking changes |
| **Database / Prisma schema** | No report-related DB changes in this migration (client-side PDF only) |
| **Operator results page** | Must continue showing clinical engine risks/warnings until explicitly redesigned |
| **Session storage keys** | Existing screening session keys remain valid until Phase 4 cutover plan |
| **Login / campaign selection** | Untouched |

### Application smoke test (run after every phase)

| # | Step | Pass criteria |
|---|------|---------------|
| S1 | Login | User reaches dashboard |
| S2 | Select campaign | Campaign loads |
| S3 | Complete screening conversation | Patient + anamnesis saved |
| S4 | Enter measurements | Values persist |
| S5 | View operator results | Clinical evaluation displays |
| S6 | Open report page | Report visible + PDF downloadable |
| S7 | Sign + complete | Delivery panel works; download PDF works |

Phases 1–3: S6 uses **existing** UI/PDF (no regression).  
Phases 4–5: S6 validates **new** pipeline behind flag, then default.

---

## Phase overview

| Phase | Name | Duration est. | Blocks |
|-------|------|---------------|--------|
| **0** | Prerequisites & guardrails | 1–2 days | All |
| **1** | Shared report model | 2–3 days | 2–9 |
| **2** | Clinical engine output | 4–6 days | 3–9 |
| **3** | Report composer | 2–3 days | 4–9 |
| **4** | UI migration | 3–5 days | 5–9 |
| **5** | PDF renderer | 4–6 days | 6–9 |
| **6** | Branding module | 2–3 days | 7–9 |
| **7** | Testing & parity | 3–5 days | 8–9 |
| **8** | Cleanup | 2–3 days | 9 |
| **9** | Release | 2–4 days | — |

**Total estimate:** 25–40 engineering days (1 developer) or 15–25 calendar days (2 developers with parallel UI/PDF after Phase 3).

---

## Phase 0 — Prerequisites & guardrails

### Goal

Establish test harness, feature flag, and golden fixtures **without changing production behavior**.

### Files modified

| File | Change |
|------|--------|
| `package.json` (root) | Add `test:report` script |
| `packages/shared/package.json` | Export test utilities if needed |
| `packages/shared/src/report/__fixtures__/` | **New** — sample inputs + expected outputs |
| `packages/shared/src/report/__tests__/` | **New** — placeholder parity tests (skipped initially) |
| `apps/web/.env.example` or config | `VITE_USE_PARTICIPANT_REPORT_V2=false` feature flag |

### Files removed

None.

### Expected result

- CI/local command exists for report tests.
- Feature flag defaults **off**.
- Golden fixture JSON files committed for: healthy, elevated BP, multi-finding, chest pain scenarios.
- Zero user-visible change.

### Validation checklist

| # | Check |
|---|-------|
| 0.1 | `npm run typecheck` passes |
| 0.2 | `npm run build` passes |
| 0.3 | `npm run test:report` runs (tests skipped or passing on fixtures only) |
| 0.4 | Feature flag documented in this repo |
| 0.5 | Smoke test S1–S7 passes on current production path |
| 0.6 | PARTICIPANT_REPORT_SPEC approval checklist (§11) signed |

### Risks

| Risk | Mitigation |
|------|------------|
| Starting implementation before product sign-off | Gate: Phase 0.6 required |
| No CI | Run `test:report` locally until CI wired |

### Rollback strategy

Delete new test/fixture directories and flag — no production impact.

### Must NOT change

All application source behavior.

---

## Phase 1 — Shared report model

### Goal

Introduce the canonical `ParticipantReport` TypeScript schema and JSON schema. **No runtime wiring yet.**

### Files modified

| File | Change |
|------|--------|
| `packages/shared/src/report/participant-report.schema.ts` | **New** — `ParticipantReport` and block types |
| `packages/shared/src/report/participant-report.constants.ts` | **New** — section titles, column labels from spec §2–3 |
| `packages/shared/src/report/index.ts` | Export new types (alongside legacy exports) |
| `packages/types/src/clinical.ts` | Add `ParticipantClinicalView` interface (optional stub) |
| `packages/shared/src/report/__tests__/schema.test.ts` | **New** — validates golden fixtures against schema |

### Files removed

None.

### Expected result

- `ParticipantReport` type matches TARGET_ARCHITECTURE §2 and PARTICIPANT_REPORT_SPEC section structure.
- Golden fixtures validate against schema.
- Legacy `ClinicalReportContent` / `ParticipantReportData` still exported and used in app.

### Validation checklist

| # | Check |
|---|-------|
| 1.1 | All block types defined: metadata, clinic, event, participant, summary, measurements, findings, recommendations, education, footer, branding, qr |
| 1.2 | Column labels match spec: Parametru, Rezultat, Interval de referință, Observație |
| 1.3 | Section title findings = `Ce a identificat screeningul` |
| 1.4 | `npm run typecheck -w @medscreen/shared` passes |
| 1.5 | Schema tests pass on 4+ fixtures |
| 1.6 | Smoke test S1–S7 unchanged |

### Risks

| Risk | Mitigation |
|------|------------|
| Schema drift from spec | Cross-walk checklist against PARTICIPANT_REPORT_SPEC §2–8 |
| Premature deletion of old types | Do not remove until Phase 8 |

### Rollback strategy

Remove new files; revert exports in `report/index.ts`.

### Must NOT change

- `buildClinicalReportContent()`
- `buildParticipantReportData()`
- `useGenerateReportPdf`
- `ClinicalReport.tsx`
- PDF renderer

### Untouched functionality

Entire web app and API behavior identical.

---

## Phase 2 — Clinical engine output

### Goal

Extend clinical engine to emit `participantView` with display-ready measurements, findings, recommendations, summary, and education — **single clinical pass**. Consolidate threshold registry.

### Files modified

| File | Change |
|------|--------|
| `packages/shared/src/clinical/thresholds/index.ts` | **New** — single threshold registry |
| `packages/shared/src/clinical/participant/` | **New directory** |
| `├── build-participant-measurements.ts` | From `report-measurement-interpretation.ts` logic + spec labels |
| `├── build-participant-findings.ts` | From observations + mappers; spec §4.2 copy |
| `├── build-participant-recommendations.ts` | From `participant-recommendations.ts` + spec §5 tiers |
| `├── build-participant-summary.ts` | Wraps `report-summary.ts` |
| `└── build-participant-education.ts` | BP education conditional |
| `packages/shared/src/clinical/engine.ts` | Attach `participantView` to result |
| `packages/types/src/clinical.ts` | `ParticipantClinicalView` on `ClinicalEvaluationResult` |
| `packages/shared/src/report/report-screening-observations.ts` | Refactor to import thresholds (thin wrapper or deprecate) |
| `packages/shared/src/report/report-measurement-interpretation.ts` | Refactor to import thresholds |
| `packages/shared/src/report/participant-recommendations.ts` | Refactor to delegate to clinical/participant OR mark deprecated |
| `packages/shared/src/clinical/__tests__/participant-view.test.ts` | **New** — unit tests per spec scenarios |

### Files removed

None yet (deprecation comments only).

### Expected result

- `evaluateClinicalEngine()` returns `participantView` populated per PARTICIPANT_REPORT_SPEC.
- Existing `risks`, `warnings`, `recommendations` (operator) unchanged for operator UI.
- Legacy report builders still work (dual path temporarily).
- Threshold constants exist in **one** file only.

### Validation checklist

| # | Check |
|---|-------|
| 2.1 | Healthy scenario: 0 findings, Tier A recommendations (3 bullets), all Normal badges |
| 2.2 | Elevated BP: finding text exact match spec §4.2 |
| 2.3 | Dyspnea + snoring → single merged finding |
| 2.4 | Chest pain → Tier C recommendation wording |
| 2.5 | Max 3 recommendation bullets enforced |
| 2.6 | Measurement Observație labels: Normal, Peste interval, Scăzut, Crescut, — |
| 2.7 | No ideal weight row added (spec §3.3) |
| 2.8 | Operator results page still renders (uses operator fields, not participantView) |
| 2.9 | API `/clinical/evaluate` response shape backward compatible (additive field only) |
| 2.10 | Smoke test S1–S7 |

### Risks

| Risk | Mitigation |
|------|------------|
| Breaking API consumers with new required fields | `participantView` optional until Phase 3; additive only |
| Copy differs from approved spec | String literal tests against spec table |
| Operator/report divergence | Separate fields; document in code comments |

### Rollback strategy

Revert `engine.ts` to omit `participantView`; keep threshold refactor if behavior-neutral. Feature flag still off.

### Must NOT change

- Report page UI/PDF output (still uses legacy builders)
- Operator `ClinicalResultSections` behavior
- Prisma, auth, campaign flows

### Verify app works

Smoke S1–S7 + operator results page manual check.

---

## Phase 3 — Report composer

### Goal

Implement `composeParticipantReport()` — assembles `ParticipantReport` from `participantView` + session + branding (interim: `clinic-branding.ts`).

### Files modified

| File | Change |
|------|--------|
| `packages/shared/src/report/composer/compose-participant-report.ts` | **New** |
| `packages/shared/src/report/composer/report-session-context.ts` | **New** — input type |
| `packages/shared/src/report/composer/index.ts` | **New** |
| `packages/shared/src/report/report-number.ts` | Used by composer (no logic change) |
| `packages/shared/src/report/report-datetime.ts` | Used by composer |
| `packages/shared/src/report/report-personalization.ts` | Used by composer |
| `packages/shared/src/report/campaign-display.ts` | Used by composer |
| `packages/shared/src/pdf/qr-code-generator.ts` | `resolveClinicQrUrl` only — until Phase 6 |
| `packages/shared/src/report/__tests__/composer.test.ts` | **New** — golden JSON output |
| `packages/shared/src/report/index.ts` | Export composer |

### Files removed

None.

### Expected result

- `composeParticipantReport(input)` → valid `ParticipantReport` JSON for all fixtures.
- Not yet called from web app (or called only in tests / dev script).
- Legacy path still serves production.

### Validation checklist

| # | Check |
|---|-------|
| 3.1 | Composer output passes Phase 1 schema validation |
| 3.2 | Filename format: `MedScreen-Raport-{name}-{reportNumber}.pdf` |
| 3.3 | QR URL populated via `resolveClinicQrUrl` |
| 3.4 | Report number matches existing `buildStableReportNumber` output |
| 3.5 | No clinical logic inside composer (grep for threshold constants — none) |
| 3.6 | Golden JSON snapshots committed |
| 3.7 | Smoke test S1–S7 |

### Risks

| Risk | Mitigation |
|------|------------|
| Composer re-implements clinical rules | Code review + grep for BMI thresholds in composer |
| Branding interim drift | Phase 6 consolidates; document debt |

### Rollback strategy

Remove composer module; tests only affected.

### Must NOT change

- Web report page production path
- PDF generation production path

---

## Phase 4 — UI migration

### Goal

Replace `ClinicalReport` with `ParticipantReportView` driven by `composeParticipantReport()`. Feature flag controls cutover.

### Files modified

| File | Change |
|------|--------|
| `apps/web/src/features/screening/report/hooks/useParticipantReport.ts` | **New** — compose from session |
| `apps/web/src/features/screening/report/components/ParticipantReportView.tsx` | **New** |
| `apps/web/src/features/screening/report/sections/*.tsx` | **New** — one file per spec section |
| `apps/web/src/features/screening/report/pages/ScreeningReportPage.tsx` | Use new view when flag on |
| `apps/web/src/features/screening/report/hooks/useGenerateReportPdf.ts` | Prepare for Phase 5 (may still call legacy PDF initially) |
| `apps/web/src/features/screening/context/ScreeningSessionContext.tsx` | Optional: store `ParticipantReport` JSON |
| `apps/web/src/features/screening/report/lib/pdf-session-storage.ts` | Optional: store report JSON alongside PDF |

### Files removed

None until Phase 8 (`ClinicalReport.tsx` kept behind flag fallback).

### Expected result

- Flag **off**: legacy UI unchanged.
- Flag **on**: UI matches PARTICIPANT_REPORT_SPEC wireframe (screen); same `ParticipantReport` data as composer output.
- PDF may still be legacy until Phase 5.

### Validation checklist

| # | Check |
|---|-------|
| 4.1 | Section order matches spec §2.1 |
| 4.2 | Findings title: Ce a identificat screeningul |
| 4.3 | Findings hidden when empty |
| 4.4 | Measurements: 8 rows, 4 columns, correct labels |
| 4.5 | Badges: Normal (green), Atenție (amber) |
| 4.6 | Recommendations: max 3 bullets, Tier A/B/C copy |
| 4.7 | BP education block when BP abnormal |
| 4.8 | Footer exact copy spec §8 |
| 4.9 | Operator in participant block |
| 4.10 | Logo from `/clinic-logo.svg` |
| 4.11 | Flag off → smoke S1–S7 |
| 4.12 | Flag on → smoke S1–S7 + visual review |

### Risks

| Risk | Mitigation |
|------|------------|
| UI/PDF temp mismatch (Phase 4 before 5) | Accept short window; flag coordinates both when ready |
| Mobile layout breaks | Test sticky action bar + table scroll |

### Rollback strategy

Set `VITE_USE_PARTICIPANT_REPORT_V2=false` — instant revert to `ClinicalReport`.

### Must NOT change

- PDF output until Phase 5 (or clearly label “UI preview may differ from PDF” during gap — avoid in production)
- API, database, other screening steps

### Verify app works

Smoke S1–S7 with flag off and on; regression on iPad target device if available.

---

## Phase 5 — PDF renderer

### Goal

Refactor PDF-v2 to **draw-only** from `ParticipantReport`. Wire `useGenerateReportPdf` to compose + render. Deprecate `buildParticipantReportData`.

### Files modified

| File | Change |
|------|--------|
| `packages/shared/src/renderers/pdf/` | **New structure** (or refactor `pdf-v2/`) |
| `├── index.ts` | `renderParticipantReportPdf(report: ParticipantReport)` |
| `├── layout/participant-report.layout.ts` | Draw-only layout per spec §10 |
| `└── draw/*.ts` | Section drawers |
| `packages/shared/src/pdf-v2/generate-participant-report-pdf.ts` | Thin wrapper → new renderer |
| `packages/shared/src/pdf-v2/index.ts` | Export new signature |
| `apps/web/src/features/screening/report/hooks/useGenerateReportPdf.ts` | `compose` → `render` only |
| `packages/shared/src/pdf-v2/stored-pdf-validation.ts` | Bump `PDF_V2_GENERATOR_VERSION` |
| `packages/shared/src/pdf-v2/test-pdf-v2-integration.ts` | Update to use `ParticipantReport` |

### Files removed

| File | When |
|------|------|
| `pdf-v2/build-participant-report-data.ts` | End of Phase 5 |
| `pdf-v2/mappers/participant-report-mappers.ts` | End of Phase 5 |

### Expected result

- PDF bytes generated from same `ParticipantReport` as UI.
- Text in PDF matches spec copy (findings, recommendations, footer).
- BP education section rendered when present in model.
- Download + completion delivery work.

### Validation checklist

| # | Check |
|---|-------|
| 5.1 | PDF contains all section titles from spec |
| 5.2 | Extracted text ⊇ all finding labels from model |
| 5.3 | Extracted text ⊇ all recommendation bullets from model |
| 5.4 | QR scannable → clinic website |
| 5.5 | Logo embedded, readable |
| 5.6 | Romanian diacritics render correctly |
| 5.7 | One-page fit for healthy fixture |
| 5.8 | Multi-page rules for stress fixture (if overflow test data exists) |
| 5.9 | `validateParticipantReportPdf` passes |
| 5.10 | Stored PDF version invalidates old cache |
| 5.11 | UI/PDF parity test: same model → same strings in UI DOM and PDF text |
| 5.12 | Smoke S1–S7 with flag on |

### Risks

| Risk | Mitigation |
|------|------------|
| Font/encoding regression | Keep existing Liberation Serif embed path |
| Layout overflow at festivals | Stress test with max findings + education |
| Version bump clears user PDFs mid-session | Acceptable; regenerate on report page |

### Rollback strategy

Flag off reverts to legacy PDF path; keep old functions until Phase 8 if needed.

### Must NOT change

- Non-report features
- Delivery provider interfaces (same `StoredScreeningPdf` shape)

---

## Phase 6 — Branding module

### Goal

Consolidate branding into `@medscreen/shared/branding`. Single color tokens, logo manifest, disclaimer copy. PDF + UI consume `ReportBrandingSnapshot` on `ParticipantReport`.

### Files modified

| File | Change |
|------|--------|
| `packages/shared/src/branding/` | **New module** |
| `├── clinic-registry.ts` | From `clinic-branding.ts` |
| `├── tokens/colors.ts` | Spec §7.5 |
| `├── tokens/typography.ts` | Spec §7.6 |
| `├── copy/disclaimer.ts` | Spec §8 |
| `├── copy/education-bp.ts` | Spec §3.5 |
| `├── assets/manifest.ts` | Logo SVG + print JPEG refs |
| `└── resolve-report-branding.ts` | |
| `packages/shared/src/branding/qr/generate-matrix.ts` | Consolidate duplicate QR |
| `packages/shared/src/report/composer/compose-participant-report.ts` | Use branding module |
| `packages/shared/src/pdf-v2/design/tokens.ts` | Import from branding tokens |
| `apps/web/tailwind.config.js` | Map brand colors from tokens (optional) |
| `apps/web/public/clinic-logo.svg` | Verify matches manifest |

### Files removed

| File | When |
|------|------|
| `pdf/qr-code-generator.ts` | After QR consolidated (keep `resolveClinicQrUrl` moved) |
| `pdf-v2/utils/qr-code.ts` | After consolidation |

### Expected result

- One source for colors, disclaimer, clinic copy.
- PDF hardcoded footer strings eliminated.
- QR matrix generated once in composer.

### Validation checklist

| # | Check |
|---|-------|
| 6.1 | Navy #003D5B and green #38A649 in PDF and UI |
| 6.2 | Disclaimer matches spec §8 exactly (PDF + UI) |
| 6.3 | Single QR implementation |
| 6.4 | Logo PDF JPEG derived from approved SVG |
| 6.5 | Smoke S1–S7 |
| 6.6 | Visual sign-off from clinic |

### Risks

| Risk | Mitigation |
|------|------------|
| Tailwind theme regression | Visual diff checklist |
| Asset pipeline for JPEG | Document build step in README |

### Rollback strategy

Composer falls back to `clinic-branding.ts` imports temporarily.

### Must NOT change

Report clinical content (Phase 2 output).

---

## Phase 7 — Testing & parity

### Goal

Comprehensive automated + manual validation. No new features.

### Files modified

| File | Change |
|------|--------|
| `packages/shared/src/report/__tests__/parity.test.ts` | UI strings vs model |
| `packages/shared/src/renderers/pdf/__tests__/pdf-parity.test.ts` | PDF text vs model |
| `apps/web/src/features/screening/report/__tests__/e2e-report.spec.ts` | Optional Playwright |
| `package.json` | `test:report` runs all report tests in CI |
| `docs/report/GOLDEN_SCENARIOS.md` | **New** — scenario catalog |

### Files removed

None.

### Expected result

- CI fails on UI/PDF/model mismatch.
- All spec scenarios covered by automated tests.
- Manual sign-off sheets completed.

### Validation checklist

See **Release Checklist** (below) — all items must pass.

### Risks

| Risk | Mitigation |
|------|------------|
| Flaky PDF text extraction | Use deterministic fixtures |
| Missing edge cases | Review spec Tier C chest pain, multi-finding |

### Rollback strategy

N/A — test-only phase.

---

## Phase 8 — Cleanup

### Goal

Remove legacy report/PDF code. Single production path. Update docs.

### Files removed

| Path | Reason |
|------|--------|
| `packages/shared/src/pdf/` (entire legacy) | Unused |
| `packages/shared/src/report/clinical-report-content.ts` | Replaced by composer |
| `packages/shared/src/report/participant-recommendations.ts` | In clinical/participant |
| `packages/shared/src/report/report-recommendation-bullets.ts` | In engine |
| `packages/shared/src/report/report-screening-observations.ts` | In clinical/participant |
| `packages/shared/src/pdf-v2/build-participant-report-data.ts` | Removed Phase 5 |
| `packages/shared/src/pdf-v2/mappers/participant-report-mappers.ts` | Removed Phase 5 |
| `apps/web/.../ClinicalReport.tsx` | Replaced |
| `apps/web/.../ClinicalReportSections.tsx` | Replaced |
| Feature flag | Remove; new path only |

### Files modified

| File | Change |
|------|--------|
| `packages/shared/src/report/index.ts` | Export only new surface |
| `packages/shared/src/pdf-v2/README.md` | Rewrite |
| `FILE_MAP.md` | Update inventory |
| Remove misleading comments | `single source of truth` fixes |

### Expected result

- One builder, one model, two renderers (UI + PDF).
- No dead code from audit §11.
- Smaller `@medscreen/shared/pdf` export surface removed from package.json if applicable.

### Validation checklist

| # | Check |
|---|-------|
| 8.1 | Grep: no imports of removed modules |
| 8.2 | `npm run build` clean |
| 8.3 | `npm run test:report` green |
| 8.4 | Smoke S1–S7 |
| 8.5 | No feature flag remnant |

### Risks

| Risk | Mitigation |
|------|------------|
| Accidental deletion of shared fonts | Keep `liberation-serif-font-bytes.ts` in branding/renderers |
| Test scripts still referencing legacy | Update test paths in same PR |

### Rollback strategy

Git revert release branch — keep Phase 7 tag as last known good.

---

## Phase 9 — Release

### Goal

Production deployment with clinical and clinic sign-off.

### Activities (not code-heavy)

| Activity | Owner |
|----------|-------|
| Deploy build to staging | Engineering |
| Print 10 sample reports at actual festival printer | Operations |
| Clinic medical director sign-off | Clinical |
| Enable for next campaign event | Product |
| Monitor first 50 screenings | All |

### Files modified

| File | Change |
|------|--------|
| `CHANGELOG.md` | **New/updated** — report migration notes |
| Version bump | `report_schema_version`, `PDF_V2_GENERATOR_VERSION` documented |

### Validation checklist

Full **Release Checklist** below.

### Rollback strategy

| Level | Action |
|-------|--------|
| **Hotfix** | Revert deploy to previous build artifact |
| **Data** | Session PDFs regenerate on report page — no DB rollback |
| **Flag** | If flag retained until 9, disable V2 |

---

## Per-phase dependency graph

```
Phase 0 ──► Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 7 ──► Phase 8 ──► Phase 9
                              │         │         │
                              │         └────► Phase 5 ──► Phase 6 ──► Phase 7
                              │
                              └── Threshold registry required before participantView tests
```

**Critical path:** 0 → 1 → 2 → 3 → 5 → 7 → 8 → 9  
**Parallelizable after Phase 3:** Phase 4 (UI) and Phase 5 (PDF) in parallel by two developers.  
**Phase 6** can start after Phase 3 but must finish before Phase 7 sign-off.

---

## Release checklist (final gate)

### Clinical validation

| # | Item | Pass |
|---|------|------|
| RC-C1 | Healthy participant: Tier A recommendations (3 bullets exact) | ☐ |
| RC-C2 | Elevated BP: finding + BP education + monitoring bullet | ☐ |
| RC-C3 | Chest pain: Tier C urgent wording | ☐ |
| RC-C4 | Dyspnea + snoring → one merged finding | ☐ |
| RC-C5 | Max 3 recommendation bullets enforced | ☐ |
| RC-C6 | No specialist named unless Tier D conditions met | ☐ |
| RC-C7 | No engine codes / English on report | ☐ |
| RC-C8 | Clinical advisor written sign-off | ☐ |

### Visual validation

| # | Item | Pass |
|---|------|------|
| RC-V1 | Header matches wireframe §10 | ☐ |
| RC-V2 | Colors navy #003D5B, green #38A649 | ☐ |
| RC-V3 | Badge colors correct (green/amber) | ☐ |
| RC-V4 | Recommendation card styling | ☐ |
| RC-V5 | Typography hierarchy readable at arm's length | ☐ |
| RC-V6 | Clinic logo crisp in print | ☐ |
| RC-V7 | Design + clinic sign-off | ☐ |

### Medical validation

| # | Item | Pass |
|---|------|------|
| RC-M1 | Thresholds documented and traceable to registry | ☐ |
| RC-M2 | Reference intervals match spec §3 | ☐ |
| RC-M3 | Disclaimer legally approved by clinic | ☐ |
| RC-M4 | On-site urgent pathway documented for chest pain | ☐ |

### PDF validation

| # | Item | Pass |
|---|------|------|
| RC-P1 | PDF opens in Adobe Reader / browser | ☐ |
| RC-P2 | All Romanian diacritics correct | ☐ |
| RC-P3 | QR scans to clinic website | ☐ |
| RC-P4 | File size reasonable (< 500 KB typical) | ☐ |
| RC-P5 | PDF text matches UI for same screening | ☐ |
| RC-P6 | `validateParticipantReportPdf` passes | ☐ |

### Printing validation

| # | Item | Pass |
|---|------|------|
| RC-PR1 | A4 print at 100% scale — no clipped margins | ☐ |
| RC-PR2 | Black & white printer: badges readable | ☐ |
| RC-PR3 | Festival target printer model tested | ☐ |
| RC-PR4 | 10 consecutive prints without quality degradation | ☐ |

### Mobile validation (web UI)

| # | Item | Pass |
|---|------|------|
| RC-MO1 | Report page readable on 390px width | ☐ |
| RC-MO2 | Measurements table scrolls horizontally if needed | ☐ |
| RC-MO3 | Download PDF works mobile Safari / Chrome | ☐ |
| RC-MO4 | Sticky action bar does not cover content | ☐ |

### Performance

| # | Item | Pass |
|---|------|------|
| RC-PE1 | Report compose < 50 ms (client, typical) | ☐ |
| RC-PE2 | PDF generation < 2 s (client, typical) | ☐ |
| RC-PE3 | No visible freeze on report page load | ☐ |

### Accessibility

| # | Item | Pass |
|---|------|------|
| RC-A1 | Report HTML semantic sections (`<header>`, `<article>`, `<footer>`) | ☐ |
| RC-A2 | Table headers associated | ☐ |
| RC-A3 | QR has alt text / aria-hidden consistent with design | ☐ |
| RC-A4 | Color contrast WCAG AA for body text | ☐ |

### Regression tests

| # | Item | Pass |
|---|------|------|
| RC-R1 | `npm run typecheck` | ☐ |
| RC-R2 | `npm run build` | ☐ |
| RC-R3 | `npm run test:report` | ☐ |
| RC-R4 | Smoke S1–S7 | ☐ |
| RC-R5 | Operator results page unchanged | ☐ |
| RC-R6 | Signature + completion flow | ☐ |
| RC-R7 | Legacy screening sessions (if any) recover or gracefully regenerate PDF | ☐ |

---

## Complexity, risk, and estimates

### Complexity by phase

| Phase | Complexity | Reason |
|-------|------------|--------|
| 0 | Low | Tests + fixtures only |
| 1 | Low | Types only |
| 2 | **High** | Clinical logic consolidation + copy compliance |
| 3 | Medium | Assembly, must stay pure |
| 4 | Medium | React section split |
| 5 | **High** | PDF layout parity + encoding |
| 6 | Medium | Asset pipeline + token unification |
| 7 | Medium | Test coverage |
| 8 | Low–Medium | Deletion + import cleanup |
| 9 | Low | Process |

### Risk register (overall)

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R1 | UI/PDF copy mismatch ships | Medium | High | Parity tests Phase 7; same model |
| R2 | Clinical copy not medically approved | Low | Critical | Sign-off RC-C8 before Phase 9 |
| R3 | Print layout breaks at festival | Medium | High | RC-PR1–4 before event |
| R4 | Scope creep (ideal weight, FHIR) | Medium | Medium | Spec v1 frozen; defer to v2 |
| R5 | Migration breaks screening workflow | Low | Critical | Feature flag; smoke S1–S7 each phase |
| R6 | Threshold change affects operator + report differently | Medium | Medium | Single registry Phase 2 |

### Recommended implementation order

1. Phase 0 → 1 → 2 → 3 (**sequential, blocking**)
2. Phase 4 + 5 **in parallel** (after 3)
3. Phase 6 (overlap tail of 4/5)
4. Phase 7 → 8 → 9 (**sequential**)

### Time estimate

| Team size | Calendar time | Notes |
|-----------|---------------|-------|
| 1 engineer | 6–8 weeks | Sequential UI then PDF |
| 2 engineers | 4–5 weeks | Parallel UI + PDF after Phase 3 |
| + Clinical review | +1 week | Overlap with Phase 2–7 |

Engineering effort: **~25–40 person-days** including testing and cleanup.

---

## Phase approval log

| Phase | Authorized by | Date | Git tag / branch |
|-------|---------------|------|------------------|
| 0 | | | |
| 1 | | | |
| 2.1 | Vorba | 2026-08-01 | — |

**Phase 2.1 notes:** Measurement + findings logic extracted to `clinical/participant-view/`; legacy report modules delegate via thin wrappers. Additional change not in original file list: `packages/shared/src/report/fixtures/load-fixtures.ts` re-exports `GOLDEN_SCENARIO_IDS`, `GoldenScenarioFixture`, and `GoldenScenarioId` from `scenario-types.ts` (parity test import convenience).

| Phase | Authorized by | Date | Git tag / branch |
|-------|---------------|------|------------------|
| 2.2 | | | |
| 2.3 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| 6 | | | |
| 7 | | | |
| 8 | | | |
| 9 | | | |

---

## Document status

| Item | Status |
|------|--------|
| IMPLEMENTATION_MASTER_PLAN.md | ✅ Complete |
| Ready for Phase 0 authorization | Awaiting sign-off |

**Do not write production code until Phase 0 is authorized in the approval log above.**

---

*End of IMPLEMENTATION_MASTER_PLAN.md*
