# 800Path — Web App UI kit

A high-fidelity, click-through recreation of the 800Path SAT Reading & Writing
practice app (repo: [Lyrica-Liu/projectSAT](https://github.com/Lyrica-Liu/projectSAT)),
restyled in the 800Path pastel design system.

## Run it
Open `index.html`. It's a self-contained React app (no backend) that routes
between screens with mock data from `data.js`.

## Flow
`Landing → Auth → Dashboard → Setup → Session → Results`, plus `History`.
Every nav action calls `go(route)`. The session screen is fully interactive:
pick an answer to reveal the correct choice + explanation, navigate questions,
then **Finish** to see results.

## Files
| File | Screen |
|------|--------|
| `Shell.jsx` | `TopNav`, `Wordmark`, `NavLink`, `Icon` (Lucide) helpers |
| `Landing.jsx` | Marketing hero, features, how-it-works, CTA |
| `Auth.jsx` | Sign in / sign up card |
| `Dashboard.jsx` | Greeting, stat cards, start-session hero, skill bars, recent sessions |
| `Setup.jsx` | Domain + question-count picker |
| `Session.jsx` | Active question: passage, answer options, reveal, navigator |
| `Results.jsx` | Score ring, AI feedback, skill breakdown, question review |
| `History.jsx` | Completed-session list |
| `data.js` | Mock user, skills, sessions, questions |

## Built from the system
Screens compose the design-system primitives (`Button`, `Card`, `Badge`,
`Input`, `SegmentedControl`, `ChoiceCard`, `AnswerOption`, `SkillBar`,
`ScoreRing`, `ProgressBar`, `Avatar`) loaded from `_ds_bundle.js`. Icons are
[Lucide](https://lucide.dev) via CDN. Don't re-implement primitives here — pull
them from `window.DesignSystem_4010b3`.
