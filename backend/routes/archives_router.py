from fastapi import APIRouter, HTTPException, Query
from database import query_all, query_one, execute_update, record_audit_log, get_db
from typing import Optional

router = APIRouter(prefix="/archives", tags=["Inactive & Deleted Archives"])

# 1. Archive Summary Stats
@router.get("/summary")
def get_archives_summary():
    inact_cont = query_one("SELECT COUNT(*) AS c FROM contacts WHERE status = 'Inactive' AND deleted_at IS NULL")
    del_cont = query_one("SELECT COUNT(*) AS c FROM contacts WHERE deleted_at IS NOT NULL")
    inact_prod = query_one("SELECT COUNT(*) AS c FROM products WHERE status = 'Inactive' AND deleted_at IS NULL")
    del_prod = query_one("SELECT COUNT(*) AS c FROM products WHERE deleted_at IS NOT NULL")
    del_sales = query_one("SELECT COUNT(*) AS c FROM sales WHERE deleted_at IS NOT NULL")
    del_purch = query_one("SELECT COUNT(*) AS c FROM purchases WHERE deleted_at IS NOT NULL")
    del_daybook = query_one("SELECT COUNT(*) AS c FROM daybook WHERE deleted_at IS NOT NULL")
    del_damages = query_one("SELECT COUNT(*) AS c FROM damages WHERE deleted_at IS NOT NULL")
    total_actions = query_one("SELECT COUNT(*) AS c FROM audit_logs")

    return {
        "inactive_contacts": inact_cont["c"] if inact_cont else 0,
        "deleted_contacts": del_cont["c"] if del_cont else 0,
        "inactive_products": inact_prod["c"] if inact_prod else 0,
        "deleted_products": del_prod["c"] if del_prod else 0,
        "deleted_sales": del_sales["c"] if del_sales else 0,
        "deleted_purchases": del_purch["c"] if del_purch else 0,
        "deleted_daybook": del_daybook["c"] if del_daybook else 0,
        "deleted_damages": del_damages["c"] if del_damages else 0,
        "total_actions": total_actions["c"] if total_actions else 0
    }

# 2. Inactive & Deleted Contacts
@router.get("/contacts")
def list_archived_contacts(filter: Optional[str] = "all"):
    if filter == "inactive":
        sql = "SELECT * FROM contacts WHERE status = 'Inactive' AND deleted_at IS NULL ORDER BY updated_at DESC, id DESC"
    elif filter == "deleted":
        sql = "SELECT * FROM contacts WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC, id DESC"
    else:
        sql = "SELECT * FROM contacts WHERE status = 'Inactive' OR deleted_at IS NOT NULL ORDER BY COALESCE(deleted_at, updated_at) DESC, id DESC"
    return query_all(sql)

@router.post("/contacts/{contact_id}/restore")
def restore_contact(contact_id: int):
    contact = query_one("SELECT * FROM contacts WHERE id = ?", (contact_id,))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    execute_update("UPDATE contacts SET deleted_at = NULL, status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (contact_id,))
    record_audit_log("contacts", contact_id, "RESTORE", old_values=contact, new_values={"status": "Active", "deleted_at": None}, details=f"Restored contact '{contact['name']}' to Active")
    return {"message": f"Contact '{contact['name']}' restored to Active successfully", "id": contact_id}

# 3. Inactive & Deleted Products
@router.get("/products")
def list_archived_products(filter: Optional[str] = "all"):
    if filter == "inactive":
        sql = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'Inactive' AND p.deleted_at IS NULL ORDER BY p.updated_at DESC, p.id DESC"
    elif filter == "deleted":
        sql = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.deleted_at IS NOT NULL ORDER BY p.deleted_at DESC, p.id DESC"
    else:
        sql = "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'Inactive' OR p.deleted_at IS NOT NULL ORDER BY COALESCE(p.deleted_at, p.updated_at) DESC, p.id DESC"
    return query_all(sql)

@router.post("/products/{product_id}/restore")
def restore_product(product_id: int):
    prod = query_one("SELECT * FROM products WHERE id = ?", (product_id,))
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    execute_update("UPDATE products SET deleted_at = NULL, status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (product_id,))
    record_audit_log("products", product_id, "RESTORE", old_values=prod, new_values={"status": "Active", "deleted_at": None}, details=f"Restored product '{prod['name']}' to Active")
    return {"message": f"Product '{prod['name']}' restored to Active successfully", "id": product_id}

# 4. Deleted Sales Invoices
@router.get("/sales")
def list_archived_sales():
    sql = """
        SELECT s.*, c.name AS customer_name, c.phone AS customer_phone
        FROM sales s
        LEFT JOIN contacts c ON s.customer_id = c.id
        WHERE s.deleted_at IS NOT NULL
        ORDER BY s.deleted_at DESC, s.id DESC
    """
    return query_all(sql)

@router.post("/sales/{sale_id}/restore")
def restore_sale(sale_id: int):
    sale = query_one("SELECT * FROM sales WHERE id = ?", (sale_id,))
    if not sale:
        raise HTTPException(status_code=404, detail="Sale invoice not found")

    items = query_all("SELECT product_id, qty FROM sale_items WHERE sale_id = ?", (sale_id,))
    with get_db() as conn:
        with conn.cursor() as cur:
            # Re-deduct stock
            for it in items:
                cur.execute("UPDATE products SET current_stock = current_stock - %s WHERE id = %s", (it["qty"], it["product_id"]))
                cur.execute("""
                    INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, narration)
                    VALUES (%s, 'sale', %s, 'sales', %s, %s, %s)
                """, (it["product_id"], -float(it["qty"]), sale_id, sale["date"], f"Restored Sale Bill {sale['bill_no']}"))
            
            # Re-apply balance to customer
            if sale.get("customer_id") and sale.get("due"):
                cur.execute("UPDATE contacts SET current_balance = current_balance + %s WHERE id = %s", (sale["due"], sale["customer_id"]))

            # Restore sale & daybook records
            cur.execute("UPDATE sales SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (sale_id,))
            cur.execute("UPDATE daybook SET deleted_at = NULL WHERE source_type = 'sale' AND source_id = %s", (sale_id,))

    record_audit_log("sales", sale_id, "RESTORE", old_values={"deleted_at": sale.get("deleted_at")}, new_values={"deleted_at": None}, details=f"Restored Sale Bill '{sale['bill_no']}' and updated stock")
    return {"message": f"Sale bill '{sale['bill_no']}' restored successfully", "id": sale_id}

# 5. Deleted Purchases
@router.get("/purchases")
def list_archived_purchases():
    sql = """
        SELECT p.*, c.name AS supplier_name, c.phone AS supplier_phone
        FROM purchases p
        LEFT JOIN contacts c ON p.supplier_id = c.id
        WHERE p.deleted_at IS NOT NULL
        ORDER BY p.deleted_at DESC, p.id DESC
    """
    return query_all(sql)

@router.post("/purchases/{purchase_id}/restore")
def restore_purchase(purchase_id: int):
    purchase = query_one("SELECT * FROM purchases WHERE id = ?", (purchase_id,))
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase invoice not found")

    items = query_all("SELECT product_id, qty FROM purchase_items WHERE purchase_id = ?", (purchase_id,))
    with get_db() as conn:
        with conn.cursor() as cur:
            # Re-add stock
            for it in items:
                cur.execute("UPDATE products SET current_stock = current_stock + %s WHERE id = %s", (it["qty"], it["product_id"]))
                cur.execute("""
                    INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, narration)
                    VALUES (%s, 'purchase', %s, 'purchases', %s, %s, %s)
                """, (it["product_id"], float(it["qty"]), purchase_id, purchase["date"], f"Restored Purchase {purchase['invoice_no']}"))

            # Re-apply balance to supplier
            if purchase.get("supplier_id") and purchase.get("due"):
                cur.execute("UPDATE contacts SET current_balance = current_balance + %s WHERE id = %s", (purchase["due"], purchase["supplier_id"]))

            cur.execute("UPDATE purchases SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (purchase_id,))
            cur.execute("UPDATE daybook SET deleted_at = NULL WHERE source_type = 'purchase' AND source_id = %s", (purchase_id,))

    record_audit_log("purchases", purchase_id, "RESTORE", old_values={"deleted_at": purchase.get("deleted_at")}, new_values={"deleted_at": None}, details=f"Restored Purchase Invoice '{purchase['invoice_no']}'")
    return {"message": f"Purchase '{purchase['invoice_no']}' restored successfully", "id": purchase_id}

# 6. Deleted Daybook Entries
@router.get("/daybook")
def list_archived_daybook():
    sql = """
        SELECT d.*, b.name as account_name
        FROM daybook d
        LEFT JOIN bank_accounts b ON d.bank_account_id = b.id
        WHERE d.deleted_at IS NOT NULL
        ORDER BY d.deleted_at DESC, d.id DESC
    """
    return query_all(sql)

@router.post("/daybook/{entry_id}/restore")
def restore_daybook_entry(entry_id: int):
    entry = query_one("SELECT * FROM daybook WHERE id = ?", (entry_id,))
    if not entry:
        raise HTTPException(status_code=404, detail="Daybook entry not found")

    # If it affected bank_account_id, restore balance
    paid = float(entry.get("paid") or 0)
    bank_acc_id = entry.get("bank_account_id")
    direction = entry.get("type")

    with get_db() as conn:
        with conn.cursor() as cur:
            if bank_acc_id and paid > 0:
                if direction == "inward":
                    cur.execute("UPDATE bank_accounts SET current_balance = current_balance + %s WHERE id = %s", (paid, bank_acc_id))
                elif direction == "outward":
                    cur.execute("UPDATE bank_accounts SET current_balance = current_balance - %s WHERE id = %s", (paid, bank_acc_id))
            
            cur.execute("UPDATE daybook SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (entry_id,))

    record_audit_log("daybook", entry_id, "RESTORE", old_values={"deleted_at": entry.get("deleted_at")}, new_values={"deleted_at": None}, details=f"Restored Daybook {entry.get('document_no')} ({entry.get('narration')})")
    return {"message": f"Daybook entry #{entry_id} restored successfully", "id": entry_id}

# 7. Deleted Damage Entries
@router.get("/damages")
def list_archived_damages():
    sql = """
        SELECT d.*, p.name as product_name, p.code as product_code, p.unit
        FROM damages d
        LEFT JOIN products p ON d.product_id = p.id
        WHERE d.deleted_at IS NOT NULL
        ORDER BY d.deleted_at DESC, d.id DESC
    """
    return query_all(sql)

@router.post("/damages/{damage_id}/restore")
def restore_damage_entry(damage_id: int):
    dmg = query_one("SELECT * FROM damages WHERE id = ?", (damage_id,))
    if not dmg:
        raise HTTPException(status_code=404, detail="Damage entry not found")

    with get_db() as conn:
        with conn.cursor() as cur:
            # Re-deduct damaged qty from products stock
            cur.execute("UPDATE products SET current_stock = current_stock - %s WHERE id = %s", (dmg["qty"], dmg["product_id"]))
            cur.execute("""
                INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, narration)
                VALUES (%s, 'damage', %s, 'damages', %s, %s, %s)
            """, (dmg["product_id"], -float(dmg["qty"]), damage_id, dmg["date"], f"Restored Damage: {dmg.get('reason')}"))
            cur.execute("UPDATE damages SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (damage_id,))

    record_audit_log("damages", damage_id, "RESTORE", old_values={"deleted_at": dmg.get("deleted_at")}, new_values={"deleted_at": None}, details=f"Restored damage record #{damage_id} ({dmg.get('reason')})")
    return {"message": f"Damage record #{damage_id} restored successfully", "id": damage_id}

# 8. Temporary Audit Log / Action History Table Query
@router.get("/audit-logs")
def list_audit_logs(
    table_name: Optional[str] = None, 
    action: Optional[str] = None,
    limit: int = 100, 
    offset: int = 0
):
    query = ["SELECT * FROM audit_logs WHERE 1=1"]
    params = []

    if table_name and table_name.lower() != "all":
        query.append("AND LOWER(table_name) = ?")
        params.append(table_name.lower())

    if action and action.lower() != "all":
        query.append("AND UPPER(action) = ?")
        params.append(action.upper())

    query.append("ORDER BY id DESC LIMIT ? OFFSET ?")
    params.extend([limit, offset])

    logs = query_all(" ".join(query), tuple(params))
    total = query_one("SELECT COUNT(*) AS c FROM audit_logs")
    
    return {
        "total": total["c"] if total else len(logs),
        "logs": logs
    }
