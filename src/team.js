import { db } from './firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { getCurrentUser, getCurrentRole, canManageUsers } from './auth.js';

let _usersUnsub = null;
let _logsUnsub = null;
let _allUsers = [];
let _allLogs = [];
let _logSearch = '';

export function renderTeamSection() {
  const container = document.getElementById('section-equipe');
  if (!container) return;

  const isAdmin = canManageUsers();
  const currentRole = getCurrentRole();

  container.innerHTML = `
    <div class="team-layout">
      ${isAdmin ? `
      <div class="team-card admin-manage-card">
        <div class="team-card-header">
          <h3>👑 Gestão de Acessos & Permissões da Equipe</h3>
          <p>Adicione o e-mail do Gmail do colaborador e atribua seu nível de permissão.</p>
        </div>
        <form id="form-add-user" class="team-form-row">
          <input type="email" id="new-user-email" class="filter-input" placeholder="E-mail Gmail (ex: fulano@gmail.com)" required style="flex:2">
          <select id="new-user-role" class="filter-select" style="flex:1">
            <option value="editor">✏️ Editor (Cria, edita e exclui)</option>
            <option value="admin">👑 Admin (Acesso total e gerencia equipe)</option>
            <option value="leitor">👀 Leitor (Apenas visualização)</option>
          </select>
          <button type="submit" class="btn-save" style="padding:10px 20px;font-size:13px">➕ Adicionar Acesso</button>
        </form>
        <div id="users-table-wrap" class="users-table-wrap">
          <div class="team-loading">Carregando membros da equipe...</div>
        </div>
      </div>
      ` : `
      <div class="team-card info-card">
        <div class="team-card-header">
          <h3>👑 Nível de Acesso: ${currentRole ? currentRole.toUpperCase() : 'LEITOR'}</h3>
          <p>Apenas usuários com papel de <strong>Admin</strong> podem adicionar novos e-mails ou alterar permissões de outros colaboradores.</p>
        </div>
      </div>
      `}

      <div class="team-card logs-card">
        <div class="team-card-header flex-header">
          <div>
            <h3>📋 Log de Auditoria & Histórico de Alterações</h3>
            <p>Registro em tempo real de todas as ações de criação, edição e exclusão de agendas realizadas no sistema.</p>
          </div>
          <input type="text" id="log-search-input" class="filter-input" placeholder="🔍 Filtrar log por agenda, autor ou ação..." style="max-width:280px">
        </div>
        <div id="logs-list-wrap" class="logs-list-wrap">
          <div class="team-loading">Carregando histórico de auditoria...</div>
        </div>
      </div>
    </div>
  `;

  if (isAdmin) {
    setupAddUserForm();
    listenUsers();
  }
  listenLogs();

  const searchInput = document.getElementById('log-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      _logSearch = (e.target.value || '').toLowerCase();
      renderLogsList();
    });
  }
}

function setupAddUserForm() {
  const form = document.getElementById('form-add-user');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('new-user-email').value.trim().toLowerCase();
    const role = document.getElementById('new-user-role').value;
    if (!email || !email.includes('@')) {
      alert('Por favor, digite um e-mail válido.');
      return;
    }
    const adminUser = getCurrentUser();
    try {
      await setDoc(doc(db, 'users', email), {
        email,
        role,
        addedBy: adminUser ? adminUser.email : 'admin',
        addedAt: serverTimestamp()
      }, { merge: true });
      document.getElementById('new-user-email').value = '';
      alert(`✅ Acesso (${role.toUpperCase()}) concedido com sucesso para ${email}!`);
    } catch (err) {
      console.error('Erro ao adicionar usuário:', err);
      alert('Erro ao salvar no Firestore: ' + err.message);
    }
  });
}

function listenUsers() {
  if (_usersUnsub) _usersUnsub();
  _usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
    _allUsers = [];
    snap.forEach(d => _allUsers.push({ id: d.id, ...d.data() }));
    renderUsersTable();
  }, (err) => {
    console.warn('Erro ao ler usuários:', err);
  });
}

function renderUsersTable() {
  const wrap = document.getElementById('users-table-wrap');
  if (!wrap) return;

  if (_allUsers.length === 0) {
    wrap.innerHTML = `<div class="team-empty">Nenhum membro cadastrado além dos administradores nativos.</div>`;
    return;
  }

  const roleEmoji = { admin: '👑 Admin', editor: '✏️ Editor', leitor: '👀 Leitor' };
  const roleClass = { admin: 'role-admin', editor: 'role-editor', leitor: 'role-leitor' };

  wrap.innerHTML = `
    <table class="users-table">
      <thead>
        <tr>
          <th>Colaborador / E-mail</th>
          <th>Nível de Acesso</th>
          <th>Adicionado Por</th>
          <th>Ações de Gerenciamento</th>
        </tr>
      </thead>
      <tbody>
        ${_allUsers.map(u => `
          <tr>
            <td>
              <div class="user-row-info">
                ${u.photoURL ? `<img src="${u.photoURL}" class="user-row-avatar" alt="">` : `<div class="user-row-avatar-placeholder">👤</div>`}
                <div>
                  <div class="user-row-name">${u.displayName || u.email}</div>
                  <div class="user-row-email">${u.email}</div>
                </div>
              </div>
            </td>
            <td><span class="role-badge ${roleClass[u.role] || ''}">${roleEmoji[u.role] || u.role}</span></td>
            <td style="font-size:12px;color:var(--muted)">${u.addedBy || 'Sistema'}</td>
            <td>
              <div class="user-row-actions">
                <select class="role-changer select-mini" data-email="${u.email}">
                  <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 Admin</option>
                  <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>✏️ Editor</option>
                  <option value="leitor" ${u.role === 'leitor' ? 'selected' : ''}>👀 Leitor</option>
                </select>
                <button class="btn-remove-user" data-email="${u.email}" title="Remover acesso">🗑️ Excluir</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  wrap.querySelectorAll('.role-changer').forEach(sel => {
    sel.addEventListener('change', async (e) => {
      const email = e.target.dataset.email;
      const newRole = e.target.value;
      try {
        await setDoc(doc(db, 'users', email), { role: newRole }, { merge: true });
      } catch (err) {
        alert('Erro ao alterar nível: ' + err.message);
      }
    });
  });

  wrap.querySelectorAll('.btn-remove-user').forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = btn.dataset.email;
      if (!confirm(`Tem certeza que deseja remover o acesso do e-mail "${email}"?`)) return;
      try {
        await deleteDoc(doc(db, 'users', email));
      } catch (err) {
        alert('Erro ao remover usuário: ' + err.message);
      }
    });
  });
}

function listenLogs() {
  if (_logsUnsub) _logsUnsub();
  const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
  _logsUnsub = onSnapshot(q, (snap) => {
    _allLogs = [];
    snap.forEach(d => _allLogs.push({ id: d.id, ...d.data() }));
    renderLogsList();
  }, (err) => {
    console.warn('Erro ao ler logs de auditoria:', err);
  });
}

function renderLogsList() {
  const wrap = document.getElementById('logs-list-wrap');
  if (!wrap) return;

  const filtered = _allLogs.filter(l => {
    if (!_logSearch) return true;
    const txt = `${l.userEmail || ''} ${l.userName || ''} ${l.itemDescricao || ''} ${l.details || ''} ${l.action || ''}`.toLowerCase();
    return txt.includes(_logSearch);
  });

  if (filtered.length === 0) {
    wrap.innerHTML = `<div class="team-empty">Nenhum evento de log encontrado no histórico.</div>`;
    return;
  }

  const actionClass = {
    'Criou': 'log-created',
    'Editou': 'log-edited',
    'Excluiu': 'log-deleted'
  };
  const actionIcon = {
    'Criou': '🟢 Criou',
    'Editou': '🟠 Editou',
    'Excluiu': '🔴 Excluiu'
  };

  wrap.innerHTML = `
    <div class="logs-feed">
      ${filtered.map(l => {
        const dateStr = l.timestamp ? new Date(l.timestamp).toLocaleString('pt-BR') : 'Data desconhecida';
        return `
          <div class="log-item">
            <div class="log-item-header">
              <div class="log-user">
                ${l.photoURL ? `<img src="${l.photoURL}" class="log-avatar" alt="">` : `<span class="log-avatar-placeholder">👤</span>`}
                <div>
                  <strong>${l.userName || l.userEmail}</strong>
                  <span class="log-email">(${l.userEmail})</span>
                </div>
              </div>
              <span class="log-badge ${actionClass[l.action] || ''}">${actionIcon[l.action] || l.action}</span>
            </div>
            <div class="log-content">
              <div class="log-title">${l.itemDescricao}</div>
              ${l.details ? `<div class="log-details">${l.details}</div>` : ''}
            </div>
            <div class="log-footer">🕒 ${dateStr}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function cleanupTeamSubscriptions() {
  if (_usersUnsub) { _usersUnsub(); _usersUnsub = null; }
  if (_logsUnsub) { _logsUnsub(); _logsUnsub = null; }
}
