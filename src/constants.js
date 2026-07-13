export const FASES = [
  {
    nome: 'Pré-Campanha',
    inicio: null,
    fim: '2026-08-14',
    metas: { rua: 30, midia: 20, propositiva: 50 },
    cor: '#4ade80',
  },
  {
    nome: 'Campanha',
    inicio: '2026-08-15',
    fim: '2026-09-18',
    metas: { rua: 35, midia: 35, propositiva: 30 },
    cor: '#f59e0b',
  },
  {
    nome: 'Reta Final',
    inicio: '2026-09-19',
    fim: '2026-10-03',
    metas: { rua: 45, midia: 40, propositiva: 15 },
    cor: '#ef4444',
  },
];

export const TIPO_FRENTE = {
  Mobilização: 'rua',
  Território: 'rua',
  Comunicação: 'midia',
  Relacionamento: 'propositiva',
  'Participação em Eventos': 'propositiva',
};

export const TIPO_CLASS = {
  Mobilização: 'tipo-mob',
  Território: 'tipo-ter',
  Comunicação: 'tipo-com',
  Relacionamento: 'tipo-rel',
  'Participação em Eventos': 'tipo-part',
};

export const STATUS_CLASS = {
  Realizada: 'realizada',
  Sugerida: 'sugerida',
  'Em Construção': 'em-construcao',
  Confirmada: 'confirmada',
  Adiada: 'adiada',
  Cancelada: 'cancelada',
};

export const PALETTE = [
  '#22c55e', '#f97316', '#3b82f6', '#a855f7',
  '#f59e0b', '#10b981', '#ef4444', '#06b6d4',
];

export function currentPhase() {
  const today = new Date();
  for (const f of FASES) {
    const fim = f.fim ? new Date(f.fim) : null;
    const ini = f.inicio ? new Date(f.inicio) : null;
    if (!ini && fim && today <= fim) return f;
    if (ini && fim && today >= ini && today <= fim) return f;
  }
  return FASES[FASES.length - 1];
}

export function parseDate(d) {
  if (!d) return null;
  if (d.includes('/')) {
    const [dd, mm, yyyy] = d.split('/');
    return new Date(`${yyyy}-${mm}-${dd}`);
  }
  return new Date(d.split(' ')[0]);
}

export function fmtDate(d) {
  if (!d) return null;
  const dt = parseDate(d);
  if (!dt || isNaN(dt)) return null;
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function countBy(arr, key) {
  return arr.reduce((m, a) => {
    const v = a[key];
    if (v) m[v] = (m[v] || 0) + 1;
    return m;
  }, {});
}

export function countCats(arr) {
  return arr.reduce((m, a) => {
    (a.categorias || []).forEach(c => { m[c] = (m[c] || 0) + 1; });
    return m;
  }, {});
}
