import './style.css';
import { db } from './firebase.js';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { seedFirestore, ACOES as SEED_ACOES } from './data.js';
import { currentPhase } from './constants.js';
import { renderKPIs, renderThermometer, renderCharts, renderTimeline, renderTable, setupFilters } from './render.js';

// ── HTML shell ────────────────────────────────────────────────────────────────

const app = document.getElementById('app');
app.innerHTML = `
  <div id="loading-screen">
    <div class="loader-inner">
      <div class="loader-logo">MH</div>
      <div class="loader-text">Conectando ao banco de dados...</div>
      <div class="loader-bar"><div class="loader-bar-fill"></div></div>
    </div>
  </div>
  <main class="dashboard" style="display:none">
    <header>
      <div class="header-left">
        <div class="header-eyebrow">Agenda de Campanha</div>
        <div class="header-title">Marina Helou</div>
        <div class="header-sub">Dashboard Estratégico — Deputada Estadual SP</div>
      </div>
      <div class="header-right">
        <div class="phase-badge"><div class="phase-dot"></div><span id="phase-label"></span></div>
        <div class="date-badge" id="date-badge"></div>
      </div>
    </header>

    <div class="section-title">Visão Geral</div>
    <div class="kpi-grid" id="kpi-grid"></div>

    <div class="section-title">Termômetro Estratégico</div>
    <div class="balance-card">
      <div class="balance-header">
        <div>
          <div class="balance-title">Equilíbrio por Frente — Real vs. Meta da Fase</div>
          <div class="balance-subtitle" id="balance-phase-label"></div>
        </div>
        <div class="balance-alert" id="balance-alert" style="display:none">⚠ Atenção: há frentes fora da meta</div>
      </div>
      <div class="balance-rows" id="balance-rows"></div>
    </div>

    <div class="section-title">Distribuição</div>
    <div class="charts-grid">
      <div class="chart-card"><div class="chart-card-title">📌 Ações por Tipo</div><div class="chart-wrap"><canvas id="chart-tipo"></canvas></div></div>
      <div class="chart-card"><div class="chart-card-title">🔄 Funil de Status</div><div class="chart-wrap"><canvas id="chart-status"></canvas></div></div>
      <div class="chart-card"><div class="chart-card-title">🗂️ Ações por Categoria <span class="chip">Multi-categoria</span></div><div class="chart-wrap"><canvas id="chart-categoria"></canvas></div></div>
    </div>

    <div class="section-title">Próximas Ações com Data</div>
    <div class="timeline-grid" id="timeline-grid"></div>

    <div class="section-title" style="margin-top:24px">Todas as Ações</div>
    <div class="table-controls">
      <div class="search-wrap">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input class="search-input" id="search-input" type="text" placeholder="Buscar ação, local, categoria..." />
      </div>
      <select class="filter-select" id="filter-tipo">
        <option value="">Todos os tipos</option>
        <option>Mobilização</option><option>Relacionamento</option><option>Participação em Eventos</option><option>Comunicação</option><option>Território</option>
      </select>
      <select class="filter-select" id="filter-status">
        <option value="">Todos os status</option>
        <option>Sugerida</option><option>Em Construção</option><option>Confirmada</option><option>Realizada</option><option>Adiada</option><option>Cancelada</option>
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>Descrição</th><th>Local</th><th>Tipo</th><th>Categoria(s)</th><th>Status</th><th>Data</th><th>Público Est.</th>
        </tr></thead>
        <tbody id="table-body"></tbody>
      </table>
    </div>

    <footer>
      <div>Dashboard ao vivo via Firebase • mh-agenda-campanha-2026</div>
      <div id="footer-timestamp"></div>
    </footer>
  </main>

  <div class="modal-overlay" id="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title" id="modal-title"></div>
        <button class="modal-close" id="modal-close">✕</button>
      </div>
      <div class="modal-badges" id="modal-badges"></div>
      <div class="modal-grid" id="modal-grid"></div>
      <div id="modal-cats-wrap"></div>
      <div id="modal-obs-wrap"></div>
      <div id="modal-aval-wrap"></div>
    </div>
  </div>
`;

// ── Init ──────────────────────────────────────────────────────────────────────

const phase = currentPhase();
document.getElementById('phase-label').textContent = phase.nome;
document.getElementById('date-badge').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
document.getElementById('footer-timestamp').textContent = `Última atualização: ${new Date().toLocaleString('pt-BR')}`;

// ── Subscribe to Firestore (real-time) ────────────────────────────────────────

function renderAll(acoes) {
  renderKPIs(acoes);
  renderThermometer(acoes);
  renderCharts(acoes);
  renderTimeline(acoes);
  renderTable(acoes);
  setupFilters(acoes);
}

function showDashboard() {
  document.getElementById('loading-screen').style.display = 'none';
  document.querySelector('.dashboard').style.display = 'block';
}

function showError(msg) {
  document.getElementById('loading-screen').innerHTML = `
    <div class="loader-inner">
      <div style="font-size:48px">⚠️</div>
      <div class="loader-text" style="color:#f97316">${msg}</div>
    </div>
  `;
}

const q = query(collection(db, 'acoes'), orderBy('status'));

const unsub = onSnapshot(
  q,
  snapshot => {
    const acoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (acoes.length === 0) {
      // Banco vazio → seed automático na primeira execução
      console.log('Firestore vazio → populando com dados da planilha...');
      seedFirestore().then(() => console.log('Seed concluído!'));
      // onSnapshot vai reagir ao seed automaticamente
      return;
    }

    renderAll(acoes);
    showDashboard();
  },
  err => {
    console.error('Firestore error:', err);
    // Fallback: usa dados locais se Firestore estiver inacessível
    console.warn('Usando dados locais como fallback...');
    renderAll(SEED_ACOES);
    showDashboard();
  }
);
