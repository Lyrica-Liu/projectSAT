// Active session — answer questions one at a time with instant reveal.
function Session({ go }) {
  const { Badge, Card, AnswerOption, ProgressBar, Button } = window.DesignSystem_4010b3;
  const qs = window.PW_DATA.questions;
  const [idx, setIdx] = React.useState(0);
  const [picks, setPicks] = React.useState(qs.map(() => null)); // chosen letter per question

  const q = qs[idx];
  const picked = picks[idx];
  const revealed = picked !== null;
  const answered = picks.filter((p) => p !== null).length;
  const allDone = answered === qs.length;

  function choose(letter) {
    if (revealed) return;
    setPicks((prev) => prev.map((p, i) => (i === idx ? letter : p)));
  }
  function stateFor(letter) {
    if (!revealed) return picked === letter ? "selected" : "default";
    if (letter === q.answer) return "correct";
    if (letter === picked) return "incorrect";
    return "muted";
  }
  const diffTone = { Easy: "mint", Medium: "butter", Hard: "rose" }[q.difficulty];

  return (
    <div style={{ minHeight: "100%", background: "var(--canvas)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)" }}>
            Q{idx + 1} <span style={{ color: "var(--text-faint)", fontWeight: 500 }}>of {qs.length}</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-faint)" }}>{answered}/{qs.length} answered</span>
            {allDone && <Button size="sm" onClick={() => go("results")}>Finish →</Button>}
          </div>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px 12px" }}>
          <ProgressBar value={(answered / qs.length) * 100} height={6} />
        </div>
      </header>

      {/* Question navigator */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 8 }}>
          {qs.map((_, i) => {
            const p = picks[i];
            const isCur = i === idx;
            const correct = p && p === qs[i].answer;
            let bg = "var(--surface-sunken)", col = "var(--text-muted)";
            if (isCur) { bg = "var(--lilac-500)"; col = "#fff"; }
            else if (p) { bg = correct ? "var(--mint-surface)" : "var(--rose-surface)"; col = correct ? "var(--mint-ink)" : "var(--rose-ink)"; }
            return (
              <button key={i} onClick={() => setIdx(i)} style={{ width: 34, height: 34, borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: "var(--text-xs)", background: bg, color: col, transition: "all var(--dur-base) var(--ease-out)" }}>{i + 1}</button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <main style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "30px 24px 48px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <Badge tone="sky">{q.domain}</Badge>
          <Badge tone="lilac">{q.skill}</Badge>
          <Badge tone={diffTone} dot>{q.difficulty}</Badge>
        </div>

        {q.passage && (
          <Card tone="sunken" padding="lg" radius="lg" shadow="none" style={{ marginBottom: 22 }}>
            <p className="pw-eyebrow" style={{ margin: "0 0 10px" }}>Passage</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: "var(--leading-relaxed)", margin: 0, whiteSpace: "pre-wrap" }}>{q.passage}</p>
          </Card>
        )}

        <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "var(--text-md)", color: "var(--text-strong)", lineHeight: "var(--leading-snug)", margin: "0 0 18px" }}>{q.stem}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {["A", "B", "C", "D"].map((c) => (
            <AnswerOption key={c} letter={c} state={stateFor(c)} disabled={revealed} onClick={() => choose(c)}>{q.options[c]}</AnswerOption>
          ))}
        </div>

        {revealed && (
          <Card tone={picked === q.answer ? "mint" : "rose"} padding="lg" radius="lg" shadow="none" style={{ marginBottom: 24 }}>
            <p className="pw-eyebrow" style={{ margin: "0 0 8px", color: "inherit", opacity: 0.8 }}>{picked === q.answer ? "Nice — correct!" : "Not quite"}</p>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-relaxed)", margin: 0, color: "inherit" }}>{q.explanation}</p>
          </Card>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Button variant="ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))} iconLeft={<Icon name="arrow-left" size={17} />}>Previous</Button>
          {idx < qs.length - 1 ? (
            <Button variant="secondary" onClick={() => setIdx((i) => i + 1)} iconRight={<Icon name="arrow-right" size={17} />}>Next</Button>
          ) : (
            <Button onClick={() => go("results")} disabled={!allDone} iconRight={<Icon name="arrow-right" size={17} />}>Finish session</Button>
          )}
        </div>
      </main>
    </div>
  );
}
window.Session = Session;
