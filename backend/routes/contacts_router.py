import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from database import query_all, query_one, execute_insert, execute_update, record_audit_log
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/contacts", tags=["Contacts"])

class ContactCreate(BaseModel):
    type: str = "Customer" # Customer, Supplier, Both
    name: str
    company: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    gstin: Optional[str] = ""
    opening_balance: float = 0.0
    balance_type: str = "To Receive" # To Receive, To Pay
    credit_limit: float = 0.0
    notes: Optional[str] = ""
    status: str = "Active"
    custom_fields: Optional[Dict[str, Any]] = None

class ContactUpdate(ContactCreate):
    pass

@router.get("")
def list_contacts(type: str = Query(None), search: str = Query(None), status: str = Query(None), include_deleted: bool = Query(False)):
    if include_deleted:
        query = ["SELECT * FROM contacts WHERE 1=1"]
    else:
        query = ["SELECT * FROM contacts WHERE deleted_at IS NULL"]
    params = []

    if type and type.lower() != 'all':
        if type.lower() == 'both':
            query.append("AND type = 'Both'")
        else:
            query.append("AND (type = ? OR type = 'Both')")
            params.append(type)

    if status and status.lower() != 'all':
        query.append("AND status = ?")
        params.append(status)

    if search:
        term = f"%{search.strip()}%"
        query.append("AND (name LIKE ? OR company LIKE ? OR phone LIKE ? OR gstin LIKE ?)")
        params.extend([term, term, term, term])

    query.append("ORDER BY name ASC")
    return query_all(" ".join(query), tuple(params))

@router.get("/{contact_id}")
def get_contact(contact_id: int):
    row = query_one("SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL", (contact_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Contact not found")
    return row

@router.get("/{contact_id}/ledger")
def get_contact_ledger(contact_id: int):
    contact = query_one("SELECT * FROM contacts WHERE id = ? AND deleted_at IS NULL", (contact_id,))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Fetch all sales (if customer)
    sales = query_all("""
        SELECT 'Sale' AS entry_type, bill_no AS doc_no, date, total, paid, due, status, notes
        FROM sales WHERE customer_id = ? AND deleted_at IS NULL
        ORDER BY date ASC
    """, (contact_id,))

    # Fetch all purchases (if supplier)
    purchases = query_all("""
        SELECT 'Purchase' AS entry_type, invoice_no AS doc_no, date, total, paid, due, status, notes
        FROM purchases WHERE supplier_id = ? AND deleted_at IS NULL
        ORDER BY date ASC
    """, (contact_id,))

    # Fetch daybook entries
    daybook_entries = query_all("""
        SELECT 'Payment/Receipt' AS entry_type, document_no AS doc_no, date, paid AS amount, type AS direction, narration, method
        FROM daybook WHERE (document_no LIKE ? OR narration LIKE ?) AND deleted_at IS NULL
        ORDER BY date ASC
    """, (f"%{contact['name']}%", f"%{contact['name']}%"))

    return {
        "contact": contact,
        "sales": sales,
        "purchases": purchases,
        "payments": daybook_entries,
    }

@router.post("")
def create_contact(payload: ContactCreate):
    c_fields_json = json.dumps(payload.custom_fields or {})
    sql = """
        INSERT INTO contacts (type, name, company, phone, email, address, city, state, gstin,
                             opening_balance, balance_type, current_balance, credit_limit, notes, status, custom_fields)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)
    """
    new_id = execute_insert(sql, (
        payload.type, payload.name.strip(), payload.company or "", payload.phone or "",
        payload.email or "", payload.address or "", payload.city or "", payload.state or "",
        payload.gstin or "", payload.opening_balance, payload.balance_type,
        payload.opening_balance, payload.credit_limit, payload.notes or "", payload.status,
        c_fields_json
    ))
    record_audit_log("contacts", new_id, "CREATE", new_values=payload.dict(), details=f"Created contact {payload.name.strip()} ({payload.type})")
    return get_contact(new_id)

@router.put("/{contact_id}")
def update_contact(contact_id: int, payload: ContactUpdate):
    exists = query_one("SELECT id FROM contacts WHERE id = ? AND deleted_at IS NULL", (contact_id,))
    if not exists:
        raise HTTPException(status_code=404, detail="Contact not found")

    c_fields_json = json.dumps(payload.custom_fields or exists.get("custom_fields") or {})
    sql = """
        UPDATE contacts SET
            type = ?, name = ?, company = ?, phone = ?, email = ?,
            address = ?, city = ?, state = ?, gstin = ?,
            credit_limit = ?, notes = ?, status = ?, custom_fields = ?::jsonb
        WHERE id = ?
    """
    execute_update(sql, (
        payload.type, payload.name.strip(), payload.company or "", payload.phone or "",
        payload.email or "", payload.address or "", payload.city or "", payload.state or "",
        payload.gstin or "", payload.credit_limit, payload.notes or "", payload.status,
        c_fields_json, contact_id
    ))
    record_audit_log("contacts", contact_id, "UPDATE", old_values=exists, new_values=payload.dict(), details=f"Updated contact {payload.name.strip()}")
    return get_contact(contact_id)

@router.delete("/{contact_id}")
def delete_contact(contact_id: int, force_inactivate: bool = Query(False)):
    contact = query_one("SELECT * FROM contacts WHERE id = ?", (contact_id,))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    s_cnt = query_one("SELECT COUNT(*) AS c FROM sales WHERE customer_id = ? AND deleted_at IS NULL", (contact_id,))
    p_cnt = query_one("SELECT COUNT(*) AS c FROM purchases WHERE supplier_id = ? AND deleted_at IS NULL", (contact_id,))
    has_links = (s_cnt and s_cnt['c'] > 0) or (p_cnt and p_cnt['c'] > 0)

    if has_links or force_inactivate:
        execute_update("UPDATE contacts SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (contact_id,))
        record_audit_log("contacts", contact_id, "INACTIVATE", old_values=contact, new_values={"status": "Inactive"}, details=f"Set contact '{contact['name']}' to Inactive (linked to {s_cnt['c'] if s_cnt else 0} sales / {p_cnt['c'] if p_cnt else 0} purchases)")
        return {"message": f"Contact '{contact['name']}' is linked to transactions and was marked as Inactive.", "id": contact_id, "action": "inactivated"}

    execute_update("UPDATE contacts SET deleted_at = CURRENT_TIMESTAMP, status = 'Inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (contact_id,))
    record_audit_log("contacts", contact_id, "DELETE", old_values=contact, new_values={"deleted_at": "CURRENT_TIMESTAMP", "status": "Inactive"}, details=f"Soft-deleted contact '{contact['name']}'")
    return {"message": f"Contact '{contact['name']}' soft-deleted successfully", "id": contact_id, "action": "deleted"}

@router.post("/{contact_id}/restore")
def restore_contact(contact_id: int):
    contact = query_one("SELECT * FROM contacts WHERE id = ?", (contact_id,))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    execute_update("UPDATE contacts SET deleted_at = NULL, status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (contact_id,))
    record_audit_log("contacts", contact_id, "RESTORE", old_values=contact, new_values={"status": "Active", "deleted_at": None}, details=f"Restored contact '{contact['name']}' to Active")
    return {"message": f"Contact '{contact['name']}' restored to Active successfully", "id": contact_id}
