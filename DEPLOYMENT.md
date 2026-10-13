# Deployment Guide: Supabase + Render + Vercel

This repository is pre-configured for one-click deployment across **Supabase** (PostgreSQL Database), **Render** (FastAPI Backend), and **Vercel** (React Vite Frontend).

---

## Architecture Overview

```
┌─────────────────────────────────┐
│     Vercel (React Frontend)     │
│   https://your-app.vercel.app   │
└────────────────┬────────────────┘
                 │ REST API (HTTPS)
                 ▼
┌─────────────────────────────────┐
│     Render (FastAPI Backend)    │
│  https://your-api.onrender.com  │
└────────────────┬────────────────┘
                 │ PostgreSQL / SSL
                 ▼
┌─────────────────────────────────┐
│   Supabase (Cloud Database)     │
│  PostgreSQL + Auto Migrations   │
└─────────────────────────────────┘
```

---

## Step 1: Database Setup on Supabase

1. Sign in to [Supabase](https://supabase.com) and create a **New Project**.
2. Set your **Database Password** and save it.
3. Once the project is provisioned:
   - Go to **SQL Editor** in the left sidebar.
   - Open and copy the contents of `backend/supabase_schema.sql` from this repository.
   - Paste it into the SQL Editor and click **Run**.
   *(All tables, indexes, and stone shop seed data will be created!)*
4. Go to **Project Settings** -> **Database**:
   - Scroll to **Connection string**.
   - Select **URI** (or Connection Pooling URI).
   - Copy the URI, for example:
     `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

---

## Step 2: Backend API on Render

1. Sign in to [Render](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Select your GitHub repository: `billing` (or `ajojohn9539/billing`).
4. Configure the service settings:
   - **Name**: `billing-backend` (or `rock-palace-billing-api`)
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, add:
   - `DATABASE_URL`: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - `PYTHON_VERSION`: `3.11.8`
6. Click **Create Web Service**.
7. Once deployed, copy your Render Web Service URL (e.g. `https://billing-backend-xxxx.onrender.com`).
   - You can test it by visiting: `https://billing-backend-xxxx.onrender.com/api/health`

---

## Step 3: Frontend on Vercel

1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository: `billing`.
4. In the configuration screen:
   - **Root Directory**: Click edit and select `frontend`
   - **Framework Preset**: `Vite` (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://billing-backend-xxxx.onrender.com` *(your Render URL without trailing slash)*
6. Click **Deploy**.
7. Your Aster Billing application is now live worldwide!

---

## Testing Local vs Production

- **Local Development**:
  Runs with local MySQL or SQLite using `./start.sh` or `npm run dev`.
- **Cloud Production**:
  Automatically switches to PostgreSQL when `DATABASE_URL` is detected.
