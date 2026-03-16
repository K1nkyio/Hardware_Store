# Hardware Store

This repo contains:

- `backend/`: Express + TypeScript API (PostgreSQL)
- `user-dashboard/`: Customer-facing React dashboard (Vite)
- `admin-dashboard/`: Admin React dashboard (Vite)

## Account creation (PostgreSQL)

Both customer and admin account creation are **real** and persisted in PostgreSQL:

- Customer register/login: `POST /api/auth/register`, `POST /api/auth/login`
- Admin self-register/login: `POST /api/admin/auth/self-register`, `POST /api/admin/auth/login`

Passwords are stored as **hashes** (never plaintext).

## Local setup

### 1) PostgreSQL database

Create a database (example: `hardware_store`) and ensure you have credentials.

### 2) Backend env

Copy `backend/.env.example` to `backend/.env` and set `DATABASE_URL`.

Example:

```text
DATABASE_URL=postgres://postgres@localhost:5432/hardware_store
DB_PASSWORD=postgres
PORT=5000
```

### 3) Run migrations (create tables)

From `backend/`:

```bash
npm install
npm run db:migrate
```

This applies `backend/src/db/schema.sql`.

### 4) Start backend

From `backend/`:

```bash
npm run dev
```

Backend runs on `http://localhost:5001` (default in `backend/.env`).

### 5) Frontend env

- `admin-dashboard/.env.example` → copy to `admin-dashboard/.env`
- `user-dashboard/.env.example` → copy to `user-dashboard/.env`

Both should point to the backend:

```text
VITE_API_BASE_URL=http://localhost:5001
```

### 6) Start dashboards

From each dashboard directory:

```bash
npm install
npm run dev
```

