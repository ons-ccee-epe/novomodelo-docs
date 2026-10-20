// Unit fixture for the check:input-schemas detector (E13 ticket-202a, GRD-03).
//
// Pins schemaPaths() on inline schemas ($ref with a recursion guard, oneOf
// unions, anyOf with a null branch, nested items, additionalProperties, the
// exempt root $schema, arrays of non-objects, parent-relative requiredness,
// value sets), pageRows() on inline pages (heading scope, fences, non-input
// tables), checkFile() with a seeded violation for every report line, and the
// CLI on temp directories. Every page and schema is inline; the CLI cases
// build their page from the vendored `stages` schema, so they follow a schema
// refresh, and none reads src/content/docs.

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BINDINGS,
  schemaPaths,
  pageRows,
  checkFile,
  readSchema,
} from "./check-input-schemas.mjs";

const SCRIPT = fileURLToPath(
  new URL("./check-input-schemas.mjs", import.meta.url),
);
const SCHEMAS = fileURLToPath(new URL("../public/schemas/", import.meta.url));

const rec = (path, required = false, ...values) => ({ path, required, values });

// ---------------------------------------------------------------------------
// schemaPaths
// ---------------------------------------------------------------------------

test("schemaPaths follows $ref into $defs and never expands an unreached def", () => {
  const schema = {
    type: "object",
    properties: {
      buses: { type: "array", items: { $ref: "#/$defs/Bus" } },
    },
    required: ["buses"],
    $defs: {
      Bus: {
        type: "object",
        properties: { id: { type: "integer" }, name: { type: "string" } },
        required: ["id"],
      },
      Unused: { type: "object", properties: { ghost: { type: "string" } } },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("buses", true),
    rec("buses[].id", true),
    rec("buses[].name"),
  ]);
});

test("schemaPaths does not re-enter a $def already on the current path", () => {
  const schema = {
    type: "object",
    properties: { tree: { $ref: "#/$defs/Node" } },
    $defs: {
      Node: {
        type: "object",
        properties: {
          label: { type: "string" },
          children: { type: "array", items: { $ref: "#/$defs/Node" } },
        },
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("tree"),
    rec("tree.label"),
    rec("tree.children"),
  ]);
});

test("schemaPaths expands a def reached from two sibling properties, the guard covering the current path only", () => {
  const schema = {
    type: "object",
    properties: { a: { $ref: "#/$defs/D" }, b: { $ref: "#/$defs/D" } },
    $defs: { D: { type: "object", properties: { x: { type: "integer" } } } },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("a"),
    rec("a.x"),
    rec("b"),
    rec("b.x"),
  ]);
});

test("schemaPaths throws on an enum keyword instead of dropping the value set", () => {
  const schema = {
    type: "object",
    properties: { mode: { type: "string", enum: ["fast", "slow"] } },
  };
  assert.throws(
    () => schemaPaths(schema),
    /unsupported 'enum' keyword at 'mode'/,
  );
});

const TAILRACE = {
  type: "object",
  properties: {
    tailrace: { anyOf: [{ $ref: "#/$defs/Tailrace" }, { type: "null" }] },
  },
  $defs: {
    Tailrace: {
      oneOf: [
        {
          type: "object",
          properties: {
            type: { type: "string", const: "polynomial" },
            coefficients: { type: "array", items: { type: "number" } },
          },
          required: ["type", "coefficients"],
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "piecewise" },
            points: { type: "array", items: { $ref: "#/$defs/Point" } },
          },
          required: ["type", "points"],
        },
      ],
    },
    Point: {
      type: "object",
      properties: {
        height_m: { type: "number" },
        outflow_m3s: { type: "number" },
      },
      required: ["height_m", "outflow_m3s"],
    },
  },
};

test("schemaPaths merges oneOf branches: a tag is required with the union of its consts, a branch-only property is optional", () => {
  assert.deepEqual(schemaPaths(TAILRACE), [
    rec("tailrace"),
    rec("tailrace.type", true, '"piecewise"', '"polynomial"'),
    rec("tailrace.coefficients"),
    rec("tailrace.points"),
    rec("tailrace.points[].height_m", true),
    rec("tailrace.points[].outflow_m3s", true),
  ]);
});

test("schemaPaths treats the null branch of an anyOf as the nullable marker, not a branch", () => {
  const schema = {
    type: "object",
    properties: {
      a: { anyOf: [{ $ref: "#/$defs/A" }, { type: "null" }] },
      n: { type: ["integer", "null"] },
    },
    $defs: {
      A: {
        type: "object",
        properties: { x: { type: "integer" } },
        required: ["x"],
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [rec("a"), rec("a.x", true), rec("n")]);
});

test("schemaPaths reads an anyOf of a free string and an object as a path with no value set", () => {
  const schema = {
    type: "object",
    properties: {
      risk: {
        anyOf: [
          { type: "string" },
          {
            type: "object",
            properties: {
              cvar: {
                type: "object",
                properties: { alpha: { type: "number" } },
                required: ["alpha"],
              },
            },
            required: ["cvar"],
          },
        ],
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("risk"),
    rec("risk.cvar"),
    rec("risk.cvar.alpha", true),
  ]);
});

test("schemaPaths appends [] per nested array of objects, the array itself being the container path", () => {
  const schema = {
    type: "object",
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          properties: {
            cells: {
              type: "array",
              items: {
                type: "object",
                properties: { v: { type: "number" } },
                required: ["v"],
              },
            },
          },
        },
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("rows"),
    rec("rows[].cells"),
    rec("rows[].cells[].v", true),
  ]);
});

test("schemaPaths turns an object-valued additionalProperties into <name> and ignores a boolean one", () => {
  const schema = {
    type: "object",
    properties: {
      profiles: {
        type: "object",
        additionalProperties: { $ref: "#/$defs/Profile" },
      },
      closed: { type: "object", additionalProperties: false },
    },
    required: ["profiles"],
    $defs: {
      Profile: {
        type: "object",
        properties: {
          groups: { type: "array", items: { $ref: "#/$defs/Group" } },
        },
        required: ["groups"],
      },
      Group: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("profiles", true),
    rec("profiles.<name>.groups", true),
    rec("profiles.<name>.groups[].name", true),
    rec("closed"),
  ]);
});

test("schemaPaths never emits the root $schema key but keeps a nested one", () => {
  const schema = {
    type: "object",
    properties: {
      $schema: { type: ["string", "null"] },
      a: { type: "object", properties: { $schema: { type: "string" } } },
    },
  };
  assert.deepEqual(schemaPaths(schema), [rec("a"), rec("a.$schema")]);
});

test("schemaPaths makes an array of non-objects one leaf without []", () => {
  const schema = {
    type: "object",
    properties: {
      xs: { type: "array", items: { type: "number" } },
      maybe: { type: ["array", "null"], items: { type: "integer" } },
      matrix: {
        type: "array",
        items: { type: "array", items: { type: "number" } },
      },
      pairs: {
        type: "array",
        items: {
          type: "array",
          prefixItems: [{ type: "integer" }, { type: "number" }],
          minItems: 2,
          maxItems: 2,
        },
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("xs"),
    rec("maybe"),
    rec("matrix"),
    rec("pairs"),
  ]);
});

test("schemaPaths reads requiredness against the enclosing object: a required field of an optional parent is required", () => {
  const schema = {
    type: "object",
    properties: {
      parent: {
        type: "object",
        properties: { must: { type: "integer" }, may: { type: "integer" } },
        required: ["must"],
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("parent"),
    rec("parent.must", true),
    rec("parent.may"),
  ]);
});

test("schemaPaths adds the names every oneOf branch requires to the object's own required list", () => {
  const schema = {
    type: "object",
    properties: { models: { type: "array", items: { $ref: "#/$defs/M" } } },
    $defs: {
      M: {
        type: "object",
        properties: { hydro_id: { type: "integer" } },
        required: ["hydro_id"],
        oneOf: [
          {
            properties: {
              mode: { const: "ranges" },
              ranges: { type: "array", items: { type: "integer" } },
            },
            required: ["mode", "ranges"],
          },
          {
            properties: {
              mode: { const: "seasonal" },
              default_model: { type: "string" },
            },
            required: ["mode", "default_model"],
          },
        ],
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("models"),
    rec("models[].hydro_id", true),
    rec("models[].mode", true, '"ranges"', '"seasonal"'),
    rec("models[].ranges"),
    rec("models[].default_model"),
  ]);
});

test("schemaPaths contributes every allOf branch and unions their required lists", () => {
  const schema = {
    type: "object",
    properties: {
      a: {
        allOf: [
          { properties: { x: { type: "integer" } }, required: ["x"] },
          { properties: { y: { type: "integer" } } },
        ],
      },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("a"),
    rec("a.x", true),
    rec("a.y"),
  ]);
});

test("schemaPaths reads a pure enum def as a sorted value set of JSON literals", () => {
  const schema = {
    type: "object",
    properties: {
      mode: { $ref: "#/$defs/Mode" },
      level: { $ref: "#/$defs/Level" },
    },
    required: ["mode"],
    $defs: {
      Mode: {
        oneOf: [
          { type: "string", const: "parallel" },
          { type: "string", const: "chronological" },
        ],
      },
      Level: { oneOf: [{ type: "integer", const: 3 }] },
    },
  };
  assert.deepEqual(schemaPaths(schema), [
    rec("mode", true, '"chronological"', '"parallel"'),
    rec("level", false, "3"),
  ]);
});

test("schemaPaths lists a parent before its children, in schema order", () => {
  const paths = schemaPaths(TAILRACE).map((record) => record.path);
  assert.deepEqual(paths.slice(0, 3), [
    "tailrace",
    "tailrace.type",
    "tailrace.coefficients",
  ]);
});

test("schemaPaths throws naming a $ref outside #/$defs/ or to a missing def", () => {
  const outside = { properties: { a: { $ref: "https://example.com/x.json" } } };
  assert.throws(
    () => schemaPaths(outside),
    /cannot resolve \$ref 'https:\/\/example\.com\/x\.json'/,
  );
  const legacy = { properties: { a: { $ref: "#/definitions/X" } } };
  assert.throws(() => schemaPaths(legacy), /'#\/definitions\/X'/);
  const missing = { properties: { a: { $ref: "#/$defs/Missing" } } };
  assert.throws(() => schemaPaths(missing), /'#\/\$defs\/Missing'/);
});

test("readSchema throws naming the file for an unreadable path and for bad JSON", () => {
  assert.throws(
    () => readSchema(join(SCHEMAS, "no-such.schema.json")),
    /could not read schema .*no-such\.schema\.json/,
  );
  withRoot({ "bad.schema.json": "{ not json" }, (root) => {
    assert.throws(
      () => readSchema(join(root, "bad.schema.json")),
      /could not read schema .*bad\.schema\.json/,
    );
  });
});

test("BINDINGS binds the 17 case-format JSON files to the vendored schema of the same stem, leaves config.json out", () => {
  const files = Object.keys(BINDINGS);
  assert.equal(files.length, 17);
  assert.ok(!("config.json" in BINDINGS));
  // D-215-1: every vendored schema but config is bound, so a schema a refresh adds cannot go unchecked.
  const vendored = readdirSync(SCHEMAS)
    .filter((name) => name.endsWith(".schema.json"))
    .map((name) => name.slice(0, -".schema.json".length))
    .filter((stem) => stem !== "config")
    .sort();
  assert.deepEqual(Object.values(BINDINGS).sort(), vendored);
  for (const [file, name] of Object.entries(BINDINGS)) {
    const stem = file
      .split("/")
      .at(-1)
      .replace(/\.json$/, "");
    const expected =
      file === "system/hydro_production_models.json"
        ? "production_models"
        : stem;
    assert.equal(name, expected, file);
    const paths = schemaPaths(readSchema(join(SCHEMAS, `${name}.schema.json`)));
    assert.ok(paths.length > 0, name);
    assert.ok(!paths.some((record) => record.path === "$schema"), name);
  }
});

test("the vendored hydros schema: tags are required with their union, a variant-only field is optional, scalar arrays are leaves", () => {
  const paths = new Map(
    schemaPaths(readSchema(join(SCHEMAS, "hydros.schema.json"))).map((r) => [
      r.path,
      r,
    ]),
  );
  const tag = paths.get("hydros[].tailrace.type");
  assert.deepEqual(
    [tag.required, tag.values],
    [true, ['"piecewise"', '"polynomial"']],
  );
  assert.equal(paths.get("hydros[].tailrace.coefficients").required, false);
  assert.deepEqual(paths.get("hydros[].generation.model").values, [
    '"constant_productivity"',
    '"fpha"',
  ]);
  assert.ok(paths.has("hydros[].evaporation.coefficients_mm"));
  assert.ok(![...paths.keys()].some((path) => path.endsWith("[]")));
});

// ---------------------------------------------------------------------------
// pageRows
// ---------------------------------------------------------------------------

const HEADER =
  "| Name | Type | Required | Default | Units | Description |\n| --- | --- | --- | --- | --- | --- |";
const row = (name, required = "Yes", description = "Text.") =>
  `| \`${name}\` | string | ${required} | — | — | ${description} |`;
const table = (...rows) => [HEADER, ...rows].join("\n");
const names = (sections) => sections.map((rows) => rows.map((r) => r.name));

test("pageRows reads the Name, Required and Description cells of the table under the file heading", () => {
  const text = `# Page\n\n## \`stages.json\`\n\n${table(row("a"), row("b", "No", 'One of \`"x"\`.'))}\n`;
  assert.deepEqual(pageRows(text, "stages.json"), [
    [
      { name: "a", required: "Yes", description: "Text." },
      { name: "b", required: "No", description: 'One of `"x"`.' },
    ],
  ]);
});

test("pageRows keeps an escaped pipe inside its cell and reads a prettier-padded table", () => {
  const text = [
    "## `stages.json`",
    "",
    "| Name                | Type            | Required | Default | Units | Description          |",
    "| ------------------- | --------------- | -------- | ------- | ----- | -------------------- |",
    "| `a[].season_id`     | integer \\| null | No       | `null`  | —     | A season \\| or none. |",
    "| `a[].id`            | integer         | Yes      | —       | —     | Identifier.          |",
  ].join("\n");
  assert.deepEqual(pageRows(text, "stages.json"), [
    [
      {
        name: "a[].season_id",
        required: "No",
        description: "A season \\| or none.",
      },
      { name: "a[].id", required: "Yes", description: "Identifier." },
    ],
  ]);
});

test("pageRows skips fenced code, a heading inside a fence included", () => {
  const text = [
    "## `stages.json`",
    "",
    "```text",
    table(row("fenced")),
    "```",
    "",
    table(row("real")),
    "",
    "```md",
    "## `other.json`",
    "```",
    "",
    table(row("after-fence")),
  ].join("\n");
  assert.deepEqual(names(pageRows(text, "stages.json")), [
    ["real", "after-fence"],
  ]);
});

test("pageRows closes a fence only with the same character, at least as long, and no info string", () => {
  const text = [
    "## `stages.json`",
    "",
    "~~~",
    "```",
    table(row("tilde")),
    "~~~",
    "",
    "````md",
    "```",
    table(row("inner")),
    "```",
    table(row("still-inner")),
    "````",
    "",
    "```text",
    "```md",
    table(row("info-inside")),
    "```",
    "",
    table(row("real")),
  ].join("\n");
  assert.deepEqual(names(pageRows(text, "stages.json")), [["real"]]);
});

test("pageRows reads a table under a sub-heading and stops at the next heading of the same or a higher level", () => {
  const text = [
    "## `stages.json`",
    table(row("top")),
    "### Sub-objects",
    table(row("sub")),
    "#### Deeper",
    table(row("deeper")),
    "## `initial_conditions.json`",
    table(row("next-file")),
  ].join("\n\n");
  assert.deepEqual(names(pageRows(text, "stages.json")), [
    ["top", "sub", "deeper"],
  ]);
  assert.deepEqual(names(pageRows(text, "initial_conditions.json")), [
    ["next-file"],
  ]);
  const higher = `# Group\n\n### \`stages.json\`\n\n${table(row("a"))}\n\n## Next\n\n${table(row("b"))}\n`;
  assert.deepEqual(names(pageRows(higher, "stages.json")), [["a"]]);
});

test("pageRows ignores tables that are not input tables", () => {
  const text = [
    "## `stages.json`",
    "",
    "| Field | Required | Description |\n| --- | --- | --- |\n| `a` | Yes | Text. |",
    "",
    '| Value | Description |\n| --- | --- |\n| `"x"` | Text. |',
    "",
    "| File | Format | Required | Description |\n| --- | --- | --- | --- |\n| `stages.json` | JSON | Yes | Text. |",
    "",
    "| Type | Name | Required | Default | Units | Description |\n| --- | --- | --- | --- | --- | --- |\n| string | `b` | Yes | — | — | Text. |",
    "",
    "| Name | Type | Nullable | Units | Description |\n| --- | --- | --- | --- | --- |\n| `c` | Int32 | No | — | Text. |",
    "",
    table(row("d")),
  ].join("\n");
  assert.deepEqual(names(pageRows(text, "stages.json")), [["d"]]);
});

test("pageRows binds only a heading whose whole text is the backticked path", () => {
  const text = `## \`stages.json\` reference\n\n${table(row("a"))}\n\n## The \`stages.json\` file\n\n${table(row("b"))}\n`;
  assert.deepEqual(pageRows(text, "stages.json"), []);
  assert.deepEqual(pageRows("No headings.\n", "stages.json"), []);
});

test("pageRows returns one section per heading and joins the tables of a section", () => {
  const text = `## \`stages.json\`\n\n${table(row("a"))}\n\nText.\n\n${table(row("b"))}\n\n## Other\n\n## \`stages.json\`\n\n${table(row("c"))}\n`;
  assert.deepEqual(names(pageRows(text, "stages.json")), [["a", "b"], ["c"]]);
});

test("pageRows reads a short row with empty cells instead of failing", () => {
  const text = `## \`stages.json\`\n\n${HEADER}\n| \`a\` | string |\n`;
  assert.deepEqual(pageRows(text, "stages.json"), [
    [{ name: "a", required: "", description: "" }],
  ]);
});

// ---------------------------------------------------------------------------
// checkFile
// ---------------------------------------------------------------------------

const SCHEMA = {
  type: "object",
  properties: {
    $schema: { type: ["string", "null"] },
    items: { type: "array", items: { $ref: "#/$defs/Item" } },
    mode: { $ref: "#/$defs/Mode" },
    note: { type: ["string", "null"] },
    shape: {
      oneOf: [
        {
          type: "object",
          properties: {
            type: { type: "string", const: "circle" },
            r: { type: "number" },
          },
          required: ["type", "r"],
        },
        {
          type: "object",
          properties: {
            type: { type: "string", const: "square" },
            side: { type: "number" },
          },
          required: ["type", "side"],
        },
      ],
    },
  },
  required: ["items", "mode"],
  $defs: {
    Item: {
      type: "object",
      properties: { id: { type: "integer" }, label: { type: "string" } },
      required: ["id"],
    },
    Mode: {
      oneOf: [
        { type: "string", const: "fast" },
        { type: "string", const: "slow" },
      ],
    },
  },
};

const ONE_OF_MODE = 'One of `"fast"`, `"slow"`. Speed.';
const ONE_OF_SHAPE = 'One of `"circle"`, `"square"`. Form.';
const goodRows = () => ({
  "items[].id": row("items[].id", "Yes"),
  "items[].label": row("items[].label", "No"),
  mode: row("mode", "Yes", ONE_OF_MODE),
  note: row("note", "No"),
  "shape.type": row("shape.type", "Yes", ONE_OF_SHAPE),
  "shape.r": row("shape.r", "Conditional"),
  "shape.side": row("shape.side", "Conditional"),
});
const pageOf = (rows, file = "f.json") =>
  `## \`${file}\`\n\n${table(...Object.values(rows))}\n`;
const check = (rows) => checkFile(SCHEMA, pageOf(rows), "f.json");
const without = (rows, key) => {
  const { [key]: _dropped, ...rest } = rows;
  return rest;
};

test("checkFile passes a page whose leaf rows cover the schema, containers covered by their descendants", () => {
  assert.deepEqual(check(goodRows()), { rows: 7, problems: [] });
});

test("checkFile accepts a row of its own for a container", () => {
  const rows = {
    ...goodRows(),
    items: row("items", "Yes"),
    shape: row("shape", "No"),
  };
  assert.deepEqual(check(rows).problems, []);
});

test("checkFile does not let a container's own row cover its leaves", () => {
  const rows = { ...goodRows(), items: row("items", "Yes") };
  delete rows["items[].id"];
  delete rows["items[].label"];
  assert.deepEqual(check(rows).problems, [
    ["MISSING", "items[].id"],
    ["MISSING", "items[].label"],
  ]);
});

test("checkFile holds a container's own row to the Required rule", () => {
  const rows = { ...goodRows(), items: row("items", "No") };
  assert.deepEqual(check(rows).problems, [
    ["REQUIRED", "items", "page=No", "schema=required"],
  ]);
});

test("checkFile reports a leaf without its row as MISSING", () => {
  assert.deepEqual(check(without(goodRows(), "note")).problems, [
    ["MISSING", "note"],
  ]);
});

test("checkFile reports a container with no row of its own and no descendant row, with its leaves", () => {
  const rows = goodRows();
  delete rows["items[].id"];
  delete rows["items[].label"];
  assert.deepEqual(check(rows).problems, [
    ["MISSING", "items"],
    ["MISSING", "items[].id"],
    ["MISSING", "items[].label"],
  ]);
});

test("checkFile reports every path as MISSING when the page has no section", () => {
  const result = checkFile(SCHEMA, "# Nothing\n", "f.json");
  assert.equal(result.rows, 0);
  assert.deepEqual(
    result.problems.map(([code]) => code),
    Array(schemaPaths(SCHEMA).length).fill("MISSING"),
  );
});

test("checkFile reports a row absent from the schema as PHANTOM, the root $schema included", () => {
  const rows = {
    ...goodRows(),
    "items[].bogus": row("items[].bogus"),
    $schema: row("$schema", "No"),
  };
  assert.deepEqual(check(rows).problems, [
    ["PHANTOM", "items[].bogus"],
    ["PHANTOM", "$schema"],
  ]);
});

test("checkFile does not let a row below a leaf cover that leaf", () => {
  const rows = { ...without(goodRows(), "note"), "note.sub": row("note.sub") };
  assert.deepEqual(check(rows).problems, [
    ["MISSING", "note"],
    ["PHANTOM", "note.sub"],
  ]);
});

test("checkFile reports Required Yes against an optional path and No against a required one", () => {
  const rows = {
    ...goodRows(),
    "items[].label": row("items[].label", "Yes"),
    "items[].id": row("items[].id", "No"),
  };
  assert.deepEqual(check(rows).problems, [
    ["REQUIRED", "items[].id", "page=No", "schema=required"],
    ["REQUIRED", "items[].label", "page=Yes", "schema=optional"],
  ]);
});

test("checkFile treats Conditional as not required: fine on an optional path, REQUIRED on a required one", () => {
  const rows = {
    ...goodRows(),
    "items[].id": row("items[].id", "Conditional"),
  };
  assert.deepEqual(check(rows).problems, [
    ["REQUIRED", "items[].id", "page=Conditional", "schema=required"],
  ]);
  assert.deepEqual(check(goodRows()).problems, []);
});

test("checkFile reports a Required cell that is none of Yes, No and Conditional", () => {
  const rows = { ...goodRows(), note: row("note", "Custom only") };
  assert.deepEqual(check(rows).problems, [
    ["REQUIRED", "note", "page=Custom only", "schema=optional"],
  ]);
});

test("checkFile reads Required parent-relative: Yes for a required field under an optional parent", () => {
  const schema = {
    type: "object",
    properties: {
      parent: {
        type: "object",
        properties: { must: { type: "integer" } },
        required: ["must"],
      },
    },
  };
  const page = `## \`f.json\`\n\n${table(row("parent", "No"), row("parent.must", "Yes"))}\n`;
  assert.deepEqual(checkFile(schema, page, "f.json").problems, []);
});

test("checkFile reports ENUM for a missing value, an extra value and a Description without the One of opening", () => {
  const missing = {
    ...goodRows(),
    mode: row("mode", "Yes", 'One of `"fast"`.'),
  };
  assert.deepEqual(check(missing).problems, [
    ["ENUM", "mode", 'page="fast"', 'schema="fast","slow"'],
  ]);
  const extra = {
    ...goodRows(),
    mode: row("mode", "Yes", 'One of `"fast"`, `"slow"`, `"turbo"`. Speed.'),
  };
  assert.deepEqual(check(extra).problems, [
    ["ENUM", "mode", 'page="fast","slow","turbo"', 'schema="fast","slow"'],
  ]);
  const unopened = {
    ...goodRows(),
    mode: row("mode", "Yes", 'Either `"fast"` or `"slow"`.'),
  };
  assert.deepEqual(check(unopened).problems, [
    ["ENUM", "mode", "page=-", 'schema="fast","slow"'],
  ]);
});

test("checkFile accepts the value set in any order or repeated, with prose after the first sentence", () => {
  const rows = {
    ...goodRows(),
    mode: row(
      "mode",
      "Yes",
      'One of `"slow"`, `"fast"`, `"slow"`. The default is `"turbo"`. More.',
    ),
    "shape.type": row("shape.type", "Yes", 'One of `"square"`, `"circle"`'),
  };
  assert.deepEqual(check(rows).problems, []);
});

test("checkFile holds a tagged-union tag to the union of its branches' consts", () => {
  const rows = {
    ...goodRows(),
    "shape.type": row("shape.type", "Yes", 'One of `"circle"`. Form.'),
  };
  assert.deepEqual(check(rows).problems, [
    ["ENUM", "shape.type", 'page="circle"', 'schema="circle","square"'],
  ]);
});

test("checkFile reports value literals written without their JSON quotes", () => {
  const rows = {
    ...goodRows(),
    mode: row("mode", "Yes", "One of `fast`, `slow`."),
  };
  assert.deepEqual(check(rows).problems, [
    ["ENUM", "mode", "page=fast,slow", 'schema="fast","slow"'],
  ]);
});

test("checkFile ends the first sentence at a period followed by a space, not at a period inside a literal", () => {
  const schema = {
    type: "object",
    properties: {
      ver: { oneOf: [{ const: "v1.0" }, { const: "v2" }] },
    },
  };
  const page = `## \`f.json\`\n\n${table(row("ver", "No", 'One of `"v1.0"`, `"v2"`. Text.'))}\n`;
  assert.deepEqual(checkFile(schema, page, "f.json").problems, []);
});

test("checkFile reports a value-set path without a row as MISSING only", () => {
  assert.deepEqual(check(without(goodRows(), "mode")).problems, [
    ["MISSING", "mode"],
  ]);
});

test("checkFile orders problems MISSING, PHANTOM, REQUIRED, ENUM and counts the rows read", () => {
  const rows = {
    ...without(goodRows(), "note"),
    bogus: row("bogus"),
    "items[].id": row("items[].id", "No"),
    mode: row("mode", "Yes", "Speed."),
  };
  const result = check(rows);
  assert.equal(result.rows, 7);
  assert.deepEqual(
    result.problems.map(([code]) => code),
    ["MISSING", "PHANTOM", "REQUIRED", "ENUM"],
  );
});

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function withRoot(files, run) {
  const root = mkdtempSync(join(tmpdir(), "input-schemas-"));
  const dirs = new Set();
  try {
    for (const [rel, content] of Object.entries(files)) {
      const path = join(root, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
      for (let dir = dirname(rel); dir !== "."; dir = dirname(dir)) {
        dirs.add(dir);
      }
    }
    return run(root);
  } finally {
    for (const rel of Object.keys(files)) unlinkSync(join(root, rel));
    for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
      rmdirSync(join(root, dir));
    }
    rmdirSync(root);
  }
}

const cli = (args) =>
  spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });

const STAGES = schemaPaths(readSchema(join(SCHEMAS, "stages.schema.json")));
const isLeaf = (record) =>
  !STAGES.some(
    (other) =>
      other.path.startsWith(`${record.path}.`) ||
      other.path.startsWith(`${record.path}[]`),
  );
const LEAVES = STAGES.filter(isLeaf);
const ENUM_PATH = STAGES.find((record) => record.values.length > 0);
const stagesRow = (record, overrides = {}) =>
  row(
    overrides.name ?? record.path,
    overrides.required ?? (record.required ? "Yes" : "No"),
    overrides.description ??
      (record.values.length > 0
        ? `One of ${record.values.map((v) => `\`${v}\``).join(", ")}. Text.`
        : "Text."),
  );
const stagesPage = (rows) => `## \`stages.json\`\n\n${table(...rows)}\n`;
const summary = (counts) =>
  `SUMMARY files=1 rows=${counts.rows} missing=${counts.missing ?? 0} phantom=${counts.phantom ?? 0} required=${counts.required ?? 0} enum=${counts.enum ?? 0} nosection=${counts.nosection ?? 0} dupsection=${counts.dupsection ?? 0}`;

test("CLI --list prints path, required|optional and the value set or - for every path, and exits 0", () => {
  const result = cli(["--list", "stages"]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  const expected = STAGES.map(
    ({ path, required, values }) =>
      `${path}\t${required ? "required" : "optional"}\t${values.join(",") || "-"}`,
  );
  assert.deepEqual(result.stdout.trimEnd().split("\n"), expected);
  assert.ok(
    expected.some((line) =>
      /\t(required|optional)\t"[^"]+"(,"[^"]+")*$/.test(line),
    ),
  );
  assert.ok(!expected.some((line) => line.startsWith("$schema")));
});

test("CLI prints only the SUMMARY line and exits 0 for a page that matches the schema", () => {
  withRoot(
    { "a.mdx": stagesPage(STAGES.map((record) => stagesRow(record))) },
    (root) => {
      const result = cli(["--dir", root, "--file", "stages.json"]);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stdout, `${summary({ rows: STAGES.length })}\n`);
    },
  );
});

test("CLI prints one line per seeded MISSING, PHANTOM, REQUIRED and ENUM, then the SUMMARY, and exits 1", () => {
  const [dropped, flipped] = LEAVES.filter(
    (record) => record !== ENUM_PATH && record.values.length === 0,
  );
  const rows = STAGES.filter((record) => record !== dropped).map((record) =>
    record === flipped
      ? stagesRow(record, { required: record.required ? "No" : "Yes" })
      : record === ENUM_PATH
        ? stagesRow(record, { description: "No set listed." })
        : stagesRow(record),
  );
  rows.push(row("bogus.path"));
  withRoot({ "a.mdx": stagesPage(rows) }, (root) => {
    const result = cli(["--dir", root, "--file", "stages.json"]);
    assert.equal(result.status, 1);
    assert.equal(
      result.stdout,
      [
        `MISSING\tstages.json\t${dropped.path}`,
        "PHANTOM\tstages.json\tbogus.path",
        `REQUIRED\tstages.json\t${flipped.path}\tpage=${flipped.required ? "No" : "Yes"}\tschema=${flipped.required ? "required" : "optional"}`,
        `ENUM\tstages.json\t${ENUM_PATH.path}\tpage=-\tschema=${ENUM_PATH.values.join(",")}`,
        summary({
          rows: STAGES.length,
          missing: 1,
          phantom: 1,
          required: 1,
          enum: 1,
        }),
      ].join("\n") + "\n",
    );
  });
});

test("CLI reports NOSECTION when no page holds the file heading, and exits 1", () => {
  withRoot({ "a.mdx": "## `other.json`\n\nText.\n" }, (root) => {
    const result = cli(["--dir", root, "--file", "stages.json"]);
    assert.equal(result.status, 1);
    assert.equal(
      result.stdout,
      `NOSECTION\tstages.json\n${summary({ rows: 0, nosection: 1 })}\n`,
    );
  });
});

test("CLI reports DUPSECTION naming the pages when two pages or one page hold the heading twice, and exits 1", () => {
  const page = stagesPage(STAGES.map((record) => stagesRow(record)));
  withRoot({ "a.mdx": page, "b.md": page }, (root) => {
    const result = cli(["--dir", root, "--file", "stages.json"]);
    assert.equal(result.status, 1);
    assert.equal(
      result.stdout,
      `DUPSECTION\tstages.json\ta.mdx,b.md\n${summary({ rows: 0, dupsection: 1 })}\n`,
    );
  });
  withRoot({ "a.mdx": `${page}\n${page}` }, (root) => {
    const result = cli(["--dir", root, "--file", "stages.json"]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^DUPSECTION\tstages\.json\ta\.mdx\n/);
  });
});

test("CLI without --file checks all 17 bindings; --file checks one; only .md and .mdx files directly in --dir are read", () => {
  const page = stagesPage(STAGES.map((record) => stagesRow(record)));
  withRoot(
    { "a.mdx": page, "notes.txt": page, "sub/b.mdx": page, "c.md": "Text.\n" },
    (root) => {
      const all = cli(["--dir", root]);
      assert.equal(all.status, 1);
      const lines = all.stdout.trimEnd().split("\n");
      assert.equal(lines.filter((l) => l.startsWith("NOSECTION\t")).length, 16);
      assert.ok(!lines.some((l) => l.startsWith("DUPSECTION")));
      assert.equal(
        lines.at(-1),
        `SUMMARY files=17 rows=${STAGES.length} missing=0 phantom=0 required=0 enum=0 nosection=16 dupsection=0`,
      );
      const one = cli(["--dir", root, "--file", "stages.json"]);
      assert.equal(one.status, 0);
      assert.equal(one.stdout, `${summary({ rows: STAGES.length })}\n`);
    },
  );
});

test("CLI exits 2 with a check:input-schemas message and no report on an unknown flag, a missing value, an unbound --file, an unreadable --dir and an unknown schema", () => {
  withRoot({ "a.mdx": "Text.\n" }, (root) => {
    const cases = [
      [["--bogus"], /Unknown option '--bogus'/],
      [["--dir"], /argument missing/],
      [
        ["--dir", root, "--file", "config.json"],
        /'config\.json' is not a bound case file/,
      ],
      [
        ["--dir", root, "--file", "constructor"],
        /'constructor' is not a bound case file/,
      ],
      [["--dir", join(root, "missing")], /ENOENT/],
      [
        ["--list", "no-such-schema"],
        /could not read schema .*no-such-schema\.schema\.json/,
      ],
    ];
    for (const [args, message] of cases) {
      const result = cli(args);
      assert.equal(result.status, 2, args.join(" "));
      assert.equal(result.stdout, "", args.join(" "));
      assert.match(result.stderr, /^check:input-schemas: /, args.join(" "));
      assert.match(result.stderr, message, args.join(" "));
    }
  });
});

// ---------------------------------------------------------------------------
// Guardian additions (survivor-killing tests)
// ---------------------------------------------------------------------------

test("schemaPaths does not re-enter a $def on the current path through a second def or a $ref chain", () => {
  const mutual = {
    type: "object",
    properties: { a: { $ref: "#/$defs/A" } },
    $defs: {
      A: { type: "object", properties: { b: { $ref: "#/$defs/B" } } },
      B: { type: "object", properties: { a: { $ref: "#/$defs/A" } } },
    },
  };
  assert.deepEqual(schemaPaths(mutual), [rec("a"), rec("a.b"), rec("a.b.a")]);
  const chain = {
    type: "object",
    properties: { a: { $ref: "#/$defs/A" } },
    $defs: { A: { $ref: "#/$defs/B" }, B: { $ref: "#/$defs/A" } },
  };
  assert.deepEqual(schemaPaths(chain), [rec("a")]);
});

test("pageRows reads only the exact six-column header: a misspelled, re-cased, shortened or extended header is not an input table", () => {
  const separator = "| --- | --- | --- | --- | --- | --- |";
  const headers = [
    "| Name | Type | Required | Default | Unit | Description |",
    "| Name | Type | Required | Default | Units | Desc |",
    "| name | type | required | default | units | description |",
    "| Name | Type | Required | Default | Units |",
    "| Name | Type | Required | Default | Units | Description | Notes |",
  ];
  for (const header of headers) {
    const text = `## \`stages.json\`\n\n${header}\n${separator}\n${row("a")}\n`;
    assert.deepEqual(pageRows(text, "stages.json"), [[]], header);
  }
});

test("pageRows needs the separator row under the header", () => {
  const text = `## \`stages.json\`\n\n${HEADER.split("\n")[0]}\n${row("a")}\n${row("b")}\n`;
  assert.deepEqual(pageRows(text, "stages.json"), [[]]);
});

test("checkFile reads the Required cell exactly: other case or trailing words is a mismatch", () => {
  for (const cell of [
    "no",
    "NO",
    "conditional",
    "No, when set",
    "No (see below)",
  ]) {
    const rows = { ...goodRows(), note: row("note", cell) };
    assert.deepEqual(
      check(rows).problems,
      [["REQUIRED", "note", `page=${cell}`, "schema=optional"]],
      cell,
    );
  }
});

test("checkFile covers a container only by rows below it, not by a sibling that shares its prefix", () => {
  const schema = {
    type: "object",
    properties: {
      item: { type: "object", properties: { x: { type: "integer" } } },
      items: {
        type: "array",
        items: { type: "object", properties: { id: { type: "integer" } } },
      },
    },
  };
  const page = `## \`f.json\`\n\n${table(row("items[].id", "No"))}\n`;
  assert.deepEqual(checkFile(schema, page, "f.json").problems, [
    ["MISSING", "item"],
    ["MISSING", "item.x"],
  ]);
});

test("checkFile reports a row that is only a prefix of a schema path as PHANTOM", () => {
  const rows = { ...goodRows(), "items[].i": row("items[].i") };
  assert.deepEqual(check(rows).problems, [["PHANTOM", "items[].i"]]);
});

test("pageRows reads a CRLF page as it reads the LF page, fences included", () => {
  const lf = [
    "## `stages.json`",
    "",
    "```text",
    table(row("fenced")),
    "```",
    "",
    table(row("real")),
    "",
  ].join("\n");
  assert.deepEqual(
    pageRows(lf.replaceAll("\n", "\r\n"), "stages.json"),
    pageRows(lf, "stages.json"),
  );
  assert.deepEqual(names(pageRows(lf, "stages.json")), [["real"]]);
});

test("schemaPaths throws on a schema that declares no properties", () => {
  assert.throws(() => schemaPaths({}), /declares no properties/);
});

// ---------------------------------------------------------------------------
// Seeded fixtures (ticket-215, GRD-03): each test seeds one class or row of
// design/e11-case-format-diff.md section 3 or 4 into an inline mini-schema
// that keeps the report row's real path names. Titles read
// `seed: <report section> <row or class>`. Root arrays and nested objects are
// seeded by the hydros and buses schemas, the oneOf union by
// fpha_plane_reduction, the root scalar by correlation `method`.
// ---------------------------------------------------------------------------

const rowsOf = (...specs) =>
  Object.fromEntries(
    specs.map(([name, ...cells]) => [name, row(name, ...cells)]),
  );
const setRow = (rows, name, ...cells) => ({
  ...rows,
  [name]: row(name, ...cells),
});
const seedCheck = (schema, file) => (rows) =>
  checkFile(schema, pageOf(rows, file), file);

const checkHydros = seedCheck(
  {
    type: "object",
    properties: {
      hydros: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            reservoir: {
              type: "object",
              properties: {
                min_storage_hm3: { type: "number" },
                max_storage_hm3: { type: "number" },
              },
              required: ["min_storage_hm3", "max_storage_hm3"],
            },
            penalties: {
              type: "object",
              properties: {
                water_withdrawal_violation_cost: { type: "number" },
              },
            },
          },
          required: ["id", "reservoir"],
        },
      },
    },
    required: ["hydros"],
  },
  "system/hydros.json",
);
const hydroRows = () =>
  rowsOf(
    ["hydros[].id"],
    ["hydros[].reservoir.min_storage_hm3"],
    ["hydros[].reservoir.max_storage_hm3"],
    ["hydros[].penalties.water_withdrawal_violation_cost", "No"],
  );

const checkBuses = seedCheck(
  {
    type: "object",
    properties: {
      buses: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            deficit_segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  depth_mw: { type: ["number", "null"] },
                  cost: { type: "number" },
                },
                required: ["cost"],
              },
            },
          },
          required: ["id"],
        },
      },
    },
    required: ["buses"],
  },
  "system/buses.json",
);

const checkPlane = seedCheck(
  {
    type: "object",
    properties: {
      fpha_plane_reduction: {
        oneOf: [
          {
            type: "object",
            properties: {
              method: { type: "string", const: "angle" },
              tolerance_deg: { type: "number" },
            },
            required: ["method", "tolerance_deg"],
          },
          {
            type: "object",
            properties: {
              method: { type: "string", const: "distance" },
              tolerance_pct: { type: "number" },
              n_samples: { type: "integer" },
            },
            required: ["method", "tolerance_pct", "n_samples"],
          },
        ],
      },
    },
  },
  "system/hydro_production_models.json",
);
const planeRows = () =>
  rowsOf(
    [
      "fpha_plane_reduction.method",
      "Yes",
      'One of `"angle"`, `"distance"`. Method.',
    ],
    ["fpha_plane_reduction.tolerance_deg", "Conditional"],
    ["fpha_plane_reduction.tolerance_pct", "Conditional"],
    ["fpha_plane_reduction.n_samples", "Conditional"],
  );

const GROUPS = "profiles.<name>.correlation_groups[]";
const checkCorrelation = seedCheck(
  {
    type: "object",
    properties: {
      method: { $ref: "#/$defs/CorrelationMethod" },
      profiles: {
        type: "object",
        additionalProperties: {
          type: "object",
          properties: {
            correlation_groups: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  entities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { type: { type: "string" } },
                      required: ["type"],
                    },
                  },
                },
                required: ["name", "entities"],
              },
            },
          },
          required: ["correlation_groups"],
        },
      },
    },
    required: ["method", "profiles"],
    $defs: {
      CorrelationMethod: { oneOf: [{ type: "string", const: "spectral" }] },
    },
  },
  "scenarios/correlation.json",
);
const correlationRows = () =>
  rowsOf(
    ["method", "Yes", 'One of `"spectral"`. Method.'],
    [`${GROUPS}.name`],
    [`${GROUPS}.entities[].type`],
  );

const checkStages = seedCheck(
  {
    type: "object",
    properties: {
      $schema: { type: ["string", "null"] },
      scenario_source: {
        default: null,
        description: "Detection field: present when the old key is written.",
      },
      stages: {
        type: "array",
        items: {
          type: "object",
          properties: { id: { type: "integer" } },
          required: ["id"],
        },
      },
    },
    required: ["stages"],
  },
  "stages.json",
);
const stagesRows = () =>
  rowsOf(
    ["scenario_source", "No", "Not accepted: a value other than `null` fails."],
    ["stages[].id"],
  );

test("seed: §3 map key profiles.<name>.correlation_groups[].entities[].type: the key is written <name>, a concrete profile name is a PHANTOM", () => {
  assert.deepEqual(checkCorrelation(correlationRows()), {
    rows: 3,
    problems: [],
  });
  const concrete = "profiles.default.correlation_groups[].name";
  const rows = setRow(without(correlationRows(), `${GROUPS}.name`), concrete);
  assert.deepEqual(checkCorrelation(rows).problems, [
    ["MISSING", `${GROUPS}.name`],
    ["PHANTOM", concrete],
  ]);
});

test("seed: §3 root scenario_source of stages.json: a key the schema lists and the loader rejects still needs its row, with no exemption", () => {
  assert.deepEqual(checkStages(stagesRows()), { rows: 2, problems: [] });
  assert.deepEqual(
    checkStages(without(stagesRows(), "scenario_source")).problems,
    [["MISSING", "scenario_source"]],
  );
});

test("seed: §4 page-only hydros[].penalties.water_withdrawal_violation_pos_cost: a key the schema does not list is a PHANTOM", () => {
  assert.deepEqual(checkHydros(hydroRows()), { rows: 4, problems: [] });
  const phantom = "hydros[].penalties.water_withdrawal_violation_pos_cost";
  assert.deepEqual(checkHydros(setRow(hydroRows(), phantom, "No")).problems, [
    ["PHANTOM", phantom],
  ]);
});

test("seed: §4 code-only hydros[].reservoir.min_storage_hm3: a required nested leaf without its row is MISSING, a sibling row covers only the object", () => {
  const rows = without(hydroRows(), "hydros[].reservoir.min_storage_hm3");
  assert.deepEqual(checkHydros(rows).problems, [
    ["MISSING", "hydros[].reservoir.min_storage_hm3"],
  ]);
});

test("seed: §4 required buses[].deficit_segments[].cost: a required leaf of an optional array written No", () => {
  const cost = "buses[].deficit_segments[].cost";
  const rows = rowsOf(
    ["buses[].id"],
    ["buses[].deficit_segments[].depth_mw", "No"],
    [cost],
  );
  assert.deepEqual(checkBuses(rows), { rows: 3, problems: [] });
  assert.deepEqual(checkBuses(setRow(rows, cost, "No")).problems, [
    ["REQUIRED", cost, "page=No", "schema=required"],
  ]);
});

test("seed: §4 required fpha_plane_reduction.n_samples: a variant-scoped key is Conditional at the union level, Yes is a mismatch, and the tag lists both variants", () => {
  assert.deepEqual(checkPlane(planeRows()), { rows: 4, problems: [] });
  const samples = "fpha_plane_reduction.n_samples";
  assert.deepEqual(checkPlane(setRow(planeRows(), samples, "Yes")).problems, [
    ["REQUIRED", samples, "page=Yes", "schema=optional"],
  ]);
  const tag = "fpha_plane_reduction.method";
  const rows = setRow(planeRows(), tag, "Yes", 'One of `"angle"`. Method.');
  assert.deepEqual(checkPlane(rows).problems, [
    ["ENUM", tag, 'page="angle"', 'schema="angle","distance"'],
  ]);
});

test("seed: §4 enum correlation.json method: a value the schema lacks, and a Description that lists none", () => {
  const added = setRow(
    correlationRows(),
    "method",
    "Yes",
    'One of `"spectral"`, `"cholesky"`. Method.',
  );
  assert.deepEqual(checkCorrelation(added).problems, [
    ["ENUM", "method", 'page="cholesky","spectral"', 'schema="spectral"'],
  ]);
  const unlisted = setRow(correlationRows(), "method", "Yes", "Method.");
  assert.deepEqual(checkCorrelation(unlisted).problems, [
    ["ENUM", "method", "page=-", 'schema="spectral"'],
  ]);
});

const checkStageModes = seedCheck(
  {
    type: "object",
    properties: {
      stages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "integer" },
            block_mode: { $ref: "#/$defs/RawBlockMode", default: "parallel" },
          },
          required: ["id"],
        },
      },
    },
    required: ["stages"],
    $defs: {
      RawBlockMode: {
        oneOf: [
          { type: "string", const: "parallel" },
          { type: "string", const: "chronological" },
        ],
      },
    },
  },
  "stages.json",
);

test("seed: §4 enum stages.json stages[].block_mode: an optional enumerated field (Required No) is held to its value set", () => {
  const mode = "stages[].block_mode";
  const rows = rowsOf(
    ["stages[].id"],
    [mode, "No", 'One of `"parallel"`, `"chronological"`. Block layout.'],
  );
  assert.deepEqual(checkStageModes(rows), { rows: 2, problems: [] });
  const short = setRow(rows, mode, "No", 'One of `"parallel"`. Block layout.');
  assert.deepEqual(checkStageModes(short).problems, [
    ["ENUM", mode, 'page="parallel"', 'schema="chronological","parallel"'],
  ]);
});

test("seed: §3 map key profiles.<name>: a misspelt field under <name> is a PHANTOM, and a map-value field keeps its own Required", () => {
  const type = `${GROUPS}.entities[].type`;
  const typo = `${GROUPS}.entities[].kind`;
  const misspelt = setRow(without(correlationRows(), type), typo);
  assert.deepEqual(checkCorrelation(misspelt).problems, [
    ["MISSING", type],
    ["PHANTOM", typo],
  ]);
  const groups = "profiles.<name>.correlation_groups";
  assert.deepEqual(checkCorrelation(setRow(correlationRows(), groups)), {
    rows: 4,
    problems: [],
  });
  assert.deepEqual(
    checkCorrelation(setRow(correlationRows(), groups, "No")).problems,
    [["REQUIRED", groups, "page=No", "schema=required"]],
  );
});
