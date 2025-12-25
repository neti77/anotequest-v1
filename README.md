# AnoteQuest

A small notes app with a FastAPI backend and a Create-React-App frontend.

## Quick deploy (minimal effort)
See [DEPLOY.md](./DEPLOY.md) for a step-by-step guide to deploy the backend to Render and the frontend to Vercel.

## Local development (short)
- Backend: `cd backend` → create `.env` from `.env.example`, `pip install -r requirements.txt`, `uvicorn server:app --reload --host 0.0.0.0 --port 8000`
- Frontend: `cd frontend` → `yarn install`, optionally set `REACT_APP_API_URL=http://localhost:8000`, `yarn start`
- Mobile (Expo POC): `cd mobile` → `yarn install`, `npx expo start` → open in Expo Go (see `mobile/README.md`)

