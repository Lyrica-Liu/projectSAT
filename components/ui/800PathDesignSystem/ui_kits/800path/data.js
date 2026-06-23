// 800Path UI kit — mock data (no backend). Mirrors the projectSAT schema:
// sessions, questions (domain/skill/difficulty), answers, skill stats.
window.PW_DATA = {
  user: { name: "Maya Chen", email: "maya@example.com" },

  skills: [
    { key: "words_in_context", label: "Words in Context", accuracy: 90, n: "9/10" },
    { key: "central_idea", label: "Central Idea", accuracy: 78, n: "7/9" },
    { key: "text_structure", label: "Text Structure", accuracy: 72, n: "8/11" },
    { key: "transitions", label: "Transitions", accuracy: 66, n: "4/6" },
    { key: "inferences", label: "Inferences", accuracy: 55, n: "6/11" },
    { key: "command_of_evidence", label: "Command of Evidence", accuracy: 40, n: "2/5" },
  ],

  recent: [
    { id: "s1", domain: "Reading & Writing", date: "Jun 20, 2026", score: 82, count: 10 },
    { id: "s2", domain: "Writing", date: "Jun 18, 2026", score: 70, count: 10 },
    { id: "s3", domain: "Reading", date: "Jun 16, 2026", score: 60, count: 5 },
    { id: "s4", domain: "Reading & Writing", date: "Jun 14, 2026", score: 90, count: 15 },
  ],

  // A short session for the interactive flow
  questions: [
    {
      domain: "Reading",
      skill: "Inferences",
      difficulty: "Medium",
      passage:
        "Marine biologist Dr. Lena Okafor noted that the reef's recovery, though encouraging, remained fragile. Coral that had bleached two summers earlier was regaining color, yet the surrounding fish populations had not rebounded at the same pace. She cautioned that visible signs of health could mask slower, structural changes still underway beneath the surface.",
      stem: "Which choice best states the main idea of the passage?",
      options: {
        A: "The reef has fully recovered from the earlier bleaching event.",
        B: "Surface signs of recovery may not reflect the reef's deeper condition.",
        C: "Fish populations recover faster than coral after bleaching.",
        D: "Dr. Okafor believes the reef will never recover.",
      },
      answer: "B",
      explanation:
        "Dr. Okafor warns that visible health 'could mask slower, structural changes,' so apparent recovery may not reflect the deeper state of the reef. B captures this; A and D overstate, and C reverses the relationship.",
    },
    {
      domain: "Writing",
      skill: "Transitions",
      difficulty: "Easy",
      passage:
        "The museum's new wing was designed to use almost no artificial lighting during the day. ___ its broad skylights flood the galleries with sunlight from morning until late afternoon.",
      stem: "Which choice completes the text with the most logical transition?",
      options: {
        A: "Nevertheless,",
        B: "For example,",
        C: "Instead,",
        D: "However,",
      },
      answer: "B",
      explanation:
        "The second sentence gives a concrete illustration of the design goal stated first, so an example transition fits. 'For example' is correct; the others signal contrast or replacement.",
    },
    {
      domain: "Reading",
      skill: "Words in Context",
      difficulty: "Medium",
      passage:
        "Although the committee's report was exhaustive, its recommendations were anything but: they were terse, almost cryptic, leaving department heads to fill in the details themselves.",
      stem: "As used in the text, 'terse' most nearly means",
      options: {
        A: "lengthy",
        B: "rude",
        C: "concise",
        D: "confusing",
      },
      answer: "C",
      explanation:
        "'Terse' is contrasted with the 'exhaustive' report and paired with 'almost cryptic,' indicating brevity. 'Concise' fits best; 'rude' and 'confusing' miss the core meaning of shortness.",
    },
  ],
};
