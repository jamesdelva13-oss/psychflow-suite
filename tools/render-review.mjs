// render-review.mjs — render a question bank (JSON) to a single-file review HTML
// (panel-HTML review document, per decisions.md D-019). No deps.
//   node tools/render-review.mjs <bank.json> <out.html>
import { readFileSync, writeFileSync } from "node:fs";

const CSS = `* { margin:0; padding:0; box-sizing:border-box; }
body { background-color:#eef0f2; font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#1f2933; line-height:1.5; padding:16px 12px 48px; }
.panel { background-color:#ffffff; border-radius:12px; padding:20px 18px; margin:0 auto 16px; max-width:760px; box-shadow:0 1px 3px rgba(20,30,40,0.08); }
h1 { font-size:1.4rem; margin-bottom:6px; }
h2 { font-size:1.1rem; color:#0f4c5c; margin-bottom:8px; }
.dl { font-size:0.78rem; font-weight:400; color:#5b6b76; }
.eyebrow { font-size:0.72rem; letter-spacing:0.08em; text-transform:uppercase; color:#0f7c8c; font-weight:700; margin-bottom:4px; }
.subtitle { color:#5b6b76; font-size:0.9rem; }
.always { font-size:0.78rem; font-weight:700; color:#1e6b34; margin-bottom:8px; }
.always.cond { color:#8a6314; }
.mintro { font-size:0.85rem; color:#5b6b76; font-style:italic; margin-bottom:10px; }
.q { border-top:1px solid #e6ebee; padding:10px 0; }
.q.repeated { padding-left:10px; }
.qhead { margin-bottom:3px; }
.qid { font-family:ui-monospace,Menlo,Consolas,monospace; font-size:0.78rem; background-color:#f1f4f6; padding:1px 6px; border-radius:4px; color:#0f4c5c; font-weight:700; }
.qprompt { font-size:0.95rem; margin-bottom:3px; }
.help { font-size:0.82rem; color:#5b6b76; margin-bottom:3px; }
.opts { font-size:0.8rem; color:#33434f; background-color:#f7fafb; border-radius:6px; padding:6px 8px; margin:4px 0; }
.qmeta { margin:3px 0; }
.showif { font-size:0.78rem; color:#8a6314; }
.notes { font-size:0.78rem; color:#7a8a94; font-style:italic; margin-top:3px; }
.tag { display:inline-block; border-radius:999px; padding:1px 8px; font-size:0.7rem; font-weight:700; margin-right:4px; }
.tag.construct { background-color:#eaf6f7; color:#0f4c5c; font-family:ui-monospace,Menlo,monospace; font-weight:600; }
.tag.rtype { background-color:#eef2f5; color:#33434f; }
.tag.req { background-color:#f3e6e6; color:#8a3030; }
.tag.elicit { background-color:#f0ecf7; color:#4b3a78; }
.rg { border:1px dashed #b9cdd6; border-radius:8px; padding:8px 10px; margin-top:10px; background-color:#fbfdfe; }
.rghead { font-size:0.82rem; color:#0f4c5c; font-weight:600; margin-bottom:4px; }
table { width:100%; border-collapse:collapse; font-size:0.82rem; margin-top:8px; background-color:#ffffff; }
th { background-color:#0f4c5c; color:#ffffff; text-align:left; padding:6px 8px; }
td { padding:6px 8px; border-bottom:1px solid #e6ebee; vertical-align:top; background-color:#ffffff; }
tr:nth-child(even) td { background-color:#f7fafb; }
td.hint { color:#5b6b76; }
ul { margin:6px 0 6px 18px; font-size:0.88rem; }
li { margin-bottom:5px; }
code { font-family:ui-monospace,Menlo,Consolas,monospace; font-size:0.78rem; }`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const branchTargets = (bank) => new Map(bank.branchRules.map((b) => [b.target, true]));

function cond(c) {
  const q = c.questionId;
  switch (c.operator) {
    case "equals": return `${q} = &ldquo;${esc(c.value)}&rdquo;`;
    case "includes": return `${q} includes &ldquo;${esc(c.value)}&rdquo;`;
    case "includes_any": return `${q} includes any of [${(c.values || []).map(esc).join(", ")}]`;
    case "is_yes": return `${q} = Yes`;
    case "is_no": return `${q} = No`;
    case "answered": return `${q} answered`;
    case "not_answered": return `${q} not answered`;
    default: return `${q} ${c.operator}`;
  }
}

function optCode(o) {
  if (o.topography) return `topography: ${o.topography}`;
  if (o.constructIds && o.constructIds.length) return o.constructIds.join(" / ");
  return null;
}

function optsBlock(q) {
  if (!q.options || !q.options.length) return "";
  const tagged = q.options.some((o) => optCode(o));
  if (tagged) {
    const rows = q.options.map((o) => {
      const code = optCode(o);
      return esc(o.label) + (code ? ` &rarr; <code>${esc(code)}</code>` : "");
    }).join("<br>");
    return `<div class="opts">${rows}</div>`;
  }
  return `<div class="opts">Options: ${q.options.map((o) => esc(o.label)).join(" &middot; ")}</div>`;
}

function questionCard(q, repeated) {
  const tags = [`<span class="tag rtype">${q.responseType}</span>`];
  if (q.required) tags.push(`<span class="tag req">required</span>`);
  tags.push(`<span class="tag elicit">${q.elicits ?? "either"}</span>`);
  const qmeta = (q.constructIds || []).map((c) => `<span class="tag construct">${esc(c)}</span>`).join(" ");
  const showif = q.showIf ? `<div class="showif">Shown when: ${q.showIf.map(cond).join(" and ")}</div>` : "";
  const notes = q.notes ? `<div class="notes">Authoring note: ${esc(q.notes)}</div>` : "";
  const help = q.helpText ? `<div class="help">${esc(q.helpText)}</div>` : "";
  return `<div class="q${repeated ? " repeated" : ""}">
    <div class="qhead"><code class="qid">${q.id}</code> ${tags.join(" ")}</div>
    <div class="qprompt">${esc(q.prompt)}</div>
    ${help}${optsBlock(q)}
    <div class="qmeta">${qmeta}</div>
    ${showif}${notes}
  </div>`;
}

function render(bank) {
  const flatQ = bank.modules.flatMap((m) => [...m.questions, ...(m.repeatGroups ?? []).flatMap((r) => r.questions)]);
  const targets = branchTargets(bank);
  const panels = bank.modules.map((m) => {
    const always = m.alwaysShown ? `<p class="always">Always shown</p>` : `<p class="always cond">Loads by branch rule</p>`;
    const mintro = m.intro ? `<p class="mintro">Informant sees: &ldquo;${esc(m.intro)}&rdquo;</p>` : "";
    const qs = m.questions.map((q) => questionCard(q, false)).join("");
    const rgs = (m.repeatGroups ?? []).map((rg) => {
      const inner = rg.questions.map((q) => questionCard(q, true)).join("");
      return `<div class="rg"><div class="rghead">Repeated once per option selected in <code>${rg.sourceQuestionId}</code>:</div>${inner}</div>`;
    }).join("");
    return `<div class="panel"><h2>${esc(m.displayLabel)} <span class="dl">module id: ${m.id}</span></h2>${always}${mintro}${qs}${rgs}</div>`;
  }).join("\n");

  const brRows = bank.branchRules.map((b) => `<tr><td><code>${b.id}</code></td><td>${b.when.map(cond).join(" and ")}</td><td>show <b>${b.target}</b></td></tr>`).join("");
  const fuRows = bank.followUps.map((f) => `<tr><td><code>${f.id}</code></td><td>${esc(f.prompt)}</td><td class="hint">${esc(f.triggerHint)}</td></tr>`).join("");
  const crRows = bank.completenessRules.map((c) => `<tr><td><code>${c.id}</code></td><td>${esc(c.description)}</td><td>${c.when.map(cond).join(" and ")}</td><td><code>${c.askFollowUpId}</code></td></tr>`).join("");
  const proh = bank.summaryConstraints.prohibited.map((p) => `<li>${esc(p)}</li>`).join("");
  const req = bank.summaryConstraints.requiredFraming.map((p) => `<li>${esc(p)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(bank.title)} v${bank.version} — Review Copy</title>
<style>${CSS}</style></head><body>
<div class="panel">
  <div class="eyebrow">Referral Intelligence Engine · Review Copy</div>
  <h1>${esc(bank.title)} — Question Bank v${bank.version}</h1>
  <p class="subtitle">Rendered from the JSON content file. Taxonomy v${bank.taxonomyVersion} · ${bank.modules.length} modules · ${flatQ.length} questions · ${bank.branchRules.length} branch rules · ${bank.followUps.length} approved follow-ups · ${bank.completenessRules.length} completeness rules. Informant sees: &ldquo;${esc(bank.intro)}&rdquo;</p>
</div>
${panels}
<div class="panel"><h2>Branch Rules</h2><table><tr><th>ID</th><th>When</th><th>Then</th></tr>${brRows}</table></div>
<div class="panel"><h2>Approved Follow-Up Bank</h2><table><tr><th>ID</th><th>Question</th><th>When it fits</th></tr>${fuRows}</table></div>
<div class="panel"><h2>Completeness Rules</h2><table><tr><th>ID</th><th>Gap detected</th><th>Condition</th><th>Asks</th></tr>${crRows}</table></div>
<div class="panel"><h2>Summary Constraints</h2>
<h2 style="font-size:0.95rem;">Prohibited — narratives may never:</h2><ul>${proh}</ul>
<h2 style="font-size:0.95rem;">Required framing:</h2><ul>${req}</ul></div>
</body></html>
`;
}

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) { console.error("usage: node tools/render-review.mjs <bank.json> <out.html>"); process.exit(1); }
const bank = JSON.parse(readFileSync(inPath, "utf8"));
writeFileSync(outPath, render(bank));
console.log(`rendered ${bank.bankId}@${bank.version} → ${outPath}`);
