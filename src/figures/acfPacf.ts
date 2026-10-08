// Compute layer — the "correct by construction" half of the per-season ACF/PACF
// figure of the PAR(p) chapter. No rendering here; this derives every plotted
// number from the math. The renderer (Observable Plot) consumes it.
//
// Model: a standardized PAR(1) over `seasons` seasons,
//   z_t = ψ*_{m(t)} z_{t−1} + √(1 − ψ*_{m(t)}²) ε_t,  ε_t ~ N(0, 1),  z_0 ~ N(0, 1),
// which keeps unit marginal variance in every season. Seasons are 0-based in
// code (1-based on the page); `psiStar[m]` is the lag-1 coefficient of season m.
//
// The sample estimator follows novomodelo's periodic autocorrelation in these
// respects: per-season mean and population standard deviation, year-aligned
// pairs, population divisor (number of pairs), 0 when either season's std is
// below machine epsilon or no pair exists, clamped to [−1, 1], lag 0 equal to 1.
// Year-alignment is calendar-exact at every lag, as in novomodelo. The PACF is the
// last coefficient of the progressive periodic Yule-Walker solves (Gaussian
// elimination with partial pivoting; a singular order ends the sequence).

export interface LagRow {
  lag: number;
  sample: number;
  model: number;
}

export interface FigureData {
  /** Plotted season in page numbering (1-based). */
  seasonLabel: number;
  /** Observations per season, N. */
  years: number;
  /** Order-selection significance band edges, [−z/√N, +z/√N]. */
  bandEdges: [number, number];
  /** Lag-axis extent, half a lag beyond the first and last plotted lag. */
  lagDomain: [number, number];
  acf: LagRow[];
  pacf: LagRow[];
}

const mod = (a: number, m: number): number => ((a % m) + m) % m;

/** Mulberry32: a seeded uniform PRNG on [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `n` standard normal draws by the Box-Muller transform of a seeded PRNG. */
export function standardNormals(seed: number, n: number): number[] {
  const rng = mulberry32(seed);
  const out: number[] = [];
  while (out.length < n) {
    const r = Math.sqrt(-2 * Math.log(1 - rng()));
    const theta = 2 * Math.PI * rng();
    out.push(r * Math.cos(theta), r * Math.sin(theta));
  }
  return out.slice(0, n);
}

/** Simulate the standardized PAR(1); returns `years` rows of `psiStar.length` seasons. */
export function simulatePar1(
  psiStar: number[],
  years: number,
  seed: number,
): number[][] {
  const seasons = psiStar.length;
  const eps = standardNormals(seed, years * seasons);
  const z = [eps[0]];
  for (let t = 1; t < years * seasons; t += 1) {
    const psi = psiStar[t % seasons];
    z.push(psi * z[t - 1] + Math.sqrt(1 - psi * psi) * eps[t]);
  }
  return Array.from({ length: years }, (_, y) =>
    z.slice(y * seasons, (y + 1) * seasons),
  );
}

function meanStd(values: number[]): { mean: number; std: number } {
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance =
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return { mean, std: Math.sqrt(variance) };
}

/** Sample periodic autocorrelation of `season` at one `lag` (series is years × seasons). */
export function sampleAcfAt(
  series: number[][],
  season: number,
  lag: number,
): number {
  if (lag === 0) return 1;
  const seasons = series[0].length;
  const lagSeason = mod(season - lag, seasons);
  const ref = series.map((row) => row[season]);
  const lagged = series.map((row) => row[lagSeason]);
  const a = meanStd(ref);
  const b = meanStd(lagged);
  if (a.std < Number.EPSILON || b.std < Number.EPSILON) return 0;
  const yearsCrossed = Math.max(0, Math.ceil((lag - season) / seasons));
  const pairs = series.length - yearsCrossed;
  if (pairs <= 0) return 0;
  let gamma = 0;
  for (let i = 0; i < pairs; i += 1) {
    gamma += (ref[yearsCrossed + i] - a.mean) * (lagged[i] - b.mean);
  }
  gamma /= pairs;
  return Math.min(1, Math.max(-1, gamma / (a.std * b.std)));
}

/** Sample periodic autocorrelation of `season` at lags 0..maxLag. */
export function sampleAcf(
  series: number[][],
  season: number,
  maxLag: number,
): number[] {
  return Array.from({ length: maxLag + 1 }, (_, lag) =>
    sampleAcfAt(series, season, lag),
  );
}

/** Model autocorrelation ρ_m(ℓ) = ∏_{j=0}^{ℓ−1} ψ*_{m−j} at lags 0..maxLag. */
export function modelAcfPar1(
  psiStar: number[],
  season: number,
  maxLag: number,
): number[] {
  const acf = [1];
  for (let lag = 1; lag <= maxLag; lag += 1) {
    acf.push(acf[lag - 1] * psiStar[mod(season - (lag - 1), psiStar.length)]);
  }
  return acf;
}

function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  for (let k = 0; k < n; k += 1) {
    let pivot = k;
    for (let r = k + 1; r < n; r += 1) {
      if (Math.abs(a[r][k]) > Math.abs(a[pivot][k])) pivot = r;
    }
    if (Math.abs(a[pivot][k]) < Number.EPSILON) return null;
    [a[k], a[pivot]] = [a[pivot], a[k]];
    [b[k], b[pivot]] = [b[pivot], b[k]];
    for (let i = k + 1; i < n; i += 1) {
      const factor = a[i][k] / a[k][k];
      for (let j = k; j < n; j += 1) a[i][j] -= factor * a[k][j];
      b[i] -= factor * b[k];
    }
  }
  const x = new Array<number>(n).fill(0);
  for (let k = n - 1; k >= 0; k -= 1) {
    let sum = b[k];
    for (let j = k + 1; j < n; j += 1) sum -= a[k][j] * x[j];
    x[k] = sum / a[k][k];
  }
  return x;
}

/**
 * Periodic PACF of `season` at lags 1..maxLag: the last coefficient of the
 * order-k periodic Yule-Walker solve, with
 * [R]_{i,j} = ρ_{(m − min(i,j)) mod M}(|j − i|) and right-hand side ρ_m(i).
 * `acf(season, lag)` supplies ρ; the result is shorter than `maxLag` when the
 * system at some order is singular.
 */
export function pacfFromAcf(
  acf: (season: number, lag: number) => number,
  season: number,
  maxLag: number,
  seasons: number,
): number[] {
  const pacf: number[] = [];
  for (let k = 1; k <= maxLag; k += 1) {
    const matrix = Array.from({ length: k }, (_, i) =>
      Array.from({ length: k }, (_, j) =>
        acf(mod(season - (Math.min(i, j) + 1), seasons), Math.abs(j - i)),
      ),
    );
    const rhs = Array.from({ length: k }, (_, i) => acf(season, i + 1));
    const phi = solve(matrix, rhs);
    if (phi === null) break;
    pacf.push(phi[k - 1]);
  }
  return pacf;
}

/** The 95% two-sided z-score z_{0.975} of the order-selection threshold. */
export const Z_ALPHA = 1.96;

/** Order-selection threshold z_{0.975}/√N. */
export function significanceBand(n: number): number {
  return Z_ALPHA / Math.sqrt(n);
}

const PSI_STAR = [
  0.55, 0.6, 0.65, 0.7, 0.72, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.5,
];
const YEARS = 60;
const SEED = 6;
const SEASON = 5;
const MAX_LAG = 6;

/** The arrays the island plots: one fixed synthetic PAR(1) example. */
export function figureData(): FigureData {
  const seasons = PSI_STAR.length;
  const series = simulatePar1(PSI_STAR, YEARS, SEED);
  const sampleAcfRows = sampleAcf(series, SEASON, MAX_LAG);
  const modelAcfRows = modelAcfPar1(PSI_STAR, SEASON, MAX_LAG);
  const samplePacf = pacfFromAcf(
    (s, lag) => sampleAcfAt(series, s, lag),
    SEASON,
    MAX_LAG,
    seasons,
  );
  const modelPacf = pacfFromAcf(
    (s, lag) => modelAcfPar1(PSI_STAR, s, lag)[lag],
    SEASON,
    MAX_LAG,
    seasons,
  );
  const lags = Array.from({ length: MAX_LAG }, (_, i) => i + 1);
  const band = significanceBand(YEARS);
  return {
    seasonLabel: SEASON + 1,
    years: YEARS,
    bandEdges: [-band, band],
    lagDomain: [0.5, MAX_LAG + 0.5],
    acf: lags.map((lag) => ({
      lag,
      sample: sampleAcfRows[lag],
      model: modelAcfRows[lag],
    })),
    pacf: lags.map((lag) => ({
      lag,
      sample: samplePacf[lag - 1],
      model: modelPacf[lag - 1],
    })),
  };
}
