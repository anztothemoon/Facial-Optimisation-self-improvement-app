# App Starter

Monorepo: **Expo (React Native)** frontend + **Express** backend.

## Structure

```
app-starter/
├── frontend/          # React Native + Expo
│   ├── components/
│   ├── screens/
│   ├── navigation/
│   ├── services/
│   ├── hooks/
│   └── utils/
└── backend/
    └── server.js      # Express entry
```

## Run

### Frontend (Expo)

```bash
cd frontend
npx expo start
```

### Backend (Express)

```bash
cd backend
node server.js
```

Or: `npm start` (runs `node server.js`).

API default: `http://localhost:3001` — try `GET /health` and `GET /api/hello`.

## Env

- Copy `frontend/.env.example` → `frontend/.env` (optional; defaults to localhost).
- Copy `backend/.env.example` → `backend/.env` to change `PORT`.
