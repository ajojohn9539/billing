import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load .env file
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv()

from database import init_db, IS_POSTGRES
from routes.contacts_router import router as contacts_router
from routes.products_router import router as products_router
from routes.purchases_router import router as purchases_router
from routes.sales_router import router as sales_router
from routes.damages_router import router as damages_router
from routes.stock_router import router as stock_router
from routes.daybook_router import router as daybook_router
from routes.others_router import router as others_router
from routes.auth_router import router as auth_router
from routes.backup_router import router as backup_router
from routes.admin_router import router as admin_router
from routes.archives_router import router as archives_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    mode = "PostgreSQL (Supabase)" if IS_POSTGRES else "MySQL"
    print(f"Starting Rock Palace - Aster Billing System API ({mode})...")
    try:
        init_db()
    except Exception as e:
        print(f"[Warning] init_db deferment or warning: {e}")
    yield
    print("Shutting down Rock Palace API...")

app = FastAPI(
    title="Billora - Smart Billing & Stone Inventory ERP API",
    description="Web-based accounting & stone billing system built on FastAPI with Supabase/PostgreSQL & MySQL support",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Top Navigation Modules according to documentation:
# 1. Contacts
# 2. Products
# 3. Purchase
# 4. Sales
# 5. Damage Entry
# 6. Stock
# 7. Daybook
# 8. Others (Expenses, Bank Accounts, Reports, Settings, Users)
app.include_router(contacts_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(purchases_router, prefix="/api")
app.include_router(sales_router, prefix="/api")
app.include_router(damages_router, prefix="/api")
app.include_router(stock_router, prefix="/api")
app.include_router(daybook_router, prefix="/api")
app.include_router(others_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(backup_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(archives_router, prefix="/api")


@app.get("/api/db-diagnostic")
def db_diagnostic():
    import urllib.parse
    from database import DATABASE_URL, IS_POSTGRES, get_db
    
    masked_url = None
    if DATABASE_URL:
        import re
        masked_url = re.sub(r':([^:@]+)@', ':****@', DATABASE_URL)

    diag = {
        "is_postgres": IS_POSTGRES,
        "database_url_configured": bool(DATABASE_URL),
        "database_url_preview": masked_url,
        "has_placeholder": bool(DATABASE_URL and ('[YOUR-PASSWORD]' in DATABASE_URL or 'db.supabase.co' in DATABASE_URL)),
        "status": "pending",
        "error": None,
        "table_count": 0
    }

    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                if IS_POSTGRES:
                    cur.execute("SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public';")
                else:
                    cur.execute("SELECT COUNT(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'billing';")
                row = cur.fetchone()
                diag["status"] = "connected"
                diag["table_count"] = row["total_tables"] if isinstance(row, dict) else row[0]
    except Exception as e:
        diag["status"] = "failed"
        diag["error"] = str(e)

    return diag

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "Billora - Smart Billing & Stone Inventory ERP System",
        "database": "PostgreSQL (Supabase)" if IS_POSTGRES else "MySQL",
        "currency": "INR (₹)",
        "version": "1.0.0"
    }


# Static files & SPA fallback (serves frontend if built)
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Multi-candidate production build lookup (supports Render rootDir=backend, rootDir=., Vercel, Docker)
DIST_DIR = None
for candidate in [
    BASE_DIR / "dist",
    BASE_DIR / "build",
    BASE_DIR.parent / "frontend" / "dist",
    BASE_DIR.parent / "frontend" / "build",
    BASE_DIR.parent / "dist",
    BASE_DIR.parent / "build"
]:
    if candidate.exists() and (candidate / "index.html").exists():
        DIST_DIR = candidate
        break

if DIST_DIR and (DIST_DIR / "index.html").exists():
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "docs" or full_path == "openapi.json":
            return None
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8100))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
