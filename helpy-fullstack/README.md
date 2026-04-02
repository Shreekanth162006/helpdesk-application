<<<<<<< HEAD
# Helpy Fullstack — React + Node/Express Help Desk

A modern help desk with:

- **Frontend:** React, Vite, React Router, Axios, Chakra UI, CSS
- **Backend:** Node.js, Express, REST API, JWT auth, file uploads (Multer), PostgreSQL (Sequelize)

---

## 📋 Setup Instructions

**For complete setup instructions, see [SETUP.md](./SETUP.md)**

**For all required packages and extensions, see [REQUIREMENTS.txt](./REQUIREMENTS.txt)**

---

## Quick start

### 1. Database

Create a PostgreSQL database, e.g. `helpy_db`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: DB_*, JWT_SECRET, etc.

npm install
npm run db:seed    # creates admin@helpy.local / admin123, forums, categories
npm run dev        # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 — proxies /api and /uploads to backend
```

### 4. Login

- **Email:** `admin@helpy.local`  
- **Password:** `admin123`

---

## API (REST)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register (email, password, name) |
| POST | `/api/auth/login` | Login → `{ user, token, refreshToken }` |
| POST | `/api/auth/refresh` | Body: `{ refreshToken }` → `{ token }` |
| GET | `/api/auth/me` | Current user (JWT) |
| GET | `/api/users` | List users (admin/agent) |
| GET | `/api/users/self` | Current user |
| GET | `/api/categories` | List categories (`?docs=true`) |
| GET | `/api/docs/:id` | Get doc |
| POST | `/api/docs` | Create doc (admin/agent/editor) |
| GET | `/api/forums` | List forums |
| GET | `/api/topics` | List topics (`?status=`, `?forum_id=`) |
| GET | `/api/topics/:id` | Get topic + posts |
| POST | `/api/topics` | Create topic (name, body, forumId, …) |
| PATCH | `/api/topics/:id` | Update status, assignee, … (admin/agent) |
| POST | `/api/posts` | Reply (topicId, body, kind: reply|note) (admin/agent/editor) |
| GET | `/api/search?q=` | Search docs/topics (JWT) |
| POST | `/api/upload` | Multipart `file` → `{ url }` (JWT) |

**Auth:** `Authorization: Bearer <token>`

---

## Project layout

```
helpy-fullstack/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── db/
│   │   │   ├── sequelize.js
│   │   │   ├── models/      # User, Category, Doc, Forum, Topic, Post, Tag
│   │   │   ├── seed.js
│   │   ├── middleware/      # auth (JWT), errorHandler, upload (Multer)
│   │   └── routes/          # auth, users, categories, docs, forums, topics, posts, search, upload
│   ├── uploads/             # uploaded files
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js    # Axios + JWT interceptors, auth, users, topics, …
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx
│   │   ├── pages/           # Login, Register, Dashboard, Tickets, TicketDetail, Knowledge
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js       # proxy /api, /uploads → backend
│   └── package.json
└── README.md
```

---

## Security (JWT)

- **Access token:** short-lived (e.g. 7d), sent as `Authorization: Bearer <token>`.
- **Refresh token:** longer-lived (e.g. 30d), used only at `POST /api/auth/refresh`.
- On 401, the frontend clears tokens and redirects to `/login`.

---

## File uploads

- **Endpoint:** `POST /api/upload` with `multipart/form-data`, field `file`.
- **Allowed:** images, PDF, DOC, TXT, ZIP (see `backend/src/middleware/upload.js`).
- **Response:** `{ url: "/uploads/...", filename, originalName }`.
- **Serving:** `GET /uploads/:filename` is served by Express static.

---

## Customization

- **Backend port:** `PORT` in `.env` (default 4000).
- **Frontend API base:** `VITE_API_URL` or use Vite proxy (default `/api` → `http://localhost:4000`).
- **DB:** PostgreSQL; set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in `.env`.
=======
# helpdesk-application
A full-stack Helpdesk Application designed to manage customer queries, ticket lifecycle, SLA tracking, and escalations, built using React, Node.js, and MySQL.
>>>>>>> 81a73259519a60aac1323c50aa36dc6fdccd8512
