import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav — border spans full width, content constrained inside */}
      <nav className="border-b border-slate-100 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            PrepWise
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
          SAT Reading &amp; Writing
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
          Study smarter,
          <br />
          <span className="text-indigo-600">not harder.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-xl mx-auto mb-10 leading-relaxed">
          Short, focused practice sessions with AI-powered feedback — built for
          self-studiers who want real improvement, not just more questions.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth?mode=signup"
            className="w-full sm:w-auto bg-indigo-600 text-white text-sm font-semibold px-8 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Start practicing — it&apos;s free
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            How it works →
          </Link>
        </div>
      </section>

      {/* Feature strip */}
      <section className="bg-slate-50 border-y border-slate-100 py-14">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            {
              icon: "⚡",
              title: "Focused sessions",
              desc: "10-question sprints you can fit into any break.",
            },
            {
              icon: "🎯",
              title: "Skill targeting",
              desc: "Drill exactly the skills where you're weakest.",
            },
            {
              icon: "🤖",
              title: "AI feedback",
              desc: "Personalized analysis after every session — not generic tips.",
            },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <span className="text-3xl">{f.icon}</span>
              <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-slate-900 mb-12 text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            {
              step: "01",
              title: "Pick your focus",
              desc: "Choose Reading, Writing, or both. Set your session length.",
            },
            {
              step: "02",
              title: "Answer questions",
              desc: "Real SAT-style passages and questions. No fluff, no filler.",
            },
            {
              step: "03",
              title: "Review & reflect",
              desc: "See your score, skill breakdown, and AI-written personalized feedback.",
            },
          ].map((s) => (
            <div key={s.step} className="flex flex-col gap-3">
              <span className="text-sm font-mono font-bold text-indigo-500">
                {s.step}
              </span>
              <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to improve your score?
          </h2>
          <p className="text-indigo-200 text-sm mb-8 leading-relaxed">
            Free to use. No credit card. Start your first session in under a
            minute.
          </p>
          <Link
            href="/auth?mode=signup"
            className="inline-block bg-white text-indigo-700 font-semibold text-sm px-8 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
          >
            Create your account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-xs text-slate-400">
        PrepWise &copy; {new Date().getFullYear()} — SAT is a trademark of
        College Board.
      </footer>
    </main>
  );
}
