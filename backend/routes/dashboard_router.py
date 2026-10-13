from fastapi import APIRouter
from datetime import datetime, date
from database import query_all, query_one

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_dashboard_stats():
    today = date.today().isoformat()
    
    # 1. Update any pending invoices whose due_date < today to 'overdue' if balance_due > 0
    with_pending = query_all("SELECT id FROM invoices WHERE status = 'pending' AND due_date < ? AND balance_due > 0;", (today,))
    for inv in with_pending:
        from database import execute_update
        execute_update("UPDATE invoices SET status = 'overdue' WHERE id = ?;", (inv["id"],))

    # 2. Settings currency
    settings = query_one("SELECT currency_symbol, currency_code, company_name FROM settings WHERE id = 1;")
    curr_symbol = settings["currency_symbol"] if settings else "$"
    company_name = settings["company_name"] if settings else "Apex"

    # 3. Overall Totals
    totals = query_one("""
        SELECT 
            COALESCE(SUM(grand_total), 0.0) AS total_billed,
            COALESCE(SUM(paid_amount), 0.0) AS total_collected,
            COALESCE(SUM(balance_due), 0.0) AS total_receivable,
            COUNT(*) AS total_invoices
        FROM invoices;
    """)

    # 4. Invoices count and amounts grouped by status
    status_summary = query_all("""
        SELECT 
            status,
            COUNT(*) AS count,
            COALESCE(SUM(grand_total), 0.0) AS total_amount,
            COALESCE(SUM(balance_due), 0.0) AS balance_due
        FROM invoices
        GROUP BY status;
    """)

    # 5. Overdue specific
    overdue_summary = query_one("""
        SELECT 
            COUNT(*) AS count,
            COALESCE(SUM(balance_due), 0.0) AS amount
        FROM invoices
        WHERE status = 'overdue';
    """)

    # 6. Customers and Products count
    customers_count = query_one("SELECT COUNT(*) AS c FROM customers;")["c"]
    products_count = query_one("SELECT COUNT(*) AS c FROM products;")["c"]

    # 7. Monthly Revenue Trend (using SQLite strftime on issue_date)
    monthly_trend = query_all("""
        SELECT 
            strftime('%Y-%m', issue_date) AS month,
            COALESCE(SUM(grand_total), 0.0) AS billed,
            COALESCE(SUM(paid_amount), 0.0) AS collected
        FROM invoices
        GROUP BY strftime('%Y-%m', issue_date)
        ORDER BY month ASC
        LIMIT 12;
    """)

    # 8. Recent 5 Invoices
    recent_invoices = query_all("""
        SELECT * FROM v_invoice_summary
        ORDER BY issue_date DESC, id DESC
        LIMIT 6;
    """)

    # 9. Recent 5 Payments
    recent_payments = query_all("""
        SELECT p.*, i.invoice_number, c.name AS customer_name
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN customers c ON i.customer_id = c.id
        ORDER BY p.payment_date DESC, p.id DESC
        LIMIT 6;
    """)

    return {
        "company_name": company_name,
        "currency_symbol": curr_symbol,
        "total_billed": totals["total_billed"] if totals else 0.0,
        "total_collected": totals["total_collected"] if totals else 0.0,
        "total_receivable": totals["total_receivable"] if totals else 0.0,
        "total_invoices": totals["total_invoices"] if totals else 0,
        "overdue_count": overdue_summary["count"] if overdue_summary else 0,
        "overdue_amount": overdue_summary["amount"] if overdue_summary else 0.0,
        "customers_count": customers_count,
        "products_count": products_count,
        "status_summary": status_summary,
        "monthly_trend": monthly_trend,
        "recent_invoices": recent_invoices,
        "recent_payments": recent_payments,
    }
