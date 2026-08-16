# 800Path Design System

An editorial design system for **800Path** — a 30-day, decided-in-advance SAT prep plan for self-studiers. The system reads like a well-set book rather than an app: warm bone paper, a soft near-black ink, a single serif doing the reading, and one dark wine mark, used sparingly, on the thing that matters.

> **Product context.** 800Path gives a learner a fixed thirty-day plan — one sitting a day, twelve questions, timed like the test — plus optional extra practice that doesn't advance the plan. Core flow: **Landing → Auth → Onboarding → Dashboard → Daily session → Results → Plan overview / History**.

## Sources

- **GitHub:** [github.com/Lyrica-Liu/projectSAT](https://github.com/Lyrica-Liu/projectSAT) — a Next.js + Supabase app. This system was built by reading its routes and its nine tracked SAT skills; the data model and copy voice come from there.
- No Figma file or slide deck was provided.

The original UI used an **indigo + slate** palette and system/Inter type. This system is a **deliberate visual redesign** toward quiet editorial print; the information architecture is preserved.

---

## Content fundamentals

**Voice:** measured, precise, second person. A good tutor speaking plainly — never a cheerleader, never a testing authority. The plan is already decided, so the copy states rather than sells ("Today is a Math sitting: twelve questions, twenty-two minutes").

- **Casing:** sentence case everywhere except eyebrow labels, which are UPPERCASE with wide tracking ("A NOTE ON TODAY"). Never title-case sentences.
- **Length:** short, but complete sentences — this system prefers a written line to a fragment. Headlines are a phrase; supporting copy is one or two full sentences.
- **Numbers as fact, not reassurance:** figures are set in tabular sans and left to speak ("Day 12 / 30 · Math", "76%"). No exclamation, no padding.
- **Emoji:** none, anywhere.
- **Feedback tone:** name what held, then what didn't, then one concrete instruction. No praise inflation.
- **Avoid:** hype, jargon, exclamation marks, raw error codes. Failure states stay level ("Not quite").

Specimens live in `guidelines/brand-voice.html`.

---

## Visual foundations

**Color.** Four values carry the system.

- **Bone** (`--canvas` #f6f4ef, `--surface` #fdfcf9) — the paper. Every screen sits on it.
- **Ink** (`--ink-900` #201f1c) — a warm near-black with a brown undertone. Never pure black, never blue-black. All reading copy and the dark hero panels (Landing method section, Auth, Onboarding) are ink.
- **Oat** (`--oat-100` #e8e4d8, ramp 50→300) — the warm light neutral. It is the **app sidebar** on every signed-in screen, and it fills quiet panels and rails. Oat keeps the chrome from becoming a second ink slab.
- **Wine** (`--wine-500` #6b3535, ramp 50→700) — the small chromatic mark, aliased to `--mark`. It carries the active nav item, today's cell in the thirty-day map, and links. Nothing else. It is a **mark, not a surface, and never a fill**.
- **Ink as brand** — `--brand` is charcoal ink (`--dark-900`), so primary buttons, progress fills, and data lines are ink. On any given screen there should be far more ink than wine; if wine reads as a colour scheme rather than a mark, it is overused.

Supporting inks stay printed rather than screen-bright: **olive** marks correct and complete, **brass** marks in-flight progress, **sienna** (`--accent`) marks emphasis and the one wrong answer. Large fills are only ever bone, ink, oat, or wine — the supporting inks live in 1px rules, small marks, and single figures. See `guidelines/color-*.html`.

**Type.** Two families, sharply divided.

- **Source Serif 4**, roman, optically sized — headlines, body, passages, question stems. Headlines are the same face as body copy; authority comes from scale, measure, and negative tracking (`--tracking-tight` −0.022em), not a second display font. Never italic for display.
- **Instrument Sans** — chrome only: eyebrow labels, buttons, tabs, metadata, and all figures (tabular numerals). If a sans string runs longer than a few words, it's in the wrong face.

Scale runs 11px eyebrows to a 68px landing hero. Passages set at 17px / 1.68 on a `--measure` of 33rem.

**Backgrounds & imagery.** No photography or illustration — it's a reading tool. Visual interest comes from rules, measure, drop caps, and the tension between bone, ink, oat, and wine.

**Shape & corners.** Crisp. `--radius-lg` 6px is the default for buttons and cards; `--radius-2xl` 10px is the largest panel. Nothing is a pill except the rare status dot.

**Cards & separation.** Separation comes from **hairline rules and empty space**, not containers. `--line` #e2ded5 for resting edges, `--line-strong` for section rules and inputs. Ledger rows are ruled, not boxed.

**Shadows.** Effectively off. `--shadow-xs/sm` are `none`; `--shadow-md` is a 1px hint. A shadow is a failure state here — the one exception is the landing specimen plate, which is a photographed object.

**Motion.** Subtle fades only — `--dur-base` 260ms on `--ease-out`. Content rises 8px on entry. The sidebar widens 66px → 218px on hover over 240ms. No spring, no bounce, no loop.

**Hover / press states.** Hover = a faint oat or bone fill; primary buttons lift to `--brand-hover` (charcoal). Active nav = wine fill with bone text. Selected controls take a wine left rule and a surface fill. Focus = 4px translucent ink ring (`--focus-ring`). Disabled = 50% opacity.

**Transparency & blur.** Not used. Modal scrims (`--overlay`) are translucent ink; every other surface is opaque.

**Layout.** The signed-in app is a fixed 66px oat spine plus a single centered column (max ~1080px) that never fights the sidebar. Marketing caps at 1220px. Vertical rhythm is generous — sections breathe at 56–96px on the 4px scale. One clear action per screen.

---

## Iconography

- **Inline SVG only**, 16px on a 1.3px stroke, drawn to sit with the sans chrome. No icon library is loaded and no PNG icons exist. Glyphs in use: calendar, bar chart, document, clock, circle-check, arrow.
- **Emoji:** none.
- **Arrows:** inline `→` / `←` in copy; drawn SVG inside buttons.
- **App mark:** the joined **800** — one continuous chancery ribbon in the Italian broad-nib manner: a 10° italic slant, thick down-strokes thinning to hairlines at the top-left and bottom-right of each counter, an entry stroke into the 8 and a rising exit flourish off the last zero. The 8 is set noticeably larger than the zeros and the three counters are bridged by tapered joins, so the mark reads as a single written gesture. Drawn as one filled SVG path (no font dependency), taking `fill` from context so it inverts to bone on ink and stays ink on oat. No box, no bitmap logo, no gradient tile. The wordmark pairs it with “800Path” in Source Serif 4 semibold. See `guidelines/brand-logo.html`; the six studies it was chosen from are in `guidelines/mark-studies.html`.

---

## Index / manifest

**Foundations (root)**

- `styles.css` — single entry point; `@import`s everything below.
- `tokens/fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `base.css`
- `guidelines/` — specimen cards: `color-lilac` (ink / charcoal ramp), `color-wine`, `color-oat`, `color-pastels`, `color-neutrals`, `color-semantic`, `color-difficulty`, `color-radiant`, `type-display`, `type-body`, `spacing-scale`, `spacing-radii`, `brand-logo`, `brand-voice`.

**Components** (`window.DesignSystem_4010b3.*`)

- `components/buttons/` — **Button**, **IconButton**
- `components/forms/` — **Input**, **SegmentedControl**
- `components/data-display/` — **Card**, **Badge**, **Avatar**
- `components/feedback/` — **ProgressBar**, **SkillBar**, **ScoreRing**
- `components/practice/` — **ChoiceCard**, **AnswerOption**

Each directory has `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and one `@dsCard` demo HTML.

**Templates** (`templates/<slug>/`) — twelve full screens, each a Design Component you can copy as a starting point:

`landing` · `auth` · `onboarding` · `dashboard` · `plan-overview` · `daily-session` · `practice-setup` · `practice-session` · `results` · `history` · `for-you` · `account-center`

**Other**

- `SKILL.md` — Agent-Skills-compatible entry point.

---

## Caveats / substitutions

- **Fonts** are a substitution. The repo used system-ui/Inter; this system uses Source Serif 4 + Instrument Sans (Google Fonts, via `@import` in `tokens/fonts.css`). JetBrains Mono is available but unused in the current screens — figures are tabular Instrument Sans.
- **Palette** is a redesign — bone, ink, oat, and wine — replacing the original indigo/slate.
- **Legacy token names persist.** `--lilac-*` now holds the charcoal ramp, `--claret-*` sienna, `--moss-*` olive, `--ochre-*` brass, and the pastel `--mint/--sky/--rose/…` slots are remapped onto printed inks. Prefer the semantic aliases (`--brand`, `--accent`, `--text-strong`, `--sidebar-*`) over the raw ramps.
- No logo or imagery assets existed in the source, so the brand mark is type and a hairline rule.
