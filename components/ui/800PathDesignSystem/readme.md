# 800Path Design System

A soft, pastel design system for **800Path** — an AI-powered, personalized SAT
Reading & Writing practice tool for self-studiers. The system reinterprets the
product with a calm, friendly, Notion-/Instagram-inspired aesthetic: cool
pastels, one minimalist sans, generous rounded corners, and clear, low-density
screens.

> **Product context.** 800Path (codenamed *projectSAT*) lets a learner run short
> practice sessions (5–20 SAT-style Reading/Writing questions), get instant
> per-question explanations, and receive AI-written feedback plus a skill-by-skill
> accuracy breakdown. Core flow: **Landing → Auth → Dashboard → Practice setup →
> Active session → Results → History**.

## Sources

- **GitHub:** [github.com/Lyrica-Liu/projectSAT](https://github.com/Lyrica-Liu/projectSAT)
  — a Next.js + Supabase app. This system was built by reading its routes
  (`app/page.tsx`, `auth`, `dashboard`, `practice`, `results`, `history`) and its
  nine tracked SAT skills. Explore the repo for the real data model and copy.
- No Figma file or slide deck was provided.

The original UI used an **indigo + slate** palette and system/Inter type. This
system is a **deliberate visual redesign** toward cool pastels per the brief; the
information architecture and copy voice are preserved.

---

## Content fundamentals

**Voice:** warm, encouraging, and plain-spoken — like a sharp study buddy, not a
testing authority. Always second person ("you"), present tense, contractions
welcome ("Let's keep the streak going").

- **Casing:** sentence case everywhere except short eyebrow labels, which are
  UPPERCASE with wide tracking ("SESSION COMPLETE"). Never title-case sentences.
- **Length:** ruthlessly short. One idea per line. Headlines are 2–5 words
  ("Study smarter, not harder."); supporting lines are one sentence.
- **Numbers as reassurance:** quantify the small commitment — "10 questions.
  ~8 minutes. Instant feedback." Stack short fragments with periods or middots.
- **Emoji:** used *sparingly* for warmth — a single 👋 in the dashboard greeting.
  Never decorative rows of emoji, never inside body copy. One per screen, max.
- **Feedback tone:** name the win first, then the fix, then one concrete next
  step ("Strong work on Words in Context… Next session, try underlining the line
  that proves each answer.").
- **Avoid:** jargon ("assessment module"), hype ("maximize outcomes"), raw error
  codes. Failure states stay gentle ("Not quite" / "No questions available yet —
  check back soon!").

Example specimens live in `guidelines/brand-voice.html`.

---

## Visual foundations

**Color.** A cool pastel palette. **Lilac/periwinkle** (`--lilac-500` #8472e8)
is the single brand hero — used for primary buttons, the filled dashboard CTA,
selected states, and links. A **pastel accent family** (mint, sky, rose, butter,
peach) provides gentle variety for skill badges, difficulty, and tinted result
cards — each ships as a *surface + ink* pair so text stays legible on the tint.
Neutrals are warm-cool **"ink" grays**, never pure black (`--ink-900` is #2a2833).
Backgrounds are flat and soft: a faint lilac-tinted off-white canvas (#faf9fc)
behind white cards. **No gradients** as fills (the only gradient-like move is the
translucent blurred nav bar). See `guidelines/color-*.html`.

**Type.** One family does almost everything: **Plus Jakarta Sans** — a friendly,
slightly rounded humanist-geometric sans that suits the soft corners. Weights
400/500/600/700/800. Display headings use 800 weight with tight negative tracking
(`--tracking-tight`); body is 400 at relaxed line-height (1.65). **JetBrains Mono**
handles numerals, question indices, scores, and small meta ("Q3 · 82% · 7/10"),
giving data a tidy tabular feel. (Substitution note below.)

**Backgrounds & imagery.** No photography or illustration in the core product —
it's a focused study tool, so surfaces are clean and typographic. Visual interest
comes from pastel tints and the rounded geometry, not imagery. There are no
repeating patterns, textures, or hand-drawn elements.

**Shape & corners.** Everything is generously rounded. Buttons and badges are
full pills (`--radius-pill`). Inputs and answer rows use 12px; cards use 16–22px;
the hero CTA and large panels use 22–28px. Nothing in the UI has a sharp 0–4px
corner.

**Cards.** Soft white (`--surface`) on the canvas, a 1px hairline border
(`--line` #ecebf1), and a *very* low, cool shadow (`--shadow-sm`). Pastel-tinted
cards (mint/rose/lilac) drop the border and shadow and rely on fill alone.
Interactive cards lift 2px with `--shadow-md` on hover. The dashboard's
"Start a session" card is the one filled-lilac hero.

**Shadows.** Low-contrast and lilac-cool, never gray-black. Four tiers
(`xs → lg`) plus `--shadow-brand` — a soft lilac glow used only under the brand
mark and primary buttons. No inner shadows.

**Borders.** Hairline 1px `--line` for resting card edges; `--line-strong` for
inputs and outlined (secondary) controls. Selected/focused controls switch the
border to `--brand` and add a 4px translucent lilac focus ring (`--focus-ring`).

**Motion.** Gentle and quick — `--dur-base` 200ms on an ease-out curve. Buttons
scale to 0.97 on press (no bounce). Bars and rings animate width/stroke over
320ms. Transitions are opacity/color/transform fades; **never** spring, bounce,
or loop. Respect `prefers-reduced-motion` in any animated context.

**Hover / press states.** Hover = a slightly darker fill (primary → `--lilac-600`)
or a faint sunken background (ghost controls). Press = scale-down 0.97. Selected
= lilac tint + brand border + focus ring. Disabled = 50% opacity, no shadow.

**Transparency & blur.** Used in exactly one place: the sticky top nav
(`rgba(255,255,255,0.85)` + `backdrop-filter: blur(10px)`) so content scrolls
softly beneath it. Modal scrims (`--overlay`) are a translucent ink. Otherwise
surfaces are opaque.

**Layout.** Centered single-column content with comfortable max-widths
(`--container-sm/md/lg`); the marketing and dashboard pages cap at ~720–1040px.
Sticky top nav. Generous vertical rhythm on the 4px spacing scale (sections
breathe at 56–84px). High whitespace, low density — one clear action per screen.

---

## Iconography

- **Library:** [**Lucide**](https://lucide.dev) (rounded 2px stroke) loaded from
  CDN — it matches the soft, minimalist feel. The original repo shipped *no* icon
  set (it used a few emoji: ⚡🎯🤖, and unicode arrows → ←), so Lucide is an
  **added substitution**, chosen for its rounded geometry. Common glyphs:
  `arrow-right`, `arrow-left`, `zap`, `target`, `sparkles`, `x`.
- **Emoji:** retained *only* for the single dashboard greeting 👋, per the
  product's existing warmth. Not used elsewhere.
- **Arrows:** inline `→` / `←` (unicode) or the Lucide arrow icons inside buttons.
- **App mark:** a CSS/text-based rounded-square "P" monogram in lilac — there is
  no bitmap logo asset; the wordmark is set in Plus Jakarta Sans 800. See
  `guidelines/brand-logo.html`.
- Use `IconButton` for icon-only controls; pass a Lucide `<i data-lucide="…">`.
  No PNG icons, no hand-drawn SVG illustration.

---

## Index / manifest

**Foundations (root)**
- `styles.css` — single entry point; `@import`s everything below.
- `tokens/fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `base.css`
- `guidelines/` — specimen cards: `color-lilac`, `color-pastels`, `color-neutrals`,
  `color-semantic`, `type-display`, `type-body`, `spacing-scale`, `spacing-radii`,
  `brand-logo`, `brand-voice`.

**Components** (`window.DesignSystem_4010b3.*`)
- `components/buttons/` — **Button**, **IconButton**
- `components/forms/` — **Input**, **SegmentedControl**
- `components/data-display/` — **Card**, **Badge**, **Avatar**
- `components/feedback/` — **ProgressBar**, **SkillBar**, **ScoreRing**
- `components/practice/` — **ChoiceCard**, **AnswerOption**

Each directory has `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md`, and one
`@dsCard` demo HTML.

**UI kit**
- `ui_kits/800path/` — interactive web-app recreation. Start at `index.html`.
  See its `README.md`.

**Other**
- `SKILL.md` — Agent-Skills-compatible entry point.

---

## Caveats / substitutions

- **Fonts** are a substitution. The repo used system-ui/Inter; this system uses
  Plus Jakarta Sans + JetBrains Mono (Google Fonts, loaded via `@import` in
  `tokens/fonts.css`). Swap the import if you have licensed brand fonts.
- **Palette** is a redesign toward cool pastels per the brief, replacing the
  original indigo/slate.
- No logo/imagery assets existed in the source, so the brand mark is a text/CSS
  wordmark.
