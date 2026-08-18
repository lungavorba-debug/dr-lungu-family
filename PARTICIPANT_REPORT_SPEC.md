# MedScreen Festival — Participant Report Product Specification

> **Document type:** Official product specification (functional, not technical)  
> **Status:** Draft for approval — **no implementation until checklist complete**  
> **Audience:** Product, clinical advisors, design, engineering  
> **Related:** [`TARGET_ARCHITECTURE.md`](./TARGET_ARCHITECTURE.md) · [`ARCHITECTURE_AUDIT.md`](./ARCHITECTURE_AUDIT.md)  
> **Language:** Romanian (participant-facing copy is normative in this document)

---

## Document control

| Field | Value |
|-------|-------|
| Product | MedScreen Festival & Event Suite — Participant Screening Report |
| Format | A4 portrait (210 × 297 mm), print-ready |
| Primary use | Festival / campaign screening — printed and digital handoff |
| Tone | Premium private clinic — calm, clear, respectful, non-alarmist |

---

## 1. Report purpose

### 1.1 What this report is

The participant report is a **personal screening summary** given to each person after a medical screening at a festival or community campaign. It is **informational**, not a diagnosis. It translates same-day measurements and short health questions into plain language the participant can understand and act on calmly.

### 1.2 What the participant should understand after reading it

After reading the report, the participant should be able to answer:

1. **Who am I in this document?** — My name, age, and when the screening took place.
2. **Where was I screened?** — Which festival/campaign and which clinic performed the screening.
3. **What was measured?** — My key numbers (blood pressure, pulse, oxygen, glucose, weight-related measures) compared to usual reference ranges.
4. **Was anything noteworthy?** — In simple words, whether anything from today’s screening deserves attention (without medical jargon).
5. **What should I do next?** — One clear, practical next step — not a list of frightening possibilities.
6. **How do I contact the clinic?** — Where to go for follow-up (QR + clinic details).

### 1.3 What this report is NOT

- Not a substitute for a doctor’s consultation.
- Not an emergency instruction sheet (urgent cases are handled verbally on site).
- Not an operator/clinical risk dashboard (engine codes, demo flags, and internal rule names never appear).
- Not a multi-page medical dossier — it must remain **scannable in under 2 minutes**.

### 1.4 Emotional design goal

The participant should leave feeling:

- **Informed**, not overwhelmed.
- **Reassured** when results are unremarkable.
- **Guided**, not alarmed, when something needs follow-up.
- **Respected** — premium layout, correct diacritics, no sloppy copy.

---

## 2. Information hierarchy

### 2.1 Section order (normative)

| # | Section | Romanian title |
|---|---------|----------------|
| 1 | Header | *(no section title — clinic + event + QR)* |
| 2 | Report title | **RAPORT DE SCREENING MEDICAL** |
| 3 | Participant identification | **Participant** |
| 4 | Screening summary | **Rezumat** |
| 5 | Measurements table | **Măsurători** |
| 6 | Findings | **Ce a identificat screeningul** |
| 7 | Recommendations | **Recomandări** |
| 8 | Optional education | *(conditional — e.g. blood pressure tips)* |
| 9 | Footer | *(disclaimer + operator + clinic)* |

**QR code** lives in the **header** (top-right), not as a standalone section at the bottom.

**Report number and date** appear in the **participant identification** block, not the header.

### 2.2 Why this order is optimal

| Principle | How the order supports it |
|-----------|---------------------------|
| **Trust first** | Header establishes clinic credibility and festival context before clinical content. |
| **Identity before data** | Participant block confirms “this is about me” before numbers. |
| **Summary before detail** | Rezumat gives the headline in 2 sentences; anxious readers get the message immediately. |
| **Evidence before interpretation** | Measurements table shows facts; findings translate facts into plain language. |
| **Action last among clinical content** | Recommendations follow findings — natural “what this means → what to do”. |
| **Education only when relevant** | BP tips appear only when blood pressure is abnormal — avoids clutter for healthy participants. |
| **Legal + accountability at end** | Footer disclaimer and operator attribution close the document professionally. |

### 2.3 Sections that must NOT appear

- Operator clinical risk cards (cardiovascular/diabetes/sleep apnea levels).
- Engine warnings with `[DEMO]` or internal codes.
- Raw observation keys (e.g. `tensiune arterială crescută` as internal slug).
- Duplicate findings sections with different titles.
- Separate “Observațiile screeningului” **and** “Ce a identificat screeningul” — **one findings section only**.

---

## 3. Measurements

### 3.1 Table structure (all channels)

Four columns — **identical labels everywhere** (screen and print):

| Column | Romanian label |
|--------|----------------|
| 1 | **Parametru** |
| 2 | **Rezultat** |
| 3 | **Interval de referință** |
| 4 | **Observație** |

The fourth column shows a **short status label** (badge on screen, text badge in PDF) — not a full medical interpretation paragraph.

### 3.2 Row order (normative)

1. Tensiune arterială  
2. Puls  
3. Saturatie de oxigen (SpO₂)  
4. Glicemie  
5. Greutate  
6. Înălțime  
7. Indice de masă corporală (IMC)  
8. Circumferință abdominală  

### 3.3 Global rules

| Rule | Specification |
|------|---------------|
| Missing value | Show **—** in Rezultat; Observație = **—**; no badge |
| Units | Always shown inside **Rezultat** (e.g. `82 kg`, `95%`) — never a separate unit column |
| Ideal weight | **Not displayed** in v1 — avoids implying precision we do not measure; IMC and waist carry weight-related message |
| Badge | Yes, when Observație is not **—** |
| Badge levels | **Normal** · **Atenție** · **—** (neutral / not applicable) |
| Recommendation in table | **No** — recommendations belong only in the Recomandări section |
| Reference interval | Always shown when clinically meaningful; **—** for height/weight descriptive rows |

### 3.4 Measurement specification (each row)

#### 3.4.1 Tensiune arterială

| Attribute | Specification |
|-----------|---------------|
| **Name** | Tensiune arterială |
| **Unit** | mmHg (implicit in format `XXX / YY`) |
| **Display format** | `{systolic} / {diastolic}` or **—** |
| **Reference interval** | sub 140/90 mmHg |
| **Observație labels** | **Normal** · **Peste interval** · **Sub interval** · **—** |
| **Badge** | Yes — green (Normal), amber (Peste interval / Sub interval) |
| **Triggers finding** | Yes, when Peste interval |
| **Ideal value** | No |
| **Recommendation in table** | No |

**Threshold intent (product):** values at or above 140 systolic and/or 90 diastolic → Peste interval.

---

#### 3.4.2 Puls

| Attribute | Specification |
|-----------|---------------|
| **Name** | Puls |
| **Unit** | bpm (implicit: `{value}` without unit suffix, reference explains) |
| **Display format** | Integer or **—** |
| **Reference interval** | 60–100 |
| **Observație labels** | **Normal** · **Scăzut** · **Crescut** · **—** |
| **Badge** | Yes — green (Normal), amber (Scăzut / Crescut) |
| **Triggers finding** | Yes, when outside 60–100 |
| **Ideal value** | No |

---

#### 3.4.3 Saturatie de oxigen (SpO₂)

| Attribute | Specification |
|-----------|---------------|
| **Name** | SpO₂ |
| **Unit** | % |
| **Display format** | `{value}%` or **—** |
| **Reference interval** | min. 95% |
| **Observație labels** | **Normal** · **Scăzut** · **—** |
| **Badge** | Yes — green (Normal), amber (Scăzut) |
| **Triggers finding** | Yes, when below 95% |
| **Ideal value** | No |

---

#### 3.4.4 Glicemie

| Attribute | Specification |
|-----------|---------------|
| **Name** | Glicemie |
| **Unit** | mg/dL (implicit in value) |
| **Display format** | Integer or **—** |
| **Reference interval** | 70–99 mg/dL *(ajeo)* — see note |
| **Observație labels** | **Normal** · **Peste interval** · **Scăzut** · **—** |
| **Badge** | Yes |
| **Triggers finding** | Yes, when Peste interval (per fasting/non-fasting rules) |
| **Ideal value** | No |

**Product note:** Reference interval shown as **70–99** for simplicity on the printed report. Fasting vs non-fasting distinction is handled in clinical rules, not explained as jargon on the report. If non-fasting, operator records status internally; participant still sees simple Observație label.

---

#### 3.4.5 Greutate

| Attribute | Specification |
|-----------|---------------|
| **Name** | Greutate |
| **Unit** | kg |
| **Display format** | `{value} kg` (one decimal) or **—** |
| **Reference interval** | **—** |
| **Observație labels** | **—** only |
| **Badge** | No |
| **Triggers finding** | No (weight alone is not a finding) |
| **Ideal value** | **No** (v1) |

---

#### 3.4.6 Înălțime

| Attribute | Specification |
|-----------|---------------|
| **Name** | Înălțime |
| **Unit** | cm |
| **Display format** | `{value} cm` or **—** |
| **Reference interval** | **—** |
| **Observație labels** | **—** only |
| **Badge** | No |
| **Triggers finding** | No |
| **Ideal value** | No |

---

#### 3.4.7 Indice de masă corporală (IMC)

| Attribute | Specification |
|-----------|---------------|
| **Name** | IMC |
| **Unit** | kg/m² (implicit) |
| **Display format** | `{value}` with 2 decimals or **—** |
| **Reference interval** | 18,5–24,9 |
| **Observație labels** | **Normal** · **Peste interval** · **—** |
| **Badge** | Yes — green (Normal), amber (Peste interval) |
| **Triggers finding** | Yes, when ≥ 25 (excess weight messaging) |
| **Ideal value** | No — reference interval suffices |

**Participant-facing finding label:** Exces ponderal *(when IMC ≥ 25)*

---

#### 3.4.8 Circumferință abdominală

| Attribute | Specification |
|-----------|---------------|
| **Name** | Circumferință abdominală |
| **Unit** | cm |
| **Display format** | `{value} cm` or **—** |
| **Reference interval** | sub 80 cm (F) · sub 94 cm (M) — gender-specific |
| **Observație labels** | **Normal** · **Peste interval** · **—** |
| **Badge** | Yes |
| **Triggers finding** | Yes, when Peste interval |
| **Ideal value** | No |

---

### 3.5 Conditional education block (not in table)

When **tensiune arterială** is Peste interval or Sub interval, an extra section appears **after Recomandări**:

**Title:** Cum să vă măsurați corect tensiunea arterială:

**Bullets (normative copy):**
- repaus minimum 10 minute;
- poziție șezând;
- brațul la nivelul inimii;
- fără conversații în timpul măsurării;
- două măsurători pe zi timp de 5–7 zile.

---

## 4. Findings

### 4.1 Section rules

| Rule | Specification |
|------|---------------|
| Section title | **Ce a identificat screeningul** |
| Visibility | Hidden entirely when there are zero findings |
| Intro line | *În urma screeningului au fost identificate următoarele:* |
| Format | Bulleted list — one line per finding |
| Language | Plain Romanian — no medical codes, no English |
| Max items | No hard cap — typically 0–5 |

### 4.2 Approved finding wordings (normative)

Each finding below is the **exact participant-facing text**. Internal clinical logic maps to these strings only.

| Clinical signal | Participant finding (exact text) |
|-----------------|----------------------------------|
| Blood pressure elevated | Tensiune arterială peste valorile recomandate |
| BMI ≥ 25 | Exces ponderal |
| Waist elevated (gender-specific) | Circumferință abdominală crescută |
| Glucose elevated | Glicemie peste valorile recomandate |
| SpO₂ below 95% | Saturație de oxigen sub valorile recomandate |
| Pulse outside 60–100 | Puls în afara intervalului obișnuit |
| Chest pain reported | Durere în piept raportată |
| Current smoker | Fumat raportat |
| Dyspnea and/or snoring (combined) | Simptome respiratorii raportate |

**Merge rule:** If both shortness of breath and snoring are reported, show **one** finding: *Simptome respiratorii raportate* — not two separate bullets.

### 4.3 Wording principles

- Use **“raportată / raportat”** for symptoms the participant declared — not “depistată”.
- Use **“peste / sub valorile recomandate”** for measurements — not “crescută patologic”.
- Never use: *anomalie*, *patologic*, *risc cardiovascular*, *HTA*, *diabet*, *obezitate morbidă*.
- Never show duplicate findings (same message twice).

---

## 5. Recommendations

### 5.1 Design philosophy

The participant receives:

1. **One clear conclusion** — in Rezumat (section 4).
2. **One primary recommendation block** — short, actionable, calm.
3. **No unnecessary anxiety** — avoid urgent language unless chest pain or critically high blood pressure on site.
4. **Specialist names only when necessary** — prefer “consult medical” / “evaluare medicală” over listing multiple specialties.

### 5.2 Section structure

| Element | Specification |
|---------|---------------|
| Section title | **Recomandări** |
| Intro line | *Pe baza informațiilor și măsurătorilor efectuate astăzi:* |
| Body format | **Maximum 3 bullet points** — never more on the printed report |
| Visibility | Always shown (even when healthy — see healthy path) |

### 5.3 Recommendation tiers

#### Tier A — Healthy screening (no findings)

**Bullets (exactly these three, order fixed):**

1. Continuați obiceiurile sănătoase actuale: alimentație echilibrată, mișcare regulată, odihnă suficientă.
2. Evitați fumatul și consumul excesiv de alcool.
3. Programați screening medical preventiv periodic, conform recomandărilor medicului dumneavoastră.

**Tone:** congratulatory but restrained — no medical claims of “perfect health”.

---

#### Tier B — Findings present, routine follow-up

**Intro unchanged.**

**Bullets (max 3 — priority order):**

1. **Primary action** — one sentence, no specialist name unless row below applies:
   - *Vă recomandăm o evaluare medicală de specialitate pentru interpretarea completă a rezultatelor.*
2. **Home monitoring** (only if blood pressure finding):  
   - *Monitorizați tensiunea arterială acasă, dimineața și seara, după 10 minute de repaus, timp de 5–7 zile, și notați valorile.*
3. **Lifestyle** (only if IMC and/or waist finding):  
   - *Adoptați treptat obiceiuri alimentare echilibrate și activitate fizică regulată.*

If fewer than 3 apply, show only what applies — **minimum 1 bullet**.

---

#### Tier C — Symptom reported (chest pain)

Replace Tier B bullet 1 with:

- *Ați raportat durere în piept. Vă recomandăm să solicitați **urgent** o evaluare medicală.*

**On-site protocol (non-print):** operator must verbally direct participant before they leave — the report supports but does not replace urgent pathway.

---

#### Tier D — Specialist named (restricted use)

Specialist name may appear **only** in these cases:

| Condition | Allowed wording |
|-----------|-----------------|
| Chest pain | consult cardiologic *(inside Tier C bullet)* |
| Dyspnea/snoring finding | evaluare pulmonologică |
| Glucose finding + known diabetes | urmați recomandările medicului diabetolog |
| Glucose finding, no known diabetes | consult diabetologic *(only if glucose finding present)* |

**Never** list more than **one** specialist per report. If multiple would apply, use generic Tier B bullet 1 instead.

### 5.4 What recommendations must NOT do

- No engine codes (`bp_specialist_referral`).
- No semicolon-separated micro-bullet lists of 8+ items.
- No duplicate bullets.
- No contradictory advice (e.g. “everything normal” + “urgent cardiologist”).
- No PDF-only generic paragraph that differs from screen bullets.

---

## 6. Visual emphasis

### 6.1 Hierarchy of visual weight (strongest → weakest)

1. **Participant name** — largest text in body (after report title).
2. **Abnormal measurement result** — bold/navy emphasis on the **Rezultat** cell.
3. **Observație badge** — amber for attention; green for normal; neutral grey for —.
4. **Recomandări block** — subtle green-tinted card/border — draws eye after findings.
5. **Report title** — centered, navy, uppercase.
6. **QR code** — prominent in header but secondary to clinic name.
7. **Footer disclaimer** — smallest body text, muted grey.

### 6.2 Element-by-element emphasis rules

| Element | Emphasis treatment |
|---------|-------------------|
| **Rezultat (normal)** | Semibold, default ink |
| **Rezultat (abnormal)** | Semibold, navy (`#003D5B`) |
| **Reference interval** | Regular weight, muted grey — never bold |
| **Observație badge Normal** | Green background, dark green text |
| **Observație badge Atenție** | Amber background, dark amber text |
| **Observație —** | Muted, no badge fill |
| **Finding bullets** | Standard body — no red alarm styling |
| **Recommendation card** | Light green background `#F7FBF8`, green left border `#38A649` |
| **QR** | Black modules on white; quiet zone preserved; min 22 mm print size |
| **Clinic name (header)** | Bold, navy |
| **Sponsor line** | Regular, smaller — must not overpower clinic |

### 6.3 What must never be emphasized

- Internal report IDs beyond the human-readable report number.
- Reference intervals when result is normal (no need to alarm).
- Festival name larger than clinic name.
- Red text for non-urgent findings (reserved for Tier C urgent wording only).

---

## 7. Branding

### 7.1 Brand identity

| Element | Content |
|---------|---------|
| Clinic name | Dr. Lungu Family |
| Slogan | Grijă pentru sănătate |
| Phone | 0755 75 45 45 |
| Address | Aleea Spitalului nr. 16, etaj 1, Pitești — vizavi de Spitalul Județean de Urgență |
| Website | www.drlungufamily.ro |
| Email | Not shown on report v1 *(optional future)* |

### 7.2 Header layout (A4)

```
┌────────────────────────────────────────────────────────────────┐
│ [LOGO]   Dr. Lungu Family                          [QR CODE]   │
│ 18mm     Grijă pentru sănătate                                 │
│          Telefon 0755 75 45 45                                 │
│          Aleea Spitalului nr. 16, etaj 1, Pitești...           │
│          www.drlungufamily.ro                                  │
│                                                                │
│          Screening realizat în cadrul                          │
│          {Festival Name}                                       │
│          {Edition line — if present}                           │
│          cu sprijinul {Sponsor — if present}                   │
├────────────────────────────────────────────────────────────────┤
```

| Element | Position | Size / notes |
|---------|----------|--------------|
| **Logo** | Top-left | 18 mm square; clinic logo; clear space 4 mm |
| **Clinic block** | Left of center, right of logo | Name bold; slogan italic; contact lines 8 pt |
| **QR** | Top-right | 22 mm module + 2 mm quiet zone; links to clinic website |
| **Festival** | Below clinic block, left-aligned | Label small caps grey; festival name navy |
| **Sponsor** | Below festival | Prefix *cu sprijinul* grey; sponsor name regular |
| **Rule** | Full width below header | 0.5 pt, light grey — separates header from title |

### 7.3 Report title

- Centered on page: **RAPORT DE SCREENING MEDICAL**
- 17 pt equivalent, navy, letterspacing +2%
- Accent rule below title (green, 24 mm wide, centered)

### 7.4 Participant identification block

| Field | Label (small caps) | Example |
|-------|-------------------|---------|
| Name | PARTICIPANT | Ion Popescu |
| Age | VÂRSTA | 45 ani |
| Date | DATA SCREENINGULUI | 01.08.2026 |
| Time | ORA | 11:35 |
| Report number | NR. RAPORT | SM-2026-004281 |
| Operator | OPERATOR | Maria Ionescu |

**Layout:** Two columns — left: Participant, Date, Nr. raport; right: Vârsta, Ora, Operator.

### 7.5 Color palette (normative)

| Token | Hex | Use |
|-------|-----|-----|
| Navy | `#003D5B` | Titles, clinic name, abnormal results |
| Green | `#38A649` | Accent rules, normal badges, recommendation border |
| Ink | `#252B30` | Body text |
| Muted | `#737880` | Reference intervals, footer |
| Rule grey | `#E5E9EF` | Table rules, dividers |
| Amber badge bg | `#FEF3E2` | Attention status |
| Green badge bg | `#EDF7F0` | Normal status |

### 7.6 Typography

| Role | Font | Size (print) |
|------|------|--------------|
| Report title | Serif (Liberation Serif / equivalent) | 17 pt |
| Section titles | Serif bold small caps | 10 pt |
| Participant name | Serif bold | 13 pt |
| Body | Serif regular | 9.5 pt |
| Table header | Serif bold | 7.5 pt |
| Footer | Serif regular | 7.5 pt |

Screen UI uses the same semantic hierarchy with web-safe serif stack.

---

## 8. Footer

### 8.1 Footer content (normative, exact copy)

**Paragraph 1:**  
Acest raport are caracter informativ și nu înlocuiește un consult medical.

**Paragraph 2:**  
Pentru recomandări personalizate vă încurajăm să solicitați o evaluare medicală de specialitate.

**Separator rule** (light grey)

**Line 3:** Screening efectuat de:  
**Line 4:** {Operator name} — semibold  
**Line 5:** {Clinic name} — navy semibold

### 8.2 Footer must NOT include

- Page numbers on single-page reports.
- Legal registration numbers (unless clinic requests later).
- Festival logo (clinic owns the footer).
- Duplicate QR (QR is header-only).

---

## 9. Multi-page behavior

### 9.1 Design target

**Primary target:** 99% of reports fit **one A4 page** (8 measurements + ≤5 findings + ≤3 recommendations).

Multi-page rules apply only when content overflows.

### 9.2 Overflow order (what moves to page 2)

If vertical space is insufficient, break in this order:

1. Optional education block → top of page 2  
2. Recommendation bullets (never split mid-bullet) → page 2  
3. Findings (never split mid-bullet) → page 2  
4. Measurements table — **never split mid-row**; if table doesn't fit, move entire table to page 2  
5. Summary + participant block — **always remain on page 1**

### 9.3 Running header (page 2+)

Minimal strip, 12 mm height:

```
Dr. Lungu Family · Raport screening · {Participant name} · {Nr. raport}
```

No logo repeat on page 2+ (saves space). Navy text, 7.5 pt.

### 9.4 Page numbers

Format: `Pagina 2 din 2` — bottom center, 7 pt, muted grey.  
Page 1 shows page number **only if** total pages > 1.

### 9.5 Footer on multi-page

- **Full footer (disclaimer + operator)** appears **only on the last page**.
- Intermediate pages: no disclaimer — running header only.

---

## 10. Final wireframe — A4 (210 × 297 mm)

Margins: **20 mm** left/right, **18 mm** top, **20 mm** bottom.  
Content width: **170 mm**.

```
┌──────────────────────────────────────────────────────────────────────────────┐  ▲
│ ┌────┐                                                          ┌──────────┐ │  │
│ │LOGO│  Dr. Lungu Family                                        │ QR 22mm  │ │  │  HEADER
│ │18mm│  Grijă pentru sănătate                                   │          │ │  │  ~45 mm
│ └────┘  Telefon 0755 75 45 45                                   └──────────┘ │  │
│         Aleea Spitalului nr. 16, etaj 1, Pitești...                          │  │
│         www.drlungufamily.ro                                                   │  │
│         Screening realizat în cadrul                                             │  │
│         {Festival Name}                                                        │  │
│         {Ediția ...}                                                           │  │
│         cu sprijinul {Sponsor}                                                 │  │
├──────────────────────────────────────────────────────────────────────────────┤  ▼
│                                                                               │  │
│                    RAPORT DE SCREENING MEDICAL                                  │  │  TITLE
│                         ─────── ✦ ───────                                     │  │  ~14 mm
│                                                                               │  │
├──────────────────────────────────────────────────────────────────────────────┤  │
│  PARTICIPANT              Ion Popescu          VÂRSTA           45 ani        │  │
│  DATA SCREENINGULUI       01.08.2026           ORA              11:35         │  │  PARTICIPANT
│  NR. RAPORT               SM-2026-004281       OPERATOR          Maria I.       │  │  ~28 mm
├──────────────────────────────────────────────────────────────────────────────┤  │
│  ▌ REZUMAT                                                                    │  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │ În urma screeningului efectuat astăzi, valorile măsurate nu indică      │ │  │  SUMMARY
│  │ anomalii importante în cadrul acestui screening.                         │ │  │  ~22 mm
│  │ Depistarea precoce a factorilor de risc contribuie la prevenirea         │ │  │
│  │ bolilor cardiovasculare.                                                 │ │  │
│  └─────────────────────────────────────────────────────────────────────────┘ │  │
├──────────────────────────────────────────────────────────────────────────────┤  │
│  ▌ MĂSURĂTORI                                                                 │  │
│  ┌──────────────────┬──────────┬─────────────────┬─────────────────────┐   │  │
│  │ PARAMETRU        │ REZULTAT │ INTERVAL REF.   │ OBSERVAȚIE          │   │  │
│  ├──────────────────┼──────────┼─────────────────┼─────────────────────┤   │  │
│  │ Tensiune arterial│ 128/82   │ sub 140/90      │ [Normal]            │   │  │
│  │ Puls             │ 72       │ 60–100          │ [Normal]            │   │  │  MEASUREMENTS
│  │ SpO₂             │ 98%      │ min. 95%        │ [Normal]            │   │  │  ~95 mm
│  │ Glicemie         │ 92       │ 70–99           │ [Normal]            │   │  │  (8 rows)
│  │ Greutate         │ 82 kg    │ —               │ —                   │   │  │
│  │ Înălțime         │ 175 cm   │ —               │ —                   │   │  │
│  │ IMC              │ 26.78    │ 18,5–24,9       │ [Peste interval]    │   │  │
│  │ Circumf. abdom.  │ 96 cm    │ sub 94 cm       │ [Peste interval]    │   │  │
│  └──────────────────┴──────────┴─────────────────┴─────────────────────┘   │  │
├──────────────────────────────────────────────────────────────────────────────┤  │
│  ▌ CE A IDENTIFICAT SCREENINGUL                                               │  │
│  În urma screeningului au fost identificate următoarele:                      │  │
│    • Exces ponderal                                                           │  │  FINDINGS
│    • Circumferință abdominală crescută                                        │  │  ~18 mm
│    (hidden if empty)                                                          │  │
├──────────────────────────────────────────────────────────────────────────────┤  │
│  ▌ RECOMANDĂRI                                                                │  │
│  ┌─ green border ────────────────────────────────────────────────────────────┐ │  │
│  │ Pe baza informațiilor și măsurătorilor efectuate astăzi:                  │ │  │
│  │  • Vă recomandăm o evaluare medicală de specialitate pentru              │ │  │  RECOMMENDATIONS
│  │    interpretarea completă a rezultatelor.                                 │ │  │  ~28 mm
│  │  • Adoptați treptat obiceiuri alimentare echilibrate și mișcare regulată.│ │  │
│  └───────────────────────────────────────────────────────────────────────────┘ │  │
├──────────────────────────────────────────────────────────────────────────────┤  │
│  ▌ CUM SĂ VĂ MĂSURAȚI CORECT TENSIUNEA ARTERIALĂ  (conditional)               │  │  EDUCATION
│  • repaus minimum 10 minute;  • poziție șezând;  ...                         │  │  ~20 mm
├──────────────────────────────────────────────────────────────────────────────┤  │
│  ─────────────────────────────────────────────────────────────────────────── │  │
│  Acest raport are caracter informativ și nu înlocuiește un consult medical.   │  │
│  Pentru recomandări personalizate vă încurajăm să solicitați o evaluare      │  │  FOOTER
│  medicală de specialitate.                                                    │  │  ~25 mm
│  ─────────────────────────────────────────────────────────────────────────── │  │
│  Screening efectuat de: Maria Ionescu                                         │  │
│  Dr. Lungu Family                                                             │  │
└──────────────────────────────────────────────────────────────────────────────┘  ▼

Total target height: ≤ 270 mm content (fits one page with abnormal BP education omitted)
```

### 10.1 Spacing tokens (normative)

| Gap | mm |
|-----|-----|
| After header rule | 6 |
| After title accent | 8 |
| After participant block | 10 |
| Between sections | 8 |
| Table row height | 7 |
| Before footer rule | 6 |
| Section title to content | 4 |

---

## 11. Approval checklist

**Implementation of the participant report is blocked until every item below is signed off.**

### 11.1 Product & clinical

| # | Item | Owner | Approved |
|---|------|-------|----------|
| C1 | Report purpose (§1) accepted | Product | ☐ |
| C2 | Section order (§2) accepted | Product + Clinical | ☐ |
| C3 | All 8 measurement rows — names, units, intervals (§3) | Clinical advisor | ☐ |
| C4 | Observație labels and badge rules (§3) | Clinical advisor | ☐ |
| C5 | Decision: ideal weight NOT shown in v1 (§3.3) | Product | ☐ |
| C6 | All finding wordings — exact Romanian copy (§4.2) | Clinical advisor | ☐ |
| C7 | Respiratory findings merge rule (§4.2) | Clinical advisor | ☐ |
| C8 | Recommendation tiers A–D (§5) | Clinical advisor | ☐ |
| C9 | Max 3 recommendation bullets | Product | ☐ |
| C10 | Specialist naming restrictions (§5.3 Tier D) | Clinical advisor | ☐ |
| C11 | Chest pain urgent pathway — print + on-site verbal | Clinical + Operations | ☐ |
| C12 | BP education conditional block copy (§3.5) | Clinical advisor | ☐ |

### 11.2 Content & language

| # | Item | Owner | Approved |
|---|------|-------|----------|
| L1 | All participant-facing text is Romanian | Content | ☐ |
| L2 | No English, engine codes, or internal keys on report | Content | ☐ |
| L3 | Rezumat copy — healthy vs findings paths (§2 + §5) | Content | ☐ |
| L4 | Footer disclaimer exact wording (§8) | Legal / Clinic | ☐ |
| L5 | Diacritics verified in all normative strings | Content | ☐ |

### 11.3 Visual & brand

| # | Item | Owner | Approved |
|---|------|-------|----------|
| V1 | Header wireframe layout (§7.2, §10) | Design + Clinic | ☐ |
| V2 | Logo asset approved (quality, dimensions) | Clinic | ☐ |
| V3 | Color palette (§7.5) | Design + Clinic | ☐ |
| V4 | Typography choices (§7.6) | Design | ☐ |
| V5 | Visual emphasis rules (§6) | Design | ☐ |
| V6 | QR placement and minimum size (§7.2) | Design | ☐ |
| V7 | Festival + sponsor hierarchy — clinic primary | Product + Clinic | ☐ |
| V8 | Recommendation card styling (§6) | Design | ☐ |

### 11.4 Layout & print

| # | Item | Owner | Approved |
|---|------|-------|----------|
| P1 | A4 wireframe (§10) accepted | Design | ☐ |
| P2 | One-page target for typical case | Product | ☐ |
| P3 | Multi-page overflow rules (§9) | Design + Engineering | ☐ |
| P4 | Print test on campaign printer (blank mockup) | Operations | ☐ |
| P5 | Table fits 170 mm content width | Design | ☐ |

### 11.5 Parity & architecture alignment

| # | Item | Owner | Approved |
|---|------|-------|----------|
| A1 | Same section order on screen and PDF | Product | ☐ |
| A2 | Same measurement column labels on screen and PDF | Product | ☐ |
| A3 | Same finding strings on screen and PDF | Clinical | ☐ |
| A4 | Same recommendation bullets on screen and PDF | Clinical | ☐ |
| A5 | Spec aligns with TARGET_ARCHITECTURE.md single model | Engineering | ☐ |

### 11.6 Stakeholder sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product owner | | | |
| Clinical advisor | | | |
| Clinic representative (Dr. Lungu Family) | | | |
| Design lead | | | |
| Engineering lead | | | |

---

**When all boxes are checked and sign-off table is complete, this document becomes the frozen specification for implementation (STEP 4+).**

---

*End of PARTICIPANT_REPORT_SPEC.md*
