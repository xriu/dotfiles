---
name: pre-mortem
description: 'Run a premortem on any plan, launch, product, hire, strategy, or decision. Assume it has already failed 6 months from now and work backward to find every reason why. Produce a revised plan with the blind spots exposed. MANDATORY TRIGGERS: ''premortem this'', ''premortem my'', ''run a premortem'', ''what could kill this'', ''stress test this plan'', ''what am I missing here'', ''find the blind spots''. STRONG TRIGGERS: ''what could go wrong'', ''am I missing something'', ''poke holes in this'', ''where will this break'', "devil''s advocate". DO NOT trigger on simple feedback requests, factual questions, or LLM Council requests. DO trigger when someone has a plan or commitment where the cost of being wrong is high.'
disable-model-invocation: true
---

# Premortem

A premortem is the opposite of a postmortem. Instead of figuring out what went wrong after something fails, you imagine it has already failed and figure out why before you start.

The method comes from psychologist Gary Klein. He published it in Harvard Business Review. Daniel Kahneman (the Nobel Prize-winning psychologist behind "Thinking, Fast and Slow") called it his most valuable decision-making technique. Google, Goldman Sachs, and Procter & Gamble use it before major decisions.

The key idea: when you ask people "what could go wrong?" they give cautious, vague answers. When you say "this already failed, tell me why," the brain shifts into narrative mode and generates far more specific, creative, and honest reasons. Researchers at Wharton and Cornell called this "prospective hindsight" and found it significantly increases the ability to identify causes of future outcomes.

Why this matters for AI-assisted decisions: Claude tends toward friendly, optimistic answers. If you ask "is this a good plan?" it will find reasons to say yes. The premortem breaks this pattern by forcing the framing "this is dead, explain how it died." Claude stops looking for reasons your plan will work and starts explaining how it fell apart.

---

## when to run a premortem

Good targets for a premortem:

- A product or feature you are about to build
- A launch plan with money or reputation at stake
- A pricing or business model change
- A hire you are about to make
- A strategy or positioning pivot
- A partnership or deal you are evaluating
- Any commitment where the cost of being wrong is high

Bad targets for a premortem:

- Vague ideas with no concrete plan yet (help them plan first, then premortem)
- Questions with a single correct answer (just answer them)
- Creative feedback requests on a draft (that is editing, not a premortem)
- Decisions already made and irreversible (a premortem is only useful when you can still change course)

---

## context gathering (the necessary minimum)

A premortem is only as good as the context it runs on. Vague information produces vague failure scenarios that help no one. Before running the premortem, you must reach a minimum context threshold.

### step 1: look for existing context

Before asking the user anything, look for context that is already available:

**A. The current conversation.** The user may have been discussing a plan, launch, product, or decision earlier in this session. Read the conversation and extract whatever is relevant.

**B. The workspace.** Do a quick scan for files that may contain relevant context:

- `CLAUDE.md` or `claude.md` (business context, preferences, constraints)
- Any `memory/` folder (audience profiles, business details, past decisions)
- Files the user explicitly referenced or attached
- Any project files, briefs, or plans related to what is being premortemed

Use `Glob` and quick `Read` calls. Spend no more than 30 seconds on this. You are looking for the key files that will anchor the failure scenarios in reality.

### step 2: assess context sufficiency

After scanning, check whether you have enough to run a useful premortem. You need three things:

1. **What is it?** — A clear understanding of what is being premortemed (a product, a launch, a hire, a pricing change, a strategy). You must be able to describe it back to the user in one sentence.

2. **Who is it for / who does it affect?** — The audience, the customer, the team, the stakeholders. Failure scenarios depend heavily on who is involved.

3. **What does success look like?** — What outcome does the user expect? Failure is defined by inverting success. If you do not know what success means, you cannot define what failure means.

### step 3: fill the gaps conversationally

If you have all three, proceed immediately to the premortem. Do not ask unnecessary questions.

If you are missing one or more, ask for the most important missing piece first. One question at a time. After each answer, assess whether you now have enough. Keep asking until you reach the threshold, but never ask more than necessary.

Examples of focused context questions:

- "What exactly are you about to launch/build/decide?" (if you do not know what it is)
- "Who is this for?" (if you know the plan but not the audience)
- "What would a win look like for this?" (if you know the plan and the audience but not the success criteria)

The goal is to reach the minimum as fast as possible without making the user feel like they are filling out a form. Conversational, not an interrogation. If you can infer an answer from context, do so instead of asking.

---

## how a premortem session works

### step 1: establish the framing

After gathering enough context, establish the premortem framing explicitly. Something like:

"OK, I have enough context. Let's run the premortem. The premise is: 6 months have passed. [The plan/launch/decision] has failed. It is done. We are looking back trying to understand what went wrong."

This framing matters. It shifts the mode from "evaluate this plan" (which triggers complacent answers) to "explain why this died" (which triggers honest, specific failure identification).

### step 2: generate failure reasons (raw premortem)

Run the raw premortem as a single, complete analysis. No preset categories, no lenses, no constraints. Just the basic Klein method:

"This plan has failed 6 months from now. Generate every genuine reason it could have died. Be exhaustive. Be specific. Ground every reason in the real details of the plan. Do not pad with weak reasons and do not stop early if there are more."

The output must be a complete list of failure reasons, each stated in 1-2 sentences. Be honest and exhaustive. Some plans may have 4 genuine failure modes. Others may have 9. The number must be whatever is real for this specific plan.

Each failure reason must be:

- Specific to this plan (not generic advice that applies to anything)
- Grounded in real details the user provided
- A genuine threat (not a minor inconvenience or an extremely unlikely edge case)

### step 3: deep-dive agents (one per failure reason, all in parallel)

Take each failure reason from step 2 and launch one sub-agent per reason, all in parallel. Each agent takes its assigned failure reason and analyzes it in depth, independently.

**Sub-agent prompt template:**

```
You are an investigator in a premortem analysis. You have been assigned one specific failure reason to analyze in depth.

The plan:
---
[full context: what it is, who it is for, what success looks like, plus relevant workspace context]
---

PREMORTEM FRAMING: 6 months have passed. This plan has failed.

YOUR ASSIGNED FAILURE REASON: [the specific failure reason from step 2]

Your job is to go deep on this failure. Write the story of how it actually unfolded. Be specific. Use details from the plan. Make it feel real, like a case study of something that actually happened.

Your output must include:

1. THE FAILURE STORY: A 2-3 paragraph narrative of how this specific failure unfolded. Use details from the plan. Name specific moments where things went wrong and why.

2. THE UNDERLYING ASSUMPTION: The single thing the user took for granted that made this failure possible. State it in one sentence.

3. EARLY WARNING SIGNS: 1-2 concrete, observable signals the user could watch for that would indicate this failure mode is starting to develop. They must be things that can actually be seen or measured, not vague feelings.

Keep the total response under 300 words. Be direct. Do not soften it. Do not sugarcoat it.
```

### step 4: synthesis

After all agents complete, read every deep analysis and produce the synthesis:

**PREMORTEM REPORT**

1. **The Most Likely Failure** — Which failure scenario is most likely given what you know about the plan? Why? This is the one the user should focus on first.

2. **The Most Dangerous Failure** — Which failure scenario would cause the most damage if it occurred, even if it is less likely? This is the one worth insuring against.

3. **The Hidden Assumption** — Of all the failure analyses, what is the most important assumption the user is making that they have probably not questioned? This is where the real value of the premortem often lives: the thing so obvious to the user that they forgot it was an assumption.

4. **The Revised Plan** — Based on the failure scenarios, what specific changes would make the plan more resilient? Be concrete. Do not say "consider your pricing." Say "test the price at $X with 20 people before committing publicly." Every revision must map directly to a specific failure scenario.

5. **The Pre-Launch Checklist** — 3-5 specific things the user must verify, test, or implement before executing. Each must prevent or detect one of the identified failure modes.

### step 5: generate the premortem report

Generate a visual HTML report and save it to the user's workspace.

**File:** `premortem-report-[timestamp].html`

The report must be a single self-contained HTML file with inline CSS. Design principles:

- Dark background (#0a0e1a or similar), clean typography, easy to scan
- The synthesis section (most likely failure, most dangerous failure, hidden assumption, revised plan, checklist) must be shown prominently at the top since it is what most people will read first
- One visual card per failure reason showing the deep analysis. Each card must show the failure reason as a heading, the failure story, the underlying assumption, and the early warning signs. Use distinct accent colors for each card so they are visually scannable.
- A clear visual severity/probability indicator for each failure mode
- The rotating visual: show the number of agents that ran and their findings as a grid or card layout, so the user can see the full scope of the premortem at a glance
- Footer with timestamp and what was premortemed

Open the HTML file after generating it.

### step 6: save the transcript

Save the complete premortem transcript as `premortem-transcript-[timestamp].md` in the same location. This includes:

- The context that was gathered (what, who, success criteria)
- The failure reasons from the raw premortem
- All agent deep-dive analyses
- The complete synthesis

---

## output format

Each premortem session produces two files:

```
premortem-report-[timestamp].html    # visual report for scanning
premortem-transcript-[timestamp].md  # complete transcript as reference
```

The user sees the HTML report first. The transcript is available if they want to dig into the reasoning behind each failure scenario.

Also provide a concise summary in the chat: the most likely failure, the hidden assumption, and the single most important plan revision. Maximum three sentences. The report has all the details.

---

## example: premortem of a product launch

**User:** "premortem this: I'm about to launch a $297 live workshop on how to use Claude Cowork for marketing teams. 50 seats. Targeted at marketing directors at companies with 10-50 employees."

**The raw premortem identifies 6 failure reasons:**

1. Marketing directors at companies of this size need approval to spend $297 on professional development, adding friction you have not accounted for
2. "Claude Cowork for marketing" is a tool-centered pitch in a market where most directors are still deciding whether AI is relevant to them at all
3. The audience that actually buys may be solopreneurs, not team directors, creating a mismatch between the content and the attendees
4. Building a workshop for marketing teams requires demo environments with realistic marketing data and multi-user setups, which takes 5 weeks of preparation, not the 2 you have budgeted
5. If 60% of attendees are solopreneurs, your reviews and case studies will not resonate with the marketing-director audience you need for future cohorts
6. At $297 with 50 seats, maximum revenue is $14,850, which may not justify the preparation time versus other revenue opportunities

**6 agents go deep on each reason independently, producing failure stories, underlying assumptions, and early warning signs.**

**Synthesis:** The most likely failure is the audience mismatch: you are targeting people who need approval to spend $297, which adds friction you have not accounted for. The most dangerous failure: attracting solopreneurs instead of team directors means your case studies and testimonials will not resonate with the real target buyer for future cohorts, compounding the problem over time. Hidden assumption: you assume "marketing directors at 10-50 person companies" is a reachable audience, but these people do not identify that way and are not in the same places. Revised plan: run a $47 pilot session for 20 people first. Use it to identify whether your real buyers are team directors or solopreneurs, and build the full workshop for whoever actually shows up.

---

## important notes

- **Always launch all failure agents in parallel.** Sequential launching wastes time and lets earlier answers influence later ones.
- **Always establish the premortem framing explicitly.** "This has already failed" is the psychological mechanism that makes this work. Without it, the analysis reverts to polite risk assessment instead of honest failure identification.
- **Be exhaustive but do not pad.** Find every genuine failure reason. Do not stop at 3 if there are 7. But do not force 7 if there are only 3. The number must be whatever is real for this specific plan.
- **The synthesis is the product.** Most users will read the synthesis and skim the individual failure cards. Make the synthesis specific and actionable.
- **Do not soften it.** The point of a premortem is to tell the user things they do not want to hear before reality does. If a plan has serious problems, say so directly.
- **The revised plan must be concrete.** Do not say "consider testing your price." Say "run a $47 pilot with 20 people before committing to the full $297 workshop." Every revision must be something the user can actually do this week.
- **Respect the minimum context threshold.** Running a premortem with insufficient context produces generic failures that waste the user's time. It is better to ask one more question than to produce a bad premortem.
- **This is not the LLM Council.** The council gives multiple perspectives on a decision right now. The premortem sends Claude into the future where the decision already failed and works backward to explain why. Different psychological mechanism, different result. If the user seems to want multiple perspectives instead of a failure analysis, suggest the council instead.
