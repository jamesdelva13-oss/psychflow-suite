import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Token purity (UI rule 2 / Gate C item 1): every style value comes from
 * tokens.css. This test enforces it structurally over ui.css and the
 * component sources:
 *
 *   - no hex colors anywhere outside tokens.css;
 *   - no px lengths in ui.css except the 1px hairline border and the 2px
 *     rules the ratified Design System itself specifies in px (§5.1 progress
 *     line, §5.10 underline tabs) — everything else must be a var();
 *   - no font-family literals outside tokens.css;
 *   - no style-value literals (hex or px) in component TSX.
 */

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("ui.css contains no hex colors", () => {
  const css = readFileSync(join(pkgRoot, "ui.css"), "utf8");
  const hex = css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  assert.deepEqual(hex, [], `hex literals found in ui.css: ${hex.join(", ")}`);
});

test("ui.css px values are limited to DS-specified hairlines (1px/2px)", () => {
  // @media breakpoints are the DS §4 responsive widths, stated in px by the
  // ratified spec itself, and CSS var() cannot participate in media queries.
  const css = readFileSync(join(pkgRoot, "ui.css"), "utf8")
    .split("\n")
    .filter((line) => !/@media/.test(line))
    .join("\n");
  const px = (css.match(/\b\d+(?:\.\d+)?px\b/g) ?? []).filter((v) => v !== "1px" && v !== "2px");
  assert.deepEqual(px, [], `off-scale px literals found in ui.css: ${px.join(", ")}`);
});

test("ui.css declares no font-family literals", () => {
  const css = readFileSync(join(pkgRoot, "ui.css"), "utf8");
  for (const line of css.split("\n")) {
    if (/font-family:/.test(line)) {
      assert.match(line, /var\(--font-/, `font-family must use a token: ${line.trim()}`);
    }
  }
});

test("component sources carry no hex or px style literals", () => {
  const srcDir = join(pkgRoot, "src");
  for (const f of readdirSync(srcDir)) {
    const text = readFileSync(join(srcDir, f), "utf8");
    const hex = text.match(/["'`]#[0-9a-fA-F]{3,8}\b/g) ?? [];
    assert.deepEqual(hex, [], `hex literal in ${f}: ${hex.join(", ")}`);
    const px = text.match(/\b\d+px\b/g) ?? [];
    assert.deepEqual(px, [], `px literal in ${f}: ${px.join(", ")}`);
  }
});

test("tokens.css is present and defines the core families", () => {
  const tokens = readFileSync(join(pkgRoot, "tokens.css"), "utf8");
  for (const name of ["--accent-600", "--ai-600", "--spine-width", "--font-ui", "--sidebar-w"]) {
    assert.ok(tokens.includes(name), `tokens.css missing ${name}`);
  }
});
