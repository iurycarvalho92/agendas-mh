# MH Agenda Campanha — Dashboard 2026

Dashboard estratégico da agenda de campanha de Marina Helou (Deputada Estadual SP).

## Stack
- **Frontend:** Vite + Vanilla JS + Chart.js
- **Banco de dados:** Firebase Firestore (tempo real)
- **Deploy:** Vercel (conectado a este repo)

## Configuração local

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Copie o arquivo de variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
4. Preencha `.env.local` com as credenciais Firebase (obtidas no Firebase Console > Project Settings > Web App)

5. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Variáveis de ambiente (Vercel)

Adicione as seguintes variáveis no painel do Vercel (Settings > Environment Variables):

| Variável | Valor |
|---|---|
| `VITE_FIREBASE_API_KEY` | Chave da API Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | `mh-agenda-campanha-2026.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `mh-agenda-campanha-2026` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `mh-agenda-campanha-2026.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `330300907281` |
| `VITE_FIREBASE_APP_ID` | `1:330300907281:web:839b1e80cc3d53c8e7f6b0` |

## Segurança

- `.env.local` está no `.gitignore` — **nunca** é enviado ao GitHub
- Os dados no Firestore têm regras de leitura pública e escrita bloqueada via cliente
- Edições nos dados devem ser feitas pelo Firebase Console ou via script com service account

## Estrutura

```
src/
├── firebase.js      # Inicialização Firebase (usa variáveis de ambiente)
├── data.js          # Dados da planilha + função de seed do Firestore
├── constants.js     # Constantes: fases, mapeamentos, utilitários
├── render.js        # Funções de renderização de cada seção
├── main.js          # Entry point: HTML shell + subscription Firestore
└── style.css        # Estilos premium dark mode
```
