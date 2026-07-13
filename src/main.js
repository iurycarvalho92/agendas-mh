import './style.css';
import { db } from './firebase.js';
import { collection, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { ACOES as SEED_ACOES } from './data.js';
import { currentPhase } from './constants.js';
import { renderKPIs, renderThermometer, renderCharts, renderTimeline, renderTable, setupFilters } from './render.js';
import { renderGuiaSection, renderEstrategiaSection, renderMonthlyCalendar, renderWeeklyCalendar, renderRoadToElection } from './views.js';
import { setupCRUDHandlers, openCreateModal } from './crud.js';

let _cachedAcoes = [];
let _activeViewMode = 'lista';
let _currentFilterState = {};

// ── Seed automático ───────────────────────────────────────────────────────────

async function seedFirestore() {
  console.log('Verificando inicialização de dados...');
  for (const acao of SEED_ACOES) {
    try {
      await setDoc(doc(db, 'acoes', acao.id), acao);
    } catch (e) {
      console.warn('Seed avultado ignorable:', e.message);
    }
  }
}

// ── DOM Shell ─────────────────────────────────────────────────────────────────

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
        <div class="header-eyebrow">Agenda de Campanha 2026</div>
        <div class="header-title">Marina Helou</div>
        <div class="header-sub">Dashboard de Trabalho Estratégico — Deputada Estadual SP</div>
      </div>
      <div class="header-right">
        <button class="btn-new-action" id="btn-new-action">➕ Nova Agenda / Sugestão</button>
        <div class="phase-badge"><div class="phase-dot"></div><span id="phase-label"></span></div>
        <div class="date-badge" id="date-badge"></div>
      </div>
    </header>

    <nav class="main-nav">
      <button class="nav-btn active" data-section="dashboard">📊 Dashboard & Agendas</button>
      <button class="nav-btn" data-section="guia">📖 Guia de Preenchimento</button>
      <button class="nav-btn" data-section="estrategia">🎯 Estratégia & Critérios</button>
    </nav>

    <div id="section-dashboard" class="nav-section active">
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

      <div class="section-header-row" style="margin-top:32px">
        <div class="section-title" style="margin:0">Todas as Ações</div>
        <div class="view-tabs">
          <button class="view-btn active" data-view="lista">📑 Lista / Tabela</button>
          <button class="view-btn" data-view="mes">📅 Calendário Mensal</button>
          <button class="view-btn" data-view="semana">📆 Calendário Semanal</button>
          <button class="view-btn" data-view="roadmap">🏁 Até a Eleição (06/10)</button>
        </div>
      </div>

      <div class="table-controls" id="view-lista-controls">
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

      <div id="view-lista" class="view-container active">
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Descrição</th><th>Local</th><th>Tipo</th><th>Categoria(s)</th><th>Status</th><th>Data</th><th>Público Est.</th>
            </tr></thead>
            <tbody id="table-body"></tbody>
          </table>
        </div>
      </div>

      <div id="view-mes" class="view-container" style="display:none"></div>
      <div id="view-semana" class="view-container" style="display:none"></div>
      <div id="view-roadmap" class="view-container" style="display:none"></div>
    </div>

    <div id="section-guia" class="nav-section" style="display:none"></div>
    <div id="section-estrategia" class="nav-section" style="display:none"></div>

    <footer>
      <div>Dashboard ao vivo via Firebase Cloud • mh-agenda-campanha-2026</div>
      <div id="footer-timestamp"></div>
    </footer>
  </main>

  <div class="modal-overlay" id="modal-overlay">
    <div class="modal" id="modal-box">
      <!-- MODO VISUALIZAÇÃO -->
      <div id="modal-view-container">
        <div class="modal-header">
          <div class="modal-title" id="modal-title"></div>
          <button class="modal-close" id="modal-close">✕</button>
        </div>
        <div class="modal-badges" id="modal-badges"></div>
        <div class="modal-grid" id="modal-grid"></div>
        <div id="modal-cats-wrap"></div>
        <div id="modal-obs-wrap"></div>
        <div id="modal-aval-wrap"></div>
        <div class="modal-actions-bar">
          <button class="btn-primary" id="btn-edit-action">✏️ Editar Ação</button>
          <button class="btn-danger" id="btn-delete-action">🗑️ Excluir Ação</button>
        </div>
      </div>

      <!-- MODO FORMULÁRIO (CRIAÇÃO / EDIÇÃO) -->
      <div id="modal-form-container" style="display:none">
        <div class="modal-header">
          <div class="modal-title" id="modal-form-title">➕ Nova Agenda</div>
        </div>
        <form id="crud-form" class="crud-form">
          <div class="form-row">
            <div class="form-group full-width">
              <label>Descrição da Agenda / Ação *</label>
              <input type="text" id="form-descricao" placeholder="Ex.: Roda de conversa sobre saúde e primeira infância..." required />
            </div>
          </div>
          <div class="form-row grid-2">
            <div class="form-group">
              <label>Tipo (Frente de Campanha)</label>
              <select id="form-tipo">
                <option value="Mobilização">Mobilização</option>
                <option value="Relacionamento">Relacionamento</option>
                <option value="Participação em Eventos">Participação em Eventos</option>
                <option value="Comunicação">Comunicação</option>
                <option value="Território">Território</option>
              </select>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select id="form-status">
                <option value="Sugerida">Sugerida</option>
                <option value="Em Construção">Em Construção</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Realizada">Realizada</option>
                <option value="Adiada">Adiada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>
          <div class="form-group full-width">
            <label>Categorias (Selecione uma ou mais)</label>
            <div class="form-categories-chips" id="form-categories-chips"></div>
          </div>
          <div class="form-row grid-2">
            <div class="form-group">
              <label>Data Prevista</label>
              <input type="date" id="form-data" />
            </div>
            <div class="form-group">
              <label>Local (Bairro / Cidade)</label>
              <input type="text" id="form-local" placeholder="Ex.: Pinheiros, Mauá, Comitê..." />
            </div>
          </div>
          <div class="form-row grid-3">
            <div class="form-group">
              <label>Sugerido por</label>
              <input type="text" id="form-sugerido" placeholder="Nome de quem sugeriu" />
            </div>
            <div class="form-group">
              <label>Envolvidos / Articuladores</label>
              <input type="text" id="form-envolvidos" placeholder="Equipe ou parceiros" />
            </div>
            <div class="form-group">
              <label>Público Estimado</label>
              <input type="text" id="form-estimativa" placeholder="Ex.: 20 pessoas" />
            </div>
          </div>
          <div class="form-group full-width">
            <label>Observações / Logística</label>
            <textarea id="form-observacoes" rows="2" placeholder="Autorizações, contatos, riscos, materiais necessários..."></textarea>
          </div>
          <div class="form-group full-width">
            <label>Avaliação Pós-Agenda</label>
            <textarea id="form-avaliacao" rows="2" placeholder="Como foi o evento, retornos de apoios, encaminhamentos..."></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" id="btn-cancel-form">Cancelar</button>
            <button type="submit" class="btn-primary" id="btn-save-form">💾 Salvar no Banco</button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

// ── Init & Event Handlers ─────────────────────────────────────────────────────

const phase = currentPhase();
document.getElementById('phase-label').textContent = phase.nome;
document.getElementById('date-badge').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
document.getElementById('footer-timestamp').textContent = `Última atualização: ${new Date().toLocaleString('pt-BR')}`;

setupCRUDHandlers();
setupFilters(_cachedAcoes, (acoes, filterState) => {
  _currentFilterState = filterState;
  updateActiveViews(acoes, filterState);
});

// Navegação de Abas Principais (Dashboard vs Guia vs Estratégia)
document.querySelectorAll('.main-nav .nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.main-nav .nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-section').forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    btn.classList.add('active');
    const secId = 'section-' + btn.dataset.section;
    const target = document.getElementById(secId);
    if (target) {
      target.classList.add('active');
      target.style.display = 'block';
    }

    if (btn.dataset.section === 'guia') renderGuiaSection();
    if (btn.dataset.section === 'estrategia') renderEstrategiaSection();
  });
});

// Navegação de Modos de Visualização (Lista vs Mês vs Semana vs Roadmap)
document.querySelectorAll('.view-tabs .view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-tabs .view-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.view-container').forEach(c => {
      c.classList.remove('active');
      c.style.display = 'none';
    });

    btn.classList.add('active');
    _activeViewMode = btn.dataset.view;
    const target = document.getElementById('view-' + _activeViewMode);
    if (target) {
      target.classList.add('active');
      target.style.display = 'block';
    }

    updateActiveViews(_cachedAcoes, _currentFilterState);
  });
});

function updateActiveViews(acoes, filter) {
  if (_activeViewMode === 'lista') renderTable(acoes, filter);
  if (_activeViewMode === 'mes') renderMonthlyCalendar(acoes, filter);
  if (_activeViewMode === 'semana') renderWeeklyCalendar(acoes, filter);
  if (_activeViewMode === 'roadmap') renderRoadToElection(acoes, filter);
}

function renderAll(acoes) {
  _cachedAcoes = acoes;
  renderKPIs(acoes);
  renderThermometer(acoes);
  renderCharts(acoes);
  renderTimeline(acoes);
  updateActiveViews(acoes, _currentFilterState);
}

function showDashboard() {
  document.getElementById('loading-screen').style.display = 'none';
  document.querySelector('.dashboard').style.display = 'block';
}

const q = query(collection(db, 'acoes'));

const unsub = onSnapshot(
  q,
  snapshot => {
    const acoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (acoes.length === 0) {
      console.log('Firestore vazio → disparando seed em segundo plano...');
      seedFirestore();
      renderAll(SEED_ACOES);
      showDashboard();
      return;
    }

    renderAll(acoes);
    showDashboard();
  },
  err => {
    console.error('Firestore error:', err);
    console.warn('Usando dados locais como fallback...');
    renderAll(SEED_ACOES);
    showDashboard();
  }
);
