// Runtime pt-BR translation of the Observable Plot figure labels (pt-br pages only).
const T: Record<string, string> = {
  "sample": "amostra",
  "model": "modelo",
  "correlation": "correlação",
  "sampled upper bound": "limite superior amostral",
  "confidence band": "intervalo de confiança",
  "lower bound": "limite inferior",
  "exact upper bound": "limite superior exato",
  "iteration": "iteração",
  "iteration k": "iteração k",
  "total expected cost": "custo total esperado",
  "gap": "gap",
  "total cost Z": "custo total Z",
  "probability density": "densidade de probabilidade",
  "opening cost": "custo da abertura",
  "weight": "peso",
  "nominal probability": "probabilidade nominal",
  "floor": "piso",
  "risk-adjusted weight μ*": "peso ajustado ao risco μ*",
  "exact φ, capped at Ḡ": "φ exata, limitada a Ḡ",
  "FPHA₀, raw hull": "FPHA₀, envoltória bruta",
  "k_FPHA·FPHA₀, corrected": "k_FPHA·FPHA₀, corrigida",
  "cloud points": "nuvem de pontos",
  "turbined flow q / q_max": "vazão turbinada q / q_max",
  "generation g / Ḡ": "geração g / Ḡ",
  "probability-weighted slope": "coeficiente ponderado pela probabilidade",
  "reduced cost of each opening, in opening order left to right": "custo reduzido de cada abertura, na ordem das aberturas da esquerda para a direita",
  "reservoir": "reservatório",
  "storage cut slope β̄ᵛₕ": "coeficiente do corte no armazenamento β̄ᵛₕ",
  "iteration-1 cut": "corte da iteração 1",
  "iteration-2 cut": "corte da iteração 2",
  "upper envelope": "envoltória superior",
  "storage at the end of stage 2, v": "armazenamento ao final do estágio 2, v",
  "stored volume v (hm³)": "volume armazenado v (hm³)",
  "future cost V(v)": "custo futuro V(v)",
  "cost-to-go": "custo futuro",
  "sampled forward pass": "simulação forward amostrada",
  "enumerated forward pass": "simulação forward enumerada",
  "slope": "coeficiente",
  "opening": "abertura",
};
const A: Record<string, string> = {
  "Periodic autocorrelation and partial autocorrelation of one season of a synthetic PAR(1) series: sample versus model autocorrelation at lags 1 to 6, and the sample and model partial autocorrelation against the ±1.96/√Nₘ significance band":
    "Autocorrelação e autocorrelação parcial periódicas de um período sazonal de uma série sintética PAR(1): autocorrelação amostral versus do modelo nas defasagens 1 a 6, e autocorrelação parcial amostral e do modelo frente à faixa de significância ±1,96/√Nₘ",
  "Two panels of SDDP bound evolution: left, a monotone lower bound and a sampled upper bound whose 95% confidence band reaches below the lower bound late in the run; right, the same lower bound and an exact upper bound that stays above it and closes the gap":
    "Dois painéis da evolução dos limites da PDDE: à esquerda, um limite inferior monótono e um limite superior amostral cujo intervalo de confiança de 95% fica abaixo do limite inferior no fim da execução; à direita, o mesmo limite inferior e um limite superior exato que permanece acima dele e fecha o gap",
  "SDDP convergence: monotone lower bound and Monte-Carlo upper bound with a 95% confidence band closing the gap":
    "Convergência da PDDE: limite inferior monótono e limite superior de Monte Carlo com intervalo de confiança de 95% fechando o gap",
  "Cost distribution f(Z) with E[Z], VaR and CVaR marked and the worst 10% of outcomes (tail fraction α = 0.1) shaded":
    "Distribuição de custo f(Z) com E[Z], VaR e CVaR marcados e os 10% piores resultados (fração da cauda α = 0,1) sombreados",
  "Bar chart of CVaR weights for four equiprobable openings with costs 10, 20, 30 and 40 at tail fraction α = 0.5 and risk weight λ = 0.5: nominal probability 0.25 each, floor 0.125 each, risk-adjusted weights 0.125, 0.125, 0.375 and 0.375":
    "Gráfico de barras dos pesos do CVaR para quatro aberturas equiprováveis com custos 10, 20, 30 e 40, fração da cauda α = 0,5 e peso de risco λ = 0,5: probabilidade nominal 0,25 cada, piso 0,125 cada, pesos ajustados ao risco 0,125, 0,125, 0,375 e 0,375",
  "Synthetic hydro plant with normalized axes, sliced at one storage: generation against turbined flow, with the cloud points and the exact production capped at installed capacity, the raw hull envelope FPHA₀ on or above every cloud point, the corrected envelope k_FPHA·FPHA₀ and the dashed line ρ_eq·q":
    "Usina hidrelétrica sintética com eixos normalizados, cortada em um armazenamento: geração versus vazão turbinada, com a nuvem de pontos e a produção exata limitada à capacidade instalada, a envoltória bruta FPHA₀ sobre ou acima de cada ponto, a envoltória corrigida k_FPHA·FPHA₀ e a reta tracejada ρ_eq·q",
  "Storage cut slopes of the four-reservoir walkthrough's iteration-1 stage-3 cut: bars for the probability-weighted slopes of H1 to H4, −50, −100/3, −50/3 and 0, with a dot for each opening's reduced cost":
    "Coeficientes de armazenamento do corte do estágio 3 na iteração 1 do exemplo com quatro reservatórios: barras para os coeficientes ponderados pela probabilidade de H1 a H4, −50, −100/3, −50/3 e 0, com um ponto para o custo reduzido de cada abertura",
  "Cost-to-go V₃ of the single-reservoir walkthrough against the storage left at the end of stage 2, with the two cuts that iterations 1 and 2 add to stage 2 and their upper envelope, which lies on or below V₃ and touches it at the trial points 10 and 20":
    "Custo futuro V₃ do exemplo com um reservatório em função do armazenamento ao final do estágio 2, com os dois cortes que as iterações 1 e 2 adicionam ao estágio 2 e sua envoltória superior, que fica sobre ou abaixo de V₃ e o toca nos estados visitados 10 e 20",
  "Future cost V(v) with Benders tangents": "Custo futuro V(v) com tangentes de Benders",
};
function tr(s: string): string | null {
  const m = s.match(/^(\s*[↑↓←]?\s*)(.*?)(\s*[→↑↓]?\s*)$/s);
  if (!m) return null;
  const core = m[2];
  let out = T[core];
  if (out === undefined) {
    let r = core.match(/^lag ℓ \(season (.+)\)$/);
    if (r) out = `defasagem ℓ (período sazonal ${r[1]})`;
    r = core.match(/^±(.+)\/√Nₘ band, Nₘ = (.+)$/);
    if (r) out = `faixa ±${r[1].replace(".", ",")}/√Nₘ, Nₘ = ${r[2]}`;
  }
  return out === undefined ? null : m[1] + out + m[3];
}
function walk(root: Element) {
  root.querySelectorAll("[aria-label]").forEach((el) => {
    const v = A[el.getAttribute("aria-label") || ""];
    if (v) el.setAttribute("aria-label", v);
  });
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) {
    const t = tr(n.nodeValue || "");
    if (t !== null && t !== n.nodeValue) n.nodeValue = t;
  }
}
export function initPlotI18n() {
  if (!location.pathname.includes("/pt-br")) return;
  const sel = '[role="img"][aria-label]';
  const run = () => document.querySelectorAll(sel).forEach((e) => walk(e));
  run();
  const obs = new MutationObserver(() => { obs.disconnect(); run(); start(); });
  const start = () => document.querySelectorAll(sel).forEach((e) => obs.observe(e, { childList: true, subtree: true, characterData: true }));
  start();
}
