# Minimal deployment (Render backend + Vercel frontend)

This document shows a minimal, low-effort way to deploy the app online using Render (backend) and Vercel (frontend).

## Backend (Render) — FastAPI
1. Create a Render account and connect your GitHub repo.
2. Create a **New Web Service** and select the `backend/` folder (or just point to repo root and set the start command manually).
3. Build/Start commands:
   - Render will install `requirements.txt` automatically.
   - Start Command (recommended): `python -m uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Alternatively you can add a small `start.sh` (included) and use `./start.sh` as the Start Command, which ensures the correct Python module is used and is robust on Render.
4. Set environment variables in Render service settings (from `backend/.env.example`):
   - `MONGO_URL` (your MongoDB Atlas URI)
   - `DB_NAME` (database name)
   - `CORS_ORIGINS` (e.g., `https://<your-frontend>.vercel.app` or `*` for testing)

   **Note:** Make sure `MONGO_URL` and `DB_NAME` are set in Render **before** starting the service — missing these will disable DB access and may produce startup errors in older code versions.
5. Deploy and verify:
   - `curl https://<your-backend>/api/` → returns `{ "message": "Hello World" }`

## Frontend (Vercel)
1. Create a Vercel account and import the `frontend` folder (select the repository and the `frontend` project root).
2. Build Command: `yarn build` (Vercel detects CRA automatically)
3. Output Directory: `build`
4. Set Environment Variables in Vercel (if your frontend will call the backend):
   - `REACT_APP_API_URL` = `https://<your-backend>`
5. Deploy and verify the site loads and (if applicable) API calls succeed.

## Quick verification checklist
- [ ] Backend responds at `https://<backend>/api/`
- [ ] Start Command runs on Render (try `python -m uvicorn server:app ...` or `./start.sh`)
- [ ] Frontend serves and loads successfully
- [ ] Frontend can call backend API (test with console or network tab)
- [ ] Secure env vars are set on both platforms and `.env` files are not committed

## Local verification (quick) 🔍
- From repo root (local dev):
  - `cd backend && python -m pip install -r requirements.txt`
  - `cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8000`
- Check that `uvicorn` is installed: `python -m pip show uvicorn`

**Important Render note:** If your Render Build Command is set to `$yarn` only, the backend Python dependencies (including `uvicorn`) will not be installed. Use the included `render.yaml` to create separate services or ensure your Build Command installs backend deps (for single-service setups, e.g., `pip install -r backend/requirements.txt && cd frontend && yarn && yarn build`).

## Notes & tips
- For a single-provider solution, Render can host both a **Web Service** (backend) and a **Static Site** (frontend) in the same repo.
- If you want CI-based deploys, connect your GitHub repo and enable auto-deploys on push to main.
- For production, don't use `CORS_ORIGINS='*'` — set explicit origins only.

If you'd like, I can also:
- Add a small README section with these steps, or
- Add a GitHub Action or `render.yaml` to automate the Render service creation.

---

## Using `render.yaml` (optional) 🔧
A `render.yaml` is included in the repo to create two services on Render automatically: a Python Web Service for the backend and a Static Site for the frontend. If you prefer using Render's UI, you can create two services instead and set the Build/Start commands as shown above.

- `anotequest-backend` (Python web service)
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `python -m uvicorn server:app --host 0.0.0.0 --port $PORT`
  - Path: `backend`

- `anotequest-frontend` (Static site)
  - Build Command: `cd frontend && yarn && yarn build`
  - Publish Path: `frontend/build`

**Note:** If you prefer a single Render service (not recommended), ensure the Build Command installs backend deps (e.g., `pip install -r backend/requirements.txt && cd frontend && yarn && yarn build`) and that the Build environment includes Python and pip.

