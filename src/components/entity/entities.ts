export type Family = 'equipment' | 'network' | 'hydrology' | 'rules';
export type Bi = { en: string; pt: string };
export interface Entity { slug: string; family: Family; icon: string; title: Bi; blurb: Bi; ready: boolean }

export const FAMILIES: { id: Family; title: Bi; subtitle?: Bi }[] = [
  { id: 'equipment', title: { pt: 'Equipamentos', en: 'Equipment' }, subtitle: { pt: 'quem gera, armazena ou consome energia', en: 'what generates, stores or consumes energy' } },
  { id: 'network', title: { pt: 'Rede e mercado', en: 'Network and market' }, subtitle: { pt: 'onde a energia é entregue e a que preço', en: 'where energy is delivered and at what price' } },
  { id: 'hydrology', title: { pt: 'Hidrologia e incerteza', en: 'Hydrology and uncertainty' } },
  { id: 'rules', title: { pt: 'Regras e custos', en: 'Rules and costs' } },
];

// 16 entries. `slug` is the EN path; the pt-BR page lives under /pt-br/.
export const ENTITIES: Entity[] = [
  { slug: 'entities/equipment/hydro-plants', family: 'equipment', icon: 'hydro', ready: true,
    title: { pt: 'Usinas hidrelétricas', en: 'Hydro plants' },
    blurb: { pt: 'reservatórios em cascata', en: 'cascaded reservoirs' } },
  { slug: 'entities/equipment/thermal-plants', family: 'equipment', icon: 'thermal', ready: true,
    title: { pt: 'Usinas termelétricas', en: 'Thermal plants' },
    blurb: { pt: 'CVU e inflexibilidade', en: 'variable cost (CVU) and inflexibility' } },
  { slug: 'entities/equipment/non-controllable-sources', family: 'equipment', icon: 'solar', ready: true,
    title: { pt: 'Fontes não despacháveis', en: 'Non-controllable sources' },
    blurb: { pt: 'eólica, solar, PCH', en: 'wind, solar, small hydro' } },
  { slug: 'entities/equipment/pumping-stations', family: 'equipment', icon: 'pump', ready: true,
    title: { pt: 'Usinas elevatórias', en: 'Pumping stations' },
    blurb: { pt: 'bombeiam água entre reservatórios', en: 'pump water between reservoirs' } },
  { slug: 'entities/network/buses', family: 'network', icon: 'bus', ready: true,
    title: { pt: 'Barramentos e subsistemas', en: 'Buses and subsystems' },
    blurb: { pt: 'onde se forma o CMO', en: 'where the marginal cost (CMO) forms' } },
  { slug: 'entities/network/lines', family: 'network', icon: 'line', ready: true,
    title: { pt: 'Linhas e intercâmbios', en: 'Lines and interchanges' },
    blurb: { pt: 'limites de transferência', en: 'transfer limits' } },
  { slug: 'entities/network/load', family: 'network', icon: 'load', ready: true,
    title: { pt: 'Carga', en: 'Load' },
    blurb: { pt: 'demanda por patamar', en: 'demand per load block' } },
  { slug: 'entities/network/deficit', family: 'network', icon: 'deficit', ready: true,
    title: { pt: 'Déficit', en: 'Deficit' },
    blurb: { pt: 'carga não atendida e seu custo', en: 'unserved load and its cost' } },
  { slug: 'entities/network/energy-contracts', family: 'network', icon: 'contract', ready: true,
    title: { pt: 'Contratos de energia', en: 'Energy contracts' },
    blurb: { pt: 'importação e exportação', en: 'import and export' } },
  { slug: 'entities/hydrology/inflows', family: 'hydrology', icon: 'inflow', ready: true,
    title: { pt: 'Afluências e modelo PAR(p)', en: 'Inflows and the PAR(p) model' },
    blurb: { pt: 'vazões incertas', en: 'uncertain flows' } },
  { slug: 'entities/hydrology/scenarios', family: 'hydrology', icon: 'scenarios', ready: true,
    title: { pt: 'Cenários e aberturas', en: 'Scenarios and openings' },
    blurb: { pt: 'os futuros possíveis', en: 'the possible futures' } },
  { slug: 'entities/hydrology/time-structure', family: 'hydrology', icon: 'time', ready: true,
    title: { pt: 'Horizonte, estágios e patamares', en: 'Horizon, stages and load blocks' },
    blurb: { pt: 'estágios e patamares', en: 'stages and load blocks' } },
  { slug: 'entities/rules/generic-constraints', family: 'rules', icon: 'constraints', ready: true,
    title: { pt: 'Restrições genéricas', en: 'Generic constraints' },
    blurb: { pt: 'limites definidos pelo usuário', en: 'user-defined limits' } },
  { slug: 'entities/rules/penalties', family: 'rules', icon: 'penalties', ready: true,
    title: { pt: 'Penalidades e custo de déficit', en: 'Penalties and deficit cost' },
    blurb: { pt: 'custos que mantêm o problema viável', en: 'costs that keep the problem feasible' } },
  { slug: 'entities/rules/risk-aversion', family: 'rules', icon: 'risk', ready: true,
    title: { pt: 'Aversão a risco (CVaR)', en: 'Risk aversion (CVaR)' },
    blurb: { pt: 'peso aos piores cenários', en: 'weight on the worst scenarios' } },
  { slug: 'entities/rules/water-value', family: 'rules', icon: 'water', ready: true,
    title: { pt: 'Valor da água e custo futuro', en: 'Water value and future cost' },
    blurb: { pt: 'custo de oportunidade da água', en: 'opportunity cost of water' } },
];

export type Lang = 'en' | 'pt-BR';
export const key = (lang: string | undefined): 'en' | 'pt' => ((lang ?? 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en');
export const entityHref = (slug: string, lang: string | undefined) => (key(lang) === 'pt' ? `/pt-br/${slug}` : `/${slug}`);
export const entityBySlug = (slug: string) => ENTITIES.find((e) => e.slug === slug)!;
