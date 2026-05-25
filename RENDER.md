# Deploy on Render

This project is a **Node Web Service** (not a static site). Render runs `npm install` then `npm start`.

## Before you deploy

Do these three things **before** you click Deploy on Render.

### Step 1 — Put your code on GitHub

1. Create a free account at [github.com](https://github.com) if you do not have one.
2. On GitHub, click **+** → **New repository**. Name it e.g. `elsueno-website`. Leave it empty (no README).
3. On your PC, open PowerShell in the project folder:

   ```powershell
   cd c:\Users\kayzp\Desktop\construction
   git init
   git add .
   git commit -m "Prepare for Render deploy"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/elsueno-website.git
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` and the repo name with yours.

   Git will **not** upload `node_modules/`, `database.json`, or `config.json` (they are in `.gitignore`). That is correct.

4. If Git is not installed: [git-scm.com/download/win](https://git-scm.com/download/win), then run the commands again.

### Step 2 — Create a MySQL database (not on Render)

Render hosts your **website**, but **not** MySQL. Use a free/cheap MySQL host, for example:

- [Railway](https://railway.app) — add a MySQL service
- [PlanetScale](https://planetscale.com)
- [Aiven](https://aiven.io) (trial)

From that provider, copy:

- Host (hostname)
- Port (usually `3306`)
- Username
- Password
- Database name

You will paste these into Render as `DB_HOST`, `DB_USER`, etc. in Step 4 below.

**Without MySQL on Render:** the live site can still run, but quote storage on Render’s disk is **not permanent** on the free tier. For production, use MySQL.

### Step 3 — Create the tables

1. Open your MySQL provider’s console (or MySQL Workbench).
2. Run the SQL file in this project: `database/schema.sql`  
   (creates database `elsueno_cslt` and the `quotes` table).

Or paste the contents of `database/schema.sql` into the SQL editor and execute it.

### Step 4 — Test locally (recommended)

```powershell
cd c:\Users\kayzp\Desktop\construction
npm install
npm start
```

Open `http://localhost:3000/consultation.html` and submit a test quote.  
Open `http://localhost:3000/api/status` — if MySQL is not set up locally, you may see `"storage": "file"`; that is OK for local testing.

---

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
