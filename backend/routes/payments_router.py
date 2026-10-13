from fastapi import APIRouter, HTTPException
from database import get_db, query_all, query_one, execute_update
from models import PaymentCreate

router = APIRouter(prefix="/payments", tags=["Payments"])

def recalculate_invoice_payment(invoice_id: int):
    """Calculates total payments made for an invoice and updates balance_due and status."""
    row = query_one("SELECT grand_total FROM invoices WHERE id = ?;", (invoice_id,))
    if not row:
        return
    grand_total = float(row["grand_total"])

    sum_row = query_one("SELECT COALESCE(SUM(amount), 0.0) AS total_paid FROM payments WHERE invoice_id = ?;", (invoice_id,))
    total_paid = float(sum_row["total_paid"])

    balance_due = max(0.0, round(grand_total - total_paid, 2))

    if total_paid >= grand_total and grand_total > 0:
        new_status = "paid"
    elif total_paid > 0:
        new_status = "partially_paid"
    else:
        new_status = "pending"

    execute_update("""
        UPDATE invoices SET
            paid_amount = ?,
            balance_due = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
    """, (total_paid, balance_due, new_status, invoice_id))

@router.get("")
def list_payments():
    sql = """
    SELECT p.*, i.invoice_number, i.grand_total, i.balance_due, c.name AS customer_name, c.company_name AS customer_company
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    JOIN customers c ON i.customer_id = c.id
    ORDER BY p.payment_date DESC, p.id DESC;
    """
    return query_all(sql)

@router.post("")
def record_payment(payload: PaymentCreate):
    invoice = query_one("SELECT * FROM invoices WHERE id = ?;", (payload.invoice_id,))
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO payments (invoice_id, amount, payment_date, payment_method, transaction_reference, notes)
            VALUES (?, ?, ?, ?, ?, ?);
        """, (
            payload.invoice_id,
            float(payload.amount),
            payload.payment_date,
            payload.payment_method,
            payload.transaction_reference or "",
            payload.notes or "",
        ))
        payment_id = cursor.lastrowid

    recalculate_invoice_payment(payload.invoice_id)

    return query_one("""
        SELECT p.*, i.invoice_number, c.name AS customer_name
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN customers c ON i.customer_id = c.id
        WHERE p.id = ?;
    """, (payment_id,))

@router.delete("/{payment_id}")
def delete_payment(payment_id: int):
    payment = query_one("SELECT invoice_id FROM payments WHERE id = ?;", (payment_id,))
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    invoice_id = payment["invoice_id"]
    execute_update("DELETE FROM payments WHERE id = ?;", (payment_id,))
    recalculate_invoice_payment(invoice_id)

    return {"message": "Payment deleted successfully", "id": payment_id}
