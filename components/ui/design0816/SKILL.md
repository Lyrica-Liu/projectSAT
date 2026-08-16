---
name: 800path-design
description: Use this skill to generate well-branded interfaces and assets for 800Path (an AI-powered SAT Reading & Writing practice tool), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick start
- **Tokens:** link `styles.css` (it `@import`s fonts, colors, typography, spacing, base). All design values are CSS custom properties — e.g. `--brand` (wine #6b3535), `--canvas` (bone), `--ink-900`, `--oat-100`, `--sidebar-*`, `--text-strong`, `--radius-lg`. Legacy ramp names persist (`--lilac-*` is now charcoal) — prefer the semantic aliases.
- **Components:** load `_ds_bundle.js`, then read primitives from `window.DesignSystem_4010b3` (Button, IconButton, Input, SegmentedControl, Card, Badge, Avatar, ProgressBar, SkillBar, ScoreRing, ChoiceCard, AnswerOption). Each has a `.prompt.md` with usage.
- **Icons:** inline SVG only, 16px on a 1.3px stroke. No icon library, no emoji.
- **Full screens:** `templates/<slug>/` — twelve Design Components covering landing, auth, onboarding, dashboard, plan overview, daily session, practice, results, history, and account.

## The vibe in one line
Warm bone paper, soft near-black ink, an oat sidebar, and one dark wine accent; Source Serif 4 for everything you read, Instrument Sans for chrome and figures; crisp small radii, hairline rules, no shadows, measured second-person copy. A well-set book, not an app.
