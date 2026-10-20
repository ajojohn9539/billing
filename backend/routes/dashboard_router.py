from fastapi import APIRouter
from datetime import datetime, date
from database import query_all, query_one

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats():
    # 1. Company Settings
    settings = query_one("SELECT currency_symbol, company_name FROM settings WHERE id = 1;")
    curr_symbol = settings.get("currency_symbol", "₹") if settings else "₹"
    company_name = settings.get("company_name", "BILLORA MARBLES & GRANITES") if settings else "BILLORA MARBLES & GRANITES"

    # 2. Sales Totals
    sales_totals = query_one("""
        SELECT 
            COALESCE(SUM(total), 0.0) AS total_billed,
            COALESCE(SUM(paid), 0.0) AS total_collected,
            COALESCE(SUM(due), 0.0) AS total_receivable,
            COUNT(*) AS total_invoices
        FROM sales
        WHERE deleted_at IS NULL;
    """) or {"total_billed": 0.0, "total_collected": 0.0, "total_receivable": 0.0, "total_invoices": 0}

    # 3. Purchases Totals
    purchases_totals = query_one("""
        SELECT 
            COALESCE(SUM(total), 0.0) AS total_purchases,
            COALESCE(SUM(paid), 0.0) AS total_purchase_paid,
            COALESCE(SUM(due), 0.0) AS total_purchase_due,
            COUNT(*) AS count
        FROM purchases
        WHERE deleted_at IS NULL;
    """) or {"total_purchases": 0.0, "total_purchase_paid": 0.0, "total_purchase_due": 0.0, "count": 0}

    # 4. Bank Balances Total
    bank_total_row = query_one("""
        SELECT COALESCE(SUM(current_balance), 0.0) AS total_bank_balance
        FROM bank_accounts;
    """) or {"total_bank_balance": 0.0}

    # 5. Inventory Valuation
    stock_val_row = query_one("""
        SELECT 
            COALESCE(SUM(current_stock * purchase_price), 0.0) AS valuation,
            COUNT(*) AS total_products
        FROM products
        WHERE (status = 'Active' OR status IS NULL) AND deleted_at IS NULL;
    """) or {"valuation": 0.0, "total_products": 0}

    # 6. Customers count
    customers_cnt_row = query_one("""
        SELECT COUNT(*) AS c FROM contacts WHERE type IN ('Customer', 'Both') AND deleted_at IS NULL;
    """) or {"c": 0}

    # 7. Recent 6 Sales Bills
    recent_sales = query_all("""
        SELECT s.id, s.bill_no, s.date, c.name AS customer_name, s.total, s.paid, s.due, s.status AS payment_status
        FROM sales s
        LEFT JOIN contacts c ON s.customer_id = c.id
        WHERE s.deleted_at IS NULL
        ORDER BY s.date DESC, s.id DESC
        LIMIT 6;
    """)

    return {
        "status": "success",
        "company_name": company_name,
        "currency_symbol": curr_symbol,
        "total_billed": float(sales_totals.get("total_billed", 0.0)),
        "total_collected": float(sales_totals.get("total_collected", 0.0)),
        "total_receivable": float(sales_totals.get("total_receivable", 0.0)),
        "total_invoices": int(sales_totals.get("total_invoices", 0)),
        "total_purchases": float(purchases_totals.get("total_purchases", 0.0)),
        "total_purchase_due": float(purchases_totals.get("total_purchase_due", 0.0)),
        "total_bank_balance": float(bank_total_row.get("total_bank_balance", 0.0)),
        "inventory_valuation": float(stock_val_row.get("valuation", 0.0)),
        "total_products": int(stock_val_row.get("total_products", 0)),
        "customers_count": int(customers_cnt_row.get("c", 0)),
        "recent_sales": recent_sales
    }
