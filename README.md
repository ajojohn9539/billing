# Apex Billing — Modern Billing & Invoice Management Software

A complete, production-grade billing and invoicing platform built with **Python (FastAPI)**, **React (Vite)**, and **SQL (SQLite Engine)**.

---

## 🌟 Key Features

1. **📊 Executive Financial Dashboard**
   - Live KPI cards: Total Billed, Realized Collections, Outstanding Balance, and Overdue Amount.
   - Monthly revenue analytics bar chart.
   - Status pipeline breakdown and recent transaction feeds.

2. **📄 Complete Invoicing Suite**
   - Dynamic invoice builder with automatic sequential numbering (`INV-2026-0001`).
   - Catalog auto-fill for products/services (prices, descriptions, tax rates).
   - Real-time live computation of subtotals, compound taxes, discounts, and grand totals.
   - Status tracking: `Draft`, `Pending`, `Partially Paid`, `Paid`, `Overdue`, `Cancelled`.

3. **🖨️ Luxury Printable / PDF Invoices**
   - Clean, professional corporate design ready for client export or printing.
   - Company branding, GST/VAT/Tax IDs, client addresses, and itemized billing table.
   - Banking wire details, payment QR code block, terms, and authorized signature section.
   - Native browser print stylesheet (`@media print`).

4. **💳 Payment & Settlement Ledger**
   - Record full or partial payments against any open invoice.
   - Automatic reconciliation of invoice `paid_amount`, `balance_due`, and status changes.
   - Tracks payment methods: Bank Wire, Credit Card, UPI, PayPal, Cheque, Cash.
   - Audit trail with ability to void/delete records.

5. **👥 Customer Relationship Directory**
   - Manage client profiles, emails, phone numbers, and billing addresses.
   - Real-time customer financial balance ledger (Total Billed vs Paid vs Balance Due).
   - Quick one-click filter to view all invoices for a specific client.

6. **📦 Inventory & Services Catalog**
   - SKU management, category tagging, unit pricing, default tax percentages, and stock tracking.

7. **📈 Tax & Financial Reports**
   - Filter by custom date ranges or quick presets (This Month, This Year, All Time).
   - Gross revenue, sales tax collected, discounts granted, and client aging.
   - One-click export to CSV.

8. **⚙️ Company & Currency Settings**
   - Configurable business identity, invoice prefix, tax rates, and banking details.
   - Multi-currency support: `$` (USD), `₹` (INR), `€` (EUR), `£` (GBP), `¥` (JPY/CNY), and more.

---

## 🏗️ Architecture & Technology Stack

```
billing-app/
├── backend/
│   ├── venv/                 # Python 3 virtual environment
│   ├── database.py           # SQLite connection pool & query helpers
│   ├── schema.sql            # SQL92 / SQLite DDL schema with views & indexes
│   ├── seed_data.sql         # Realistic seed data for demonstration
│   ├── models.py             # Pydantic validation schemas
│   ├── main.py               # FastAPI application & CORS setup
│   ├── requirements.txt      # FastAPI, Uvicorn, Pydantic
│   └── routes/
│       ├── dashboard_router.py
│       ├── invoices_router.py
│       ├── customers_router.py
│       ├── products_router.py
│       ├── payments_router.py
│       ├── reports_router.py
│       └── settings_router.py
│
├── frontend/
│   ├── src/
│   │   ├── index.css         # Modern dark glassmorphism design system
│   │   ├── App.jsx           # Master application layout & state machine
│   │   ├── services/api.js   # REST API client
│   │   └── components/
│   │       ├── Navbar.jsx
│   │       ├── DashboardView.jsx
│   │       ├── InvoicesView.jsx
│   │       ├── InvoiceEditorModal.jsx
│   │       ├── InvoicePrintModal.jsx
│   │       ├── PaymentRecordModal.jsx
│   │       ├── CustomersView.jsx
│   │       ├── ProductsView.jsx
│   │       ├── PaymentsView.jsx
│   │       ├── ReportsView.jsx
│   │       └── SettingsView.jsx
│   ├── package.json
│   └── vite.config.js        # Port 5180 with /api proxy to port 8100
│
├── run_backend.sh            # Starts FastAPI on http://127.0.0.1:8100
├── run_frontend.sh           # Starts Vite on http://127.0.0.1:5180
└── start.sh                  # Starts both servers simultaneously
```

---

## 🚀 Quick Start Guide

### 1. Launch Servers

To run both backend and frontend together:
```bash
cd /home/ajo/.gemini/antigravity-ide/scratch/billing-app
./start.sh
```

Or run individually:
```bash
# Terminal 1: Backend
./run_backend.sh

# Terminal 2: Frontend
./run_frontend.sh
```

### 2. Access the Application

- **Frontend Application**: [http://127.0.0.1:5180](http://127.0.0.1:5180)
- **Interactive API Swagger Docs**: [http://127.0.0.1:8100/docs](http://127.0.0.1:8100/docs)
- **API Health Check**: [http://127.0.0.1:8100/api/health](http://127.0.0.1:8100/api/health)
