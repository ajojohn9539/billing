from fastapi import APIRouter, HTTPException, Query
from database import get_db, query_all, query_one, execute_insert, execute_update, record_audit_log
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

router = APIRouter(prefix="/purchases", tags=["Purchase"])

class PurchaseItemInput(BaseModel):
    product_id: int
    qty: float = Field(gt=0.0)
    rate: float = Field(ge=0.0)
    discount: float = 0.0
    tax_percent: float = 0.0

class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_no: str
    date: str
    payment_method: str = "Cash"
    notes: Optional[str] = ""
    transport_charges: float = 0.0
    round_off: float = 0.0
    amount_paid_now: float = 0.0
    items: List[PurchaseItemInput]

class PurchasePaymentInput(BaseModel):
    amount: float = Field(gt=0.0)
    date: str
    payment_method: str = "Cash"
    bank_account_id: int = 1
    notes: Optional[str] = ""

@router.get("")
def list_purchases(
    supplier_id: int = Query(None),
    status: str = Query(None),
    search: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    query = ["""
        SELECT p.*, c.name AS supplier_name, c.company AS supplier_company
        FROM purchases p
        JOIN contacts c ON p.supplier_id = c.id
        WHERE p.deleted_at IS NULL
    """]
    params = []

    if supplier_id:
        query.append("AND p.supplier_id = ?")
        params.append(supplier_id)

    if status and status.lower() != 'all':
        query.append("AND p.status = ?")
        params.append(status)

    if start_date:
        query.append("AND p.date >= ?")
        params.append(start_date)

    if end_date:
        query.append("AND p.date <= ?")
        params.append(end_date)

    if search:
        term = f"%{search.strip()}%"
        query.append("AND (p.invoice_no LIKE ? OR c.name LIKE ?)")
        params.extend([term, term])

    query.append("ORDER BY p.date DESC, p.id DESC")
    return query_all(" ".join(query), tuple(params))

@router.get("/{purchase_id}")
def get_purchase(purchase_id: int):
    purchase = query_one("""
        SELECT p.*, c.name AS supplier_name, c.company AS supplier_company, c.phone, c.gstin
        FROM purchases p
        JOIN contacts c ON p.supplier_id = c.id
        WHERE p.id = ? AND p.deleted_at IS NULL
    """, (purchase_id,))
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    items = query_all("""
        SELECT pi.*, pr.name AS product_name, pr.code AS product_code
        FROM purchase_items pi
        JOIN products pr ON pi.product_id = pr.id
        WHERE pi.purchase_id = ?
    """, (purchase_id,))

    return {
        "purchase": purchase,
        "items": items
    }

@router.post("")
def create_purchase(payload: PurchaseCreate):
    supplier = query_one("SELECT id, name FROM contacts WHERE id = ? AND deleted_at IS NULL", (payload.supplier_id,))
    if not supplier:
        raise HTTPException(status_code=400, detail="Supplier not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Purchase must contain at least one stone item")

    # Check unique invoice_no per supplier
    dup = query_one("SELECT id FROM purchases WHERE supplier_id = ? AND invoice_no = ? AND deleted_at IS NULL", (payload.supplier_id, payload.invoice_no.strip()))
    if dup:
        raise HTTPException(status_code=400, detail=f"Invoice #{payload.invoice_no} already exists for this supplier.")

    subtotal = 0.0
    discount_total = 0.0
    tax_total = 0.0
    calculated_items = []

    for item in payload.items:
        prod = query_one("SELECT id, name, unit FROM products WHERE id = ?", (item.product_id,))
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product ID {item.product_id} not found")

        item_sub = item.qty * item.rate
        item_disc = item.discount
        taxable = max(0.0, item_sub - item_disc)
        item_tax = taxable * (item.tax_percent / 100.0)
        item_tot = taxable + item_tax

        subtotal += item_sub
        discount_total += item_disc
        tax_total += item_tax

        calculated_items.append({
            "product_id": item.product_id,
            "qty": item.qty,
            "unit": prod["unit"],
            "rate": item.rate,
            "discount": item_disc,
            "tax_percent": item.tax_percent,
            "tax_amount": round(item_tax, 2),
            "total": round(item_tot, 2)
        })

    subtotal = round(subtotal, 2)
    grand_total = round(max(0.0, subtotal - discount_total + tax_total + payload.transport_charges + payload.round_off), 2)
    paid = round(min(grand_total, max(0.0, payload.amount_paid_now)), 2)
    due = round(max(0.0, grand_total - paid), 2)

    status = "Paid" if due <= 0 else "Partly paid" if paid > 0 else "Unpaid"

    with get_db() as conn:
        with conn.cursor() as cur:
            # 1. Insert Purchase Header
            cur.execute("""
                INSERT INTO purchases (supplier_id, invoice_no, date, payment_method, notes,
                                      subtotal, discount, tax, transport_charges, round_off,
                                      total, paid, due, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                payload.supplier_id, payload.invoice_no.strip(), payload.date,
                payload.payment_method, payload.notes or "",
                subtotal, discount_total, tax_total, payload.transport_charges, payload.round_off,
                grand_total, paid, due, status
            ))
            purchase_id = cur.lastrowid

            # 2. Insert items and increase stock
            for it in calculated_items:
                cur.execute("""
                    INSERT INTO purchase_items (purchase_id, product_id, qty, unit, rate, discount, tax_percent, tax_amount, total)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    purchase_id, it["product_id"], it["qty"], it["unit"],
                    it["rate"], it["discount"], it["tax_percent"], it["tax_amount"], it["total"]
                ))

                # Update product stock
                cur.execute("UPDATE products SET current_stock = current_stock + %s WHERE id = %s", (it["qty"], it["product_id"]))

                # Stock movement audit
                cur.execute("""
                    INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, remarks)
                    VALUES (%s, 'purchase', %s, 'purchases', %s, %s, %s)
                """, (it["product_id"], it["qty"], purchase_id, payload.date, f"Purchase Invoice {payload.invoice_no}"))

            # 3. Update supplier current balance (To Pay)
            cur.execute("UPDATE contacts SET current_balance = current_balance + %s WHERE id = %s", (due, payload.supplier_id))

            # 4. If amount paid, create Outward entry in Daybook
            if paid > 0:
                cur.execute("""
                    INSERT INTO daybook (date, time, type, method, bank_account_id, document_no, narration, to_be_paid, paid, excess, source_type, source_id)
                    VALUES (%s, %s, 'outward', %s, 1, %s, %s, %s, %s, 0, 'purchase', %s)
                """, (
                    payload.date, datetime.now().strftime("%H:%M:%S"), payload.payment_method,
                    payload.invoice_no.strip(),
                    f"Payment to {supplier['name']} for purchase bill #{payload.invoice_no}",
                    grand_total, paid, purchase_id
                ))

    return get_purchase(purchase_id)

@router.post("/{purchase_id}/payment")
def add_purchase_payment(purchase_id: int, payload: PurchasePaymentInput):
    purchase = query_one("SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL", (purchase_id,))
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    supplier = query_one("SELECT name FROM contacts WHERE id = ?", (purchase["supplier_id"],))

    new_paid = purchase["paid"] + payload.amount
    new_due = max(0.0, purchase["total"] - new_paid)
    new_status = "Paid" if new_due <= 0 else "Partly paid"

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE purchases SET paid = %s, due = %s, status = %s WHERE id = %s", (new_paid, new_due, new_status, purchase_id))
            cur.execute("UPDATE contacts SET current_balance = current_balance - %s WHERE id = %s", (payload.amount, purchase["supplier_id"]))

            # Daybook outward
            cur.execute("""
                INSERT INTO daybook (date, time, type, method, bank_account_id, document_no, narration, to_be_paid, paid, excess, source_type, source_id)
                VALUES (%s, %s, 'outward', %s, %s, %s, %s, %s, %s, 0, 'purchase', %s)
            """, (
                payload.date, datetime.now().strftime("%H:%M:%S"), payload.payment_method,
                payload.bank_account_id, purchase["invoice_no"],
                f"Payment against purchase bill #{purchase['invoice_no']} to {supplier['name']}",
                purchase["due"], payload.amount, purchase_id
            ))

    record_audit_log("purchases", purchase_id, "CREATE", new_values={"invoice_no": payload.invoice_no, "total": grand_total, "supplier": supplier["name"]}, details=f"Inward Purchase #{payload.invoice_no} from {supplier['name']} ({grand_total})")
    return get_purchase(purchase_id)

@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int):
    # Reverse stock & accounts
    purchase = query_one("SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL", (purchase_id,))
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    items = query_all("SELECT product_id, qty FROM purchase_items WHERE purchase_id = ?", (purchase_id,))

    # Check if removing this purchase would make stock negative
    for it in items:
        prod = query_one("SELECT current_stock, name FROM products WHERE id = ?", (it["product_id"],))
        if prod["current_stock"] < it["qty"]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete purchase: {it['qty']} {prod['name']} has already been sold. Current stock would become negative."
            )

    with get_db() as conn:
        with conn.cursor() as cur:
            for it in items:
                cur.execute("UPDATE products SET current_stock = current_stock - %s WHERE id = %s", (it["qty"], it["product_id"]))
                cur.execute("DELETE FROM stock_movements WHERE reference_type = 'purchases' AND reference_id = %s", (purchase_id,))

            cur.execute("UPDATE contacts SET current_balance = current_balance - %s WHERE id = %s", (purchase["due"], purchase["supplier_id"]))
            cur.execute("UPDATE purchases SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s", (purchase_id,))
            cur.execute("UPDATE daybook SET deleted_at = CURRENT_TIMESTAMP WHERE source_type = 'purchase' AND source_id = %s", (purchase_id,))

    return {"message": "Purchase deleted and stock reversed successfully", "id": purchase_id}
