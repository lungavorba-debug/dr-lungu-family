# MedScreen — Product Specification

**Version:** 1.0  
**Status:** Official — single source of truth  
**Audience:** Developers, operators, product owners, AI assistants

---

## 1. Product Vision

MedScreen is a **fast cardiovascular screening application**.

It is designed for:

- Festivals
- Health caravans
- Villages and rural communities
- Companies and workplace campaigns
- Public screening campaigns

MedScreen is **not**:

- An Electronic Medical Record (EMR)
- A medical consultation platform
- A hospital information system
- A full anamnesis or medical history application

Every product decision must reinforce **speed, simplicity, and cardiovascular screening at the point of care** — not clinical documentation or longitudinal care.

---

## 2. Product Goal

Complete **one participant screening in approximately 3–5 minutes**.

Operational priorities:

- **Reduce operator typing** — prefer selection, defaults, and AI-assisted capture over free text.
- **Reduce clicks** — minimize steps, confirmations, and navigation depth.
- **Keep the workflow extremely simple** — a volunteer with minimal medical training must be able to run a screening correctly.

Success is measured by throughput at events, not by depth of clinical documentation.

---

## 3. Screening Workflow

The operator-facing flow is linear and must remain obvious at every step:

```
Participant
  →
Identification
  →
Screening Questions
  →
Measurements
  →
Results
  →
Participant Report
  →
Signature
  →
Save
```

Operators must immediately understand that this is a **cardiovascular screening workflow**, not a medical consultation.

---

## 4. Participant Identification

Required fields for each participant:

| Field | Description |
|-------|-------------|
| First name | Given name |
| Last name | Family name |
| Age | Years |
| Sex | Male / Female (used for calculations such as ideal weight) |
| Phone | Contact number |
| Locality | City, village, or place of residence |

Identification must be quick to enter and may be assisted by the AI Assistant (see Section 8).

---

## 5. Screening Questions

**Only** the following screening questions exist in the current product. No full medical interview, review of systems, or consultation workflow may be exposed to operators.

| Topic | Operator-facing intent | Response options |
|-------|------------------------|------------------|
| Known hypertension | Tension/high blood pressure or treatment for it | Yes / No |
| Known diabetes | Diabetes or treatment for it | Yes / No |
| Smoking | Current smoking status | Yes / No / Former smoker |
| Daily treatment | Takes medication every day | Yes / No; if Yes, **optional** free text only if the participant voluntarily describes treatment |
| Frequent snoring | Told they snore frequently at night | Yes / No |
| Chest pain | Recent chest pain or pressure | None / On exertion / At rest / Both exertion and rest |
| Shortness of breath | Gets tired or breathless more easily than before | Yes / No |

Rules:

- Treatment details are **never required** (no medication names or dosages mandatory).
- Medication names must **never be inferred** — store only what the participant says voluntarily.
- These are **screening questions only**; they do not turn the app into a consultation system.

---

## 6. Measurements

Operators capture the following measurements during screening:

| Measurement | Typical unit / note |
|-------------|---------------------|
| Blood pressure | Systolic / diastolic (mmHg) |
| Pulse | bpm |
| Oxygen saturation | % (SpO₂) |
| Blood glucose | mg/dL (with fasting / non-fasting context where applicable) |
| Weight | kg |
| Height | cm |
| Waist circumference | cm |

Validation and unusual-value warnings may apply; operators confirm before saving when values are out of expected range.

---

## 7. Automatic Calculations

The system computes and displays (read-only where applicable) the following from measurements and participant data:

| Calculation | Inputs / notes |
|-------------|----------------|
| **BMI** | Weight and height |
| **Ideal weight** | Height and sex (Devine formula; read-only, recomputed when height or sex changes) |
| **BMI classification** | From BMI thresholds |
| **Blood pressure classification** | From systolic / diastolic values |
| **Blood glucose classification** | From glucose value and collection context |
| **Waist classification** | From waist circumference (and sex where rules require) |
| **Cardiovascular risk** | From clinical rules engine using measurements and screening answers |

Calculations must stay consistent across UI, clinical engine input, storage, and export. Do not change formulas or clinical rule semantics without explicit product approval.

---

## 8. AI Assistant

The AI exists **only to reduce typing** for the operator. It is **not** performing a medical consultation.

### The AI may help complete

- Participant identification (name, phone, age, sex, locality)
- Screening questions (Section 5)

### The AI must NEVER

- Invent information
- Invent diagnoses
- Invent allergies
- Invent surgical or family history
- Invent complete medical history
- Invent medication names or dosages
- Fill fields from **silence** or empty audio
- Use **background conversations**, operator speech, or environmental noise as patient data
- Populate fields from healthcare professional questions (only **participant answers** count)

### Priority

- **Manual edits always have priority** over AI suggestions.
- AI output is assistive; the operator confirms the record before proceeding.

---

## 9. Participant Report

The participant-facing report includes:

- Participant identification
- Screening answers
- Measurements
- Calculated values (e.g. BMI, ideal weight, classifications where shown)
- Interpretation (plain-language summary from clinical evaluation)
- Recommendations (see Section 10)
- Clinic logo and branding
- Campaign information (name, edition, location, etc.)
- Participant signature

Report layout and PDF generation are governed by existing report modules; changes must not expand scope into full EMR-style documentation without product review.

---

## 10. Recommendations

Recommendations are **generated automatically** according to the **implemented clinical rules** (clinical engine).

They:

- Support screening follow-up messaging (e.g. lifestyle, further checks)
- Are appropriate for a **public screening context**

They **never replace** medical consultation, diagnosis, or treatment prescribed by a licensed clinician.

---

## 11. Data Storage

Every **completed** screening is saved persistently.

**Excel export** must include at minimum:

| Category | Content |
|----------|---------|
| Participant | Identification fields |
| Measurements | Raw measurement values |
| Calculated values | BMI, ideal weight, classifications, risk outputs as applicable |
| Screening answers | All Section 5 responses |
| Campaign | Campaign metadata |
| Date | Screening date / timestamp |
| Signature | Evidence that participant received the report (as stored by the system) |

Export and database schema changes must remain compatible with campaign reporting and audit requirements.

---

## 12. Development Principles

Every future implementation must:

1. **Reduce typing**
2. **Reduce clicks**
3. **Improve operator speed**
4. **Simplify the workflow**
5. **Preserve the cardiovascular screening purpose** — not EMR, not consultation, not full anamnesis

When choosing between a richer clinical feature and a faster screening path, **choose the faster screening path** unless this document is explicitly updated.

Do not redesign architecture, expand scope, or add consultation workflows without product sign-off.

---

## 13. Golden Rule

**Before implementing any feature, bug fix, or refactor**, every developer or AI assistant **must read this document first**.

If a requested implementation **conflicts** with this specification:

1. **Stop**
2. **Explain the conflict** clearly to the requester
3. **Do not change code** until the specification is updated or the request is narrowed to comply

This file is the **single source of truth** for MedScreen product behavior.

---

*End of Product Specification*
