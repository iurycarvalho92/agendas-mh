import { Chart, registerables } from 'chart.js';
import { PALETTE, TIPO_FRENTE, TIPO_CLASS, STATUS_CLASS, currentPhase, countBy, countCats, parseDate, fmtDate, FASES } from './constants.js';

Chart.register(...registerables);

let charts = {};

// ── helpers ──────────────────────────────────────────────────────────────────

function destroyCharts() {
  Object.values(charts).forEach(c => c.destroy());
  charts = {};
}

function badge(text, cls) {
  return `<span class="badge ${cls || ''}">${text}</span>`;
}

function catChip(text) {
  return `<span class="cat-chip">${text}</span>`;
}

// ── KPI cards ─────────────────────────────────────────────────────────────────

export function renderKPIs(acoes) {
  const total = acoes.length;
  const realizadas = acoes.filter(a => a.status === 'Realizada').length;
  const emConst = acoes.filter(a => a.status === 'Em Construção').length;
  const sugeridas = acoes.filter(a => a.status === 'Sugerida').length;

  const kpis = [
    { label: 'Total de Ações', value: total, icon: '📋', pct: 100, sub: 'registradas no período', cls: '' },
    { label: 'Realizadas', value: realizadas, icon: '✅', pct: Math.round((realizadas / total) * 100), sub: `${Math.round((realizadas / total) * 100)}% do total`, cls: '' },
    { label: 'Em Construção', value: emConst, icon: '🔧', pct: Math.round((emConst / total) * 100), sub: `${Math.round((emConst / total) * 100)}% do total`, cls: 'amber' },
    { label: 'Sugeridas / Pendentes', value: sugeridas, icon: '💡', pct: Math.round((sugeridas / total) * 100), sub: 'aguardando decisão', cls: 'blue' },
  ];

  const grid = document.getElementById('kpi-grid');
  grid.innerHTML = kpis.map((k, i) => `
    <div class="kpi-card ${k.cls}" style="animation-delay:${i * 0.07}s">
      <div class="kpi-icon">${k.icon}</div>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" data-target="${k.value}">0</div>
      <div class="kpi-bar"><div class="kpi-bar-fill" style="width:0%" data-pct="${k.pct}"></div></div>
      <div class="kpi-sub">${k.sub}</div>
    </div>
  `).join('');

  requestAnimationFrame(() => {
    grid.querySelectorAll('.kpi-value').forEach(el => {
      const target = parseInt(el.dataset.target);
      let s = 0;
      const step = () => { s = Math.min(s + Math.ceil(target / 20), target); el.textContent = s; if (s < target) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    grid.querySelectorAll('.kpi-bar-fill').forEach(el => { el.style.width = el.dataset.pct + '%'; });
  });
}

// ── Thermometer ───────────────────────────────────────────────────────────────

export function renderThermometer(acoes) {
  const phase = currentPhase();
  const fc = { rua: 0, midia: 0, propositiva: 0 };
  acoes.forEach(a => { const f = TIPO_FRENTE[a.tipo]; if (f) fc[f]++; });
  const ft = Object.values(fc).reduce((a, b) => a + b, 0);
  const fp = {
    rua: ft ? Math.round((fc.rua / ft) * 100) : 0,
    midia: ft ? Math.round((fc.midia / ft) * 100) : 0,
    propositiva: ft ? Math.round((fc.propositiva / ft) * 100) : 0,
  };

  document.getElementById('balance-phase-label').textContent =
    `Fase atual: ${phase.nome} — Metas: Rua ${phase.metas.rua}% | Mídia ${phase.metas.midia}% | Propositiva ${phase.metas.propositiva}%`;

  const rows = [
    { label: '🟠 Rua (Mobilização + Território)', color: '#f97316', pct: fp.rua, meta: phase.metas.rua },
    { label: '🔵 Mídia (Comunicação)', color: '#3b82f6', pct: fp.midia, meta: phase.metas.midia },
    { label: '🟢 Propositiva / Relacionamento', color: '#22c55e', pct: fp.propositiva, meta: phase.metas.propositiva },
  ];

  let hasAlert = false;
  const container = document.getElementById('balance-rows');
  container.innerHTML = rows.map(b => {
    const diff = b.pct - b.meta;
    const ok = Math.abs(diff) <= 8;
    if (!ok) hasAlert = true;
    return `
      <div class="balance-row">
        <div class="balance-row-header">
          <div class="balance-row-label"><div class="dot" style="background:${b.color}"></div>${b.label}</div>
          <div class="balance-row-values">
            <span style="color:${b.color}">${b.pct}% real</span>
            <span>meta: ${b.meta}%</span>
            <span style="color:${ok ? '#4ade80' : '#f97316'}">${diff >= 0 ? '+' : ''}${diff}pp</span>
          </div>
        </div>
        <div class="balance-track">
          <div class="balance-fill" style="width:0%;background:${b.color}" data-pct="${Math.min(b.pct, 100)}"></div>
          <div class="balance-target-line" style="left:${b.meta}%" data-label="meta ${b.meta}%"></div>
        </div>
      </div>
    `;
  }).join('');

  if (hasAlert) document.getElementById('balance-alert').style.display = 'inline-flex';

  setTimeout(() => {
    container.querySelectorAll('.balance-fill').forEach(el => { el.style.width = el.dataset.pct + '%'; });
  }, 200);
}

// ── Charts ────────────────────────────────────────────────────────────────────

export function renderCharts(acoes) {
  destroyCharts();

  // Tipo
  const tipoC = countBy(acoes, 'tipo');
  const tipoL = Object.keys(tipoC);
  charts.tipo = new Chart(document.getElementById('chart-tipo'), {
    type: 'bar',
    data: {
      labels: tipoL,
      datasets: [{ data: tipoL.map(k => tipoC[k]), backgroundColor: tipoL.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'), borderColor: tipoL.map((_, i) => PALETTE[i % PALETTE.length]), borderWidth: 1, borderRadius: 6 }],
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#6b7a70', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(30,50,40,0.8)' } }, y: { ticks: { color: '#86efac', font: { family: 'Inter', size: 11 } }, grid: { display: false } } }, animation: { duration: 1000 } },
  });

  // Status
  const stC = countBy(acoes, 'status');
  const stL = Object.keys(stC);
  const stCols = { Realizada: '#22c55e', 'Em Construção': '#f59e0b', Sugerida: '#3b82f6', Confirmada: '#10b981', Adiada: '#f97316', Cancelada: '#ef4444' };
  charts.status = new Chart(document.getElementById('chart-status'), {
    type: 'doughnut',
    data: { labels: stL, datasets: [{ data: stL.map(k => stC[k]), backgroundColor: stL.map(k => (stCols[k] || '#888') + 'bb'), borderColor: stL.map(k => stCols[k] || '#888'), borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: '#86efac', font: { family: 'Inter', size: 10 }, padding: 10, boxWidth: 10 } } }, animation: { animateRotate: true, duration: 1200 } },
  });

  // Categorias (multi-categoria)
  const catC = countCats(acoes);
  const catE = Object.entries(catC).sort((a, b) => b[1] - a[1]);
  charts.cat = new Chart(document.getElementById('chart-categoria'), {
    type: 'bar',
    data: {
      labels: catE.map(([k]) => k.length > 18 ? k.slice(0, 16) + '…' : k),
      datasets: [{ data: catE.map(([, v]) => v), backgroundColor: catE.map((_, i) => PALETTE[i % PALETTE.length] + 'bb'), borderColor: catE.map((_, i) => PALETTE[i % PALETTE.length]), borderWidth: 1, borderRadius: 6 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => catE[items[0].dataIndex][0] } } }, scales: { x: { ticks: { color: '#6b7a70', font: { family: 'Inter', size: 9 } }, grid: { display: false } }, y: { ticks: { color: '#6b7a70', font: { family: 'Inter', size: 11 }, stepSize: 1 }, grid: { color: 'rgba(30,50,40,0.8)' } } }, animation: { duration: 1000 } },
  });
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export function renderTimeline(acoes) {
  const today = new Date();
  const withDate = acoes
    .filter(a => a.data)
    .map(a => ({ ...a, _dt: parseDate(a.data) }))
    .filter(a => a._dt && a._dt >= today)
    .sort((a, b) => a._dt - b._dt);

  const grid = document.getElementById('timeline-grid');
  if (!withDate.length) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:14px;padding:24px 0">Nenhuma ação futura com data definida.</div>';
    return;
  }

  grid.innerHTML = withDate.map((a, i) => {
    const days = Math.ceil((a._dt - today) / (1000 * 60 * 60 * 24));
    const uc = days <= 7 ? 'urgente' : days <= 21 ? 'breve' : '';
    const up = Math.max(5, Math.min(100, 100 - days * 1.2));
    const urgColor = uc === 'urgente' ? '#f97316' : uc === 'breve' ? '#f59e0b' : '#22c55e';
    return `
      <div class="timeline-card" style="animation-delay:${i * 0.07}s" data-id="${a.id || i}">
        <div class="timeline-card-top">
          <div class="timeline-card-desc">${a.descricao}</div>
          <div class="timeline-date ${uc}">${a._dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
        </div>
        <div class="timeline-meta">
          ${badge(a.status, STATUS_CLASS[a.status] || '')}
          ${a.tipo ? badge(a.tipo, TIPO_CLASS[a.tipo] || '') : ''}
          ${a.estimativa ? `<span class="badge" style="background:rgba(255,255,255,0.05);color:var(--muted);border:1px solid var(--border)">👥 ${a.estimativa}</span>` : ''}
        </div>
        ${a.local ? `<div class="timeline-local">📍 ${a.local}</div>` : ''}
        <div class="urgency-bar"><div class="urgency-fill" style="width:0%;background:${urgColor}" data-pct="${up}"></div></div>
      </div>
    `;
  }).join('');

  setTimeout(() => { grid.querySelectorAll('.urgency-fill').forEach(el => { el.style.width = el.dataset.pct + '%'; }); }, 300);

  // Attach click → modal
  grid.querySelectorAll('.timeline-card').forEach((card, i) => {
    card.addEventListener('click', () => openModal(withDate[i]));
  });
}

// ── Table ─────────────────────────────────────────────────────────────────────

let _allAcoes = [];

export function renderTable(acoes, filter = {}) {
  _allAcoes = acoes;
  applyFilter(filter);
}

function applyFilter(filter = {}) {
  const search = (filter.search || '').toLowerCase();
  const tipo = filter.tipo || '';
  const status = filter.status || '';

  const filtered = _allAcoes.filter(a => {
    const catsStr = (a.categorias || []).join(' ').toLowerCase();
    const mS = !search || (a.descricao || '').toLowerCase().includes(search) || (a.local || '').toLowerCase().includes(search) || catsStr.includes(search);
    return mS && (!tipo || a.tipo === tipo) && (!status || a.status === status);
  });

  const tbody = document.getElementById('table-body');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">Nenhuma ação encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(a => `
    <tr data-id="${a.id || ''}">
      <td><div class="td-desc-text" title="${a.descricao}">${a.descricao}</div></td>
      <td class="td-local">${a.local ? '📍 ' + a.local : '—'}</td>
      <td>${badge(a.tipo || '—', TIPO_CLASS[a.tipo] || '')}</td>
      <td><div class="td-cats">${(a.categorias || []).map(catChip).join('')}</div></td>
      <td>${badge(a.status || '—', STATUS_CLASS[a.status] || '')}</td>
      <td class="td-local">${a.data ? fmtDate(a.data) || '—' : '—'}</td>
      <td class="td-local">${a.estimativa || '—'}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr').forEach((tr, i) => {
    tr.addEventListener('click', () => openModal(filtered[i]));
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export function openModal(a) {
  document.getElementById('modal-title').textContent = a.descricao;
  document.getElementById('modal-badges').innerHTML = [
    a.status ? badge(a.status, STATUS_CLASS[a.status] || '') : '',
    a.tipo ? badge(a.tipo, TIPO_CLASS[a.tipo] || '') : '',
  ].join('');

  const fields = [
    ['Local', a.local || '—'],
    ['Data', a.data ? fmtDate(a.data) || '—' : '—'],
    ['Sugerido por', a.sugerido_por || '—'],
    ['Envolvidos', a.envolvidos || '—'],
    ['Público estimado', a.estimativa || '—'],
  ];
  document.getElementById('modal-grid').innerHTML = fields.map(([l, v]) => `
    <div class="modal-field">
      <div class="modal-field-label">${l}</div>
      <div class="modal-field-value">${v}</div>
    </div>
  `).join('');

  const cats = a.categorias || [];
  document.getElementById('modal-cats-wrap').innerHTML = cats.length
    ? `<div class="modal-divider"></div><div class="modal-field-label" style="margin-bottom:8px">Categorias</div><div class="modal-cats">${cats.map(c => `<span class="cat-chip" style="font-size:11px;padding:4px 10px">${c}</span>`).join('')}</div>`
    : '';

  document.getElementById('modal-obs-wrap').innerHTML = a.observacoes
    ? `<div class="modal-divider"></div><div class="modal-field-label" style="margin-bottom:8px">⚠️ Observações</div><div class="modal-observacao">${a.observacoes}</div>`
    : '';

  document.getElementById('modal-aval-wrap').innerHTML = a.avaliacao
    ? `<div class="modal-divider"></div><div class="modal-field-label" style="margin-bottom:8px">💬 Avaliação</div><div class="modal-avaliacao">${a.avaliacao}</div>`
    : '';

  document.getElementById('modal-overlay').classList.add('open');
}

export function setupFilters(acoes) {
  let filterState = {};
  document.getElementById('search-input').addEventListener('input', e => { filterState.search = e.target.value; applyFilter(filterState); });
  document.getElementById('filter-tipo').addEventListener('change', e => { filterState.tipo = e.target.value; applyFilter(filterState); });
  document.getElementById('filter-status').addEventListener('change', e => { filterState.status = e.target.value; applyFilter(filterState); });

  document.getElementById('modal-close').addEventListener('click', () => document.getElementById('modal-overlay').classList.remove('open'));
  document.getElementById('modal-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) document.getElementById('modal-overlay').classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.getElementById('modal-overlay').classList.remove('open'); });
}
