from fastapi import APIRouter, Query
from database import query_all, query_one

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_reports_summary(
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    date_filter = ""
    params = []
    if start_date and end_date:
        date_filter = "WHERE issue_date BETWEEN ? AND ?"
        params = [start_date, end_date]
    elif start_date:
        date_filter = "WHERE issue_date >= ?"
        params = [start_date]
    elif end_date:
        date_filter = "WHERE issue_date <= ?"
        params = [end_date]

    # Revenue Totals
    totals_sql = f"""
        SELECT 
            COALESCE(SUM(subtotal), 0.0) AS gross_sales,
            COALESCE(SUM(tax_total), 0.0) AS total_tax_collected,
            COALESCE(SUM(discount_total), 0.0) AS total_discounts,
            COALESCE(SUM(grand_total), 0.0) AS net_billed,
            COALESCE(SUM(paid_amount), 0.0) AS total_received,
            COALESCE(SUM(balance_due), 0.0) AS total_outstanding,
            COUNT(*) AS invoice_count
        FROM invoices
        {date_filter};
    """
    totals = query_one(totals_sql, tuple(params))

    # Top Customers by Billing
    top_customers_sql = f"""
        SELECT 
            c.id, c.name, c.company_name,
            COUNT(i.id) AS invoices_count,
            COALESCE(SUM(i.grand_total), 0.0) AS total_amount,
            COALESCE(SUM(i.paid_amount), 0.0) AS paid_amount,
            COALESCE(SUM(i.balance_due), 0.0) AS outstanding
        FROM customers c
        JOIN invoices i ON c.id = i.customer_id
        {date_filter}
        GROUP BY c.id
        ORDER BY total_amount DESC
        LIMIT 10;
    """
    top_customers = query_all(top_customers_sql, tuple(params))

    # Product Sales breakdown
    product_sales_sql = f"""
        SELECT 
            COALESCE(p.name, ii.item_name) AS item_name,
            COALESCE(p.category, 'General') AS category,
            SUM(ii.quantity) AS total_qty_sold,
            SUM(ii.total) AS total_revenue,
            SUM(ii.tax_amount) AS total_tax
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        LEFT JOIN products p ON ii.product_id = p.id
        {date_filter}
        GROUP BY item_name
        ORDER BY total_revenue DESC
        LIMIT 10;
    """
    product_sales = query_all(product_sales_sql, tuple(params))

    return {
        "totals": totals,
        "top_customers": top_customers,
        "product_sales": product_sales,
    }
