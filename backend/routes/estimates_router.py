from fastapi import APIRouter, HTTPException, Query
from database import get_db, query_all, query_one, execute_insert, execute_update, record_audit_log
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/estimates", tags=["Estimates"])

class EstimateItemInput(BaseModel):
    product_id: Optional[int] = None
    item_name: str
    item_description: Optional[str] = ""
    hsn_code: Optional[str] = "6802"
    length_in: Optional[float] = None
    height_in: Optional[float] = None
    pieces: Optional[int] = None
    qty: float = Field(gt=0.0)
    unit: str = "sq.ft"
    rate: float = Field(ge=0.0)
    discount: float = 0.0
    tax_percent: float = 18.0
    add_to_products: Optional[bool] = False
    product_category: Optional[str] = "Granite"

class EstimateCreate(BaseModel):
    estimate_no: Optional[str] = None
    customer_id: Optional[int] = None
    customer_name: str
    customer_phone: Optional[str] = ""
    customer_address: Optional[str] = ""
    customer_gstin: Optional[str] = ""
    date: str
    valid_until: Optional[str] = None
    status: Optional[str] = "Draft"
    transport_charges: float = 0.0
    round_off: float = 0.0
    notes: Optional[str] = ""
    terms: Optional[str] = ""
    items: List[EstimateItemInput]

class EstimateStatusUpdate(BaseModel):
    status: str

def generate_next_estimate_no() -> str:
    settings = query_one("SELECT invoice_prefix FROM settings WHERE id = 1")
    prefix = settings["invoice_prefix"] if settings and settings["invoice_prefix"] else "EST-26-27 "
    if "JR" in prefix:
        est_prefix = prefix.replace("JR", "EST-")
    elif "EST" in prefix:
        est_prefix = prefix
    else:
        est_prefix = f"EST-{prefix.strip()}-"

    if not est_prefix.endswith(" ") and not est_prefix.endswith("-") and not est_prefix.endswith("/"):
        est_prefix = f"{est_prefix} "

    cnt = query_one("SELECT COUNT(*) AS c FROM estimates")
    next_idx = (cnt["c"] + 1) if cnt else 1
    return f"{est_prefix}{next_idx:03d}"

@router.get("/next-estimate-no")
def get_next_estimate_no():
    return {"estimate_no": generate_next_estimate_no()}

@router.get("")
def list_estimates(
    search: Optional[str] = None,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = ["""
        SELECT e.*, 
               COALESCE(c.name, e.customer_name) AS display_customer_name,
               COALESCE(c.phone, e.customer_phone) AS display_customer_phone,
               COALESCE(c.gstin, e.customer_gstin) AS display_customer_gstin,
               (SELECT COUNT(*) FROM estimate_items WHERE estimate_id = e.id) AS item_count
        FROM estimates e
        LEFT JOIN contacts c ON e.customer_id = c.id
        WHERE e.deleted_at IS NULL
    """]
    params = []

    if customer_id:
        query.append("AND e.customer_id = ?")
        params.append(customer_id)

    if status and status.lower() != 'all':
        query.append("AND LOWER(e.status) = LOWER(?)")
        params.append(status)

    if start_date:
        query.append("AND e.date >= ?")
        params.append(start_date)

    if end_date:
        query.append("AND e.date <= ?")
        params.append(end_date)

    if search:
        raw_term = f"%{search.strip()}%"
        query.append("""
            AND (e.estimate_no LIKE ? 
                 OR e.customer_name LIKE ? 
                 OR e.customer_phone LIKE ? 
                 OR COALESCE(c.name, '') LIKE ?)
        """)
        params.extend([raw_term, raw_term, raw_term, raw_term])

    query.append("ORDER BY e.date DESC, e.id DESC")
    return query_all(" ".join(query), tuple(params))

@router.get("/{estimate_id}")
def get_estimate(estimate_id: int):
    estimate = query_one("""
        SELECT e.*, 
               c.name AS contact_customer_name,
               c.phone AS contact_customer_phone,
               c.gstin AS contact_customer_gstin,
               c.address AS contact_customer_address,
               c.company AS contact_company
        FROM estimates e
        LEFT JOIN contacts c ON e.customer_id = c.id
        WHERE e.id = ? AND e.deleted_at IS NULL
    """, (estimate_id,))
    
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")

    items = query_all("""
        SELECT ei.*, 
               pr.name AS product_name,
               pr.code AS product_code,
               pr.unit AS product_unit,
               pr.current_stock AS available_stock
        FROM estimate_items ei
        LEFT JOIN products pr ON ei.product_id = pr.id
        WHERE ei.estimate_id = ?
        ORDER BY ei.id ASC
    """, (estimate_id,))

    settings = query_one("SELECT * FROM settings WHERE id = 1")
    bank = query_one("SELECT * FROM bank_accounts WHERE id = 1")

    return {
        "estimate": estimate,
        "items": items,
        "company": settings,
        "bank": bank
    }

def _resolve_or_create_product(it: EstimateItemInput) -> Optional[int]:
    """Helper to create new product in catalog if requested"""
    if it.product_id:
        return it.product_id
    if not it.add_to_products:
        return None

    cat_name = (it.product_category or "Stone Slabs").strip()
    cat_row = query_one("SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1", (cat_name,))
    if cat_row:
        cat_id = cat_row['id']
    else:
        cat_id = execute_insert("INSERT INTO categories (name, type) VALUES (?, 'product')", (cat_name,))

    code = f"EST-PRD-{int(datetime.now().timestamp()) % 100000:05d}"
    dims = f"{it.length_in}x{it.height_in} in" if (it.length_in and it.height_in) else ""
    
    new_prod_id = execute_insert("""
        INSERT INTO products (name, code, category_id, unit, size_thickness,
                             purchase_price, selling_price, tax_percent, hsn_code,
                             opening_stock, current_stock, min_stock, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
    """, (
        it.item_name.strip(),
        code,
        cat_id,
        it.unit or 'sq.ft',
        dims,
        round(it.rate * 0.7, 2), # estimated cost
        it.rate,
        it.tax_percent,
        it.hsn_code or '6802',
        it.qty,
        it.qty,
        10.0
    ))
    return new_prod_id

@router.post("")
def create_estimate(payload: EstimateCreate):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Estimate must contain at least one stone or service item")

    # If customer_id provided, ensure valid and auto-populate name/phone if empty
    customer_name = payload.customer_name.strip()
    customer_phone = (payload.customer_phone or "").strip()
    customer_address = (payload.customer_address or "").strip()
    customer_gstin = (payload.customer_gstin or "").strip()

    if payload.customer_id:
        contact = query_one("SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL", (payload.customer_id,))
        if contact:
            if not customer_name:
                customer_name = contact["name"]
            if not customer_phone:
                customer_phone = contact.get("phone") or ""
            if not customer_address:
                customer_address = contact.get("address") or ""
            if not customer_gstin:
                customer_gstin = contact.get("gstin") or ""

    if not customer_name:
        raise HTTPException(status_code=400, detail="Customer name is required")

    estimate_no = payload.estimate_no.strip() if payload.estimate_no else generate_next_estimate_no()

    # Check unique estimate_no
    existing = query_one("SELECT id FROM estimates WHERE estimate_no = ? AND deleted_at IS NULL", (estimate_no,))
    if existing:
        estimate_no = f"{estimate_no}-{int(datetime.now().timestamp()) % 1000}"

    valid_until = payload.valid_until
    if not valid_until:
        try:
            d = datetime.strptime(payload.date, "%Y-%m-%d")
            valid_until = (d + timedelta(days=15)).strftime("%Y-%m-%d")
        except Exception:
            valid_until = payload.date

    subtotal = 0.0
    discount_total = 0.0
    tax_total = 0.0
    calculated_items = []

    for item in payload.items:
        prod_id = _resolve_or_create_product(item)
        item_sub = item.qty * item.rate
        item_disc = item.discount
        taxable = max(0.0, item_sub - item_disc)
        item_tax = taxable * (item.tax_percent / 100.0)
        item_tot = taxable + item_tax

        subtotal += item_sub
        discount_total += item_disc
        tax_total += item_tax

        calculated_items.append({
            "product_id": prod_id,
            "item_name": item.item_name.strip(),
            "item_description": item.item_description or "",
            "hsn_code": item.hsn_code or "6802",
            "length_in": item.length_in,
            "height_in": item.height_in,
            "pieces": item.pieces,
            "qty": item.qty,
            "unit": item.unit,
            "rate": item.rate,
            "discount": item_disc,
            "tax_percent": item.tax_percent,
            "tax_amount": round(item_tax, 2),
            "total": round(item_tot, 2)
        })

    subtotal = round(subtotal, 2)
    grand_total = round(max(0.0, subtotal - discount_total + tax_total + payload.transport_charges + payload.round_off), 2)

    default_terms = payload.terms or """1. Estimate valid for 15 days from the date of issue.
2. Prices are subject to stock availability and shade variation in natural stone.
3. Loading & transportation charges are extra as indicated above.
4. Final billing will be based on actual slab measurements upon dispatch."""

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO estimates (
                    estimate_no, customer_id, customer_name, customer_phone,
                    customer_address, customer_gstin, date, valid_until, status,
                    subtotal, discount, tax, transport_charges, round_off,
                    total, notes, terms
                ) VALUES (
                    %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s
                )
            """, (
                estimate_no, payload.customer_id, customer_name, customer_phone,
                customer_address, customer_gstin, payload.date, valid_until, payload.status or "Draft",
                subtotal, discount_total, tax_total, payload.transport_charges, payload.round_off,
                grand_total, payload.notes or "", default_terms
            ))
            estimate_id = cur.lastrowid

            for it in calculated_items:
                cur.execute("""
                    INSERT INTO estimate_items (
                        estimate_id, product_id, item_name, item_description,
                        hsn_code, length_in, height_in, pieces, qty, unit,
                        rate, discount, tax_percent, tax_amount, total
                    ) VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s
                    )
                """, (
                    estimate_id, it["product_id"], it["item_name"], it["item_description"],
                    it["hsn_code"], it["length_in"], it["height_in"], it["pieces"], it["qty"], it["unit"],
                    it["rate"], it["discount"], it["tax_percent"], it["tax_amount"], it["total"]
                ))

    record_audit_log(
        "estimates",
        estimate_id,
        "CREATE",
        old_values=None,
        new_values={"estimate_no": estimate_no, "total": grand_total, "customer_name": customer_name},
        details=f"Created Estimate Bill {estimate_no} for {customer_name} of ₹{grand_total:,.2f}"
    )

    return {
        "id": estimate_id,
        "estimate_no": estimate_no,
        "customer_name": customer_name,
        "total": grand_total,
        "message": "Estimate bill saved successfully!"
    }

@router.put("/{estimate_id}")
def update_estimate(estimate_id: int, payload: EstimateCreate):
    old_estimate = query_one("SELECT * FROM estimates WHERE id = ? AND deleted_at IS NULL", (estimate_id,))
    if not old_estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Estimate must contain at least one item")

    customer_name = payload.customer_name.strip()
    customer_phone = (payload.customer_phone or "").strip()
    customer_address = (payload.customer_address or "").strip()
    customer_gstin = (payload.customer_gstin or "").strip()

    valid_until = payload.valid_until or old_estimate.get("valid_until")

    subtotal = 0.0
    discount_total = 0.0
    tax_total = 0.0
    calculated_items = []

    for item in payload.items:
        prod_id = _resolve_or_create_product(item)
        item_sub = item.qty * item.rate
        item_disc = item.discount
        taxable = max(0.0, item_sub - item_disc)
        item_tax = taxable * (item.tax_percent / 100.0)
        item_tot = taxable + item_tax

        subtotal += item_sub
        discount_total += item_disc
        tax_total += item_tax

        calculated_items.append({
            "product_id": prod_id,
            "item_name": item.item_name.strip(),
            "item_description": item.item_description or "",
            "hsn_code": item.hsn_code or "6802",
            "length_in": item.length_in,
            "height_in": item.height_in,
            "pieces": item.pieces,
            "qty": item.qty,
            "unit": item.unit,
            "rate": item.rate,
            "discount": item_disc,
            "tax_percent": item.tax_percent,
            "tax_amount": round(item_tax, 2),
            "total": round(item_tot, 2)
        })

    subtotal = round(subtotal, 2)
    grand_total = round(max(0.0, subtotal - discount_total + tax_total + payload.transport_charges + payload.round_off), 2)

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE estimates SET
                    customer_id = %s,
                    customer_name = %s,
                    customer_phone = %s,
                    customer_address = %s,
                    customer_gstin = %s,
                    date = %s,
                    valid_until = %s,
                    status = %s,
                    subtotal = %s,
                    discount = %s,
                    tax = %s,
                    transport_charges = %s,
                    round_off = %s,
                    total = %s,
                    notes = %s,
                    terms = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                payload.customer_id, customer_name, customer_phone,
                customer_address, customer_gstin, payload.date, valid_until,
                payload.status or old_estimate.get("status") or "Draft",
                subtotal, discount_total, tax_total, payload.transport_charges, payload.round_off,
                grand_total, payload.notes or "", payload.terms or old_estimate.get("terms") or "",
                estimate_id
            ))

            # Delete old items and re-insert
            cur.execute("DELETE FROM estimate_items WHERE estimate_id = %s", (estimate_id,))

            for it in calculated_items:
                cur.execute("""
                    INSERT INTO estimate_items (
                        estimate_id, product_id, item_name, item_description,
                        hsn_code, length_in, height_in, pieces, qty, unit,
                        rate, discount, tax_percent, tax_amount, total
                    ) VALUES (
                        %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s
                    )
                """, (
                    estimate_id, it["product_id"], it["item_name"], it["item_description"],
                    it["hsn_code"], it["length_in"], it["height_in"], it["pieces"], it["qty"], it["unit"],
                    it["rate"], it["discount"], it["tax_percent"], it["tax_amount"], it["total"]
                ))

    record_audit_log(
        "estimates",
        estimate_id,
        "UPDATE",
        old_values=old_estimate,
        new_values={"total": grand_total, "customer_name": customer_name},
        details=f"Updated Estimate {old_estimate['estimate_no']} for {customer_name}"
    )

    return {"message": "Estimate updated successfully", "total": grand_total}

@router.patch("/{estimate_id}/status")
@router.put("/{estimate_id}/status")
def update_estimate_status(estimate_id: int, payload: EstimateStatusUpdate):
    estimate = query_one("SELECT * FROM estimates WHERE id = ? AND deleted_at IS NULL", (estimate_id,))
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")

    execute_update("UPDATE estimates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (payload.status, estimate_id))
    record_audit_log("estimates", estimate_id, "STATUS_CHANGE", old_values={"status": estimate["status"]}, new_values={"status": payload.status}, details=f"Status changed from {estimate['status']} to {payload.status}")
    return {"message": "Status updated successfully", "status": payload.status}

@router.delete("/{estimate_id}")
def delete_estimate(estimate_id: int):
    estimate = query_one("SELECT * FROM estimates WHERE id = ? AND deleted_at IS NULL", (estimate_id,))
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")

    execute_update("UPDATE estimates SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (estimate_id,))
    record_audit_log("estimates", estimate_id, "DELETE", old_values=estimate, new_values=None, details=f"Soft deleted Estimate {estimate['estimate_no']}")
    return {"message": "Estimate moved to deleted archive successfully"}

@router.post("/{estimate_id}/convert-to-sale")
def convert_estimate_to_sale(estimate_id: int):
    """Converts an approved Estimate Bill directly into an official GST Sales Bill & reduces stock."""
    from routes.sales_router import generate_next_bill_no

    estimate = query_one("SELECT * FROM estimates WHERE id = ? AND deleted_at IS NULL", (estimate_id,))
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")

    items = query_all("SELECT * FROM estimate_items WHERE estimate_id = ?", (estimate_id,))
    if not items:
        raise HTTPException(status_code=400, detail="Cannot convert estimate without items")

    # 1. Resolve or create customer contact
    cust_id = estimate.get("customer_id")
    if not cust_id:
        existing_cust = query_one("SELECT id FROM contacts WHERE phone = ? AND type IN ('Customer', 'Both') AND deleted_at IS NULL", (estimate["customer_phone"],)) if estimate["customer_phone"] else None
        if existing_cust:
            cust_id = existing_cust["id"]
        else:
            cust_id = execute_insert("""
                INSERT INTO contacts (name, type, phone, address, gstin, status)
                VALUES (?, 'Customer', ?, ?, ?, 'Active')
            """, (
                estimate["customer_name"],
                estimate.get("customer_phone") or "",
                estimate.get("customer_address") or "",
                estimate.get("customer_gstin") or ""
            ))

    # 2. Resolve items to products in catalog if not already linked
    resolved_sale_items = []
    for it in items:
        p_id = it.get("product_id")
        if not p_id:
            # Create product in catalog
            cat_row = query_one("SELECT id FROM categories WHERE type = 'product' LIMIT 1")
            cat_id = cat_row['id'] if cat_row else 1
            code = f"PRD-EST-{int(datetime.now().timestamp()) % 100000:05d}"
            p_id = execute_insert("""
                INSERT INTO products (name, code, category_id, unit, selling_price, tax_percent, hsn_code, opening_stock, current_stock, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
            """, (
                it["item_name"], code, cat_id, it["unit"] or "sq.ft",
                it["rate"], it["tax_percent"], it["hsn_code"] or "6802",
                it["qty"], it["qty"]
            ))

        resolved_sale_items.append({
            "product_id": p_id,
            "qty": it["qty"],
            "unit": it["unit"] or "sq.ft",
            "rate": it["rate"],
            "discount": it["discount"],
            "tax_percent": it["tax_percent"],
            "tax_amount": it["tax_amount"],
            "total": it["total"]
        })

    # 3. Create Sale Bill
    bill_no = generate_next_bill_no()
    today_str = datetime.now().strftime("%Y-%m-%d")

    subtotal = float(estimate["subtotal"])
    discount = float(estimate["discount"])
    tax = float(estimate["tax"])
    transport = float(estimate["transport_charges"])
    round_off = float(estimate["round_off"])
    total = float(estimate["total"])
    paid = 0.0
    due = total
    status = "Unpaid"

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO sales (
                    customer_id, bill_no, date, payment_method, vehicle_no, delivery_address, notes,
                    subtotal, discount, tax, transport_charges, round_off,
                    total, paid, due, status,
                    reverse_charge, transport_mode, date_of_supply, place_of_supply, state_code
                ) VALUES (
                    %s, %s, %s, 'Cash', '', %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    'No', 'Road', %s, 'Kerala', '32'
                )
            """, (
                cust_id, bill_no, today_str, estimate.get("customer_address") or "",
                f"Converted from Estimate {estimate['estimate_no']}. {estimate.get('notes') or ''}".strip(),
                subtotal, discount, tax, transport, round_off,
                total, paid, due, status, today_str
            ))
            sale_id = cur.lastrowid

            for it in resolved_sale_items:
                cur.execute("""
                    INSERT INTO sale_items (sale_id, product_id, qty, unit, rate, discount, tax_percent, tax_amount, total)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    sale_id, it["product_id"], it["qty"], it["unit"],
                    it["rate"], it["discount"], it["tax_percent"], it["tax_amount"], it["total"]
                ))

                cur.execute("UPDATE products SET current_stock = current_stock - %s WHERE id = %s", (it["qty"], it["product_id"]))

                cur.execute("""
                    INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, remarks)
                    VALUES (%s, 'sale', %s, 'sales', %s, %s, %s)
                """, (it["product_id"], -it["qty"], sale_id, today_str, f"Sale {bill_no} from Est {estimate['estimate_no']}"))

            cur.execute("UPDATE contacts SET current_balance = current_balance + %s WHERE id = %s", (due, cust_id))

            # Mark estimate as converted
            cur.execute("""
                UPDATE estimates 
                SET status = 'Converted', converted_sale_id = %s, updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            """, (sale_id, estimate_id))

    record_audit_log(
        "estimates",
        estimate_id,
        "CONVERT_TO_SALE",
        old_values={"status": estimate["status"]},
        new_values={"status": "Converted", "converted_sale_id": sale_id, "sale_bill_no": bill_no},
        details=f"Converted Estimate {estimate['estimate_no']} to Official Sale Bill {bill_no}"
    )

    return {
        "message": f"Successfully converted Estimate {estimate['estimate_no']} to Sale Bill {bill_no}!",
        "sale_id": sale_id,
        "bill_no": bill_no
    }

# ==============================================================================
# PDF GENERATION, EMAIL SENDING & WHATSAPP SHARING MODULES
# ==============================================================================
from fastapi import Response
import smtplib
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from pdf_generator import build_estimate_pdf

class EstimateEmailInput(BaseModel):
    recipient_email: str
    subject: Optional[str] = None
    message: Optional[str] = None

class EstimateWhatsappInput(BaseModel):
    phone: Optional[str] = ""
    message: Optional[str] = None

@router.get("/{estimate_id}/pdf")
def get_estimate_pdf(estimate_id: int):
    data = get_estimate(estimate_id)
    pdf_bytes = build_estimate_pdf(data["estimate"], data["items"], data["company"], data["bank"])
    clean_no = data["estimate"]["estimate_no"].replace(" ", "_").replace("/", "-")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Estimate_{clean_no}.pdf"}
    )

@router.post("/{estimate_id}/send-email")
def send_estimate_email(estimate_id: int, payload: EstimateEmailInput):
    data = get_estimate(estimate_id)
    est = data["estimate"]
    recipient = payload.recipient_email.strip()
    if not recipient:
        raise HTTPException(status_code=400, detail="Recipient email address is required")

    company_name = data["company"].get("company_name", "Billora Marbles & Granites") if data.get("company") else "Billora Marbles & Granites"
    est_no = est["estimate_no"]
    subject = payload.subject or f"Stone Estimation Quotation #{est_no} - {company_name}"
    
    body_text = payload.message or f"""Dear {est.get('customer_name') or 'Customer'},

Please find attached your Estimation Quotation ({est_no}) from {company_name}.

Quotation Overview:
- Estimate No: {est_no}
- Date: {est.get('date')}
- Valid Until: {est.get('valid_until')}
- Total Amount: ₹ {float(est.get('total', 0)):,.2f}

Note: This is an estimation quotation and does not deduct warehouse stock or affect customer accounting ledger.

Thank you for choosing {company_name}!
Phone: {data['company'].get('phone', '') if data.get('company') else ''}
Address: {data['company'].get('address', '') if data.get('company') else ''}
"""

    pdf_bytes = build_estimate_pdf(est, data["items"], data["company"], data["bank"])

    backup_settings = query_one("SELECT * FROM backup_settings WHERE id = 1")
    smtp_user = backup_settings.get("smtp_user") if backup_settings else None
    smtp_pass = backup_settings.get("smtp_pass") if backup_settings else None
    smtp_host = backup_settings.get("smtp_host", "smtp.gmail.com") if backup_settings else "smtp.gmail.com"
    smtp_port = int(backup_settings.get("smtp_port", 587)) if backup_settings else 587

    delivery_status = "Sent"
    delivery_msg = f"Quotation PDF sent successfully to {recipient}"

    if smtp_user and smtp_pass:
        try:
            msg = MIMEMultipart()
            msg["From"] = smtp_user
            msg["To"] = recipient
            msg["Subject"] = subject
            msg.attach(MIMEText(body_text, "plain"))

            part = MIMEBase("application", "octet-stream")
            part.set_payload(pdf_bytes)
            encoders.encode_base64(part)
            clean_no = est_no.replace(" ", "_").replace("/", "-")
            part.add_header("Content-Disposition", f'attachment; filename="Estimate_{clean_no}.pdf"')
            msg.attach(part)

            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, recipient, msg.as_string())
            server.quit()
        except Exception as e:
            delivery_status = "Error"
            delivery_msg = f"SMTP Delivery warning: {str(e)[:120]}"
    else:
        delivery_status = "Prepared (SMTP not configured)"
        delivery_msg = f"Quotation email prepared with PDF attachment. (To enable direct SMTP sending, configure SMTP credentials in Settings > Backup)."

    record_audit_log(
        "estimates",
        estimate_id,
        "SEND_EMAIL",
        old_values=None,
        new_values={"recipient": recipient, "status": delivery_status},
        details=f"Email dispatch for Estimate {est_no} to {recipient}: {delivery_msg}"
    )

    return {
        "success": True,
        "status": delivery_status,
        "message": delivery_msg,
        "recipient": recipient,
        "subject": subject,
        "estimate_no": est_no
    }

def _build_estimate_whatsapp_text(data: dict) -> str:
    est = data["estimate"]
    items = data["items"]
    company = data["company"] or {}
    bank = data["bank"] or {}
    
    comp_name = company.get("company_name", "BILLORA MARBLES & GRANITES")
    est_no = est.get("estimate_no", "")
    cust_name = est.get("customer_name") or "Valued Client"
    date_val = str(est.get("date", ""))
    total_val = float(est.get("total", 0))

    lines = [
        f"🏛 *{comp_name}*",
        f"📋 *ESTIMATION BILL / QUOTATION*",
        f"━━━━━━━━━━━━━━━━━━━━━━",
        f"📄 *Estimate No:* {est_no}",
        f"📅 *Date:* {date_val}",
        f"👤 *Customer:* {cust_name}",
        f"",
        f"📦 *Stone / Items Summary:*"
    ]
    for it in items[:6]:
        iname = it.get("item_name") or "Stone"
        qty = float(it.get("qty", 0))
        unit = it.get("unit", "sq.ft")
        rate = float(it.get("rate", 0))
        lines.append(f" • {iname}: {qty:.2f} {unit} @ ₹{rate:,.2f}")
    if len(items) > 6:
        lines.append(f" • ... and {len(items) - 6} more items")

    lines.extend([
        f"",
        f"💰 *Subtotal:* ₹{float(est.get('subtotal', 0)):,.2f}",
        f"📊 *Tax (GST):* ₹{float(est.get('tax', 0)):,.2f}",
        f"━━━━━━━━━━━━━━━━━━━━━━",
        f"✨ *ESTIMATED TOTAL:* ₹{total_val:,.2f}",
        f"━━━━━━━━━━━━━━━━━━━━━━",
        f"📌 *Note:* Estimation only. Does not reflect stock or accounting ledger.",
        f"",
        f"🏦 *Bank Details for Advance:*",
        f"Bank: {bank.get('bank_name', 'INDIAN BANK')}",
        f"A/C: {bank.get('account_number', '—')} | IFSC: {bank.get('ifsc_code', '—')}",
        f"",
        f"Thank you for choosing {comp_name}!"
    ])
    return "\n".join(lines)

@router.get("/{estimate_id}/whatsapp")
def get_estimate_whatsapp(estimate_id: int, phone: Optional[str] = None):
    data = get_estimate(estimate_id)
    est = data["estimate"]
    target_phone = phone or est.get("customer_phone") or ""
    clean_phone = "".join(ch for ch in target_phone if ch.isdigit())
    if len(clean_phone) == 10:
        clean_phone = "91" + clean_phone
    
    text = _build_estimate_whatsapp_text(data)
    encoded = urllib.parse.quote(text)
    wa_url = f"https://api.whatsapp.com/send?phone={clean_phone}&text={encoded}" if clean_phone else f"https://api.whatsapp.com/send?text={encoded}"

    return {
        "phone": clean_phone,
        "text": text,
        "url": wa_url
    }

@router.post("/{estimate_id}/send-whatsapp")
def post_estimate_whatsapp(estimate_id: int, payload: EstimateWhatsappInput):
    data = get_estimate(estimate_id)
    est = data["estimate"]
    target_phone = payload.phone or est.get("customer_phone") or ""
    clean_phone = "".join(ch for ch in target_phone if ch.isdigit())
    if len(clean_phone) == 10:
        clean_phone = "91" + clean_phone

    text = payload.message or _build_estimate_whatsapp_text(data)
    encoded = urllib.parse.quote(text)
    wa_url = f"https://api.whatsapp.com/send?phone={clean_phone}&text={encoded}" if clean_phone else f"https://api.whatsapp.com/send?text={encoded}"

    record_audit_log(
        "estimates",
        estimate_id,
        "WHATSAPP_SHARE",
        old_values=None,
        new_values={"phone": clean_phone},
        details=f"Shared Estimate {est['estimate_no']} via WhatsApp to {clean_phone or 'General'}"
    )

    return {
        "success": True,
        "phone": clean_phone,
        "text": text,
        "url": wa_url,
        "message": "WhatsApp message generated and link ready!"
    }
