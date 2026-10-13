from fastapi import APIRouter, HTTPException, Query
from database import query_all, query_one, execute_insert, execute_update
from models import CustomerCreate, CustomerUpdate

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("")
def list_customers(search: str = Query(None)):
    if search:
        term = f"%{search.strip()}%"
        sql = """
        SELECT c.*, 
               COALESCE(COUNT(i.id), 0) AS total_invoices,
               COALESCE(SUM(i.grand_total), 0) AS total_billed,
               COALESCE(SUM(i.paid_amount), 0) AS total_paid,
               COALESCE(SUM(i.balance_due), 0) AS balance_due
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id
        WHERE c.name LIKE ? OR c.company_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?
        GROUP BY c.id
        ORDER BY c.name ASC;
        """
        return query_all(sql, (term, term, term, term))
    
    sql = """
    SELECT c.*, 
           COALESCE(COUNT(i.id), 0) AS total_invoices,
           COALESCE(SUM(i.grand_total), 0) AS total_billed,
           COALESCE(SUM(i.paid_amount), 0) AS total_paid,
           COALESCE(SUM(i.balance_due), 0) AS balance_due
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    GROUP BY c.id
    ORDER BY c.name ASC;
    """
    return query_all(sql)

@router.get("/{customer_id}")
def get_customer(customer_id: int):
    sql = """
    SELECT c.*, 
           COALESCE(COUNT(i.id), 0) AS total_invoices,
           COALESCE(SUM(i.grand_total), 0) AS total_billed,
           COALESCE(SUM(i.paid_amount), 0) AS total_paid,
           COALESCE(SUM(i.balance_due), 0) AS balance_due
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id
    WHERE c.id = ?
    GROUP BY c.id;
    """
    row = query_one(sql, (customer_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")
    return row

@router.get("/{customer_id}/invoices")
def get_customer_invoices(customer_id: int):
    sql = """
    SELECT * FROM invoices 
    WHERE customer_id = ? 
    ORDER BY issue_date DESC;
    """
    return query_all(sql, (customer_id,))

@router.post("")
def create_customer(payload: CustomerCreate):
    sql = """
    INSERT INTO customers (name, company_name, email, phone, billing_address, shipping_address, tax_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    """
    new_id = execute_insert(
        sql,
        (
            payload.name.strip(),
            payload.company_name or "",
            payload.email or "",
            payload.phone or "",
            payload.billing_address or "",
            payload.shipping_address or "",
            payload.tax_id or "",
            payload.notes or "",
        ),
    )
    return get_customer(new_id)

@router.put("/{customer_id}")
def update_customer(customer_id: int, payload: CustomerUpdate):
    exists = query_one("SELECT id FROM customers WHERE id = ?;", (customer_id,))
    if not exists:
        raise HTTPException(status_code=404, detail="Customer not found")

    sql = """
    UPDATE customers SET
        name = ?,
        company_name = ?,
        email = ?,
        phone = ?,
        billing_address = ?,
        shipping_address = ?,
        tax_id = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?;
    """
    execute_update(
        sql,
        (
            payload.name.strip(),
            payload.company_name or "",
            payload.email or "",
            payload.phone or "",
            payload.billing_address or "",
            payload.shipping_address or "",
            payload.tax_id or "",
            payload.notes or "",
            customer_id,
        ),
    )
    return get_customer(customer_id)

@router.delete("/{customer_id}")
def delete_customer(customer_id: int):
    # Check if invoices exist
    inv = query_one("SELECT COUNT(*) AS cnt FROM invoices WHERE customer_id = ?;", (customer_id,))
    if inv and inv["cnt"] > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete customer with {inv['cnt']} associated invoices. Delete invoices first or archive customer."
        )
    execute_update("DELETE FROM customers WHERE id = ?;", (customer_id,))
    return {"message": "Customer deleted successfully", "id": customer_id}
