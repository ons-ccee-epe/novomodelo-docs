# Generic-constraint example fixture

## Purpose

The overlay that `scripts/check-gc-examples.mjs` (`check:gc-examples`) copies over the scaffold of `novomodelo init --template 1dtoy` to build the case the generic-constraint examples are validated in. Every `gc-check` fence of `src/content/docs/reference/generic-constraints.mdx` is spliced into that case and run through `novomodelo validate` (fence meta: `docs/design/reference-conventions.md`, D-160-4). Only the files the examples need beyond the scaffold are committed here; the scaffold itself comes from `novomodelo init` at run time, so a template change at a novomodelo sync reaches the gate.

## Files

Paths are relative to the case directory. `replaced` overwrites a scaffold file and `added` is absent from the scaffold.

<!-- prettier-ignore -->
| Path | Scaffold file | Content |
| --- | --- | --- |
| `system/hydros.json` | replaced | Hydro `0` with `min_storage_hm3` 100.0 and `specific_productivity_mw_per_m3s_per_m` 0.0088; hydros `1`, `10` and `11` (`UHE2`, `UHE11`, `UHE12`) copy it with `min_storage_hm3` 0.0 and no specific productivity |
| `initial_conditions.json` | replaced | Storage 500.0 hm³ for hydros `0`, `1`, `10` and `11` |
| `system/hydro_production_models.json` | replaced | Hydro `0`'s entry copied for hydros `1`, `10` and `11` |
| `scenarios/inflow_seasonal_stats.parquet` | replaced | Hydro `0`'s four stage rows copied for hydros `1`, `10` and `11` |
| `system/hydro_geometry.parquet` | added | Hydro `0`, `(volume_hm3, height_m, area_km2)`: `(100, 300, 10)`, `(500, 320, 30)`, `(1000, 335, 50)`; `novomodelo validate` does not depend on it (without the file the outcome is unchanged), it feeds the `novomodelo run` echo of the security-curve example |
| `constraints/generic_parameters.json` | added | `rho_int` (`integrated_accumulated_productivity`) and `emax` (`max_stored_energy`) on hydro `0`, the parameter file of the security-curve example |
| `constraints/generic_constraint_bounds.parquet` | added | Constraint `1`, stages `0` to `3`, `block_id` null, `bound_lower` 0.0, `bound_upper` null |
| `constraints/generic_constraints.json` | added | One constraint, `overlay_default`: `hydro_generation(0)`, slack disabled |

Every checked example uses constraint id `1`, so the bounds file names a constraint the default file declares. Each of the four hydros needs a production-model entry and inflow statistics. Parquet columns are `Int32` and `Float64`, written with zstd (the release binary rejects snappy Parquet).

## Splice rule

Each checked fence is spliced alone (D-179-2). A fresh copy of the base case (the scaffold with this overlay) has the file at the fence's `title` path replaced by the fence content, and `novomodelo validate` must then exit `0` for `gc-check="accept"` and exit `1` with an `error` object for `gc-check="reject"`. The overlay alone must validate first (`Valid case: 1 buses, 4 hydros, 2 thermals, 0 lines`), so a refusal is attributable to the fence. A fence without `gc-check` is illustrative and is not run.

## Provenance

- Version line (`novomodelo version`, line 1): `novomodelo   v0.18.0`
- Release archive `novomodelo-cli-x86_64-unknown-linux-gnu.tar.xz`: sha256 prefix `93cb7307` (the archive's hash)
- Extracted `novomodelo` binary: sha256 `a7a8e16bd9006dd9194955d634a5cf8af823e786d7b661fb796e0a41f7cf84c5` (the binary's hash, not the archive's)
- Parquet writer: pyarrow 25.0.1, `compression="zstd"`
- Source record: ticket-179 (overlay and per-fence results), captured 2026-10-07

## Regenerate

Regenerate at each novomodelo sync, after `DEFAULT_NOVOMODELO_REF` in `scripts/novomodelo-ref.mjs` moves, then run the gate (`NOVOMODELO_BIN=<binary> node scripts/check-gc-examples.mjs`). `NOVOMODELO_BIN` is the `novomodelo` binary whose `novomodelo version` tag is `DEFAULT_NOVOMODELO_REF`; `NOVOMODELO_PY` is a Python with pyarrow. From the repository root:

```sh
d=$(mktemp -d)
NO_COLOR=1 "$NOVOMODELO_BIN" init --template 1dtoy "$d/case"
"$NOVOMODELO_PY" - "$d/case" <<'PY'
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path
from typing import Any

import pyarrow as pa
import pyarrow.parquet as pq

case = Path(sys.argv[1])
NEW_HYDROS = {1: "UHE2", 10: "UHE11", 11: "UHE12"}
ALL_HYDROS = [0, 1, 10, 11]
STAGES = [0, 1, 2, 3]


def load(name: str) -> dict[str, Any]:
    return json.loads((case / name).read_text())


def dump(name: str, obj: dict[str, Any]) -> None:
    path = case / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n")


def write(name: str, table: pa.Table) -> None:
    path = case / name
    path.parent.mkdir(parents=True, exist_ok=True)
    pq.write_table(table, path, compression="zstd")


# (a) system/hydros.json
hydros = load("system/hydros.json")
h0 = hydros["hydros"][0]
h0["reservoir"]["min_storage_hm3"] = 100.0
h0["specific_productivity_mw_per_m3s_per_m"] = 0.0088
template = copy.deepcopy(h0)
template["reservoir"]["min_storage_hm3"] = 0.0
del template["specific_productivity_mw_per_m3s_per_m"]
for hid, name in NEW_HYDROS.items():
    h = copy.deepcopy(template)
    h["id"] = hid
    h["name"] = name
    h["unit_groups"][0]["name"] = name
    hydros["hydros"].append(h)
dump("system/hydros.json", hydros)

# (b) initial_conditions.json
ic = load("initial_conditions.json")
ic["storage"] = [{"hydro_id": hid, "value_hm3": 500.0} for hid in ALL_HYDROS]
dump("initial_conditions.json", ic)

# (c) system/hydro_production_models.json
models = load("system/hydro_production_models.json")
e0 = models["production_models"][0]
for hid in NEW_HYDROS:
    e = copy.deepcopy(e0)
    e["hydro_id"] = hid
    models["production_models"].append(e)
dump("system/hydro_production_models.json", models)

# (d) scenarios/inflow_seasonal_stats.parquet
stats = pq.read_table(case / "scenarios/inflow_seasonal_stats.parquet")
schema = pa.schema([(n, stats.schema.field(n).type) for n in stats.schema.names])
rows = stats.to_pylist()
rows0 = [r for r in rows if r["hydro_id"] == 0]
for hid in NEW_HYDROS:
    rows += [dict(r, hydro_id=hid) for r in rows0]
write(
    "scenarios/inflow_seasonal_stats.parquet",
    pa.Table.from_pylist(rows, schema=schema),
)

# (e) system/hydro_geometry.parquet
geometry = pa.schema([
    ("hydro_id", pa.int32()),
    ("volume_hm3", pa.float64()),
    ("height_m", pa.float64()),
    ("area_km2", pa.float64()),
])
points = [(100.0, 300.0, 10.0), (500.0, 320.0, 30.0), (1000.0, 335.0, 50.0)]
write("system/hydro_geometry.parquet", pa.Table.from_pylist(
    [dict(hydro_id=0, volume_hm3=v, height_m=h, area_km2=a) for v, h, a in points],
    schema=geometry,
))

# (f) constraints/generic_parameters.json
dump("constraints/generic_parameters.json", {"scalar_parameters": [
    {"id": 1, "name": "rho_int", "kind": "computed",
     "computed_spec": {"tag": "integrated_accumulated_productivity", "hydro_id": 0}},
    {"id": 2, "name": "emax", "kind": "computed",
     "computed_spec": {"tag": "max_stored_energy", "hydro_id": 0}},
]})

# (g) constraints/generic_constraint_bounds.parquet
bounds = pa.schema([
    pa.field("constraint_id", pa.int32(), nullable=False),
    pa.field("stage_id", pa.int32(), nullable=False),
    pa.field("block_id", pa.int32(), nullable=True),
    pa.field("bound_lower", pa.float64(), nullable=True),
    pa.field("bound_upper", pa.float64(), nullable=True),
])
bound_rows = [
    {
        "constraint_id": 1,
        "stage_id": s,
        "block_id": None,
        "bound_lower": 0.0,
        "bound_upper": None,
    }
    for s in STAGES
]
write(
    "constraints/generic_constraint_bounds.parquet",
    pa.Table.from_pylist(bound_rows, schema=bounds),
)

# (h) constraints/generic_constraints.json
overlay_default = {
    "id": 1,
    "name": "overlay_default",
    "expression": "hydro_generation(0)",
    "slack": {"enabled": False},
}
dump("constraints/generic_constraints.json", {"constraints": [overlay_default]})
PY
dest="$PWD/scripts/fixtures/gc-overlay"
(cd "$d/case" && cp --parents \
  system/hydros.json \
  initial_conditions.json \
  system/hydro_production_models.json \
  scenarios/inflow_seasonal_stats.parquet \
  system/hydro_geometry.parquet \
  constraints/generic_parameters.json \
  constraints/generic_constraint_bounds.parquet \
  constraints/generic_constraints.json \
  "$dest/")
rm -r "$d"
```
