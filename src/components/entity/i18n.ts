type Key = 'input' | 'output' | 'whyTitle' | 'decidesTitle' | 'informsTitle' | 'deepTitle' | 'filesTitle' | 'filesLead';
const S: Record<'en' | 'pt', Record<Key, string>> = {
  pt: { input: 'entrada', output: 'saída', whyTitle: 'Por que importa', decidesTitle: 'O que o modelo decide', informsTitle: 'O que você informa', deepTitle: 'Aprofundar', filesTitle: 'Para quem roda o modelo', filesLead: 'Arquivos onde esta entidade aparece.' },
  en: { input: 'input', output: 'output', whyTitle: 'Why it matters', decidesTitle: 'What the model decides', informsTitle: 'What you provide', deepTitle: 'Go deeper', filesTitle: 'For those who run the model', filesLead: 'Files where this entity appears.' },
};
export function t(locale: string | undefined, key: Key): string {
  return S[(locale ?? 'en').toLowerCase().startsWith('pt') ? 'pt' : 'en'][key];
}
