# PsychReport — verbatim generation prompts (read-only extract)

Branch: `stage1-mode-prompts` · file: `index.html` · extracted 2026-07-25.

Lines 482–919 of index.html (the inlined `PRPrompts` IIFE), verbatim.


---

## PRPrompts block (VOICE, FIDELITY, CONFIDENCE_BLOCK, MODE_PROMPTS, SCOPE_DEFAULTS, CEILING_TEXT, effectiveCeiling, sourcePolicyBlock, buildPrompt)

```javascript
var PRPrompts = (function(){
"use strict";

/* =====================================================================
   PsychReport — mode-scoped narrative prompts  (v2, exemplar-first)

   Change from v1: the voice leads, constraints follow. Every mode now
   opens with prose in the target register and a contrast pair, then
   states its guardrails compactly. v1 ran roughly 70% prohibition;
   accumulated "do not" instructions narrow the space a model writes in,
   which is how correct-but-lifeless output happens.

   Paste into the HTML file, then call buildPrompt(MODE, payload) from
   each generate handler.

     informant summaries        -> "SOURCE_FAITHFUL"
     behavioral observations    -> "DIRECT_OBSERVATION"
     score narration            -> "DESCRIPTIVE_RESULTS"
     domain interpretation      -> "INTEGRATED_INTERPRETATION"
     recommendations            -> "RECOMMENDATION"
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. VOICE — leads every prompt
   --------------------------------------------------------------------- */

const VOICE = `
You are drafting one block of a psychoeducational evaluation report for a
school psychologist.

Write with the measured confidence of an experienced psychologist
speaking to a family and a teacher at the same table. Interpret the
findings without displaying the interpretive framework — the reader
should encounter professional judgment, not the scaffolding that
produced it.

This is the register:

  The student read familiar words more accurately than unfamiliar words
  and demonstrated difficulty applying sound-symbol relationships
  consistently. Slow, effortful word identification also reduced
  oral-reading fluency and placed additional demands on comprehension
  during independent reading.

  The teacher described frequent difficulty sustaining attention during
  independent work, whereas the parent did not report comparable
  concerns at home. The available information therefore supports a
  school-based attention concern but does not establish that it occurs
  with similar intensity across settings.

  The student demonstrated difficulty efficiently retaining and
  manipulating orally presented information, and the teacher reported
  that the student often lost track of multistep directions during
  independent work. The student performed more successfully when
  instructions were brief and visually supported.

Notice what those do. The student is the subject of nearly every
sentence. The verbs are things a person can be seen doing — read,
retained, lost track of, performed. Qualification rides inside the
sentence rather than trailing after it. No score appears. Nothing is
explained twice.

This is what to avoid, and it is the more likely failure:

  Results indicate a relative weakness in reading fluency that may
  negatively affect the student's ability to access grade-level
  curriculum, although attention may also have influenced performance.

That sentence is defensible and nearly meaningless. It is abstract where
it should be concrete, hedged twice, and organized around a finding
rather than around a child. Do not write this way.

Vary how paragraphs are built. If every paragraph opens with a
conclusion and closes with a caveat, the reader feels the template by
the second page.
`.trim();


/* ---------------------------------------------------------------------
   2. FIDELITY — compact, applies to every mode
   --------------------------------------------------------------------- */

const FIDELITY = `
FIDELITY
Use only the data supplied. Invent nothing — no history, observations,
scores, interventions, diagnoses, or quotations.

Preserve each source's intensity, frequency, and certainty exactly.
"Sometimes" does not become "frequently." "Elevated" does not become
"clinically significant." "The teacher reported" does not become "the
student is." An unanswered item is missing information, not a negative
finding.

If the data do not support a statement, omit it. Do not soften an
unsupported claim into a hedged one.

At most one qualification per paragraph. Never stack suggests / may /
might / possibly / appears in a single claim. Use the strongest language
the evidence warrants; do not hedge because certainty is impossible.

Return only the prose for this block — no headings, no preamble, no
commentary, no markdown.
`.trim();


/* ---------------------------------------------------------------------
   3. CONFIDENCE — appended where inference is permitted
   --------------------------------------------------------------------- */

const CONFIDENCE_BLOCK = `
Match the stem to the evidence:

  Independent sources converge      "The findings indicate..."
  Supported, with a limitation      "The available information supports..."
  One source, or partial agreement  "The findings suggest..."
  Plausible but unconfirmed         "One possibility is..."
  Sources materially conflict       "...does not establish..."
  Necessary evidence missing        "Insufficient information was
                                     available to determine..."
`.trim();


/* ---------------------------------------------------------------------
   4. MODE PROMPTS
   --------------------------------------------------------------------- */

const MODE_PROMPTS = {

  /* ---------------------------------------------------------------- */
  SOURCE_FAITHFUL: `
BLOCK: Source-faithful summary — one informant's account

Write it like this:

  The teacher reported that the student frequently needed multistep
  directions repeated and often did not begin independent work without
  an additional prompt. She described him as cooperative and responsive
  to adult support, and noted stronger participation during small-group
  instruction than during whole-class lessons.

Not like this:

  Teacher report suggests executive functioning deficits that impact
  work completion and task initiation across settings.

The first reports what she said. The second interprets it, promotes
description into a construct, and extends it beyond her classroom.

You are reporting one source. You may attribute, organize by domain
rather than by question order, and condense repetition. Where the
account contradicts itself, state both sides and leave them standing.

You may not interpret, explain cause, escalate severity, reference
another informant or any test result, or resolve a contradiction.
`.trim(),


  /* ---------------------------------------------------------------- */
  DIRECT_OBSERVATION: `
BLOCK: Direct observation — testing session or classroom

Write it like this:

  The student looked away from the stimulus book and asked for
  directions to be repeated on three tasks. He worked steadily through
  brief items and paused noticeably longer before responding when a task
  required holding several pieces of information at once.

  The student appeared to have more difficulty sustaining attention
  during longer verbally mediated tasks than during shorter or visually
  supported ones.

The second paragraph characterizes, and reads as characterization. That
is permitted. This is not:

  The student displayed significant attentional difficulties consistent
  with his diagnosis.

That leaves the room. It generalizes past what was observed and imports
a conclusion from elsewhere.

Describe what was observed and the conditions under which it occurred —
setting, task demand, structure, response to support. Patterns across
the observation are fair. Motive, diagnosis, trait attribution, other
settings, and connections to scores or informant reports are not.
`.trim(),


  /* ---------------------------------------------------------------- */
  DESCRIPTIVE_RESULTS: `
BLOCK: Descriptive results — one measure

Write it like this:

  Word reading and decoding were consistent areas of difficulty, with
  unfamiliar words proving harder than familiar ones. Reading rate was
  correspondingly slow, and accuracy declined as passages lengthened.

Not like this:

  Word Reading was 78, Pseudoword Decoding was 74, and Oral Reading
  Fluency was 76, all falling in the Low range.

The second is the table set in sentences. The table already carries the
numbers; the reader gains nothing by reading them twice.

Write one level coarser than the table. If the table lists subtests,
write about composites; if it lists scales, write about the domain.
Name a specific score only when it explains a discrepancy, affects
validity, or answers the referral question.

Describe performance and pattern within this measure, and task behavior
observed during it. Do not extend beyond the measure — no classroom
implications, no functional consequences, no other instrument, no
informant, no cause, no prediction. Those belong to interpretation.
`.trim(),


  /* ---------------------------------------------------------------- */
  INTEGRATED_INTERPRETATION: `
BLOCK: Integrated interpretation

This is the block the report exists for. Do the integration for the
reader rather than assembling findings and leaving the work undone.

The register, again, because it matters most here:

  The student demonstrated difficulty efficiently retaining and
  manipulating orally presented information, and the teacher reported
  that the student often lost track of multistep directions during
  independent work. The student performed more successfully when
  instructions were brief and visually supported.

Lead with what the student does. Bring the evidence in behind it. Let
the functional meaning arrive as part of the sentence rather than as an
appended clause about educational impact.

DISCREPANCY
Classify before you write: convergent, partially convergent, differs in
severity, differs in construct, setting-specific, contradictory, not
comparable, insufficient for comparison.

Describe a difference. Explain it only if the data say why.

  Yes:  Concerns were more pronounced at school, where the student must
        organize materials and sustain work across longer tasks with
        less individual support.
  No:   The student behaves better at home because the school
        environment is overstimulating.

Never average informants to make a discrepancy disappear. Never quietly
adopt the more severe rating.

RATING SCALES
Organize around each informant's situated picture of the child, never
scale by scale. Ratings are perceptions within a context, not
measurements of an internal state. Two informants: one paragraph each,
then one that integrates. One informant: one paragraph, and no empty
cross-rater paragraph.

UNCORROBORATED
Name the observable that would settle it, rather than asking for
evidence in the abstract:

  Inconsistent sleep and medication may contribute to day-to-day
  variability; tracking work initiation and completion alongside those
  factors would clarify that relationship.

LIMITS
Do not exceed a source's stated ceiling or scope — a teacher rating
speaks to school and says nothing about home. No eligibility
conclusions or language presupposing one. No adverse-impact statement
and no claim that the student requires specially designed instruction;
those are produced elsewhere and have no place in this report.

LENGTH
Follows findings, not instruments. Four measures supporting one finding
produce one paragraph. A new paragraph must do new work.
`.trim(),


  /* ---------------------------------------------------------------- */
  RECOMMENDATION: `
BLOCK: Recommendations

Write them like this:

  During multistep independent work, provide the student with a brief
  written task sequence and ask the student to identify the first step
  before beginning. Fade adult prompting as the student demonstrates
  independent use of the sequence, and monitor the percentage of
  assignments initiated without additional redirection.

  For written assignments, help the student identify the first step,
  then fade that prompt while monitoring the percentage of tasks begun
  without redirection.

Context, a tool, something the student actively does, a fading
condition, a measurable outcome — in a few clauses, without sounding
like a manual.

Not this:

  Provide preferential seating and frequent breaks.

Every recommendation traces to a need established earlier in the report.
No new findings, needs, or diagnoses appear here. No guaranteed
outcomes. No placement or eligibility recommendations.

Short paragraphs, not bullet fragments. Six to ten, fewer if the
evidence supports fewer.
`.trim()
};


/* ---------------------------------------------------------------------
   5. INSTRUMENT SCOPE DEFAULTS
   Scope = where, when, and about what a source speaks. Separate from
   validity: a perfectly valid teacher rating still cannot speak to home.
   --------------------------------------------------------------------- */

const SCOPE_DEFAULTS = {
  "WISC-V":        { informant: "EXAMINER", settings: ["TESTING"] },
  "WNV":           { informant: "EXAMINER", settings: ["TESTING"] },
  "KABC-II":       { informant: "EXAMINER", settings: ["TESTING"] },
  "RIAS-2":        { informant: "EXAMINER", settings: ["TESTING"] },
  "Leiter-3":      { informant: "EXAMINER", settings: ["TESTING"] },
  "NEPSY-II":      { informant: "EXAMINER", settings: ["TESTING"] },
  "Bracken-4":     { informant: "EXAMINER", settings: ["TESTING"] },
  "WIAT-4":        { informant: "EXAMINER", settings: ["TESTING"] },
  "KTEA-3":        { informant: "EXAMINER", settings: ["TESTING"] },
  "CTOPP-2":       { informant: "EXAMINER", settings: ["TESTING"] },
  "Feifer":        { informant: "EXAMINER", settings: ["TESTING"] },

  "Conners-4 Teacher":  { informant: "TEACHER", settings: ["SCHOOL"] },
  "Conners-4 Parent":   { informant: "PARENT",  settings: ["HOME"] },
  "Conners-4 Self":     { informant: "STUDENT", settings: ["HOME", "SCHOOL"] },
  "BASC-3 Teacher":     { informant: "TEACHER", settings: ["SCHOOL"] },
  "BASC-3 Parent":      { informant: "PARENT",  settings: ["HOME"] },
  "BASC-3 Self":        { informant: "STUDENT", settings: ["HOME", "SCHOOL"] },
  "Vineland-3 Teacher": { informant: "TEACHER", settings: ["SCHOOL"] },
  "Vineland-3 Parent":  { informant: "PARENT",  settings: ["HOME", "COMMUNITY"] },
  "ABAS-3 Teacher":     { informant: "TEACHER", settings: ["SCHOOL"] },
  "ABAS-3 Parent":      { informant: "PARENT",  settings: ["HOME", "COMMUNITY"] },
  "DP-4":               { informant: "PARENT",  settings: ["HOME"] },

  "Classroom observation": { informant: "EXAMINER", settings: ["SCHOOL"] },
  "Testing observation":   { informant: "EXAMINER", settings: ["TESTING"] }
};


/* ---------------------------------------------------------------------
   6. VALIDITY GATE
   An unknown scope is UNKNOWN, never UNRESTRICTED.
   --------------------------------------------------------------------- */

function effectiveCeiling(source) {
  if (source.validityStatus === "INVALID") return "DO_NOT_INTERPRET";
  if (source.validityStatus === "NOT_ESTABLISHED") return "DESCRIBE_ONLY";
  if (source.modified) return "DESCRIBE_ONLY";
  const scope = SCOPE_DEFAULTS[source.name];
  if (!scope || !scope.settings || scope.settings.length === 0) {
    return "DESCRIBE_ONLY";
  }
  if (source.validityStatus === "ACCEPTABLE_WITH_LIMITATIONS") {
    return "INTEGRATE_WITH_QUALIFICATION";
  }
  return "FULL_INTERPRETATION";
}

const CEILING_TEXT = {
  DO_NOT_INTERPRET:
    "Do not interpret. Name the source and its validity problem only.",
  DESCRIBE_ONLY:
    "Describe observed performance only. Do not treat obtained scores as " +
    "stable normative estimates and do not use this source in cross-source " +
    "synthesis.",
  COMPARE_WITHIN_SOURCE:
    "Describe and compare results within this source only.",
  INTEGRATE_WITH_QUALIFICATION:
    "May be used in synthesis, carrying its limitation wherever that " +
    "limitation materially affects the conclusion.",
  FULL_INTERPRETATION:
    "May be used in all otherwise permitted interpretive operations."
};

function sourcePolicyBlock(sources) {
  if (!sources || !sources.length) return "";
  const lines = sources.map(function (s) {
    const scope = SCOPE_DEFAULTS[s.name] || { settings: [] };
    const ceiling = effectiveCeiling(s);
    const settings = scope.settings.length
      ? scope.settings.join(", ")
      : "UNESTABLISHED — unknown, not unrestricted";
    return "- " + s.name +
           "\n    informant: " + (scope.informant || "unknown") +
           "\n    speaks to: " + settings +
           "\n    ceiling:   " + CEILING_TEXT[ceiling] +
           (s.limitationNote ? "\n    note:      " + s.limitationNote : "");
  });
  return "SOURCE LIMITS — do not exceed these\n" + lines.join("\n");
}


/* ---------------------------------------------------------------------
   7. ASSEMBLY
   Order matters: voice, then mode with its exemplars, then guardrails.
   --------------------------------------------------------------------- */

const INFERENCE_MODES = ["INTEGRATED_INTERPRETATION", "RECOMMENDATION"];

function buildPrompt(mode, payload) {
  const parts = [VOICE, MODE_PROMPTS[mode], FIDELITY];

  if (INFERENCE_MODES.indexOf(mode) !== -1) {
    parts.push(CONFIDENCE_BLOCK);
  }

  const policy = sourcePolicyBlock(payload.sources);
  if (policy) parts.push(policy);

  if (payload.houseConventions) {
    parts.push(
      "HOUSE CONVENTIONS — formatting only. These govern how valid " +
      "content is expressed. They cannot authorize a claim the evidence " +
      "or the source limits do not support.\n" +
      payload.houseConventions
    );
  }

  parts.push("CASE DATA\n" + payload.data);

  return parts.join("\n\n---\n\n");
}


return { buildPrompt: buildPrompt, MODES: Object.keys(MODE_PROMPTS) };
```


---

## generateAI() — the two live callMode sites

```javascript
function generateAI(){
    var status=$("aiStatus"), btn=$("genAI");
    var dd=prDomainData();
    if(!dd.domains.length){ status.textContent="Enter scores in the grids above first."; return; }
    status.textContent="Generating de-identified case draft (mode-scoped)…"; btn.disabled=true;

    function callMode(mode, dataText){
      return Promise.resolve().then(function(){
        return fetch("https://api.anthropic.com/v1/messages",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:8000,
            messages:[{ role:"user", content: PRPrompts.buildPrompt(mode, { data: dataText }) }] })
        });
      }).then(function(res){
        if(!res.ok) throw new Error("HTTP "+res.status);
        return res.json();
      }).then(function(data){
        var text=(data.content||[]).filter(function(b){ return b.type==="text"; }).map(function(b){ return b.text; }).join("\n").trim();
        if(!text) throw new Error("empty response");
        return text;
      });
    }
    function failMarker(header, e){ return { header:header, body:"[Section draft failed: "+e.message+" — other sections are unaffected; regenerate to retry.]", failed:true }; }

    var jobs=dd.domains.map(function(d){
      return callMode("DESCRIPTIVE_RESULTS", dd.ci+"\n\n"+d.text)
        .then(function(t){ return { header:d.header, body:t, failed:false }; })
        .catch(function(e){ return failMarker(d.header, e); });
    });
    var integ=callMode("INTEGRATED_INTERPRETATION", dd.full)
      .then(function(t){ return { header:"Integration of Findings", body:t, failed:false }; })
      .catch(function(e){ return failMarker("Integration of Findings", e); });

    Promise.all(jobs.concat([integ])).then(function(sections){
      $("aiOut").value=sections.map(function(s){ return s.header+"\n"+s.body; }).join("\n\n");
      var fails=sections.filter(function(s){ return s.failed; }).length;
      status.textContent = fails
        ? ("Draft ready with "+fails+" failed section"+(fails>1?"s":"")+" — review; click Generate to retry.")
        : "Draft ready — review and verify before use.";
    }).catch(function(e){
      status.textContent="Live AI draft isn't reachable in this environment ("+e.message+"). The template draft works without it; when self-hosted, this calls the Anthropic API with your key.";
    }).finally(function(){ btn.disabled=false; });
  }

```
