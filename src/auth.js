import { auth, db } from './firebase.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

// Verificar se houve retorno de redirecionamento do Google
getRedirectResult(auth).catch(err => {
  if (err && err.code !== 'auth/popup-closed-by-user') {
    console.error('Erro ao retornar do redirecionamento do Google:', err);
  }
});

// Administradores Supremos por padrão
const DEFAULT_ADMINS = [
  'iury.decarvalho@gmail.com',
  'iurycarvalho92@gmail.com'
];

let _currentUser = null;
let _currentRole = null; // 'admin' | 'editor' | 'leitor'
let _presenceInterval = null;
let _presenceUnsub = null;
let _onlineUsersCallbacks = [];

export function getCurrentUser() {
  return _currentUser;
}

export function getCurrentRole() {
  return _currentRole;
}

export function canEdit() {
  if (!_currentUser || !_currentRole) return false;
  return _currentRole === 'admin' || _currentRole === 'editor';
}

export function canManageUsers() {
  if (!_currentUser || !_currentRole) return false;
  return _currentRole === 'admin';
}

export async function loginWithGoogle(useRedirect = false) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  if (useRedirect) {
    return signInWithRedirect(auth, provider);
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err) {
    console.error('Erro no login com Google (Popup):', err);
    throw err;
  }
}

export async function logout() {
  try {
    await stopPresenceSync();
    await signOut(auth);
  } catch (err) {
    console.error('Erro no logout:', err);
  }
}

export function initAuthListener(onStateChangeCallback) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      _currentUser = user;
      const emailLower = (user.email || '').toLowerCase();

      // Verificar ou criar doc de usuário no Firestore
      const userRef = doc(db, 'users', emailLower);
      let userDoc = await getDoc(userRef);

      if (DEFAULT_ADMINS.includes(emailLower)) {
        _currentRole = 'admin';
        // Garantir que o doc do admin exista no banco
        await setDoc(userRef, {
          email: emailLower,
          role: 'admin',
          displayName: user.displayName || emailLower,
          photoURL: user.photoURL || '',
          lastLogin: serverTimestamp()
        }, { merge: true });
      } else if (userDoc.exists()) {
        const data = userDoc.data();
        _currentRole = data.role || 'leitor';
        await updateDoc(userRef, {
          displayName: user.displayName || emailLower,
          photoURL: user.photoURL || '',
          lastLogin: serverTimestamp()
        }).catch(() => {});
      } else {
        // Usuário novo não admin entra como 'leitor' por padrão
        _currentRole = 'leitor';
        await setDoc(userRef, {
          email: emailLower,
          role: 'leitor',
          displayName: user.displayName || emailLower,
          photoURL: user.photoURL || '',
          addedAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      }

      await startPresenceSync(user, _currentRole);
      onStateChangeCallback(user, _currentRole);
    } else {
      _currentUser = null;
      _currentRole = null;
      await stopPresenceSync();
      onStateChangeCallback(null, null);
    }
  });
}

// ── Presença em Tempo Real (`presence`) ─────────────────────────────────────

async function startPresenceSync(user, role) {
  await stopPresenceSync();
  if (!user) return;

  const presenceRef = doc(db, 'presence', user.uid);

  const setOnline = async () => {
    try {
      await setDoc(presenceRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Usuário'),
        photoURL: user.photoURL || '',
        role: role || 'leitor',
        state: 'online',
        lastSeen: Date.now()
      }, { merge: true });
    } catch (e) {
      console.warn('Erro ao atualizar presença online:', e);
    }
  };

  const setOffline = async () => {
    try {
      await updateDoc(presenceRef, {
        state: 'offline',
        lastSeen: Date.now()
      });
    } catch (e) {
      // ignore
    }
  };

  await setOnline();

  _presenceInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      setOnline();
    }
  }, 30000); // Heartbeat a cada 30 segundos

  window.addEventListener('beforeunload', setOffline);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      setOffline();
    } else if (document.visibilityState === 'visible') {
      setOnline();
    }
  });

  // Escutar todos online em tempo real
  _presenceUnsub = onSnapshot(collection(db, 'presence'), (snap) => {
    const now = Date.now();
    const onlineUsers = [];
    snap.forEach(d => {
      const p = d.data();
      // Consideramos online se state === 'online' e lastSeen nos últimos 3 minutos (180.000 ms)
      if (p && p.state === 'online' && p.lastSeen && (now - p.lastSeen < 180000)) {
        onlineUsers.push(p);
      }
    });
    _onlineUsersCallbacks.forEach(cb => cb(onlineUsers));
  }, (err) => {
    console.warn('Erro ao ler presença:', err);
  });
}

async function stopPresenceSync() {
  if (_presenceInterval) {
    clearInterval(_presenceInterval);
    _presenceInterval = null;
  }
  if (_presenceUnsub) {
    _presenceUnsub();
    _presenceUnsub = null;
  }
  if (_currentUser) {
    try {
      await updateDoc(doc(db, 'presence', _currentUser.uid), {
        state: 'offline',
        lastSeen: Date.now()
      });
    } catch (e) {}
  }
}

export function subscribeOnlineUsers(callback) {
  _onlineUsersCallbacks.push(callback);
  return () => {
    _onlineUsersCallbacks = _onlineUsersCallbacks.filter(cb => cb !== callback);
  };
}
