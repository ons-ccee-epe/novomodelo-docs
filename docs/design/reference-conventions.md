# Reference content conventions

This document fixes the table schemas, type vocabulary, anchor scheme and fence meta of the reference pages. The pages
follow it and the reference gates check them against it (section 1). It is a design document, not site content;
`check:type-spelling` reads its section 4 at run time.

## 1. Scope and consumers

The conventions cover the twenty pages under `src/content/docs/reference/`: the nine pages of `case-format/`, the seven
pages of `output/`, `error-codes`, `generic-constraints`, `cli-reference` and `json-schemas`.

| Consumer               | Reads                                                                              | Section    |
| ---------------------- | ---------------------------------------------------------------------------------- | ---------- |
| Reference page authors | every table, heading and fence follows the conventions                             | 2-7        |
| `check:input-schemas`  | input tables against the 17 bound vendored schemas (`config.json` is not bound)    | 2, 4, 5, 8 |
| `check:type-spelling`  | the Type cell of every input and output table, against the vocabulary of section 4 | 2-5        |
| `check:error-coverage` | error-codes headings                                                               | 6          |
| `check:gc-examples`    | generic-constraint fences                                                          | 7          |
| `check:links`          | every inbound link and fragment into the reference pages, on the built site        | 5          |

The pages own their facts (field lists, messages). This document owns only the shape in which the pages state them.

## 2. Input table schema

An input file section holds one table per file, with the columns below. The header row and one example row:

| Name                     | Type   | Required | Default | Units | Description                                                            |
| ------------------------ | ------ | -------- | ------- | ----- | ---------------------------------------------------------------------- |
| `hydros[].tailrace.type` | string | Yes      | —       | —     | One of `"piecewise"`, `"polynomial"`. Selects the tailrace curve form. |

Column rules:

- **Header.** The header row is exactly `Name | Type | Required | Default | Units | Description`, with these six names in
  this order. A table with any other header is not an input table and the checker does not read it.
- **Name.** A JSON `Name` cell holds the backticked full path from the file root, with `[]` after an array of objects
  (`hydros[].tailrace.type`) and `<name>` for a user-chosen map key (`profiles.<name>.correlation_groups[].name`; the array row itself is `profiles.<name>.correlation_groups`, with no trailing `[]`). An array of
  non-objects (scalars, or arrays of scalars) is one leaf row with no `[]` and Type `array`; the example is
  `hydros[].evaporation.coefficients_mm`. A Parquet `Name` cell holds the backticked column name.
- **Type.** One name from section 4, written bare (no backticks) and case-sensitive: `Int32` is not `int32`. A nullable
  JSON field writes `integer \| null`, with the pipe escaped so the cell stays one cell.
- **Required.** One of `Yes`, `No`, `Conditional`, read against the enclosing object:
  - `Yes`: the schema lists the field in `required` of its enclosing object in every `oneOf` or `anyOf` branch of that
    object. A `{"type":"null"}` branch is the nullable marker, not a branch.
  - `No`: the schema does not require the field.
  - `Conditional`: the schema does not require the field, and the Description states the load-time condition. A field
    that only some `oneOf` or `anyOf` variants require is `Conditional`. `check:input-schemas` treats `Conditional` as
    not required.
- **Default.** The em dash `—` (U+2014) or a backticked literal. A JSON field takes the literal of the `default` key on
  its property in the vendored schema (`null` when that key is `null`), and `—` when the property has no `default` key,
  including an optional field that reads as `null` when absent. A Parquet column, which has no vendored schema, takes the
  backticked default the loader applies to an absent or null cell, and `—` when the loader applies none. A default the
  loader applies but the schema omits (`hydro.inflow_nonnegativity_cost`) is stated in the Description, not the Default
  cell.
- **Units.** A plain unit (`MW`, `USD/MWh`, `USD/(m³/s·h)`, `hm³`, `m³/s`, `h`) or `—` (U+2014). Currency is written
  `USD`, never a bare dollar sign, which remark-math can pair into inline math across a table row.
- **Description.** An enumerated field has Type `string` and a Description that opens `One of` followed by each value as
  a backticked JSON literal, as in the example row. The values sit in the first sentence, which ends at the first period
  followed by a space, or at the end of the cell. The set is exactly the schema's set; for a tagged-union tag property
  (`type`, `model`) it is the union of the branches' `const` values.
- **Comparison.** Cells are compared after trimming, so column padding is free (the repository's prettier hook pads
  tables). `\|` inside a cell is not a column separator, and fenced code is skipped.

Two rules apply to `check:input-schemas`:

- **Required is parent-relative.** `Required` is read relative to the enclosing object. A field that the schema requires
  inside an optional parent object is `Yes`, and the parent row carries the optionality. In the example above, `tailrace`
  is optional in `hydros[]`, so the `hydros[].tailrace` row says `No`, while `type` is required once a `tailrace` object
  exists, so its row says `Yes`. The contrast within the same object: `hydros[].tailrace.type` is `Yes` because every
  `tailrace` variant lists `type` in `required`, and `hydros[].tailrace.coefficients` is `Conditional` because only the
  `polynomial` variant lists it.
- **No `$schema` row.** The root `$schema` key has no row on any file table. The case-format `## Conventions` block
  describes it once.

**Door**: one-way.
**Revisit trigger**: none known.

## 3. Output table schema

An output file section holds one table per file with these columns. The header row and one example row:

| Name       | Type  | Nullable | Units | Description             |
| ---------- | ----- | -------- | ----- | ----------------------- |
| `stage_id` | Int32 | No       | —     | Stage index of the row. |

Column rules:

- **Name.** The backticked column name.
- **Type.** A name from section 4, written bare: an Arrow name (Parquet), or a JSON keyword or FlatBuffers spelling for
  the JSON and checkpoint files. The Type cell never carries `\| null`; the Nullable column states nullability.
- **Nullable.** One of `Yes`, `No`. The value is the `nullable` flag of the writer schema field.
- **Units.** As in section 2.
- **Description.** What the column holds. The example is the `stage_id` column of `simulation/hydros/`, a row-prefix
  column of every simulation table (`simulation_row_prefix`, `crates/novomodelo-io/src/output/schemas.rs`).

**Door**: one-way.
**Revisit trigger**: none known.

## 4. Type vocabulary

Parquet columns use the Arrow type names that the loader's wrong-type message and the writer schemas print.

| Name                 | Parquet physical type | pyarrow        | polars       | Read or written by                                                                                                        |
| -------------------- | --------------------- | -------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `Int32 (nullable)`   | INT32                 | `pa.int32()`   | `pl.Int32`   | optional input column, null cells allowed; read (`extract_optional_int32`, `crates/novomodelo-io/src/parquet_helpers.rs`)      |
| `Float64 (nullable)` | DOUBLE                | `pa.float64()` | `pl.Float64` | optional input column, null cells allowed; read (`extract_optional_float64`, `crates/novomodelo-io/src/parquet_helpers.rs`)    |
| `Int8`               | INT32                 | `pa.int8()`    | `pl.Int8`    | written (output schemas)                                                                                                  |
| `Int32`              | INT32                 | `pa.int32()`   | `pl.Int32`   | read (`extract_required_int32`, `extract_optional_int32`) and written                                                     |
| `Int64`              | INT64                 | `pa.int64()`   | `pl.Int64`   | written                                                                                                                   |
| `UInt32`             | INT32                 | `pa.uint32()`  | `pl.UInt32`  | read (`extract_required_uint32`) and written                                                                              |
| `UInt64`             | INT64                 | `pa.uint64()`  | `pl.UInt64`  | written                                                                                                                   |
| `Float64`            | DOUBLE                | `pa.float64()` | `pl.Float64` | read (`extract_required_float64`, `extract_optional_float64`) and written                                                 |
| `Utf8`               | BYTE_ARRAY (string)   | `pa.string()`  | `pl.String`  | read (`extract_required_string`, `crates/novomodelo-io/src/extensions/evaporation_models.rs`, the `source` column) and written |
| `Boolean`            | BOOLEAN               | `pa.bool_()`   | `pl.Boolean` | written                                                                                                                   |
| `Date32`             | INT32 (date)          | `pa.date32()`  | `pl.Date`    | read (`extract_required_date32`) and written                                                                              |

Parquet physical names are not used in tables. They cannot tell `Int32` from `UInt32` or `Date32` (all physical INT32)
and differ from the names a user sees in the load error.

The `(nullable)` suffix is for input tables only, which have no Nullable column; an output table writes the plain name and states nullability in its Nullable column.

JSON fields use JSON Schema type keywords, as the 18 vendored input schemas (`public/schemas/*.schema.json`) do. The
nullable form below applies to input tables only; output tables state nullability in the Nullable column.

| Name              | Meaning                                                                                                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `integer`         | JSON integer                                                                                                                                                                              |
| `number`          | JSON number                                                                                                                                                                               |
| `string`          | JSON string; an enumeration is a `string` whose Description lists the values                                                                                                              |
| `boolean`         | `true` or `false`                                                                                                                                                                         |
| `object`          | JSON object                                                                                                                                                                               |
| `array`           | JSON array                                                                                                                                                                                |
| `integer \| null` | A nullable field of an input table: append `\| null` to the keyword. The vendored schemas encode it two ways: `"type": ["integer", "null"]`, and `anyOf` with a `{"type": "null"}` branch |
| `a \| b`          | A field that accepts any one of two or more JSON keywords (a `oneOf` or `anyOf` of typed branches), as in `string \| object`; each part is a keyword of this table                        |
| `—`               | No schema `type`: a field whose schema property declares no `type` keyword; the Description states its only accepted value                                                                |

CSV columns (`training/dictionaries/*.csv`) use the JSON keywords, and `check:type-spelling` reads the three tables of this section.

Checkpoint wire fields (`policy/cuts/*.bin`, `basis/`, `states/`, `manifest.bin`) are FlatBuffers. They use the
spellings declared in `crates/novomodelo-io/schemas/policy.fbs`.

| Name      | Meaning                                                                      |
| --------- | ---------------------------------------------------------------------------- |
| `bool`    | Boolean scalar                                                               |
| `byte`    | Underlying type of `enum EntityType : byte` (`policy.fbs`); not a field type |
| `uint8`   | Unsigned 8-bit scalar                                                        |
| `int32`   | Signed 32-bit scalar                                                         |
| `uint32`  | Unsigned 32-bit scalar                                                       |
| `uint64`  | Unsigned 64-bit scalar                                                       |
| `float64` | 64-bit floating-point scalar                                                 |
| `string`  | UTF-8 string                                                                 |

A vector is written `[T]` as in the schema (`[float64]`, `[uint8]`, `[uint32]`, `[string]`, `[EntitySlot]`,
`[AffinePiece]`, `[ManifestNode]`, `[ManifestEdge]`, `[HydroSeasonOrders]`). A table or enum field is named by its
schema name (`EntityType`, `SeasonManifest`).

The loader quotes the type it found and the type it needs. The message is, verbatim, from
`crates/novomodelo-io/src/parquet_helpers.rs`:

```text
column "{name}" has type {actual} but {expected} is required
```

`{actual}` is the Arrow `DataType` display name. In the shared helpers `{expected}` is one of `Int32`, `Float64`,
`UInt32`, `Date32`. The one `Utf8` reader, `extract_required_string` in `crates/novomodelo-io/src/extensions/evaporation_models.rs`, prints the
same message shape with `Utf8` as the expected type. A pandas default `int64` column therefore fails on an `Int32` column
with:

```text
column "hydro_id" has type Int64 but Int32 is required
```

A Type cell takes any name in the tables of this section except `byte`. A type the code adds later joins these tables in
the same change that documents it.

**Door**: one-way.
**Revisit trigger**: none known.

## 5. Anchors

A file section is a heading whose text is only the backticked case-relative (input) or output-relative path. The slug
derives from the identifier:

- ``### `system/hydros.json` `` gives `#systemhydrosjson`.
- ``### `training/metadata.json` `` gives `#trainingmetadatajson`.

There are no custom heading ids and no heading-id plugin; every anchor is a heading slug. A file-path heading
occurs once across the reference pages (the checker reports a second occurrence as `DUPSECTION`). A heading that has
inbound links keeps its text. Renaming one requires every inbound link to change in the same batch.

The reference pages are the nine pages under `reference/case-format/`, the seven pages under `reference/output/`,
`error-codes`, `generic-constraints`, `cli-reference` and `json-schemas`. `npm run check:links` checks every inbound
link and fragment into them on the built site in every pull-request CI run.

**Door**: one-way.
**Revisit trigger**: none known.

## 6. Error-codes headings

A kind section is a `###` heading whose whole text is one backticked kind, as the user sees it in `[Kind]`, outside fenced
code: ``### `BusinessRuleViolation` `` gives `#businessruleviolation`. Its body runs to the next `##` or `###` heading, and its
slug is unique on the page (`check:error-coverage` reports a repeated kind heading as `DUPLICATE`).

A per-rule entry is a `####` heading whose text is a noun phrase naming the rule. It carries no version words and no code
identifier that names an implementation, and it is unique on the page. Its slug is the rule anchor.

A kind that is a variant of both enums (`ParseError`) has one kind section, `#parseerror`.

**Door**: one-way.
**Revisit trigger**: none known.

## 7. Generic-constraint example fences

A fence that `check:gc-examples` checks carries two meta options. `title` is the case-relative path and the fence content is that
whole file. `gc-check` is `"accept"` (`novomodelo validate` must exit `0` once the fence is spliced into the fixture) or
`"reject"` (it must exit `1`). The fence headers, verbatim:

````text
```json title="constraints/generic_constraints.json" gc-check="accept"
```json title="constraints/generic_constraints.json" gc-check="reject"
````

Values use double quotes only. A `gc-check` value other than `"accept"` or `"reject"`, a misspelled option name, or a
`gc-check` with no `title` is an error. A fence without `gc-check` is illustrative and is not checked. Expressive Code 0.43.1 ignores a meta option that no
plugin reads, and `title="…"` renders a frame title.

Each checked fence is spliced alone into a fresh copy of one base case, the `novomodelo init --template 1dtoy` scaffold with
the committed overlay `scripts/fixtures/gc-overlay/` copied over it, replacing the file at its `title` path.
The overlay's files, splice rule, provenance and regeneration steps are in `scripts/fixtures/gc-overlay/README.md`.

**Door**: one-way.
**Revisit trigger**: none known.

## 8. Table binding

No binding marker comments are used. `check:input-schemas` binds a table to a schema by its file-path heading (section 5)
and the full `Name` paths (section 2). The rows of a file are the input tables (section 2 header, exactly) under the
heading whose text is that file's backticked path, up to the next heading of the same or a higher level; other
tables are not read. The binding covers the 17 case-format JSON files; `config.json` is not bound.

**Door**: two-way.
**Revisit trigger**: a split page that must group several files under one heading.
