import { db } from './firebase.js';
import { doc, setDoc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { STATUS_CLASS, TIPO_CLASS, renderPrioridadeBadge } from './constants.js';
import { canEdit, getCurrentUser, getCurrentRole } from './auth.js';

async function logAuditEvent(action, itemDescricao, details) {
  const user = getCurrentUser();
  if (!user) return;
  try {
    await addDoc(collection(db, 'logs'), {
      action, // 'Criou' | 'Editou' | 'Excluiu'
      userEmail: user.email,
      userName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      itemDescricao: itemDescricao || 'Agenda sem título',
      details: details || '',
      timestamp: Date.now(),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Erro ao gravar log de auditoria:', err);
  }
}

const TODAS_CATEGORIAS = [
  'Adesivaço',
  'Panfletaço',
  'Caminhada / Carreata',
  'Encontro com lideranças',
  'Encontro com categorias (professores, saúde, etc.)',
  'Roda de conversa',
  'Conversa 1:1',
  'Feiras e Convenções',
  'Evento com fala',
  'Evento institucional',
  'Entrevista / Podcast',
  'Gravação de vídeos / Redes Sociais',
  'Visita a locais'
];

let _currentAction = null;
let _isEditing = false;
let _selectedCategories = [];

function badge(text, cls) {
  return `<span class="badge ${cls || ''}">${text || '—'}</span>`;
}

function fmtDate(isoStr) {
  if (!isoStr) return '—';
  const parts = isoStr.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return isoStr;
}

export function openViewModal(acao) {
  _currentAction = acao;
  _isEditing = false;

  const viewContainer = document.getElementById('modal-view-container');
  const formContainer = document.getElementById('modal-form-container');
  if (viewContainer) viewContainer.style.display = 'block';
  if (formContainer) formContainer.style.display = 'none';

  document.getElementById('modal-title').textContent = acao.descricao || 'Sem descrição';
  document.getElementById('modal-badges').innerHTML = [
    acao.status ? badge(acao.status, STATUS_CLASS[acao.status] || '') : '',
    acao.tipo ? badge(acao.tipo, TIPO_CLASS[acao.tipo] || '') : '',
    renderPrioridadeBadge(acao.prioridade),
  ].join('');

  const fields = [
    ['Local', acao.local || '—'],
    ['Data', acao.data ? fmtDate(acao.data) : '—'],
    ['Sugerido por', acao.sugerido_por || '—'],
    ['Envolvidos', acao.envolvidos || '—'],
    ['Público estimado', acao.estimativa || '—'],
  ];
  document.getElementById('modal-grid').innerHTML = fields.map(([l, v]) => `
    <div class="modal-field">
      <div class="modal-field-label">${l}</div>
      <div class="modal-field-value">${v}</div>
    </div>
  `).join('');

  const cats = acao.categorias || [];
  document.getElementById('modal-cats-wrap').innerHTML = cats.length
    ? `<div class="modal-divider"></div><div class="modal-field-label" style="margin-bottom:8px">Categorias</div><div class="modal-cats">${cats.map(c => `<span class="cat-chip" style="font-size:11px;padding:4px 10px">${c}</span>`).join('')}</div>`
    : '';

  document.getElementById('modal-obs-wrap').innerHTML = acao.observacoes
    ? `<div class="modal-divider"></div><div class="modal-field-label" style="margin-bottom:8px">⚠️ Observações</div><div class="modal-observacao">${acao.observacoes}</div>`
    : '';

  document.getElementById('modal-aval-wrap').innerHTML = acao.avaliacao
    ? `<div class="modal-divider"></div><div class="modal-field-label" style="margin-bottom:8px">💬 Avaliação</div><div class="modal-avaliacao">${acao.avaliacao}</div>`
    : '';

  document.getElementById('modal-overlay').classList.add('open');
}

export function openCreateModal() {
  if (!canEdit()) {
    alert('🔒 Acesso Restrito\nSeu nível atual é [' + (getCurrentRole() || 'Não logado') + ']. Apenas Admins e Editores podem criar ou alterar agendas.');
    return;
  }
  _currentAction = null;
  _isEditing = false;
  _selectedCategories = ['Encontro com lideranças'];

  const viewContainer = document.getElementById('modal-view-container');
  const formContainer = document.getElementById('modal-form-container');
  if (viewContainer) viewContainer.style.display = 'none';
  if (formContainer) formContainer.style.display = 'block';
  document.getElementById('modal-form-title').textContent = '➕ Nova Agenda / Sugestão';

  fillFormFields({
    descricao: '',
    tipo: 'Mobilização',
    status: 'Sugerida',
    prioridade: 'media',
    data: '',
    local: '',
    sugerido_por: '',
    envolvidos: '',
    estimativa: '',
    observacoes: '',
    avaliacao: '',
    categorias: _selectedCategories
  });

  document.getElementById('modal-overlay').classList.add('open');
}

export function openEditModal(acao) {
  if (!canEdit()) {
    alert('🔒 Acesso Restrito\nSeu nível atual é [' + (getCurrentRole() || 'Não logado') + ']. Apenas Admins e Editores podem criar ou alterar agendas.');
    return;
  }
  _currentAction = acao;
  _isEditing = true;
  _selectedCategories = [...(acao.categorias || [])];

  const viewContainer = document.getElementById('modal-view-container');
  const formContainer = document.getElementById('modal-form-container');
  if (viewContainer) viewContainer.style.display = 'none';
  if (formContainer) formContainer.style.display = 'block';
  document.getElementById('modal-form-title').textContent = '✏️ Editar Agenda';

  fillFormFields(acao);
}

function fillFormFields(data) {
  document.getElementById('form-descricao').value = data.descricao || '';
  document.getElementById('form-tipo').value = data.tipo || 'Mobilização';
  document.getElementById('form-status').value = data.status || 'Sugerida';
  if (document.getElementById('form-prioridade')) {
    document.getElementById('form-prioridade').value = (data.prioridade || 'media').toLowerCase();
  }
  
  let dateVal = '';
  if (data.data) {
    const raw = data.data.split(' ')[0].split('T')[0];
    dateVal = raw;
  }
  document.getElementById('form-data').value = dateVal;
  document.getElementById('form-local').value = data.local || '';
  document.getElementById('form-sugerido').value = data.sugerido_por || '';
  document.getElementById('form-envolvidos').value = data.envolvidos || '';
  document.getElementById('form-estimativa').value = data.estimativa || '';
  document.getElementById('form-observacoes').value = data.observacoes || '';
  document.getElementById('form-avaliacao').value = data.avaliacao || '';

  renderFormCategories();
}

function renderFormCategories() {
  const container = document.getElementById('form-categories-chips');
  container.innerHTML = TODAS_CATEGORIAS.map(cat => {
    const active = _selectedCategories.includes(cat) ? 'active' : '';
    return `<button type="button" class="form-chip ${active}" data-cat="${cat}">${cat}</button>`;
  }).join('');

  container.querySelectorAll('.form-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (_selectedCategories.includes(cat)) {
        if (_selectedCategories.length > 1) {
          _selectedCategories = _selectedCategories.filter(c => c !== cat);
        }
      } else {
        _selectedCategories.push(cat);
      }
      renderFormCategories();
    });
  });
}

export function setupCRUDHandlers() {
  const btnNew = document.getElementById('btn-new-action');
  if (btnNew) btnNew.addEventListener('click', () => openCreateModal());

  const btnEdit = document.getElementById('btn-edit-action');
  if (btnEdit) btnEdit.addEventListener('click', () => {
    if (_currentAction) openEditModal(_currentAction);
  });

  const btnDelete = document.getElementById('btn-delete-action');
  if (btnDelete) btnDelete.addEventListener('click', async () => {
    if (!_currentAction || !_currentAction.id) return;
    if (!canEdit()) {
      alert('🔒 Acesso Restrito: Apenas Admins e Editores podem excluir agendas.');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir "${_currentAction.descricao}" do banco Firestore?`)) return;
    try {
      const desc = _currentAction.descricao;
      await deleteDoc(doc(db, 'acoes', _currentAction.id));
      await logAuditEvent('Excluiu', desc, 'Excluiu a agenda do banco Firestore');
      document.getElementById('modal-overlay').classList.remove('open');
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir: ' + err.message);
    }
  });

  const btnCancel = document.getElementById('btn-cancel-form');
  if (btnCancel) btnCancel.addEventListener('click', () => {
    if (_isEditing && _currentAction) {
      openViewModal(_currentAction);
    } else {
      document.getElementById('modal-overlay').classList.remove('open');
    }
  });

  const form = document.getElementById('crud-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!canEdit()) {
        alert('🔒 Acesso Restrito: Apenas Admins e Editores podem criar ou alterar agendas.');
        return;
      }
      const descricao = document.getElementById('form-descricao').value.trim();
      if (!descricao) {
        alert('Por favor, informe a descrição da agenda.');
        return;
      }

      const payload = {
        descricao,
        tipo: document.getElementById('form-tipo').value,
        status: document.getElementById('form-status').value,
        prioridade: document.getElementById('form-prioridade') ? document.getElementById('form-prioridade').value : 'media',
        data: document.getElementById('form-data').value || null,
        local: document.getElementById('form-local').value.trim() || null,
        sugerido_por: document.getElementById('form-sugerido').value.trim() || null,
        envolvidos: document.getElementById('form-envolvidos').value.trim() || null,
        estimativa: document.getElementById('form-estimativa').value.trim() || null,
        observacoes: document.getElementById('form-observacoes').value.trim() || null,
        avaliacao: document.getElementById('form-avaliacao').value.trim() || null,
        categorias: _selectedCategories.length ? _selectedCategories : ['Outros']
      };

      try {
        const btnSubmit = document.getElementById('btn-save-form');
        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = '⏳ Salvando no Cloud...';
        btnSubmit.disabled = true;

        if (_isEditing && _currentAction && _currentAction.id) {
          await updateDoc(doc(db, 'acoes', _currentAction.id), payload);
          await logAuditEvent('Editou', payload.descricao, `Atualizou agenda (Status: ${payload.status}, Tipo: ${payload.tipo})`);
        } else {
          const docId = 'acao-' + Date.now();
          await setDoc(doc(db, 'acoes', docId), payload);
          await logAuditEvent('Criou', payload.descricao, `Nova agenda criada (Status: ${payload.status}, Tipo: ${payload.tipo})`);
        }

        btnSubmit.textContent = originalText;
        btnSubmit.disabled = false;
        document.getElementById('modal-overlay').classList.remove('open');
      } catch (err) {
        console.error('Erro ao salvar no Firestore:', err);
        alert('Erro ao salvar no Firestore: ' + err.message);
        const btnSubmit = document.getElementById('btn-save-form');
        if (btnSubmit) {
          btnSubmit.textContent = '💾 Salvar no Banco';
          btnSubmit.disabled = false;
        }
      }
    });
  }
}
