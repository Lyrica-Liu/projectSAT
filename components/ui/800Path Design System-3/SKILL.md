---
name: 800path-design
description: Use this skill to generate well-branded interfaces and assets for 800Path (an AI-powered SAT Reading & Writing practice tool), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick start
- **Tokens:** link `styles.css` (it `@import`s fonts, colors, typography, spacing, base). All design values are CSS custom properties — e.g. `--lilac-500` (brand), `--canvas`, `--surface`, `--text-strong`, `--radius-lg`, `--shadow-sm`.
- **Components:** load `_ds_bundle.js`, then read primitives from `window.DesignSystem_4010b3` (Button, IconButton, Input, SegmentedControl, Card, Badge, Avatar, ProgressBar, SkillBar, ScoreRing, ChoiceCard, AnswerOption). Each has a `.prompt.md` with usage.
- **Icons:** Lucide via CDN (`https://unpkg.com/lucide`). Rounded 2px stroke.
- **Full screens:** see `ui_kits/800path/` for an interactive recreation of the app.

## The vibe in one line
Cool pastels (lilac hero + mint/sky/rose/butter/peach accents), one minimalist sans (Plus Jakarta Sans), big rounded corners, soft low shadows, high whitespace, warm second-person copy. Notion/Instagram calm.
