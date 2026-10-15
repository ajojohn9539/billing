from fastapi import APIRouter, HTTPException, Query
from database import get_db, query_all, query_one, execute_insert, execute_update
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

router = APIRouter(prefix="/sales", tags=["Sales"])

class SaleItemInput(BaseModel):
    product_id: int
    qty: float = Field(gt=0.0)
    rate: float = Field(ge=0.0)
    discount: float = 0.0
    tax_percent: float = 0.0

class SaleCreate(BaseModel):
    customer_id: int
    bill_no: Optional[str] = None
    date: str
    payment_method: str = "Cash"
    vehicle_no: Optional[str] = ""
    delivery_address: Optional[str] = ""
    notes: Optional[str] = ""
    transport_charges: float = 0.0
    round_off: float = 0.0
    amount_received: float = 0.0
    reverse_charge: Optional[str] = "No"
    transport_mode: Optional[str] = "Road"
    date_of_supply: Optional[str] = None
    place_of_supply: Optional[str] = "Kerala"
    state_code: Optional[str] = "32"
    eway_bill_no: Optional[str] = ""
    consignee_name: Optional[str] = ""
    consignee_address: Optional[str] = ""
    consignee_state: Optional[str] = "Kerala"
    consignee_state_code: Optional[str] = "32"
    items: List[SaleItemInput]

class SaleReceiptInput(BaseModel):
    amount: float = Field(gt=0.0)
    date: str
    payment_method: str = "Cash"
    bank_account_id: int = 1
    notes: Optional[str] = ""

def generate_next_bill_no() -> str:
    settings = query_one("SELECT invoice_prefix FROM settings WHERE id = 1")
    prefix = settings["invoice_prefix"] if settings and settings["invoice_prefix"] else "JR26-27 "
    cnt = query_one("SELECT COUNT(*) AS c FROM sales")
    next_idx = (cnt["c"] + 1) if cnt else 1
    if prefix.endswith(' ') or prefix.endswith('/'):
        return f"{prefix}{next_idx:03d}"
    year = datetime.now().year
    return f"{prefix}/{year}/{next_idx:04d}"

@router.get("/next-bill-no")
def get_next_bill_no():
    return {"bill_no": generate_next_bill_no()}

@router.get("")
def list_sales(
    customer_id: int = Query(None),
    status: str = Query(None),
    search: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    query = ["""
        SELECT s.*, c.name AS customer_name, c.company AS customer_company, c.phone AS customer_phone
        FROM sales s
        JOIN contacts c ON s.customer_id = c.id
        WHERE s.deleted_at IS NULL
    """]
    params = []

    if customer_id:
        query.append("AND s.customer_id = ?")
        params.append(customer_id)

    if status and status.lower() != 'all':
        query.append("AND s.status = ?")
        params.append(status)

    if start_date:
        query.append("AND s.date >= ?")
        params.append(start_date)

    if end_date:
        query.append("AND s.date <= ?")
        params.append(end_date)

    if search:
        term = f"%{search.strip()}%"
        query.append("AND (s.bill_no LIKE ? OR c.name LIKE ? OR s.vehicle_no LIKE ?)")
        params.extend([term, term, term])

    query.append("ORDER BY s.date DESC, s.id DESC")
    return query_all(" ".join(query), tuple(params))

@router.get("/{sale_id}")
def get_sale(sale_id: int):
    sale = query_one("""
        SELECT s.*, c.name AS customer_name, c.company AS customer_company, c.phone, c.gstin, c.address AS customer_address
        FROM sales s
        JOIN contacts c ON s.customer_id = c.id
        WHERE s.id = ? AND s.deleted_at IS NULL
    """, (sale_id,))
    if not sale:
        raise HTTPException(status_code=404, detail="Sale bill not found")

    items = query_all("""
        SELECT si.*, pr.name AS product_name, pr.code AS product_code, pr.hsn_code
        FROM sale_items si
        JOIN products pr ON si.product_id = pr.id
        WHERE si.sale_id = ?
    """, (sale_id,))

    settings = query_one("SELECT * FROM settings WHERE id = 1")
    bank = query_one("SELECT * FROM bank_accounts WHERE bank_name ILIKE '%INDIAN BANK%' OR id = 1 LIMIT 1")

    return {
        "sale": sale,
        "items": items,
        "company": settings,
        "bank": bank
    }

@router.post("")
def create_sale(payload: SaleCreate):
    customer = query_one("SELECT id, name FROM contacts WHERE id = ? AND deleted_at IS NULL", (payload.customer_id,))
    if not customer:
        raise HTTPException(status_code=400, detail="Customer not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Sale must contain at least one stone item")

    bill_no = payload.bill_no.strip() if payload.bill_no else generate_next_bill_no()

    # Rule in Section 6: Quantity cannot exceed available stock!
    for it in payload.items:
        prod = query_one("SELECT id, name, current_stock FROM products WHERE id = ?", (it.product_id,))
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product ID {it.product_id} not found")
        if it.qty > prod["current_stock"]:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{prod['name']}'. Requested: {it.qty}, Available: {prod['current_stock']}"
            )

    subtotal = 0.0
    discount_total = 0.0
    tax_total = 0.0
    calculated_items = []

    for item in payload.items:
        prod = query_one("SELECT id, name, unit FROM products WHERE id = ?", (item.product_id,))
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
    paid = round(min(grand_total, max(0.0, payload.amount_received)), 2)
    due = round(max(0.0, grand_total - paid), 2)

    status = "Paid" if due <= 0 else "Partly paid" if paid > 0 else "Unpaid"

    with get_db() as conn:
        with conn.cursor() as cur:
            # 1. Insert Sales Header with GST Invoice metadata
            cur.execute("""
                INSERT INTO sales (customer_id, bill_no, date, payment_method, vehicle_no, delivery_address, notes,
                                  subtotal, discount, tax, transport_charges, round_off,
                                  total, paid, due, status,
                                  reverse_charge, transport_mode, date_of_supply, place_of_supply, state_code,
                                  eway_bill_no, consignee_name, consignee_address, consignee_state, consignee_state_code)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                payload.customer_id, bill_no, payload.date,
                payload.payment_method, payload.vehicle_no or "", payload.delivery_address or "", payload.notes or "",
                subtotal, discount_total, tax_total, payload.transport_charges, payload.round_off,
                grand_total, paid, due, status,
                payload.reverse_charge or "No", payload.transport_mode or "Road",
                payload.date_of_supply or payload.date, payload.place_of_supply or "Kerala",
                payload.state_code or "32", payload.eway_bill_no or "",
                payload.consignee_name or "", payload.consignee_address or "",
                payload.consignee_state or "Kerala", payload.consignee_state_code or "32"
            ))
            sale_id = cur.lastrowid

            # 2. Insert items and reduce stock
            for it in calculated_items:
                cur.execute("""
                    INSERT INTO sale_items (sale_id, product_id, qty, unit, rate, discount, tax_percent, tax_amount, total)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    sale_id, it["product_id"], it["qty"], it["unit"],
                    it["rate"], it["discount"], it["tax_percent"], it["tax_amount"], it["total"]
                ))

                # Reduce stock
                cur.execute("UPDATE products SET current_stock = current_stock - %s WHERE id = %s", (it["qty"], it["product_id"]))

                # Stock movement audit
                cur.execute("""
                    INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, remarks)
                    VALUES (%s, 'sale', %s, 'sales', %s, %s, %s)
                """, (it["product_id"], -it["qty"], sale_id, payload.date, f"Sales Bill {bill_no} to {customer['name']}"))

            # 3. Update customer receivable balance
            cur.execute("UPDATE contacts SET current_balance = current_balance + %s WHERE id = %s", (due, payload.customer_id))

            # 4. Inward entry in Daybook for received cash/bank
            if paid > 0:
                cur.execute("""
                    INSERT INTO daybook (date, time, type, method, bank_account_id, document_no, narration, to_be_paid, paid, excess, source_type, source_id)
                    VALUES (%s, %s, 'inward', %s, 1, %s, %s, %s, %s, 0, 'sale', %s)
                """, (
                    payload.date, datetime.now().strftime("%H:%M:%S"), payload.payment_method,
                    bill_no,
                    f"Receipt for sales bill #{bill_no} from {customer['name']}",
                    grand_total, paid, sale_id
                ))

    return get_sale(sale_id)

@router.post("/{sale_id}/payment")
def add_sale_payment(sale_id: int, payload: SaleReceiptInput):
    sale = query_one("SELECT * FROM sales WHERE id = ? AND deleted_at IS NULL", (sale_id,))
    if not sale:
        raise HTTPException(status_code=404, detail="Sale bill not found")

    customer = query_one("SELECT name FROM contacts WHERE id = ?", (sale["customer_id"],))

    new_paid = sale["paid"] + payload.amount
    new_due = max(0.0, sale["total"] - new_paid)
    new_status = "Paid" if new_due <= 0 else "Partly paid"

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE sales SET paid = %s, due = %s, status = %s WHERE id = %s", (new_paid, new_due, new_status, sale_id))
            cur.execute("UPDATE contacts SET current_balance = current_balance - %s WHERE id = %s", (payload.amount, sale["customer_id"]))

            # Daybook inward
            cur.execute("""
                INSERT INTO daybook (date, time, type, method, bank_account_id, document_no, narration, to_be_paid, paid, excess, source_type, source_id)
                VALUES (%s, %s, 'inward', %s, %s, %s, %s, %s, %s, 0, 'sale', %s)
            """, (
                payload.date, datetime.now().strftime("%H:%M:%S"), payload.payment_method,
                payload.bank_account_id, sale["bill_no"],
                f"Receipt against sales bill #{sale['bill_no']} from {customer['name']}",
                sale["due"], payload.amount, sale_id
            ))

    return get_sale(sale_id)

@router.delete("/{sale_id}")
def delete_sale(sale_id: int):
    sale = query_one("SELECT * FROM sales WHERE id = ? AND deleted_at IS NULL", (sale_id,))
    if not sale:
        raise HTTPException(status_code=404, detail="Sale bill not found")

    items = query_all("SELECT product_id, qty FROM sale_items WHERE sale_id = ?", (sale_id,))

    with get_db() as conn:
        with conn.cursor() as cur:
            for it in items:
                cur.execute("UPDATE products SET current_stock = current_stock + %s WHERE id = %s", (it["qty"], it["product_id"]))
                cur.execute("DELETE FROM stock_movements WHERE reference_type = 'sales' AND reference_id = %s", (sale_id,))

            cur.execute("UPDATE contacts SET current_balance = current_balance - %s WHERE id = %s", (sale["due"], sale["customer_id"]))
            cur.execute("UPDATE sales SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s", (sale_id,))
            cur.execute("UPDATE daybook SET deleted_at = CURRENT_TIMESTAMP WHERE source_type = 'sale' AND source_id = %s", (sale_id,))

    return {"message": "Sale bill deleted and stock restored successfully", "id": sale_id}
