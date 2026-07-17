import { Chart, registerables } from 'chart.js';
import { PALETTE, TIPO_FRENTE, TIPO_CLASS, STATUS_CLASS, currentPhase, countBy, countCats, parseDate, fmtDate, FASES, renderPrioridadeBadge } from './constants.js';
import { openViewModal } from './crud.js';

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
            <span style="color:${ok ? 'var(--green3)' : '#f97316'}">${diff >= 0 ? '+' : ''}${diff}pp</span>
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

function getChartColors() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return {
    ticksText: isLight ? '#0f172a' : '#86efac',
    ticksMuted: isLight ? '#64748b' : '#6b7a70',
    gridColor: isLight ? 'rgba(203,213,225,0.6)' : 'rgba(30,50,40,0.8)'
  };
}

export function renderCharts(acoes) {
  destroyCharts();
  const colors = getChartColors();

  // Tipo
  const tipoC = countBy(acoes, 'tipo');
  const tipoL = Object.keys(tipoC);
  charts.tipo = new Chart(document.getElementById('chart-tipo'), {
    type: 'bar',
    data: {
      labels: tipoL,
      datasets: [{ data: tipoL.map(k => tipoC[k]), backgroundColor: tipoL.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'), borderColor: tipoL.map((_, i) => PALETTE[i % PALETTE.length]), borderWidth: 1, borderRadius: 6 }],
    },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: colors.ticksMuted, font: { family: 'Inter', size: 11 } }, grid: { color: colors.gridColor } }, y: { ticks: { color: colors.ticksText, font: { family: 'Inter', size: 11 } }, grid: { display: false } } }, animation: { duration: 1000 } },
  });

  // Status
  const stC = countBy(acoes, 'status');
  const stL = Object.keys(stC);
  const stCols = { Realizada: '#22c55e', 'Em Construção': '#f59e0b', Sugerida: '#3b82f6', Confirmada: '#10b981', Adiada: '#f97316', Cancelada: '#ef4444' };
  charts.status = new Chart(document.getElementById('chart-status'), {
    type: 'doughnut',
    data: { labels: stL, datasets: [{ data: stL.map(k => stC[k]), backgroundColor: stL.map(k => (stCols[k] || '#888') + 'bb'), borderColor: stL.map(k => stCols[k] || '#888'), borderWidth: 2 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color: colors.ticksText, font: { family: 'Inter', size: 10 }, padding: 10, boxWidth: 10 } } }, animation: { animateRotate: true, duration: 1200 } },
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
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { title: (items) => catE[items[0].dataIndex][0] } } }, scales: { x: { ticks: { color: colors.ticksMuted, font: { family: 'Inter', size: 9 } }, grid: { display: false } }, y: { ticks: { color: colors.ticksMuted, font: { family: 'Inter', size: 11 }, stepSize: 1 }, grid: { color: colors.gridColor } } }, animation: { duration: 1000 } },
  });
}

// ── Sugestões ──────────────────────────────────────────────────────────────────

export function renderSugestoesSemData(acoes) {
  const sugestoes = acoes.filter(a => !a.data || a.status === 'Sugerida' || a.status === 'Em Construção');
  const grid = document.getElementById('sugestoes-grid');
  if (!grid) return;
  if (!sugestoes.length) {
    grid.innerHTML = '<div style="color:var(--muted);font-size:14px;padding:24px 0">Nenhuma agenda sugerida, em confirmação ou sem data no momento.</div>';
    return;
  }

  grid.innerHTML = sugestoes.map((a, i) => {
    return `
      <div class="sugestao-card" style="animation-delay:${i * 0.05}s" data-status="${a.status || ''}" data-id="${a.id || i}">
        <div class="sugestao-card-top">
          <div class="sugestao-card-desc">${a.descricao}</div>
          <div class="sugestao-card-date">${a.data ? fmtDate(a.data) : '🗓️ Data a definir'}</div>
        </div>
        <div class="sugestao-meta">
          ${renderPrioridadeBadge(a.prioridade)}
          ${badge(a.status, STATUS_CLASS[a.status] || '')}
          ${a.tipo ? badge(a.tipo, TIPO_CLASS[a.tipo] || '') : ''}
          ${a.estimativa ? `<span class="badge" style="background:rgba(255,255,255,0.05);color:var(--muted);border:1px solid var(--border)">👥 ${a.estimativa}</span>` : ''}
        </div>
        ${a.local ? `<div class="sugestao-local">📍 ${a.local}</div>` : ''}
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.sugestao-card').forEach((card, i) => {
    card.addEventListener('click', () => openViewModal(sugestoes[i]));
  });
}

// ── Table ─────────────────────────────────────────────────────────────────────

let _allAcoes = [];
let _filterState = {};

export function renderTable(acoes, filter = {}) {
  _allAcoes = acoes;
  applyFilter(filter);
}

export function applyFilter(filter = {}) {
  _filterState = filter;
  const search = (filter.search || '').toLowerCase();
  const tipo = filter.tipo || '';
  const status = filter.status || '';
  const prioridade = filter.prioridade || '';

  const filtered = _allAcoes.filter(a => {
    const catsStr = (a.categorias || []).join(' ').toLowerCase();
    const mS = !search || (a.descricao || '').toLowerCase().includes(search) || (a.local || '').toLowerCase().includes(search) || catsStr.includes(search);
    const mPrio = !prioridade || (a.prioridade || 'media').toLowerCase() === prioridade;
    return mS && (!tipo || a.tipo === tipo) && (!status || a.status === status) && mPrio;
  });

  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="no-data">Nenhuma ação encontrada.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(a => `
    <tr data-id="${a.id || ''}" data-status="${a.status || ''}">
      <td><div class="td-desc-text" title="${a.descricao}">${a.descricao}</div></td>
      <td class="td-local">${a.local ? '📍 ' + a.local : '—'}</td>
      <td>${badge(a.tipo || '—', TIPO_CLASS[a.tipo] || '')}</td>
      <td><div class="td-cats">${(a.categorias || []).map(catChip).join('')}</div></td>
      <td>${renderPrioridadeBadge(a.prioridade)}</td>
      <td>${badge(a.status || '—', STATUS_CLASS[a.status] || '')}</td>
      <td class="td-local">${a.data ? fmtDate(a.data) || '—' : '—'}</td>
      <td class="td-local">${a.estimativa || '—'}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr').forEach((tr, i) => {
    tr.addEventListener('click', () => openViewModal(filtered[i]));
  });
}

export function setupFilters(acoes, onFilterChange) {
  _allAcoes = acoes;
  const searchInput = document.getElementById('search-input');
  const filterTipo = document.getElementById('filter-tipo');
  const filterStatus = document.getElementById('filter-status');
  const filterPrioridade = document.getElementById('filter-prioridade');

  if (searchInput) {
    searchInput.oninput = e => {
      _filterState.search = e.target.value;
      applyFilter(_filterState);
      if (onFilterChange) onFilterChange(_allAcoes, _filterState);
    };
  }
  if (filterTipo) {
    filterTipo.onchange = e => {
      _filterState.tipo = e.target.value;
      applyFilter(_filterState);
      if (onFilterChange) onFilterChange(_allAcoes, _filterState);
    };
  }
  if (filterPrioridade) {
    filterPrioridade.onchange = e => {
      _filterState.prioridade = e.target.value;
      applyFilter(_filterState);
      if (onFilterChange) onFilterChange(_allAcoes, _filterState);
    };
  }
  if (filterStatus) {
    filterStatus.onchange = e => {
      _filterState.status = e.target.value;
      applyFilter(_filterState);
      if (onFilterChange) onFilterChange(_allAcoes, _filterState);
    };
  }

  const modalClose = document.getElementById('modal-close');
  const modalOverlay = document.getElementById('modal-overlay');
  if (modalClose) modalClose.onclick = () => modalOverlay.classList.remove('open');
  if (modalOverlay) {
    modalOverlay.onclick = e => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('open');
    };
  }
  document.onkeydown = e => {
    if (e.key === 'Escape' && modalOverlay) modalOverlay.classList.remove('open');
  };
}

