// Break points in table code.
//
// Reference tables name nested keys and file paths in inline code
// (`thermals[].anticipated_config.lead_time_hours`,
// `system/hydro_production_models.json`). A code span has no break opportunity,
// so its whole length sets its column's minimum width, and a table with a few
// long names overflows the content column and hides its last columns behind a
// horizontal scroll. This plugin puts a <wbr> before each `.` that starts a key
// or an extension and after each `/`, so a name wraps at its own boundaries,
// and only when the column is too narrow for it. A piece longer than LONG_PIECE
// characters also breaks after each `_`. Numbers (`0.0`, `v0.22.0`) keep their
// dots whole, and the rendered and copied text does not change.
//
// Register it in `markdown.processor` `rehypePlugins` (astro.config.mjs).

// Long enough to keep the common keys (`operational_start_date`) whole.
const LONG_PIECE = 24;

const BOUNDARY = /(?<=[\p{L}\p{N}_\])])(?=\.[\p{L}_])|(?<=\/)(?=\S)/u;
const AFTER_UNDERSCORE = /(?<=_)(?=[\p{L}\p{N}])/u;

/** The pieces of `text` a <wbr> goes between; joined, they give back `text`. */
export function breakPieces(text) {
  const pieces = [""];
  for (const run of text.split(/(\s+)/)) {
    const parts = /^\s*$/.test(run)
      ? [run]
      : run.split(BOUNDARY).flatMap((part) => (part.length > LONG_PIECE ? part.split(AFTER_UNDERSCORE) : [part]));
    pieces[pieces.length - 1] += parts[0];
    pieces.push(...parts.slice(1));
  }
  return pieces;
}

const wbr = () => ({ type: "element", tagName: "wbr", properties: {}, children: [] });

function addBreaks(node) {
  node.children = node.children.flatMap((child) => {
    if (child.type === "element") addBreaks(child);
    if (child.type !== "text") return [child];
    return breakPieces(child.value).flatMap((value, i) => (i === 0 ? [] : [wbr()]).concat({ type: "text", value }));
  });
}

const isElement = (node, tagName) => node.type === "element" && node.tagName === tagName;

// MDX components (Tabs, asides) wrap tables in JSX nodes, so the walk descends
// through every node with children, not only elements.
function walk(node, inTable) {
  for (const child of node.children ?? []) {
    if (isElement(child, "pre")) continue;
    if (inTable && isElement(child, "code")) addBreaks(child);
    else walk(child, inTable || isElement(child, "table"));
  }
}

export default function rehypeTableCodeBreaks() {
  return (tree) => walk(tree, false);
}
