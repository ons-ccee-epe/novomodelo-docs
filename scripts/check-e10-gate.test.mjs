// Unit fixture for the check:e10 gate helpers (E8 ticket-029).
//
// Running `npm run check:e10` against the real built dist/ is the end-to-end
// integration check (first AC); this colocated node:test fixture additionally
// pins the two PURE helpers — the byte-identical comparison and the
// footer-substring detector — so a future refactor of check-e10-gate.mjs cannot
// silently weaken the cutover gate. DIST-INDEPENDENT (inline fixtures, no live
// dist/) so it runs pre-build like check-d2-layout.test.mjs, and is picked up by
// the scripts/*.test.mjs glob in `npm test`. node:test + node:assert/strict,
// mirroring check-d2-layout.test.mjs / check-spdx.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { buffersIdentical, footerHasNotices } from "./check-e10-gate.mjs";

// --- buffersIdentical -------------------------------------------------------

test("buffersIdentical: identical buffers compare equal", () => {
  const a = Buffer.from("third-party notices\nKaTeX MIT\n", "utf8");
  const b = Buffer.from("third-party notices\nKaTeX MIT\n", "utf8");
  assert.equal(buffersIdentical(a, b), true);
});

test("buffersIdentical: differing content compares unequal", () => {
  const a = Buffer.from("notices A", "utf8");
  const b = Buffer.from("notices B", "utf8");
  assert.equal(buffersIdentical(a, b), false);
});

test("buffersIdentical: a truncated copy compares unequal (catches a partial dist copy)", () => {
  const a = Buffer.from("third-party notices, full text", "utf8");
  const b = Buffer.from("third-party notices", "utf8"); // prefix only
  assert.equal(buffersIdentical(a, b), false);
});

test("buffersIdentical: a single trailing-byte difference compares unequal", () => {
  // Same length, last byte differs — a re-encode (e.g. CRLF↔LF) must not pass.
  const a = Buffer.from("notices\n", "utf8");
  const b = Buffer.from("notices\r", "utf8");
  assert.equal(a.length, b.length);
  assert.equal(buffersIdentical(a, b), false);
});

test("buffersIdentical: two empty buffers compare equal", () => {
  assert.equal(buffersIdentical(Buffer.alloc(0), Buffer.alloc(0)), true);
});

test("buffersIdentical: a non-Buffer argument is rejected (not silently equal)", () => {
  const buf = Buffer.from("x", "utf8");
  assert.equal(buffersIdentical("x", buf), false);
  assert.equal(buffersIdentical(buf, undefined), false);
});

// --- footerHasNotices -------------------------------------------------------

// The rendered Footer.astro notices block: a root build emits
// href="/THIRD-PARTY-NOTICES.txt", the CC-BY-4.0 token, and an Apache-2.0
// href="…/LICENSE" link. Mirrors the substrings the gate greps in dist/index.html.
const ROOT_FOOTER = [
  '<div class="sl-footer-notices">',
  '<p class="sl-footer-notice"><a href="/THIRD-PARTY-NOTICES.txt">Third-party notices</a></p>',
  '<p class="sl-footer-notice">© 2026 Operador Nacional do Sistema Elétrico - ONS, Câmara de Comercialização ',
  "de Energia Elétrica - CCEE, Empresa de Pesquisa Energética - EPE and Contributors, adapted from the ",
  '<a href="https://github.com/cobre-rs/cobre-docs">Cobre Methodology Documentation</a> ',
  "© 2026 Rogerio J. M. Alves and Cobre Contributors — text &amp; figures ",
  '<a href="https://creativecommons.org/licenses/by/4.0/">CC-BY-4.0</a>, code ',
  '<a href="https://github.com/ons-ccee-epe/novomodelo-docs/blob/main/LICENSE">Apache-2.0</a></p>',
  "</div>",
].join("");

test("footerHasNotices: a complete root-build footer block passes", () => {
  const r = footerHasNotices(ROOT_FOOTER);
  assert.equal(r.ok, true);
  assert.deepEqual(r.missing, []);
});

test("footerHasNotices: a versioned-build base-prefixed href still passes", () => {
  // A /v0.8/ build emits href="/v0.8/THIRD-PARTY-NOTICES.txt"; the trailing
  // filename match must be base-aware, not pinned to a leading slash.
  const versioned = ROOT_FOOTER.replace(
    'href="/THIRD-PARTY-NOTICES.txt"',
    'href="/v0.8/THIRD-PARTY-NOTICES.txt"',
  ).replace(
    'href="https://github.com/ons-ccee-epe/novomodelo-docs/blob/main/LICENSE"',
    'href="/v0.8/LICENSE"',
  );
  assert.equal(footerHasNotices(versioned).ok, true);
});

test("footerHasNotices: a missing notices link is reported", () => {
  const noLink = ROOT_FOOTER.replace(
    '<a href="/THIRD-PARTY-NOTICES.txt">Third-party notices</a>',
    "Third-party notices",
  );
  const r = footerHasNotices(noLink);
  assert.equal(r.ok, false);
  assert.ok(
    r.missing.some((m) => /THIRD-PARTY-NOTICES\.txt/.test(m)),
    "expected the missing notices-link cause",
  );
});

test("footerHasNotices: a missing CC-BY-4.0 token is reported", () => {
  const noCc = ROOT_FOOTER.replace("CC-BY-4.0", "some-other-license");
  const r = footerHasNotices(noCc);
  assert.equal(r.ok, false);
  assert.ok(
    r.missing.some((m) => /CC-BY-4\.0/.test(m)),
    "expected the missing CC-BY-4.0 cause",
  );
});

test("footerHasNotices: a missing LICENSE link is reported", () => {
  const noLicense = ROOT_FOOTER.replace(
    '<a href="https://github.com/ons-ccee-epe/novomodelo-docs/blob/main/LICENSE">Apache-2.0</a>',
    "Apache-2.0",
  );
  const r = footerHasNotices(noLicense);
  assert.equal(r.ok, false);
  assert.ok(
    r.missing.some((m) => /LICENSE/.test(m)),
    "expected the missing LICENSE-link cause",
  );
});

test("footerHasNotices: an empty / non-string input reports all three missing (no throw)", () => {
  for (const input of ["", undefined, null, 42]) {
    const r = footerHasNotices(input);
    assert.equal(r.ok, false);
    assert.equal(r.missing.length, 3, `expected all three causes for ${String(input)}`);
  }
});

test("footerHasNotices: the bare filename in prose (no href attr) does NOT satisfy the link", () => {
  // The link assertion requires an actual href="…THIRD-PARTY-NOTICES.txt"
  // attribute, not the filename merely appearing in text — so a page that only
  // mentions the file in prose is correctly reported as missing the link.
  const prose =
    "See THIRD-PARTY-NOTICES.txt for details. " +
    '<a href="/x/LICENSE">CC-BY-4.0</a>';
  const r = footerHasNotices(prose);
  assert.equal(r.ok, false);
  assert.ok(r.missing.some((m) => /href ending in THIRD-PARTY-NOTICES\.txt/.test(m)));
});
