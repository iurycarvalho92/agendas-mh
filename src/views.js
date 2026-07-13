import { openViewModal } from './crud.js';
import { STATUS_CLASS, TIPO_CLASS, fmtDate } from './constants.js';

function badge(text, cls) {
  return `<span class="badge ${cls || ''}">${text || '—'}</span>`;
}

// ── Guia de Preenchimento ───────────────────────────────────────────────────

export function renderGuiaSection() {
  const el = document.getElementById('section-guia');
  if (!el) return;
  el.innerHTML = `
    <div class="views-header">
      <div class="views-title">📖 Guia de Uso e Preenchimento da Agenda</div>
      <div class="views-sub">Instruções operacionais completas para cadastro e acompanhamento das ações de campanha</div>
    </div>

    <div class="guia-card">
      <div class="guia-card-title">1. Como preencher os campos no Dashboard / Formulário</div>
      <ul class="guia-list">
        <li><strong>Descrição da Ação:</strong> resuma em uma linha clara o que será feito (ex.: <em>'Roda de conversa sobre saúde e primeira infância no bairro X'</em>).</li>
        <li><strong>Tipo de Ação (Frente):</strong> selecione no menu suspenso a categoria macro: <code>Mobilização</code>, <code>Relacionamento</code>, <code>Participação em Eventos</code>, <code>Comunicação</code> ou <code>Território</code>.</li>
        <li><strong>Categorias:</strong> selecione uma ou mais categorias (chips) que definem o formato exato (ex.: <em>Roda de conversa</em>, <em>Encontro com lideranças</em>, <em>Entrevista/Podcast</em>).</li>
        <li><strong>Status:</strong> acompanhe a evolução usando: <code>Sugerida</code> (aguardando aprovação), <code>Em Construção</code> (organizando logística), <code>Confirmada</code>, <code>Realizada</code>, <code>Adiada</code> ou <code>Cancelada</code>.</li>
        <li><strong>Data:</strong> defina a data provável ou exata (YYYY-MM-DD) para que a ação apareça na linha do tempo e nos calendários.</li>
        <li><strong>Local:</strong> indique o bairro, cidade ou espaço (ex.: <em>Pinheiros</em>, <em>Mauá</em>, <em>Comitê</em>).</li>
        <li><strong>Público Estimado:</strong> quantidade de pessoas previstas ou presentes (ex.: <em>20 pessoas</em>, <em>150 pessoas</em>).</li>
        <li><strong>Observações:</strong> anote autorizações necessárias, riscos logísticos, contatos importantes ou materiais (ex.: <em>Confirmar autorização da prefeitura para som</em>).</li>
        <li><strong>Avaliação Pós-Agenda:</strong> após a realização, registre como foi o engajamento, retornos de apoios e próximos passos (ex.: <em>Engajou muitas mulheres, saiu +1 roda de conversa</em>).</li>
      </ul>
    </div>

    <div class="guia-card">
      <div class="guia-card-title">2. Classificação Oficial dos Tipos de Ação</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Tipo / Frente</th><th>Foco</th><th>Exemplos de Categorias e Formatos</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>${badge('Mobilização', TIPO_CLASS['Mobilização'])}</td>
              <td><strong>Rua</strong></td>
              <td>Adesivaço, panfletaço, caminhada, carreata, corpo a corpo no comércio.</td>
            </tr>
            <tr>
              <td>${badge('Relacionamento', TIPO_CLASS['Relacionamento'])}</td>
              <td><strong>Rua / Base</strong></td>
              <td>Encontro com líderes comunitários, encontro com segmentos (professores, saúde, mães), lideranças de dobradas, rodas de conversa, conversas 1:1.</td>
            </tr>
            <tr>
              <td>${badge('Participação em Eventos', TIPO_CLASS['Participação em Eventos'])}</td>
              <td><strong>Rua / Institucional</strong></td>
              <td>Feiras, convenções, seminários, eventos de terceiros, agendas institucionais (audiências públicas, ALESP).</td>
            </tr>
            <tr>
              <td>${badge('Comunicação', TIPO_CLASS['Comunicação'])}</td>
              <td><strong>Mídia</strong></td>
              <td>Podcasts, entrevistas em rádios/jornais, gravação de vídeos para redes sociais, debates.</td>
            </tr>
            <tr>
              <td>${badge('Território / Temática', TIPO_CLASS['Território'])}</td>
              <td><strong>Propositiva / Rua</strong></td>
              <td>Rodas de conversa por tema de mandato, visitas técnicas a locais que embasam propostas (escolas, cooperativas, ONGs).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="guia-card">
      <div class="guia-card-title">3. Equilíbrio de Frentes: Rua x Mídia x Propositiva</div>
      <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Use como referência de planejamento ao olhar o <strong>Termômetro Estratégico</strong> na aba Dashboard:</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Fase da Campanha</th><th>Metas de Equilíbrio</th><th>Prioridade Estratégica Sugerida</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Pré-Campanha</strong><br><span style="font-size:11px;color:var(--muted)">Até 15/08</span></td>
              <td>🟢 50% Propositiva/Relac.<br>🟠 30% Rua<br>🔵 20% Mídia</td>
              <td>Foco total em construir base de propostas, mapear lideranças regionais e fortalecer relações em territórios prioritários.</td>
            </tr>
            <tr>
              <td><strong>Campanha</strong><br><span style="font-size:11px;color:var(--muted)">15/08 a 18/09</span></td>
              <td>🟠 35% Rua<br>🔵 35% Mídia<br>🟢 30% Propositiva/Relac.</td>
              <td>Equilíbrio ativo entre as três frentes. Intensificar a presença territorial e consolidar o reconhecimento público da mensagem.</td>
            </tr>
            <tr>
              <td><strong>Reta Final</strong><br><span style="font-size:11px;color:var(--muted)">19/09 a 03/10</span></td>
              <td>🟠 45% Rua<br>🔵 40% Mídia<br>🟢 15% Propositiva/Relac.</td>
              <td>Foco máximo em mobilização de rua e explosão de mídia para maximizar visibilidade e conversão final de eleitores indecisos.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── Estratégia de Agenda ────────────────────────────────────────────────────

export function renderEstrategiaSection() {
  const el = document.getElementById('section-estrategia');
  if (!el) return;
  el.innerHTML = `
    <div class="views-header">
      <div class="views-title">🎯 Estratégia de Agenda & Territorial</div>
      <div class="views-sub">Norteadores estratégicos, prioridades regionais e critérios de decisão para alocação do tempo da candidata</div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));margin-bottom:24px">
      <div class="kpi-card" style="border-left:4px solid #f97316">
        <div class="kpi-label">Norteador 1</div>
        <div style="font-size:18px;font-weight:700;color:#fff;margin:8px 0">Alcançar Regiões Prioritárias</div>
        <div class="kpi-sub">Presença intensiva e regular na Capital (Zona Oeste) e municípios estratégicos mapeados.</div>
      </div>
      <div class="kpi-card" style="border-left:4px solid #22c55e">
        <div class="kpi-label">Norteador 2</div>
        <div style="font-size:18px;font-weight:700;color:#fff;margin:8px 0">Fortalecimento da Base</div>
        <div class="kpi-sub">Consolidar rede de apoiadores, voluntários e articuladores regionais com escuta ativa.</div>
      </div>
      <div class="kpi-card" style="border-left:4px solid #3b82f6">
        <div class="kpi-label">Norteador 3</div>
        <div style="font-size:18px;font-weight:700;color:#fff;margin:8px 0">Gerar Visibilidade & Engajamento</div>
        <div class="kpi-sub">Transformar toda presença territorial em reconhecimento público e mobilização nas redes.</div>
      </div>
    </div>

    <div class="guia-card">
      <div class="guia-card-title">Estratégia por Fase da Campanha</div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Fase</th><th>Objetivo Principal</th><th>Prioridades e Entregas de Agenda</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong style="color:#22c55e">PRÉ-CAMPANHA</strong><br><span style="font-size:12px;color:var(--muted)">Até 15 de Agosto</span></td>
              <td>Construir presença territorial, fortalecer relações políticas e ampliar a rede de apoio antes do início oficial da campanha.</td>
              <td>
                <ul style="margin:0;padding-left:16px;font-size:13px">
                  <li>Mapeamento das regiões prioritárias e temas locais relevantes.</li>
                  <li>Reuniões qualificadas com lideranças e segmentos organizados.</li>
                  <li>Visitas de escuta: associações, bairros, cooperativas, ONGs e escolas.</li>
                  <li>Priorizar agendas menores com tempo de qualidade para diálogo.</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td><strong style="color:#f59e0b">CAMPANHA</strong><br><span style="font-size:12px;color:var(--muted)">15/08 a 18/09</span></td>
              <td>Ampliar visibilidade, consolidar apoio e transformar presença territorial em reconhecimento público de massa.</td>
              <td>
                <ul style="margin:0;padding-left:16px;font-size:13px">
                  <li>Atos públicos, encontros com apoiadores e caminhadas em feiras/comércio.</li>
                  <li>Reuniões temáticas (Meio Ambiente, Mulheres, Mães, Juventude).</li>
                  <li>Participação em entrevistas, debates e eventos de grande circulação.</li>
                  <li>Agenda de rua diária com foco em proximidade com a população.</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td><strong style="color:#f97316">RETA FINAL</strong><br><span style="font-size:12px;color:var(--muted)">19/09 a 03/10</span></td>
              <td>Maximizar visibilidade, mobilizar apoiadores ao máximo e reforçar presença nas zonas e dobradas decisivas.</td>
              <td>
                <ul style="margin:0;padding-left:16px;font-size:13px">
                  <li>Eventos de alta mobilização (panfletaços gigantes, adesivaços, carreatas).</li>
                  <li>Presença intensiva diária nas regiões prioritárias (ex.: Capital - Zona Oeste).</li>
                  <li>Agendas simbólicas em locais que representem as pautas centrais.</li>
                  <li>Conversão de eleitores indecisos com engajamento total da base.</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="guia-card">
      <div class="guia-card-title">Estratégia para Viagens e Regiões Distantes</div>
      <p style="color:var(--muted);font-size:13px;margin-bottom:12px">Para justificar o deslocamento para municípios distantes da capital, toda viagem deve possuir uma <strong>Agenda Âncora</strong> conectada a agendas complementares:</p>
      <div class="grid-estrategia-distante">
        <div class="card-pilar">
          <div class="card-pilar-title">1. Agenda Âncora (Obrigatória)</div>
          <p>Evento relevante de alto impacto na cidade (ex.: seminário estadual, convenção do partido, grande ato público) ou visita institucional a local que recebeu emenda/projeto da deputada.</p>
        </div>
        <div class="card-pilar">
          <div class="card-pilar-title">2. Encontro Político / Lideranças</div>
          <p>Reunião de alinhamento com lideranças locais, vereadores, prefeitos ou segmentos organizados que possam ampliar a votação e estrutura no município.</p>
        </div>
        <div class="card-pilar">
          <div class="card-pilar-title">3. Roda Temática / Apoiadores</div>
          <p>Encontro com apoiadores locais, voluntários ou roda de conversa temática para escuta de demandas e consolidação do grupo regional.</p>
        </div>
      </div>
    </div>

    <div class="guia-card">
      <div class="guia-card-title">Os 5 Critérios de Ouro para Aprovação de Agendas</div>
      <p style="color:var(--muted);font-size:13px;margin-bottom:16px">Toda sugestão de agenda deve ser avaliada contra estes 5 critérios antes da confirmação:</p>
      <div class="criterios-grid">
        <div class="criterio-item">
          <div class="criterio-header"><span>📍 Relevância Territorial</span><span class="criterio-prio prio-alta">!!! ALTA</span></div>
          <p>Municípios ou regiões com maior potencial político, histórico de votação e presença ativa de apoiadores da Marina Helou.</p>
        </div>
        <div class="criterio-item">
          <div class="criterio-header"><span>👥 Capacidade de Mobilização</span><span class="criterio-prio prio-alta">!!! ALTA</span></div>
          <p>Locais onde a visita tem garantia de gerar participação significativa de pessoas, fotos/vídeos impactantes e energia.</p>
        </div>
        <div class="criterio-item">
          <div class="criterio-header"><span>🤝 Presença de Lideranças Estratégicas</span><span class="criterio-prio prio-alta">!!! ALTA</span></div>
          <p>Regiões que contam com lideranças fortes, articuladores ou dobradas capazes de multiplicar a rede de apoio.</p>
        </div>
        <div class="criterio-item">
          <div class="criterio-header"><span>💬 Temas Locais Relevantes</span><span class="criterio-prio prio-media">! MÉDIA</span></div>
          <p>Cidades ou bairros com pautas urgentes que dialoguem diretamente com a atuação, leis e propostas do mandato da deputada.</p>
        </div>
        <div class="criterio-item">
          <div class="criterio-header"><span>🚗 Viabilidade Logística</span><span class="criterio-prio prio-media">! MÉDIA</span></div>
          <p>Possibilidade de encaixar várias agendas qualificadas no mesmo deslocamento, otimizando o tempo e recursos da equipe.</p>
        </div>
      </div>
    </div>
  `;
}

// ── Calendário Mensal ───────────────────────────────────────────────────────

let _curYear = 2026;
let _curMonth = 7; // 0-indexed (7 = Agosto)

export function renderMonthlyCalendar(acoes, filter = {}) {
  const container = document.getElementById('view-mes');
  if (!container) return;

  // Filtrar acoes por texto/tipo/status
  const filtered = acoes.filter(a => {
    const search = (filter.search || '').toLowerCase();
    const catsStr = (a.categorias || []).join(' ').toLowerCase();
    const mS = !search || (a.descricao || '').toLowerCase().includes(search) || (a.local || '').toLowerCase().includes(search) || catsStr.includes(search);
    return mS && (!filter.tipo || a.tipo === filter.tipo) && (!filter.status || a.status === filter.status);
  });

  const firstDay = new Date(_curYear, _curMonth, 1);
  const lastDay = new Date(_curYear, _curMonth + 1, 0);
  const monthName = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Agrupar acoes com data no mes
  const byDay = {};
  filtered.forEach(a => {
    if (!a.data) return;
    const raw = a.data.split(' ')[0].split('T')[0];
    const [y, m, d] = raw.split('-').map(Number);
    if (y === _curYear && m - 1 === _curMonth) {
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(a);
    }
  });

  const startWeekDay = firstDay.getDay(); // 0 = Dom
  const totalDays = lastDay.getDate();

  let cellsHtml = '';
  for (let i = 0; i < startWeekDay; i++) {
    cellsHtml += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= totalDays; d++) {
    const dayActions = byDay[d] || [];
    cellsHtml += `
      <div class="cal-day ${dayActions.length ? 'has-events' : ''}">
        <div class="cal-day-num">${d}</div>
        <div class="cal-events">
          ${dayActions.map(a => {
            const stCol = a.status === 'Realizada' ? '#22c55e' : a.status === 'Confirmada' ? '#10b981' : a.status === 'Em Construção' ? '#f59e0b' : '#3b82f6';
            return `<div class="cal-event-chip" style="border-left:3px solid ${stCol}" data-id="${a.id}">${a.descricao}</div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="cal-header">
      <div class="cal-title">📅 ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</div>
      <div class="cal-nav">
        <button class="cal-nav-btn" id="cal-prev-month">◀ Mês Anterior</button>
        <button class="cal-nav-btn" id="cal-today-month">Agosto 2026</button>
        <button class="cal-nav-btn" id="cal-next-month">Próximo Mês ▶</button>
      </div>
    </div>
    <div class="cal-grid">
      <div class="cal-weekday">Dom</div><div class="cal-weekday">Seg</div><div class="cal-weekday">Ter</div>
      <div class="cal-weekday">Qua</div><div class="cal-weekday">Qui</div><div class="cal-weekday">Sex</div><div class="cal-weekday">Sáb</div>
      ${cellsHtml}
    </div>
  `;

  document.getElementById('cal-prev-month').addEventListener('click', () => {
    _curMonth--;
    if (_curMonth < 0) { _curMonth = 11; _curYear--; }
    renderMonthlyCalendar(acoes, filter);
  });
  document.getElementById('cal-next-month').addEventListener('click', () => {
    _curMonth++;
    if (_curMonth > 11) { _curMonth = 0; _curYear++; }
    renderMonthlyCalendar(acoes, filter);
  });
  document.getElementById('cal-today-month').addEventListener('click', () => {
    _curYear = 2026; _curMonth = 7; // Agosto 2026
    renderMonthlyCalendar(acoes, filter);
  });

  container.querySelectorAll('.cal-event-chip').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const acao = acoes.find(a => a.id === id);
      if (acao) openViewModal(acao);
    });
  });
}

// ── Calendário Semanal ──────────────────────────────────────────────────────

let _curWeekStart = new Date(2026, 7, 10); // Segunda, 10/08/2026

export function renderWeeklyCalendar(acoes, filter = {}) {
  const container = document.getElementById('view-semana');
  if (!container) return;

  const filtered = acoes.filter(a => {
    const search = (filter.search || '').toLowerCase();
    const catsStr = (a.categorias || []).join(' ').toLowerCase();
    const mS = !search || (a.descricao || '').toLowerCase().includes(search) || (a.local || '').toLowerCase().includes(search) || catsStr.includes(search);
    return mS && (!filter.tipo || a.tipo === filter.tipo) && (!filter.status || a.status === filter.status);
  });

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(_curWeekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }

  const startLabel = days[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const endLabel = days[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const colsHtml = days.map(day => {
    const yStr = day.getFullYear();
    const mStr = String(day.getMonth() + 1).padStart(2, '0');
    const dStr = String(day.getDate()).padStart(2, '0');
    const isoDay = `${yStr}-${mStr}-${dStr}`;

    const dayActions = filtered.filter(a => {
      if (!a.data) return false;
      const raw = a.data.split(' ')[0].split('T')[0];
      return raw === isoDay;
    });

    const dayName = day.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
    const isSunday = day.getDay() === 0;

    return `
      <div class="week-col ${isSunday ? 'sunday' : ''}">
        <div class="week-col-header">
          <div class="week-day-name">${dayName}</div>
          <div class="week-day-num">${day.getDate()}/${day.getMonth() + 1}</div>
        </div>
        <div class="week-col-events">
          ${dayActions.length ? dayActions.map(a => {
            const stCol = a.status === 'Realizada' ? '#22c55e' : a.status === 'Confirmada' ? '#10b981' : a.status === 'Em Construção' ? '#f59e0b' : '#3b82f6';
            return `
              <div class="week-event-card" style="border-left:3px solid ${stCol}" data-id="${a.id}">
                <div class="week-event-desc">${a.descricao}</div>
                ${a.local ? `<div class="week-event-local">📍 ${a.local}</div>` : ''}
                <div class="week-event-badges">${badge(a.status, STATUS_CLASS[a.status] || '')}</div>
              </div>
            `;
          }).join('') : `<div class="week-empty">Sem agenda</div>`}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="cal-header">
      <div class="cal-title">📆 Semana de ${startLabel} a ${endLabel}</div>
      <div class="cal-nav">
        <button class="cal-nav-btn" id="week-prev">◀ Semana Anterior</button>
        <button class="cal-nav-btn" id="week-today">Semana Atual (10/08)</button>
        <button class="cal-nav-btn" id="week-next">Próxima Semana ▶</button>
      </div>
    </div>
    <div class="week-grid">
      ${colsHtml}
    </div>
  `;

  document.getElementById('week-prev').addEventListener('click', () => {
    _curWeekStart.setDate(_curWeekStart.getDate() - 7);
    renderWeeklyCalendar(acoes, filter);
  });
  document.getElementById('week-next').addEventListener('click', () => {
    _curWeekStart.setDate(_curWeekStart.getDate() + 7);
    renderWeeklyCalendar(acoes, filter);
  });
  document.getElementById('week-today').addEventListener('click', () => {
    _curWeekStart = new Date(2026, 7, 10);
    renderWeeklyCalendar(acoes, filter);
  });

  container.querySelectorAll('.week-event-card').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const acao = acoes.find(a => a.id === id);
      if (acao) openViewModal(acao);
    });
  });
}

// ── Linha do Tempo: "Hoje até a Eleição (06/10/2026)" ──────────────────────

const ELEICAO_DATA = new Date(2026, 9, 6); // 06 de Outubro de 2026

export function renderRoadToElection(acoes, filter = {}) {
  const container = document.getElementById('view-roadmap');
  if (!container) return;

  const today = new Date();
  const diffTime = ELEICAO_DATA - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  const filtered = acoes.filter(a => {
    const search = (filter.search || '').toLowerCase();
    const catsStr = (a.categorias || []).join(' ').toLowerCase();
    const mS = !search || (a.descricao || '').toLowerCase().includes(search) || (a.local || '').toLowerCase().includes(search) || catsStr.includes(search);
    return mS && (!filter.tipo || a.tipo === filter.tipo) && (!filter.status || a.status === filter.status);
  });

  // Agrupar por fase da campanha
  const preCampanha = [];
  const campanha = [];
  const retaFinal = [];
  const semData = [];

  filtered.forEach(a => {
    if (!a.data) {
      semData.push(a);
      return;
    }
    const raw = a.data.split(' ')[0].split('T')[0];
    const dt = new Date(raw + 'T12:00:00');
    if (dt <= new Date(2026, 7, 15)) {
      preCampanha.push(a);
    } else if (dt <= new Date(2026, 8, 18)) {
      campanha.push(a);
    } else {
      retaFinal.push(a);
    }
  });

  function renderRoadGroup(title, list, color, dateSpan) {
    return `
      <div class="road-phase" style="border-top:3px solid ${color}">
        <div class="road-phase-header">
          <div>
            <div class="road-phase-title" style="color:${color}">${title}</div>
            <div class="road-phase-span">${dateSpan}</div>
          </div>
          <div class="road-phase-count">${list.length} agendadas</div>
        </div>
        <div class="road-cards">
          ${list.length ? list.map(a => `
            <div class="road-card" data-id="${a.id}">
              <div class="road-card-top">
                <div class="road-card-desc">${a.descricao}</div>
                <div class="road-card-date">${fmtDate(a.data)}</div>
              </div>
              <div class="road-card-meta">
                ${badge(a.status, STATUS_CLASS[a.status] || '')}
                ${a.tipo ? badge(a.tipo, TIPO_CLASS[a.tipo] || '') : ''}
                ${a.local ? `<span class="road-card-local">📍 ${a.local}</span>` : ''}
              </div>
            </div>
          `).join('') : `<div class="road-empty">Nenhuma ação cadastrada para este período ainda.</div>`}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="road-hero">
      <div class="road-hero-left">
        <div class="road-hero-eyebrow">CONTAGEM REGRESSIVA OFICIAL</div>
        <div class="road-hero-title">Rumo à Eleição 2026</div>
        <div class="road-hero-sub">06 de Outubro de 2026 — 1º Turno das Eleições Estaduais</div>
      </div>
      <div class="road-hero-stats">
        <div class="road-stat-box">
          <div class="road-stat-num">${diffDays > 0 ? diffDays : 0}</div>
          <div class="road-stat-label">Dias Restantes</div>
        </div>
        <div class="road-stat-box">
          <div class="road-stat-num">${diffWeeks > 0 ? diffWeeks : 0}</div>
          <div class="road-stat-label">Semanas de Trabalho</div>
        </div>
        <div class="road-stat-box" style="background:rgba(34,197,94,0.15);border-color:#22c55e">
          <div class="road-stat-num" style="color:#4ade80">${filtered.length}</div>
          <div class="road-stat-label">Ações no Radar</div>
        </div>
      </div>
    </div>

    <div class="road-grid">
      ${renderRoadGroup('🟢 Fase 1: Pré-Campanha', preCampanha, '#22c55e', 'Até 15 de Agosto')}
      ${renderRoadGroup('🟠 Fase 2: Campanha Ativa', campanha, '#f97316', '15 de Agosto a 18 de Setembro')}
      ${renderRoadGroup('🔴 Fase 3: Reta Final Decisiva', retaFinal, '#ef4444', '19 de Setembro até 06 de Outubro')}
    </div>

    ${semData.length ? `
      <div class="road-phase" style="margin-top:24px;border-top:3px solid #6b7a70">
        <div class="road-phase-header">
          <div>
            <div class="road-phase-title" style="color:#9ca3af">💡 Agendas & Sugestões a Definir Data</div>
            <div class="road-phase-span">Aguardando encaixe logístico na linha do tempo</div>
          </div>
          <div class="road-phase-count">${semData.length} pendentes</div>
        </div>
        <div class="road-cards">
          ${semData.map(a => `
            <div class="road-card" data-id="${a.id}">
              <div class="road-card-top">
                <div class="road-card-desc">${a.descricao}</div>
                <div class="road-card-date" style="color:var(--amber)">Data a definir</div>
              </div>
              <div class="road-card-meta">
                ${badge(a.status, STATUS_CLASS[a.status] || '')}
                ${a.tipo ? badge(a.tipo, TIPO_CLASS[a.tipo] || '') : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  container.querySelectorAll('.road-card').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const acao = acoes.find(a => a.id === id);
      if (acao) openViewModal(acao);
    });
  });
}
