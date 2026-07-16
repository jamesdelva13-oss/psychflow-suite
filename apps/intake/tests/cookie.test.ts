import { test } from "node:test";
import assert from "node:assert/strict";
import { makeCookieValue, parseCookieValue } from "../lib/respondent-cookie";
import { authorizeRespondent } from "../lib/respondent-guard";

test("cookie round-trips to its invitation id", () => {
  assert.equal(parseCookieValue(makeCookieValue("inv-A")), "inv-A");
});

test("a cookie minted for A does not validate as B", () => {
  const a = makeCookieValue("inv-A");
  assert.equal(parseCookieValue(a), "inv-A");
  assert.notEqual(parseCookieValue(a), "inv-B");
});

test("tampered signature is rejected", () => {
  const a = makeCookieValue("inv-A");
  const tampered = a.slice(0, -2) + (a.endsWith("aa") ? "bb" : "aa");
  assert.equal(parseCookieValue(tampered), null);
});

test("forged value (swap id, keep signature) is rejected", () => {
  const a = makeCookieValue("inv-A");
  const sig = a.split(".").pop();
  assert.equal(parseCookieValue(`inv-B.${sig}`), null);
});

test("missing / empty cookie → null", () => {
  assert.equal(parseCookieValue(undefined), null);
  assert.equal(parseCookieValue(null), null);
  assert.equal(parseCookieValue(""), null);
});

test("authorizeRespondent gates writes to exactly one invitation", () => {
  assert.equal(authorizeRespondent("A", "A"), true);
  assert.equal(authorizeRespondent("A", "B"), false); // cookie for A cannot write B
  assert.equal(authorizeRespondent(null, "A"), false);
  assert.equal(authorizeRespondent("A", ""), false);
});
