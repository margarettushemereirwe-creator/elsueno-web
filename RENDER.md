# Deploy on Render

This project is a **Node Web Service** (not a static site). Render runs `npm install` then `npm start`.

## Before you deploy

1. Push the repo to GitHub (do **not** commit `node_modules/`, `database.json`, or `config.json`).
2. Create a **MySQL** database elsewhere (Render only offers PostgreSQL). Examples: PlanetScale, Railway, Aiven.
3. Run `database/schema.sql` on that database.

## Create the service

1. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint** (if `render.yaml` is in the repo)  
   **or** **New** → **Web Service** and connect the repo manually.

2. Manual settings (if not using Blueprint):

   | Setting | Value |
   |---------|--------|
   | Runtime | Node |
   | Build Command | `npm install` |
   | Start Command | `npm start` |
   | Health Check Path | `/health` |

3. **Environment variables** (required for quotes/admin):

   | Variable | Description |
   |----------|-------------|
   | `DB_HOST` | MySQL hostname |
   | `DB_PORT` | Usually `3306` |
   | `DB_USER` | MySQL username |
   | `DB_PASSWORD` | MySQL password |
   | `DB_NAME` | e.g. `elsueno_cslt` |
   | `DB_SSL` | `true` for most cloud MySQL hosts |
   | `ADMIN_PASSWORD` | Admin login password (overrides `config.json`) |

4. Deploy. Open your Render URL → `/api/status` should show `"ok": true` when MySQL is connected.

## Verify

- `https://YOUR-SERVICE.onrender.com/` — website
- `https://YOUR-SERVICE.onrender.com/health` — always `{"ok":true}` (Render health check)
- `https://YOUR-SERVICE.onrender.com/api/status` — database status
- `https://YOUR-SERVICE.onrender.com/admin.html` — admin panel

## Notes

- `PORT` is set automatically by Render; do not override it.
- Admin sessions are in memory; they reset when the service restarts (normal on free tier).
- Free tier sleeps after inactivity; first visit may be slow.
