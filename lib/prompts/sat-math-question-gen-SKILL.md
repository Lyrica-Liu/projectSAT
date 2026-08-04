---
name: sat-math-question-gen
description: >
  Generate new Digital SAT Math questions on demand for an AI endpoint.
  Use this skill whenever the task involves generating SAT Math questions,
  creating math practice problems for a SAT study app, or producing a batch
  of SAT-style math questions with answer choices (or grid-in answers) and
  explanations. Trigger on phrases like "generate math questions", "create
  SAT math questions", "give me N [category] questions", or any request
  that names a math category and/or difficulty level. Even if the user just
  says "give me 20 hard Geometry questions", use this skill.
---

# SAT Math Question Generator

Generates batches of Digital SAT Math questions that match the style, format,
and content standards of an existing question bank (480 questions: 3
categories x 4 difficulties x 40 questions).

---

## Input Contract

The caller (AI endpoint or developer) provides:

| Field | Values |
|---|---|
| `category` | `Algebra` · `Data Analysis` · `Geometry` |
| `difficulty` | `EASY` · `MEDIUM-LOW` · `MEDIUM-HIGH` · `HIGH` |
| `count` | Integer — how many questions to generate (default: 20) |
| `format` | `json` (default) · `text` (plain readable) |

If `count` is omitted, default to 20. If `format` is omitted, default to `json`.

---

## Category Content Scope

```
1. Algebra
   • Linear equations, inequalities, and functions (one and two variables)
   • Systems of linear equations
   • Nonlinear equations and functions (quadratics, exponentials, polynomials)
   • Equivalent expressions (factoring, exponent rules, rational expressions)

2. Data Analysis
   • Ratios, rates, proportions, and percentages
   • One-variable data (mean, median, mode, range, standard deviation)
   • Two-variable data (scatterplots, lines of best fit, correlation)
   • Probability (including compound and conditional probability)
   • Sample inference, margin of error, and evaluating statistical claims

3. Geometry
   • Area, perimeter, and volume (2D and 3D figures)
   • Lines, angles, and triangles (including similar/congruent triangles)
   • Right triangles and trigonometry (special right triangles, SOHCAHTOA)
   • Circles (circumference, area, arcs, sectors, chords, tangents, equations)
```

A single request targets ONE category. Within that category, vary the
specific topic across the batch — don't generate 20 questions on the same
narrow topic (e.g., don't make all 20 Algebra questions about linear
equations; mix in systems, quadratics, exponents, etc., per the difficulty
band below).

---

## Question Types

Two types are used, mixed within every batch at roughly **75% Multiple
Choice / 25% Grid-In**:

### Multiple Choice
```
Prompt: <question stem, may include a table for Data Analysis>
A) ...
B) ...
C) ...
D) ...

Correct Answer: <letter>
Correct Answer Explanation: <2-3 sentences: state why the answer is right,
  show the key calculation or relationship, tie it to the specific numbers
  in the problem>
False Answer Explanations:
* Choice A is incorrect because ... [omit if A is correct]
* Choice B is incorrect because ...
* Choice C is incorrect because ...
* Choice D is incorrect because ...
```

### Grid-In (student-produced response)
```
Prompt: <question stem>

Correct Answer: <numeric value, fraction, or simplest-radical expression>
Explanation: <2-3 sentences showing the calculation that produces the answer>
```

Grid-In answers may be integers, decimals, fractions (e.g., `5/18`), or
expressions in simplest radical form (e.g., `5√3`). Never use a Grid-In
question where the answer is negative or where more than one value would
be considered correct (real DSAT grid-ins only accept positive values and
select fractions/decimals).

Distribute correct answers across A/B/C/D roughly evenly — do not default
to B or C. For Data Analysis questions, tables should be given in markdown
format directly in the prompt (2-4 columns, 3-5 rows, internally consistent
numbers).

---

## Difficulty Calibration

| Level | Characteristics |
|---|---|
| EASY | Single-step computation; direct formula application; small, clean numbers; obviously wrong distractors (off-by-one-step errors) |
| MEDIUM-LOW | Two-step computation; simple systems or basic word problems; one distractor reflects a plausible but identifiable arithmetic slip |
| MEDIUM-HIGH | Multi-step reasoning; requires setting up an equation/relationship before solving; may involve quadratics, similar figures, or two-way tables; distractors reflect specific, identifiable errors in the setup or arithmetic |
| HIGH | Dense, layered reasoning requiring 3+ steps or the combination of two concepts (e.g., Law of Cosines, tangent-secant relationships, weighted systems, conditional probability from a table, inscribed solids); numbers are chosen so shortcuts don't work; distractors are the result of a specific, plausible misstep (e.g., using the wrong sub-formula, mixing up which quantity is squared, an off-by-one in a combinatorics setup) rather than random wrong numbers |

**HIGH difficulty specifics:**
- Require identifying which formula/relationship applies before any
  arithmetic can begin (e.g., recognizing an intersecting-chords setup,
  recognizing a disguised quadratic, recognizing that two events are
  independent vs. mutually exclusive)
- Prefer non-obvious numbers (e.g., a 13-14-15 triangle needing Heron's
  formula) over "nice" textbook triples when it raises the reasoning bar
- At least 2 of the 3 distractors in Multiple Choice should come from a
  specific, plausible wrong turn (sign error, wrong sub-formula, reversed
  ratio) — not just "a nearby number"
- Verify every HIGH question's arithmetic twice before finalizing; a wrong
  answer key at HIGH difficulty is far more damaging (harder for a student
  to notice) than at EASY

Scale numbers, the number of solution steps, and distractor plausibility
together as difficulty increases.

---

## Content Guidelines

- **Calculator**: Assume calculator use is allowed on every question (matches
  current Digital SAT policy). Numbers need not be "mental math friendly,"
  but should still resolve to a clean, verifiable answer.
- **Realism**: Use word-problem contexts that feel like real SAT
  scenarios — school, sports, retail, science, finance, city planning — and
  vary them across the batch.
- **Internal consistency**: Every number in a problem must be consistent
  with every other number. This matters especially for: two-way tables
  (rows/columns must sum correctly), systems of equations (must have a
  real, checkable solution), and geometric figures (side lengths, angles,
  and areas must satisfy their formulas exactly).
- **Distractors**: Every wrong MC answer must be wrong for a specific,
  statable reason — never merely "an unrelated nearby number." Reference
  the specific misstep in the explanation (sign error, wrong formula, used
  radius instead of diameter, etc.).
- **No unverified arithmetic**: Before finalizing any question, recompute
  the correct answer from the given numbers and confirm all four
  MC options are numerically distinct.

---

## Output Format

### JSON (default)

```json
{
  "metadata": {
    "category": "...",
    "difficulty": "...",
    "count": N,
    "generated_at": "<ISO timestamp>"
  },
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "prompt": "...",
      "table": null,
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct_answer": "B",
      "correct_answer_explanation": "...",
      "false_answer_explanations": {
        "A": "Choice A is incorrect because ...",
        "C": "Choice C is incorrect because ...",
        "D": "Choice D is incorrect because ..."
      }
    },
    {
      "id": 2,
      "type": "grid_in",
      "prompt": "...",
      "table": null,
      "correct_answer": "17/4",
      "explanation": "..."
    }
  ]
}
```

**Type values**: `"multiple_choice"` or `"grid_in"`.
`table` is `null` unless the question includes a data table (Data Analysis
only), in which case it is a markdown string.
For `grid_in` questions, omit `options`, `correct_answer_explanation`, and
`false_answer_explanations`; use `explanation` instead.

### Text (plain)

Reproduce the exact plain-text format used in the question bank file:

```
QUESTION 1 | <Category> | <DIFFICULTY> | Multiple Choice
Prompt: ...
A) ...
B) ...
C) ...
D) ...

Correct Answer: X
Correct Answer Explanation: ...
False Answer Explanations:
A) Choice A is incorrect because ...
```

or, for Grid-In:

```
QUESTION 2 | <Category> | <DIFFICULTY> | Grid-In
Prompt: ...

Correct Answer: ...
Explanation: ...
```

---

## Generation Steps

1. **Confirm category and difficulty** from the input contract.
2. **Plan topic spread**: before writing, list which sub-topics within the
   category (see Category Content Scope) the batch will cover so no single
   sub-topic is overrepresented.
3. **Assign question types**: mark ~75% of the batch as Multiple Choice and
   ~25% as Grid-In, distributed throughout (not clustered at the start or
   end).
4. **Draft each question**: write the prompt → work the problem yourself
   from scratch → derive the correct answer → build 3 distractors tied to
   specific plausible errors → write explanations.
5. **Self-check each question** before including it:
   - Recompute the correct answer independently — does it match what's
     stated?
   - For MC: are all 4 options numerically distinct, and is exactly one
     correct?
   - For Grid-In: is the answer a single, unambiguous positive value
     (integer, decimal, fraction, or simplest radical form)?
   - Does the difficulty match the calibration table (not easier or harder
     than intended)?
   - Is every distractor wrong for a specific, statable reason?
6. **Check correct-answer letter distribution** across the MC portion of
   the batch — rebalance if too many cluster on one letter.
7. **Return output** in the requested format.

---

## Quality Red Flags (avoid these)

- Any arithmetic error in the stated correct answer (verify by recomputing,
  not by assuming the first calculation was right)
- A Multiple Choice question with two options that are both technically
  correct
- A Grid-In question with a negative, non-unique, or ambiguous answer
- Distractors that are just random numbers rather than the result of a
  specific plausible error
- Data tables with rows/columns that don't sum correctly
- Correct answers that cluster on B or C across the batch
- HIGH difficulty questions solvable in a single obvious step
- EASY difficulty questions with multi-step reasoning or messy numbers
- Reusing the same word-problem context (e.g., "a jar of marbles") more
  than 2-3 times within one batch of 20
