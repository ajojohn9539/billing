import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import init_db
from routes.contacts_router import router as contacts_router
from routes.products_router import router as products_router
from routes.purchases_router import router as purchases_router
from routes.sales_router import router as sales_router
from routes.damages_router import router as damages_router
from routes.stock_router import router as stock_router
from routes.daybook_router import router as daybook_router
from routes.others_router import router as others_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Rock Palace - Aster Billing System API (MySQL Mode)...")
    init_db()
    yield
    print("Shutting down Rock Palace API...")

app = FastAPI(
    title="Rock Palace - Aster Billing & Accounting API",
    description="Web-based accounting & stone billing system built on MySQL (phpMyAdmin `billing` database)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "Aster Billing (Rock Palace Stone Shop)",
        "database": "MySQL 8.0 `billing`",
        "currency": "INR (₹)",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8100, reload=True)
