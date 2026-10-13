from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, date
from database import get_db, query_all, query_one, execute_update
from models import InvoiceCreate, InvoiceStatusUpdate

router = APIRouter(prefix="/invoices", tags=["Invoices"])

def generate_next_invoice_number() -> str:
    """Computes next sequential invoice number based on prefix and latest ID."""
    settings = query_one("SELECT invoice_prefix FROM settings WHERE id = 1;")
    prefix = settings["invoice_prefix"] if settings and settings["invoice_prefix"] else "INV-"
    
    current_year = datetime.now().year
    row = query_one("""
        SELECT invoice_number FROM invoices 
        ORDER BY id DESC LIMIT 1;
    """)
    if not row or not row["invoice_number"]:
        return f"{prefix}{current_year}-0001"
    
    last_num = row["invoice_number"]
    # Try parsing number from the end
    try:
        parts = last_num.split("-")
        seq = int(parts[-1]) + 1
        return f"{prefix}{current_year}-{seq:04d}"
    except Exception:
        # Fallback to counting total invoices
        cnt = query_one("SELECT COUNT(*) as c FROM invoices;")
        return f"{prefix}{current_year}-{(cnt['c'] + 1):04d}"

@router.get("/next-number")
def get_next_number():
    return {"next_number": generate_next_invoice_number()}

@router.get("")
def list_invoices(
    status: str = Query(None),
    customer_id: int = Query(None),
    search: str = Query(None),
):
    query_parts = ["SELECT * FROM v_invoice_summary WHERE 1=1"]
    params = []

    if status and status.lower() != "all":
        query_parts.append("AND status = ?")
        params.append(status.lower())

    if customer_id:
        query_parts.append("AND customer_id = ?")
        params.append(customer_id)

    if search:
        term = f"%{search.strip()}%"
        query_parts.append("AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_company LIKE ?)")
        params.extend([term, term, term])

    query_parts.append("ORDER BY issue_date DESC, id DESC;")
    sql = " ".join(query_parts)
    return query_all(sql, tuple(params))

@router.get("/{invoice_id}")
def get_invoice(invoice_id: int):
    invoice = query_one("SELECT * FROM v_invoice_summary WHERE id = ?;", (invoice_id,))
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Fetch customer full details
    customer = query_one("SELECT * FROM customers WHERE id = ?;", (invoice["customer_id"],))

    # Fetch line items
    items = query_all("SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC;", (invoice_id,))

    # Fetch payments
    payments = query_all("SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC, id DESC;", (invoice_id,))

    # Fetch settings for company profile on bill
    settings = query_one("SELECT * FROM settings WHERE id = 1;")

    return {
        "invoice": invoice,
        "customer": customer,
        "items": items,
        "payments": payments,
        "company": settings,
    }

@router.post("")
def create_invoice(payload: InvoiceCreate):
    # Verify customer exists
    customer = query_one("SELECT id FROM customers WHERE id = ?;", (payload.customer_id,))
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Invoice must contain at least one line item")

    inv_number = payload.invoice_number.strip() if payload.invoice_number else generate_next_invoice_number()

    # Check uniqueness
    existing = query_one("SELECT id FROM invoices WHERE invoice_number = ?;", (inv_number,))
    if existing:
        raise HTTPException(status_code=400, detail=f"Invoice number '{inv_number}' already exists.")

    # Calculate item totals, subtotal, and tax
    calculated_items = []
    subtotal = 0.0
    tax_total = 0.0

    for item in payload.items:
        item_qty = float(item.quantity)
        item_price = float(item.unit_price)
        item_tax_rate = float(item.tax_rate)
        
        line_subtotal = item_qty * item_price
        line_tax = line_subtotal * (item_tax_rate / 100.0)
        line_total = line_subtotal + line_tax

        subtotal += line_subtotal
        tax_total += line_tax

        calculated_items.append({
            "product_id": item.product_id,
            "item_name": item.item_name.strip(),
            "description": item.description or "",
            "quantity": item_qty,
            "unit_price": item_price,
            "tax_rate": item_tax_rate,
            "tax_amount": round(line_tax, 2),
            "total": round(line_total, 2)
        })

    subtotal = round(subtotal, 2)
    tax_total = round(tax_total, 2)
    discount_total = round(float(payload.discount_total), 2)
    grand_total = max(0.0, round(subtotal + tax_total - discount_total, 2))
    paid_amount = 0.0
    balance_due = grand_total

    status = payload.status or "pending"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO invoices (
                invoice_number, customer_id, issue_date, due_date,
                subtotal, tax_total, discount_total, grand_total, paid_amount, balance_due,
                status, notes, terms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            inv_number,
            payload.customer_id,
            payload.issue_date,
            payload.due_date,
            subtotal,
            tax_total,
            discount_total,
            grand_total,
            paid_amount,
            balance_due,
            status,
            payload.notes or "",
            payload.terms or "",
        ))
        invoice_id = cursor.lastrowid

        for item in calculated_items:
            cursor.execute("""
                INSERT INTO invoice_items (
                    invoice_id, product_id, item_name, description,
                    quantity, unit_price, tax_rate, tax_amount, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                invoice_id,
                item["product_id"],
                item["item_name"],
                item["description"],
                item["quantity"],
                item["unit_price"],
                item["tax_rate"],
                item["tax_amount"],
                item["total"]
            ))

    return get_invoice(invoice_id)

@router.put("/{invoice_id}")
def update_invoice(invoice_id: int, payload: InvoiceCreate):
    existing = query_one("SELECT * FROM invoices WHERE id = ?;", (invoice_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Invoice not found")

    customer = query_one("SELECT id FROM customers WHERE id = ?;", (payload.customer_id,))
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Invoice must contain at least one line item")

    inv_number = payload.invoice_number.strip() if payload.invoice_number else existing["invoice_number"]

    # Calculate item totals, subtotal, and tax
    calculated_items = []
    subtotal = 0.0
    tax_total = 0.0

    for item in payload.items:
        item_qty = float(item.quantity)
        item_price = float(item.unit_price)
        item_tax_rate = float(item.tax_rate)
        
        line_subtotal = item_qty * item_price
        line_tax = line_subtotal * (item_tax_rate / 100.0)
        line_total = line_subtotal + line_tax

        subtotal += line_subtotal
        tax_total += line_tax

        calculated_items.append({
            "product_id": item.product_id,
            "item_name": item.item_name.strip(),
            "description": item.description or "",
            "quantity": item_qty,
            "unit_price": item_price,
            "tax_rate": item_tax_rate,
            "tax_amount": round(line_tax, 2),
            "total": round(line_total, 2)
        })

    subtotal = round(subtotal, 2)
    tax_total = round(tax_total, 2)
    discount_total = round(float(payload.discount_total), 2)
    grand_total = max(0.0, round(subtotal + tax_total - discount_total, 2))
    
    # Keep existing payments in mind
    paid_amount = float(existing["paid_amount"])
    balance_due = max(0.0, round(grand_total - paid_amount, 2))

    # Update status according to balance
    status = payload.status or existing["status"]
    if paid_amount >= grand_total and grand_total > 0:
        status = "paid"
    elif paid_amount > 0 and balance_due > 0:
        status = "partially_paid"

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE invoices SET
                invoice_number = ?,
                customer_id = ?,
                issue_date = ?,
                due_date = ?,
                subtotal = ?,
                tax_total = ?,
                discount_total = ?,
                grand_total = ?,
                balance_due = ?,
                status = ?,
                notes = ?,
                terms = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
        """, (
            inv_number,
            payload.customer_id,
            payload.issue_date,
            payload.due_date,
            subtotal,
            tax_total,
            discount_total,
            grand_total,
            balance_due,
            status,
            payload.notes or "",
            payload.terms or "",
            invoice_id,
        ))

        # Replace items
        cursor.execute("DELETE FROM invoice_items WHERE invoice_id = ?;", (invoice_id,))
        for item in calculated_items:
            cursor.execute("""
                INSERT INTO invoice_items (
                    invoice_id, product_id, item_name, description,
                    quantity, unit_price, tax_rate, tax_amount, total
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (
                invoice_id,
                item["product_id"],
                item["item_name"],
                item["description"],
                item["quantity"],
                item["unit_price"],
                item["tax_rate"],
                item["tax_amount"],
                item["total"]
            ))

    return get_invoice(invoice_id)

@router.post("/{invoice_id}/status")
def update_invoice_status(invoice_id: int, payload: InvoiceStatusUpdate):
    exists = query_one("SELECT id FROM invoices WHERE id = ?;", (invoice_id,))
    if not exists:
        raise HTTPException(status_code=404, detail="Invoice not found")

    allowed = ["draft", "pending", "paid", "partially_paid", "overdue", "cancelled"]
    if payload.status.lower() not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(allowed)}")

    execute_update("UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;", (payload.status.lower(), invoice_id))
    return query_one("SELECT * FROM v_invoice_summary WHERE id = ?;", (invoice_id,))

@router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int):
    execute_update("DELETE FROM invoices WHERE id = ?;", (invoice_id,))
    return {"message": "Invoice deleted successfully", "id": invoice_id}
