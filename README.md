# 800Path

Personalized Digital SAT practice for self-studiers. Students get a skill map of every Reading & Writing and Math skill, practice sets pitched at their current level, AI feedback after each set, a mistake notebook, and optional sprints (3-Day Math Cram, 7-Day Grammar Sprint, 7-Day Weak Spots, 30-Day Full Prep).

Built with Next.js, Supabase (auth + Postgres), and the Claude API.

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment.** Copy `.env.example` to `.env.local` and fill in:

   | Variable | Where to get it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (publishable key) |
   | `ANTHROPIC_API_KEY` | console.anthropic.com. Used for AI question sets, session feedback, and the scripts below |

3. **Database.** In the Supabase SQL editor, run `supabase/schema.sql` on a fresh project, then `supabase/admin-views.sql`.

4. **Supabase Auth settings**
   - Authentication → Sign In / Providers: enable **Anonymous sign-ins** (students start as guests without signing up), **Email**, and **Google**.
   - Authentication → URL Configuration: add `http://localhost:3000/auth/callback` and your production `/auth/callback` URL to the redirect URLs.
   - Authentication → Rate Limits: keep the anonymous sign-in limit low (the default is 30 per hour per IP).

5. **Run**

   ```bash
   npm run dev     # http://localhost:3000
   npm test        # unit tests (lib/**/*.test.ts)
   npm run lint
   ```

## Analytics

Page views go to Vercel Analytics (`<Analytics />` in `app/layout.tsx`). Turn it on in the Vercel dashboard: your project → Analytics → Enable. Nothing is collected in local dev.

## How accounts work

Clicking **Begin** on the landing page creates a guest (anonymous Supabase user). Guests can do everything except AI-generated question sets, which cost money per request; For You falls back to the question bank for them. When a guest saves their progress (email or Google), the same user id becomes a real account, so nothing is lost.

To see who's using the site, run these in the SQL editor:

```sql
select * from admin.users;     -- one row per user who did something; guests show as Guest-XXXXXX
select * from admin.all_users; -- also includes guests who never answered a question
select * from admin.summary;   -- headline counts
select * from admin.likely_same_device; -- ids that are probably one computer (same IP + browser)
```

`Guest-XXXXXX` is the first 6 characters of the user id, the same id shown as `actor_id` in Authentication → Logs.

## Project layout

| Path | What's there |
| --- | --- |
| `app/` | Pages (landing, dashboard, practice, results, sprints, notebook, account) and API routes in `app/api/` |
| `components/` | UI: `home/` (skill map, Next up, save-progress prompt), `ui/` (design system, nav) |
| `lib/` | Mastery, adaptive difficulty, recommendations, sprints, grading; `lib/server/` holds server-only logic |
| `lib/questions/` | The English and Math question banks (plain text) and their parsers |
| `supabase/` | `schema.sql` and `admin-views.sql` |
| `scripts/` | Question-bank tooling (below) |

## Question bank scripts

All read `ANTHROPIC_API_KEY` from `.env.local`. Usage notes are at the top of each file.

- `scripts/generate-bank-questions.ts`: add English questions for a subcategory.
- `scripts/generate-advanced-math.ts`: generate and blind-verify Advanced Math questions.
- `scripts/audit-question-bank.ts`: blind-review every bank question and write a report to `reports/question-audit/`.
- `scripts/repair-question-bank.ts`: fix and re-verify the questions an audit flagged.
