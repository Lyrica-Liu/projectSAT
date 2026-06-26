export const SAT_GENERATOR_PROMPT = `SAT R&W Question Generator
Generates batches of Digital SAT Reading & Writing questions that match the style,
format, and content standards of an existing question bank.

Input Contract
The caller (AI endpoint or developer) provides:
- category: Information and Ideas · Craft and Structure · Expression of Ideas · Standard English Conventions
- subcategory: See taxonomy below
- difficulty: LOW · MEDIUM-LOW · MEDIUM-HIGH · HIGH
- count: Integer — how many questions to generate
- format: json (default) · text (plain readable)

If format is omitted, default to json.

Full Taxonomy
1. Information and Ideas
   • Central Ideas and Details
   • Command of Evidence (Textual)
   • Command of Evidence (Quantitative)
   • Inferences

2. Craft and Structure
   • Words in Context
   • Text Structure and Purpose
   • Cross-Text Connections

3. Expression of Ideas
   • Transitions
   • Rhetorical Synthesis

4. Standard English Conventions
   • Boundaries
   • Form, Structure, and Sense

Question Formats by Subcategory
Each subcategory has a distinct structure. Match it precisely.

Standard format (most subcategories)
Used by: Central Ideas and Details, Command of Evidence (Textual), Inferences,
Words in Context, Text Structure and Purpose, Transitions, Boundaries, Form Structure and Sense

Passage:
<single paragraph, 60–120 words>

Prompt:
<question stem>

Options:
A) ...
B) ...
C) ...
D) ...

Correct Answer: <letter>

False Answer Explanations:
* Choice A is incorrect because ...   [omit if A is correct]
* Choice B is incorrect because ...   [omit if B is correct]
* Choice C is incorrect because ...   [omit if C is correct]
* Choice D is incorrect because ...   [omit if D is correct]

SEC subcategories only (Boundaries, Form Structure and Sense) also include:
Correct Answer Explanation:
* Choice <X> is correct because ...
Place this BEFORE the False Answer Explanations block.

Command of Evidence (Quantitative) format
Passage:
<paragraph describing a researcher's claim, ~80–120 words>

Table: <Descriptive Title>
| Column 1 | Column 2 | ... |
|---|---|---|
| ...      | ...      |     |

Prompt:
Which choice best uses data from the table to support [the researcher's/scientist's/student's] claim?

Options: ...
Correct Answer: ...
False Answer Explanations: ...
Tables have 2–4 columns, 3–5 data rows. Values must be internally consistent and
support exactly one correct answer.

Cross-Text Connections format
Passage 1:
<paragraph, ~70–100 words>

Passage 2:
<paragraph, ~70–100 words — related topic, different angle or stance>

Prompt:
<question about relationship between the two passages>

Options: ...
Correct Answer: ...
Correct Answer Explanation:
* Choice <X> is correct because ...
False Answer Explanations: ...
Cross-Text always includes a Correct Answer Explanation.

Rhetorical Synthesis format
Notes:
- <bullet fact 1>
- <bullet fact 2>
- <bullet fact 3>
- <bullet fact 4>

Prompt:
The student wants to <specific rhetorical goal>. Which choice most effectively uses
the notes to accomplish this goal?

Options:
A) <complete sentence synthesizing some notes>
B) <complete sentence synthesizing some notes>
C) <complete sentence synthesizing some notes — correct>
D) <complete sentence synthesizing some notes>

Correct Answer: ...
Correct Answer Explanation:
* Choice <X> is correct because ...
False Answer Explanations: ...
Rhetorical Synthesis always includes a Correct Answer Explanation.
Notes are 4 bullet facts. Each answer option is a full, polished sentence.

Difficulty Calibration
LOW: Simple, concrete passages; clear single answer; distractors obviously wrong; accessible vocabulary
MEDIUM-LOW: Slightly more abstract; requires closer reading; one distractor is close but clearly eliminable
MEDIUM-HIGH: Nuanced passages; subtle distinctions between correct answer and 1–2 distractors; some inference required
HIGH: Dense academic or literary prose with technical vocabulary; multiple highly plausible distractors that are partially correct or contain a kernel of truth; correct answer requires distinguishing fine-grained textual evidence from plausible-but-overstated or subtly inaccurate alternatives; may involve philosophical argumentation, scientific methodology, literary criticism, or historical interpretation

HIGH difficulty specifics:
- Passages should be 100–150 words with layered or qualified claims
- At least 2 of the 3 distractors should be partially correct (true in some sense, but wrong for a specific, statable reason)
- Correct answer should require reading carefully enough that a hasty reader would pick a distractor
- Avoid HIGH questions where the correct answer is obvious on a single read

Scale passage complexity, prompt precision, and distractor quality together.

Content Guidelines
Topics: Use a wide range of subjects — science, history, literature, social science, technology, arts, environment. Vary topics across a batch.
Passages: Write original passages. Never copy or closely paraphrase from the question bank. Maintain appropriate length for the difficulty level.
Distractors: Every wrong answer must be specifically wrong for a reason that can be stated clearly. Avoid distractors that are simply "not mentioned" — they should be tempting but refutable by the text.
Correct answer distribution: Vary which letter (A/B/C/D) is correct across the batch. Do not default to B or C.
Explanations: False answer explanations must reference specific text evidence. They should explain why the choice is wrong, not merely state it is wrong. Aim for 2–3 sentences per explanation: (1) identify what specifically makes the choice wrong, (2) point to the text element that refutes or fails to support it, and optionally (3) note what a reader might have been misled by. The Correct Answer Explanation (where required) should similarly be 2–3 sentences: state why the answer is right, tie it to specific passage evidence, and note what the answer does that the others don't.

Quality Red Flags (avoid these)
- A distractor that is wrong only because it "isn't mentioned" — distractors should be actively contradicted or irrelevant for a clear reason
- A passage that could support more than one answer choice
- Correct answers that are always B or C
- Explanations that say "this is incorrect because the text says X" without quoting or pointing to the specific relevant part
- LOW difficulty questions with complex vocabulary or multi-clause reasoning
- HIGH difficulty questions with simple, obvious correct answers
- Rhetorical Synthesis options that are fragments rather than complete sentences
- Quantitative tables with inconsistent or impossible numbers`;
