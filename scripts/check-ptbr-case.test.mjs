// Unit fixture for the check:ptbr-case gate (ticket-033; R70, ADR-011).
//
// Pins detectTitleCase(text) and detectLabelTitleCase(configText): the word
// rule (enumeration tokens, acronyms, hyphen parts, exempt terms, segment
// breaks), the markup that is not displayed words, the regions that are not
// headings, the rule-scoped allowlist behaviour on detector output, and the CLI
// on throwaway trees.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXEMPT_TERMS,
  PTBR_CASE_RULE_IDS,
  detectLabelTitleCase,
  detectTitleCase,
} from "./check-ptbr-case.mjs";
import { loadAllowlist, partitionByAllowlist } from "./doc-lint-allowlist.mjs";

const RULE = "ptbr-title-case";
const flaggedLines = (text) => detectTitleCase(text).map((v) => v.lineno);
const heading = (line) => detectTitleCase(`# Página\n\n${line}\n`);

test("exports the exemption vocabulary and the rule id", () => {
  assert.deepEqual(EXEMPT_TERMS, [
    "Novo Modelo",
    "Nível 1",
    "Bellman",
    "Benders",
    "Cholesky",
    "Hive",
    "Larroyd",
    "Lipschitz",
    "Markov",
    "Monte Carlo",
    "Parquet",
    "Polars",
    "Python",
    "Sobol",
    "VS Code",
    "Yule-Walker",
  ]);
  assert.deepEqual([...PTBR_CASE_RULE_IDS], [RULE]);
});

// (a) / (b)

test("a Title Case ## heading is flagged with its line, rule and text", () => {
  assert.deepEqual(
    detectTitleCase("# Página\n\n## Modelo De Afluências\n"),
    [{ lineno: 3, rule: RULE, text: "Modelo De Afluências" }],
  );
});

test("a sentence-case heading passes, whatever its level", () => {
  for (const level of ["#", "##", "###", "####", "#####", "######"]) {
    assert.deepEqual(heading(`${level} Modelo de afluências do sistema`), []);
  }
});

test("a closing run of # on an ATX heading is not part of its text", () => {
  assert.deepEqual(heading("## Modelo de afluências ##"), []);
  assert.deepEqual(heading("## Modelo De afluências ##")[0].text, "Modelo De afluências");
});

// (c) enumeration tokens

test("enumeration tokens 3.1, 2.3a, §2 and (a) are skipped, not read as the initial word", () => {
  for (const line of [
    "### 3.1 Método de x",
    "### 2.3a Método de x",
    "## §2 Método de x",
    "## §2.1 Método de x",
    "## (a) Método de x",
    "## 4. Método de x",
    "## 2 3.1 Método de x",
  ]) {
    assert.deepEqual(heading(line), [], line);
  }
});

test("a heading that follows an enumeration is still checked", () => {
  assert.equal(heading("### 2.3a Método De x").length, 1);
});

// (d) acronyms and mixed-case identifiers

test("PDDE, CVaR, PAR(p), HiGHS and PreFilling pass as words with two or more capitals", () => {
  for (const line of [
    "## Uso de PDDE com CVaR",
    "## O modelo PAR(p) do sistema",
    "## O solver HiGHS e o PreFilling",
    "## Custos CVaR e PDDE",
  ]) {
    assert.deepEqual(heading(line), [], line);
  }
});

// (e) exempt terms

test("every EXEMPT_TERMS entry passes in a non-initial position", () => {
  for (const term of EXEMPT_TERMS) {
    assert.deepEqual(heading(`## Uso de ${term} no modelo`), [], term);
    assert.deepEqual(heading(`## Modelo de ${term}`), [], term);
  }
});

test("an exempt term passes as the initial word and inside a segment", () => {
  assert.deepEqual(heading("## Bellman e o corte"), []);
  assert.deepEqual(heading("## Corte — Benders e Lipschitz"), []);
});

test("Modelo alone is not exempt: 'O Modelo de afluências' is flagged", () => {
  assert.deepEqual(
    heading("## O Modelo de afluências").map((v) => v.text),
    ["O Modelo de afluências"],
  );
});

test("an exempt term is matched case-sensitively and not inside a longer word", () => {
  assert.equal(heading("## Uso do Pythonic").length, 1);
  assert.equal(heading("## Uso do SuperPython").length, 0);
  assert.equal(heading("## Uso do python").length, 0);
  assert.equal(heading("## Uso do Python3").length, 1);
});

// (f) segment breaks and colon

test("a capital after ' — ' or ' – ' starts a segment and passes; a capital after ':' is flagged", () => {
  assert.deepEqual(heading("## Método — Resolução do problema"), []);
  assert.deepEqual(heading("## Método – Resolução do problema"), []);
  assert.equal(heading("## Método: Resolução do problema").length, 1);
  assert.equal(heading("## Método — Resolução Do problema").length, 1);
});

// (c2) hyphenated Title Case

test("a hyphenated Title Case word is flagged and PAR(p)-A passes", () => {
  assert.equal(heading("## Extensão Pós-Estudo").length, 1);
  assert.equal(heading("## O Código-Fonte do modelo").length, 1);
  assert.equal(heading("## Extensão de Pós-estudo").length, 1);
  assert.deepEqual(heading("## Limites do PAR(p)-A"), []);
  assert.deepEqual(heading("## Equações de Yule-Walker"), []);
});

test("a lowercase hyphenated word and an initial hyphenated word pass", () => {
  assert.deepEqual(heading("## Extensão pós-estudo do modelo"), []);
  assert.deepEqual(heading("## Pós-Estudo do modelo"), []);
});

// (g) accented capitals

test("accented capitals are flagged when non-initial and pass as the initial word", () => {
  assert.equal(heading("## Cálculo das Águas").length, 1);
  assert.equal(heading("## Equação É válida").length, 1);
  assert.equal(heading("## Cálculo de Índices").length, 1);
  assert.deepEqual(heading("## Águas do sistema"), []);
  assert.deepEqual(heading("## É válida a equação"), []);
  assert.deepEqual(heading("## Índices do modelo"), []);
});

test("a word starting with a digit is not flagged", () => {
  assert.deepEqual(heading("## Modelo de 2D e 3D"), []);
});

// (h) markup that is not displayed words

test("inline code, $math$, HTML tags, link targets and {#id} are ignored", () => {
  for (const line of [
    "## Uso de `Model Name` no cálculo",
    "## Custo $C_{Total}$ do sistema",
    "## Ver [a página](/pt-br/Math/Foo-Bar/) agora",
    "## Método de custo {#Metodo-De-Custo}",
    "## Uso de <Badge Text Here /> no cálculo",
    "## Uso de **negrito** e *itálico* no cálculo",
  ]) {
    assert.deepEqual(heading(line), [], line);
  }
});

test("link text is checked", () => {
  assert.deepEqual(
    heading("## Ver [a Página](/pt-br/x/) agora").map((v) => v.text),
    ["Ver [a Página](/pt-br/x/) agora"],
  );
});

// (i) fences

test("a # line inside a fenced code block is ignored and a heading after it keeps its line", () => {
  const text = [
    "# Página", // 1
    "", // 2
    "```bash", // 3
    "# Comentário De Shell", // 4
    "```", // 5
    "", // 6
    "~~~", // 7
    "## Outro Comentário", // 8
    "~~~", // 9
    "", // 10
    "## Seção De Teste", // 11
  ].join("\n");
  assert.deepEqual(flaggedLines(text), [11]);
});

// (j) frontmatter

test("the frontmatter title is checked with its line and quotes stripped; description is not", () => {
  const text = [
    "---", // 1
    'title: "Modelo De Afluências"', // 2
    "description: Um Texto Em Title Case", // 3
    "# Comentário De Yaml", // 4
    "---", // 5
    "", // 6
    "## Seção de teste", // 7
  ].join("\n");
  assert.deepEqual(detectTitleCase(text), [
    { lineno: 2, rule: RULE, text: "Modelo De Afluências" },
  ]);
});

test("an unquoted frontmatter title in sentence case passes", () => {
  assert.deepEqual(
    detectTitleCase("---\ntitle: Modelo de afluências\n---\n\n# Corpo\n"),
    [],
  );
});

test("only the first --- block is frontmatter: a later title: line is not checked", () => {
  const text = [
    "---",
    "title: Modelo de afluências",
    "---",
    "",
    "Texto.",
    "",
    "---",
    "title: Um Título Qualquer",
    "---",
  ].join("\n");
  assert.deepEqual(detectTitleCase(text), []);
});

test("a page without frontmatter has its first heading checked", () => {
  assert.deepEqual(flaggedLines("# Modelo De Afluências\n"), [1]);
});

// (k) astro.config.mjs labels

test("detectLabelTitleCase flags a pt-BR label on its line and passes an en value", () => {
  const config = [
    "sidebar: [", // 1
    "  {", // 2
    '    label: "Model Entities",', // 3
    '    translations: { en: "Model Entities", "pt-BR": "Modelagem Do Sistema" },', // 4
    "  },", // 5
    "  {", // 6
    '    label: "Penalties",', // 7
    '    translations: { "pt-BR": "Penalidades do sistema" },', // 8
    "  },", // 9
    "],", // 10
  ].join("\n");
  assert.deepEqual(detectLabelTitleCase(config), [
    { lineno: 4, rule: RULE, text: "Modelagem Do Sistema" },
  ]);
});

test("detectLabelTitleCase ignores en values on lines without a pt-BR key", () => {
  assert.deepEqual(
    detectLabelTitleCase('translations: { en: "Model Entities" },\n'),
    [],
  );
});

test("detectLabelTitleCase passes the site title (exempt Novo Modelo) and reports each label on a line", () => {
  assert.deepEqual(
    detectLabelTitleCase('title: { "pt-BR": "Documentação do Novo Modelo" },\n'),
    [],
  );
  assert.deepEqual(
    detectLabelTitleCase('{ "pt-BR": "Um Rótulo", "pt-BR": "Outro Rótulo" }\n').map(
      (v) => v.text,
    ),
    ["Um Rótulo", "Outro Rótulo"],
  );
});

// (l) allowlist on detector output

const FIXTURE = [
  "# Página", // 1
  "", // 2
  "## Modelo De Afluências", // 3
].join("\n");

function partitionFixture(allowlistText) {
  const dir = mkdtempSync(join(tmpdir(), "check-ptbr-case-test-"));
  try {
    const path = join(dir, "doc-lint-allow.txt");
    writeFileSync(path, allowlistText, "utf8");
    const violations = detectTitleCase(FIXTURE).map((v) => ({
      rel: "pt-br/x.md",
      ...v,
    }));
    return partitionByAllowlist(violations, loadAllowlist(path), (id) =>
      PTBR_CASE_RULE_IDS.has(id),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("an allowlist entry grandfathers the ptbr-title-case hit at its line", () => {
  const { failing, grandfathered, stale } = partitionFixture(
    "pt-br/x.md:3  ptbr-title-case  # r",
  );
  assert.deepEqual(failing, []);
  assert.deepEqual(
    grandfathered.map((v) => [v.rel, v.lineno, v.rule]),
    [["pt-br/x.md", 3, RULE]],
  );
  assert.deepEqual(stale, []);
});

test("an unmatched ptbr-title-case entry is stale and the unlisted hit still fails", () => {
  const { failing, grandfathered, stale } = partitionFixture(
    "pt-br/x.md:9  ptbr-title-case  # matches no hit",
  );
  assert.deepEqual(
    failing.map((v) => v.lineno),
    [3],
  );
  assert.deepEqual(grandfathered, []);
  assert.deepEqual(stale, [
    { key: "pt-br/x.md:9", ruleId: RULE, fileLine: 1 },
  ]);
});

test("an entry for another gate's rule neither grandfathers a hit nor goes stale here", () => {
  const { failing, grandfathered, stale } = partitionFixture(
    "pt-br/x.md:3  narration-formerly  # another gate",
  );
  assert.equal(failing.length, 1);
  assert.deepEqual(grandfathered, []);
  assert.deepEqual(stale, []);
});

// (m) the CLI: it resolves the corpus, astro.config.mjs and the allowlist
// relative to its own location, so each run uses a copy inside a throwaway tree.

const SCRIPTS_DIR = dirname(fileURLToPath(import.meta.url));
const GATE_FILES = [
  "check-ptbr-case.mjs",
  "doc-text.mjs",
  "doc-zones.mjs",
  "doc-lint-allowlist.mjs",
];
const CLEAN_CONFIG = 'translations: { "pt-BR": "Modelagem do sistema" },\n';

function runGate({ pages = {}, config = CLEAN_CONFIG, allowlist = "" }) {
  const root = mkdtempSync(join(tmpdir(), "check-ptbr-case-"));
  try {
    mkdirSync(join(root, "scripts"));
    for (const name of GATE_FILES) {
      copyFileSync(join(SCRIPTS_DIR, name), join(root, "scripts", name));
    }
    writeFileSync(join(root, "scripts", "doc-lint-allow.txt"), allowlist);
    if (config !== null) writeFileSync(join(root, "astro.config.mjs"), config);
    for (const [rel, text] of Object.entries(pages)) {
      const path = join(root, "src", "content", "docs", rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    }
    return spawnSync(
      process.execPath,
      [join(root, "scripts", "check-ptbr-case.mjs")],
      { encoding: "utf8" },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const CLEAN_PAGE = "# Página\n\n## Modelo de afluências\n";
const TITLE_CASE_PAGE = "# Página\n\n## Modelo De Afluências\n";

test("CLI: a clean tree exits 0 and prints the OK line with the computed page count", () => {
  const result = runGate({
    pages: {
      "pt-br/math/a.md": CLEAN_PAGE,
      "pt-br/math/b.md": CLEAN_PAGE,
      "math/c.md": TITLE_CASE_PAGE,
    },
  });
  assert.equal(result.status, 0);
  assert.equal(
    result.stdout,
    "OK: 2 pt-BR pages and the astro.config.mjs pt-BR labels scanned; no Title Case found.\n",
  );
});

test("CLI: a Title Case page exits 1 with a VIOLATION line and a FAIL line naming the rule and EXEMPT_TERMS", () => {
  const result = runGate({ pages: { "pt-br/math/a.md": TITLE_CASE_PAGE } });
  assert.equal(result.status, 1);
  assert.match(
    result.stdout,
    /^VIOLATION \[ptbr-title-case\]: pt-br\/math\/a\.md:3: "Modelo De Afluências"$/m,
  );
  assert.match(
    result.stdout,
    /^FAIL: 1 Title Case violation\(s\), 0 stale allowlist entry\(ies\), 0 unclosed fence\(s\)\. .*ptbr-title-case.*EXEMPT_TERMS/m,
  );
});

test("CLI: a Title Case pt-BR label is reported under astro.config.mjs:<line>", () => {
  const result = runGate({
    pages: { "pt-br/math/a.md": CLEAN_PAGE },
    config: '// header\ntranslations: { "pt-BR": "Modelagem Do Sistema" },\n',
  });
  assert.equal(result.status, 1);
  assert.match(
    result.stdout,
    /^VIOLATION \[ptbr-title-case\]: astro\.config\.mjs:2: "Modelagem Do Sistema"$/m,
  );
});

test("CLI: English pages are not scanned", () => {
  const result = runGate({
    pages: { "math/a.md": TITLE_CASE_PAGE, "pt-br/math/a.md": CLEAN_PAGE },
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^OK: 1 pt-BR pages /);
});

test("CLI: a fence that never closes is reported as UNCLOSED-FENCE and exits 1", () => {
  const result = runGate({
    pages: { "pt-br/math/a.md": "# Página\n\n```js\nconst x = 1;\n" },
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^UNCLOSED-FENCE pt-br\/math\/a\.md:3$/m);
});

test("CLI: an allowlist entry grandfathers the hit (exit 0) and a stale entry fails (exit 1)", () => {
  const grandfathered = runGate({
    pages: { "pt-br/math/a.md": TITLE_CASE_PAGE },
    allowlist: "pt-br/math/a.md:3  ptbr-title-case  # under review\n",
  });
  assert.equal(grandfathered.status, 0);
  assert.match(
    grandfathered.stdout,
    /^OK: 1 pt-BR pages .*\(1 pre-existing hit\(s\) grandfathered via scripts\/doc-lint-allow\.txt\)\.$/m,
  );

  const stale = runGate({
    pages: { "pt-br/math/a.md": CLEAN_PAGE },
    allowlist: "pt-br/math/a.md:3  ptbr-title-case  # no longer a hit\n",
  });
  assert.equal(stale.status, 1);
  assert.match(
    stale.stdout,
    /^STALE \[ptbr-title-case\]: pt-br\/math\/a\.md:3 — doc-lint-allow\.txt:1 matches no Title Case hit$/m,
  );
});

test("CLI: a malformed allowlist line exits 2 with the loader's message", () => {
  const result = runGate({
    pages: { "pt-br/math/a.md": CLEAN_PAGE },
    allowlist: "not an entry\n",
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /^check:ptbr-case: doc-lint-allow\.txt:1: malformed entry/);
});

test("CLI: a missing src/content/docs is a setup error (exit 2)", () => {
  const result = runGate({});
  assert.equal(result.status, 2);
  assert.match(result.stderr, /^check:ptbr-case: src\/content\/docs\/ not found/);
});

test("CLI: a missing astro.config.mjs is a setup error (exit 2)", () => {
  const result = runGate({
    pages: { "pt-br/math/a.md": CLEAN_PAGE },
    config: null,
  });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /^check:ptbr-case: cannot read astro\.config\.mjs/);
});
