# Country-Driven Docs for License Parsing

## Overview

Replace all Jamaica-hardcoded logic with a data-driven system.
`docs/<country>/driver_license.json` defines the field spec for each country.
A country picker on the More screen controls which spec is active.
The spec drives the AI prompt, OCR fallback, license edit form, and license card display.

---

## Decisions

| Question                 | Decision                                                                          |
| ------------------------ | --------------------------------------------------------------------------------- |
| Region vs Country        | Country replaces Region entirely                                                  |
| Country picker placement | New section at top of More screen                                                 |
| Non-JA OCR fallback      | AI-only (no custom regex for unsupported countries)                               |
| License model            | Generic `DynamicDriverLicense` with `fields: Record<string, string \| undefined>` |
| Initial countries        | `"jm"` (Jamaica) only — only country in `docs/` folder                            |
| `parsingMode` bug        | Fixed as part of this work (missing from settings store)                          |

---

## Directory: `docs/` — Source of Truth

```
docs/
  jamaica/
    driver_license.json   ← field spec for JA driver's licence
    document.json         ← JA vehicle document types
```

Each `driver_license.json` is an array containing one object:

```json
[
  {
    "type": "drivers_licence",
    "label": "Driver's Licence",
    "issuing_authority": "Tax Administration Jamaica (TAJ) / Island Traffic Authority (ITA)",
    "fields": {
      "fieldName": {
        "type": "string | date | enum",
        "required": true,
        "pattern": "optional regex",
        "values": ["for enums only"],
        "format": "for dates"
      }
    }
  }
]
```

To add a new country: create `docs/<countryCode>/driver_license.json`, add a static import in `services/docs-registry.ts`, and add the entry to `COUNTRY_REGISTRY`.

---

## Phase 1 — Data Layer

### 1. `services/docs-registry.ts` _(new file)_

Central registry for all country document specs. Uses static imports (React Native does not support runtime filesystem reads in production).

```ts
export type CountryCode = "jm";

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  jm: "Jamaica",
};

export interface FieldSpec {
  type: "string" | "date" | "enum";
  required?: boolean;
  pattern?: string;
  values?: string[];
  format?: string;
  label?: string;
}

export interface DriverLicenseSpec {
  type: string;
  label: string;
  issuing_authority: string;
  fields: Record<string, FieldSpec>;
}

export function getDriverLicenseSpec(country: CountryCode): DriverLicenseSpec;
```

**Deps:** `docs/jamaica/driver_license.json`

---

### 2. `store/settings-store.ts`

- Replace `RegionCode` → `CountryCode` (imported from `docs-registry`)
- Replace `REGION_LABELS` → `COUNTRY_LABELS`
- Rename state field `region` → `country: CountryCode`, default `"jm"`
- Rename action `setRegion` → `setCountry`
- Add `parsingMode: "entity" | "ocr"` + `setParsingMode` _(fixes existing runtime bug in `more.tsx`)_

---

### 3. `models/driver-license.ts`

Add `DynamicDriverLicense`:

```ts
import { CountryCode } from "@/services/docs-registry";

export interface DynamicDriverLicense {
  id: string;
  country: CountryCode;
  fields: Record<string, string | undefined>;
  imageUriFront?: string;
  imageUriBack?: string;
  createdAt: string;
  updatedAt: string;
}
```

Existing `DriverLicense` and `JamaicanDriverLicense` interfaces are removed (replaced by dynamic model).

---

### 4. `store/license-store.ts`

- Change `JamaicanDriverLicense` → `DynamicDriverLicense` in state and all methods

---

## Phase 2 — More Screen

### 5. `app/(tabs)/more.tsx`

Add a country picker section **at the very top of the screen** (above the license banner and nav menu).

```
┌─────────────────────────────┐
│  More                       │  ← header
├─────────────────────────────┤
│  COUNTRY                    │  ← new section
│  [Jamaica ▾]                │
├─────────────────────────────┤
│  [License card banner]      │  ← existing (if license saved)
├─────────────────────────────┤
│  Documents                  │
│  Vehicles                   │
│  ...                        │  ← existing menu
├─────────────────────────────┤
│  SCANNING                   │
│  Entity Extraction  [toggle]│  ← existing (now fixed)
└─────────────────────────────┘
```

- Uses `country` / `setCountry` from updated store
- Renders `COUNTRY_LABELS` for each entry in `CountryCode`
- Fix `parsingMode` / `setParsingMode` (now defined in store)

---

## Phase 3 — Settings Screen Cleanup

### 6. `app/settings.tsx`

- Remove the old Region picker section (replaced by country picker on More screen)
- Update all `region` / `RegionCode` / `REGION_LABELS` imports → `country` / `CountryCode` / `COUNTRY_LABELS`

---

## Phase 4 — License UI

### 7. `app/license.tsx` — Dynamic form

**Edit mode:**

- Replace hardcoded Jamaica state fields with `fields: Record<string, string>` keyed by spec field names
- Load `spec = getDriverLicenseSpec(country)` from the registry on mount
- Render each `spec.fields` entry as the appropriate control:
  - `type: "string"` → `TextInput`
  - `type: "date"` → date text input (with ISO normalisation on save)
  - `type: "enum"` → segmented control / picker using `values`
- Required fields from spec are marked with `*`
- Validate `pattern` (regex) for fields that have one (e.g. `licenseNumber: ^\d{7}$`, `trn: ^\d{9}$`)

**Save:**

```ts
const license: DynamicDriverLicense = {
  id: uuidv4(),
  country,
  fields,
  imageUriFront,
  imageUriBack,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

**View mode:**

- Pass `license` + `spec` to `<LicenseCard>`

---

### 8. `components/license/license-card.tsx` — Dynamic card

**Before (hardcoded):**

```tsx
<Text>DRIVER'S LICENCE</Text>
<Text>GOVERNMENT OF JAMAICA</Text>
<Text>{license.fullName}</Text>
<Text>{license.trn}</Text>
```

**After (dynamic):**

```tsx
<Text>{spec.label.toUpperCase()}</Text>
<Text>{spec.issuing_authority}</Text>
{Object.entries(spec.fields).map(([key, fieldSpec]) =>
  license.fields[key] ? (
    <Field label={key} value={license.fields[key]} />
  ) : null
)}
```

Props: `license: DynamicDriverLicense`, `spec: DriverLicenseSpec`

---

## Phase 5 — Services

### 9. `services/firebase/ai-license.ts` — Dynamic AI prompt

**Before:** Prompt hardcodes 16 Jamaican field names.

**After:**

```ts
export async function extractLicenseFieldsWithAI(
  country: CountryCode,
  frontUri?: string,
  backUri?: string,
): Promise<DynamicDriverLicense["fields"]>;
```

Prompt is built dynamically from `spec.fields`:

```
Extract the following fields from this driver's licence image as a JSON object.
Field name → type (pattern if applicable):
  fullName → string
  licenseNumber → string (pattern: ^\d{7}$)
  trn → string (pattern: ^\d{9}$)
  sex → enum: M, F
  ...
Return only valid JSON.
```

---

### 10. `services/ocr/parsers/license-parser.ts` — Country-aware wrapper

Add:

```ts
export function parseLicenseByCountry(
  text: string,
  country: CountryCode,
): Record<string, string | undefined> | null;
```

- `"jm"`: calls existing `parseJamaicanLicenseFromText`, maps result to a `Record` keyed by field names
- All other countries: returns `null` → caller falls back to AI

Update `extractLicenseFromOCR` to return `DynamicDriverLicense | null`.

**Scan flow (updated):**

```
image captured
    │
    ▼
OCR text extracted
    │
    ├─ parseLicenseByCountry(text, country)
    │       └─ "jm" → Jamaican regex parser → fields Record
    │       └─ other → null
    │
    ├─ null → extractLicenseFieldsWithAI(country, frontUri, backUri)
    │
    └─ merge into DynamicDriverLicense
```

---

## Files Changed

| File                                     | Type | Notes                                      |
| ---------------------------------------- | ---- | ------------------------------------------ |
| `services/docs-registry.ts`              | New  | Country registry, static JSON imports      |
| `store/settings-store.ts`                | Edit | region→country, add parsingMode            |
| `models/driver-license.ts`               | Edit | Add DynamicDriverLicense, remove JA types  |
| `store/license-store.ts`                 | Edit | JamaicanDriverLicense→DynamicDriverLicense |
| `app/(tabs)/more.tsx`                    | Edit | Country picker at top, fix parsingMode     |
| `app/settings.tsx`                       | Edit | Remove region picker                       |
| `app/license.tsx`                        | Edit | Dynamic form fields                        |
| `components/license/license-card.tsx`    | Edit | Dynamic card rendering                     |
| `services/firebase/ai-license.ts`        | Edit | Dynamic Gemini prompt                      |
| `services/ocr/parsers/license-parser.ts` | Edit | Country-aware wrapper                      |

---

## Verification Checklist

- [ ] `npx tsc --noEmit` → 0 errors (including the pre-existing `parsingMode` bug)
- [ ] More screen renders country picker at top of screen
- [ ] Country selection persists across app restarts (AsyncStorage via Zustand persist)
- [ ] License form renders exactly the fields defined in `docs/jamaica/driver_license.json`
- [ ] `enum` fields (e.g. `sex`) render as a picker with the correct `values`
- [ ] AI scan: Gemini prompt includes all fields from the JSON spec dynamically
- [ ] OCR scan: Jamaica regex path still functions correctly
- [ ] Non-JA country selection triggers AI-only path (no crash)
- [ ] License card header shows `spec.label`, issuer shows `spec.issuing_authority`
- [ ] Settings screen no longer shows a Region picker

---

## Adding Future Countries

1. Create `docs/<countryCode>/driver_license.json` following the Jamaica schema
2. In `services/docs-registry.ts`:
   - Extend `CountryCode` union: `"jm" | "us"`
   - Add static import + entry to `COUNTRY_REGISTRY`
   - Add label to `COUNTRY_LABELS`
3. _(Optional)_ Add a country-specific regex parser in `services/ocr/parsers/license-parser.ts`
4. If no regex parser added, AI fallback handles the new country automatically

No changes needed to the UI, form, card, or store — they are fully data-driven.
