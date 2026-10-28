# 800Path Lite: design brief

Design the phone screens for **800Path Lite**, the on-the-go companion to 800Path, a free Digital SAT prep website. Lite is an installable web app (added to the home screen, opens full-screen). It shares the student's account and progress with the website.

**Who uses it:** high-school students (15–18) practicing in short bursts: on the bus, between classes, before bed. One-handed, often distracted, sessions of 2–10 minutes.

**Priority:** on-the-go question practice first, then vocab, then sprints.

## Look and feel

**"Lighter, bolder" than the website.** Keep the 800Path brand (colors, wordmark), but make it feel like a study app, not a printed journal:
- bigger type and chunky, thumb-sized buttons (at least 48px tall)
- more playful energy: satisfying right/wrong feedback, progress rings, small celebrations
- one clear action per screen

**The website's brand, for reference.** It's a calm, editorial "printed ink on warm paper" look:

| Role | Color |
| --- | --- |
| Ink (brand, text, primary buttons) | `#201f1c` |
| Canvas (page background) | `#f6f4ef` |
| Card surface | `#fdfcf9` |
| Sunken surface | `#eeebe3` |
| Correct / success (moss) | `#4a5d47`, soft `#eef0e9` |
| Wrong / danger, accent (claret) | `#8f4a35`, soft `#f6ece7` |
| Mark (wine) | `#6b3535` |
| Ochre (warning, highlights) | `#8a7550` |
| Signature gradient (max once per screen) | `#171613` → `#3b2a22` → `#8f4a35` |

Fonts: **Source Serif 4** (headings, question text), **Instrument Sans** (UI, labels, buttons). Lite may lean more on Instrument Sans for its bolder feel. Logo: the "800" ribbon mark plus the word "800Path"; for Lite, "800Path Lite".

Brighter or extra accent colors are fine if they're used sparingly and sit well with these.

**Frame:** design at 390 × 844 (iPhone 14/15). Respect the top notch and bottom home-indicator safe areas. It must also work at 360px wide. Light mode first; show a dark-mode version of the question card if there's time.

## Navigation

A bottom tab bar with four tabs: **Practice · Vocab · Sprints · Me**. A streak flame with a number sits in the top bar of Practice.

## Screens to design

### 1. Practice (home)
- **One big Start button**, the hero of the app. It starts the mode used last; the first time, that's Adaptive. Under it, a small 3-way switcher: **Adaptive · Clinic · Pick**.
  - **Adaptive:** a mix of the student's weakest skills, with some variety. Subtitle example: "Mix of your weak spots".
  - **Clinic:** drills the single weakest skill, mixed with questions they got wrong before. Subtitle example: "Clinic: Transitions + your mistakes".
  - **Pick:** opens a picker (screen 3).
- **Daily goal ring:** today's questions vs. the goal (default 10), e.g. "6 / 10 today".
- **Today's sprint day,** if one is active: "7-Day Grammar Sprint · Day 3 of 7 · Boundaries", with a Continue button.
- **Guest banner** (dismissible, small): "Your progress isn't saved to an account yet", with a Save button.

### 2. Question card (the core screen)
An endless stream, one question per card:
- **Top bar:** close (X), the count so far ("12 answered · 9 right"), and the skill name and difficulty ("Transitions · Medium").
- **Optional passage:** usually 40–120 words, sometimes two short texts ("Text 1 / Text 2"), sometimes a small data table. It must scroll comfortably.
- **The question,** then **four answer choices A–D** as big tappable rows.
- **States to show:**
  1. *Unanswered*
  2. *Answered right:* the choice turns green, with a little celebration; the explanation slides up from the bottom; a big **Next** button.
  3. *Answered wrong:* the chosen answer turns red and the right one green; explanation; **Next**.
  4. *Loading the next card:* skeleton.
- A **"From your mistakes"** tag for re-asked questions.
- Example content (real format):
  > **Passage:** Researchers studying urban birds found that city-dwelling blackbirds sing at a higher pitch than their forest relatives. ______ the higher pitch may help their songs carry over low-frequency traffic noise.
  > **Question:** Which choice completes the text with the most logical transition?
  > A) Nevertheless, B) For instance, C) Presumably, D) In contrast,
  > **Explanation:** The second sentence offers a likely reason for the finding, so "Presumably" fits…

### 3. Pick sheet
A bottom sheet: **All English**, **All Math**, or one skill. There are 11 English skills grouped in 4 domains (Information and Ideas, Craft and Structure, Expression of Ideas, Standard English Conventions) and 4 Math skills (Algebra, Advanced Math, Data Analysis, Geometry). Each shows a small level indicator: not started / weak / strong / mastered.

### 4. Stop recap
Shown when the student closes the stream:
- answered and right (e.g. "14 answered · 11 right · 79%")
- mistakes fixed ("2 old mistakes fixed")
- per skill: answered/right, and "Level up! Transitions → Medium-High" when a skill moved
- a **Done** button and a **Keep going** button

### 5. Vocab
- **Overview:** learned / learning / new counts out of 154 words, "12 cards due", and a big **Study** button.
- **Flashcard, front:** the word, large ("**corroborate**"), and its part of speech.
- **Flashcard, back** (tap to flip): the definition ("to confirm or support with evidence") and an SAT-style example sentence with the word highlighted.
- Two big buttons, **Still learning** and **Got it**; swiping left/right does the same.
- **End of deck:** "20 cards done", with a mini summary.

### 6. Sprints
- **Active sprint:** the title, a row of day dots (done / today / locked), and today's skill, with a Start button.
- **No sprint:** cards for 3-Day Math Cram, 7-Day Grammar Sprint, 7-Day Weak Spots, and 30-Day Full Prep, each with a one-line tagline and a Start button.
- **A sprint day** is played with the same question card as screen 2, but it's a fixed 10 questions, so show a progress bar (3/10).
- **Sprint finished:** a reward screen.

### 7. Me
- Streak (with a "best" streak) and the daily goal, with a control to change it (5 / 10 / 20 / 30)
- **Skill levels:** a compact list of the 15 skills with level bars
- **Mistake notebook:** a list of saved questions, tap to retry
- **Account:** name and email, or, for a guest, a "Save my progress" card (Google or email); Sign out; **"Full site"** link

## Out of scope for Lite
Math questions where you type the answer (grid-ins) stay on the website. There are no timers or test simulations; this is relaxed, bite-size practice.
