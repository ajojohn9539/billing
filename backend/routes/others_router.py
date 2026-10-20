from fastapi import APIRouter, HTTPException, Query
from database import get_db, query_all, query_one, execute_insert, execute_update
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

router = APIRouter(prefix="/others", tags=["Others & Administration"])

# --- Bank Accounts ---
class BankAccountCreate(BaseModel):
    name: str
    account_number: Optional[str] = ""
    bank_name: Optional[str] = ""
    branch: Optional[str] = ""
    ifsc: Optional[str] = ""
    account_type: Optional[str] = "Current Account"
    opening_balance: float = 0.0
    current_balance: Optional[float] = None

class BankAccountUpdate(BaseModel):
    name: Optional[str] = None
    account_number: Optional[str] = None
    bank_name: Optional[str] = None
    branch: Optional[str] = None
    ifsc: Optional[str] = None
    account_type: Optional[str] = None
    opening_balance: Optional[float] = None
    current_balance: Optional[float] = None

class BankTransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float = Field(gt=0.0)
    date: str
    narration: Optional[str] = "Transfer between accounts"

# --- Users ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "Sales staff"

# --- Settings ---
class SettingsUpdate(BaseModel):
    company_name: str
    business_type: Optional[str] = "Stone Shop (Granite & Marble)"
    tagline: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    invoice_prefix: str = "RP/BILL/"
    purchase_prefix: str = "RP/PUR/"
    currency_symbol: str = "₹"
    default_tax_rate: float = 18.0
    payment_terms: Optional[str] = ""
    logo_url: Optional[str] = "/logo.png"

# --- Bank Endpoints ---
@router.get("/bank-accounts")
def list_bank_accounts():
    return query_all("SELECT * FROM bank_accounts ORDER BY id ASC")

@router.post("/bank-accounts")
def create_bank_account(payload: BankAccountCreate):
    curr_balance = payload.current_balance if payload.current_balance is not None else payload.opening_balance
    new_id = execute_insert("""
        INSERT INTO bank_accounts (name, account_number, bank_name, branch, ifsc, account_type, opening_balance, current_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        payload.name,
        payload.account_number or "",
        payload.bank_name or "",
        payload.branch or "",
        payload.ifsc or "",
        payload.account_type or "Current Account",
        payload.opening_balance,
        curr_balance
    ))
    return query_one("SELECT * FROM bank_accounts WHERE id = ?", (new_id,))

@router.put("/bank-accounts/{account_id}")
def update_bank_account(account_id: int, payload: BankAccountUpdate):
    existing = query_one("SELECT * FROM bank_accounts WHERE id = ?", (account_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Bank account not found")

    name = payload.name if payload.name is not None else existing["name"]
    account_number = payload.account_number if payload.account_number is not None else (existing.get("account_number") or "")
    bank_name = payload.bank_name if payload.bank_name is not None else (existing.get("bank_name") or "")
    branch = payload.branch if payload.branch is not None else (existing.get("branch") or "")
    ifsc = payload.ifsc if payload.ifsc is not None else (existing.get("ifsc") or "")
    account_type = payload.account_type if payload.account_type is not None else (existing.get("account_type") or "Current Account")
    opening_balance = payload.opening_balance if payload.opening_balance is not None else existing.get("opening_balance", 0.0)
    current_balance = payload.current_balance if payload.current_balance is not None else existing.get("current_balance", 0.0)

    execute_update("""
        UPDATE bank_accounts
        SET name = ?, account_number = ?, bank_name = ?, branch = ?, ifsc = ?, account_type = ?, opening_balance = ?, current_balance = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (name, account_number, bank_name, branch, ifsc, account_type, opening_balance, current_balance, account_id))

    return query_one("SELECT * FROM bank_accounts WHERE id = ?", (account_id,))

@router.delete("/bank-accounts/{account_id}")
def delete_bank_account(account_id: int):
    existing = query_one("SELECT * FROM bank_accounts WHERE id = ?", (account_id,))
    if not existing:
        raise HTTPException(status_code=404, detail="Bank account not found")

    cnt_row = query_one("SELECT COUNT(*) AS c FROM daybook WHERE bank_account_id = ?", (account_id,))
    if cnt_row and cnt_row["c"] > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete account '{existing['name']}' because it is linked to {cnt_row['c']} active daybook transaction records. Please transfer or reassign those entries first."
        )

    execute_update("DELETE FROM bank_accounts WHERE id = ?", (account_id,))
    return {"message": "Bank account deleted successfully", "id": account_id}

@router.post("/bank-transfer")
def transfer_funds(payload: BankTransferCreate):
    if payload.from_account_id == payload.to_account_id:
        raise HTTPException(status_code=400, detail="Source and destination accounts must be different.")

    from_acc = query_one("SELECT * FROM bank_accounts WHERE id = ?", (payload.from_account_id,))
    to_acc = query_one("SELECT * FROM bank_accounts WHERE id = ?", (payload.to_account_id,))
    if not from_acc or not to_acc:
        raise HTTPException(status_code=404, detail="Account not found")

    if from_acc["current_balance"] < payload.amount:
        raise HTTPException(status_code=400, detail=f"Insufficient balance in {from_acc['name']} ({from_acc['current_balance']})")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE bank_accounts SET current_balance = current_balance - %s WHERE id = %s", (payload.amount, payload.from_account_id))
            cur.execute("UPDATE bank_accounts SET current_balance = current_balance + %s WHERE id = %s", (payload.amount, payload.to_account_id))

            # Record in Daybook Outward & Inward
            cur.execute("""
                INSERT INTO daybook (date, time, type, method, bank_account_id, narration, paid, source_type)
                VALUES (%s, %s, 'outward', 'Bank', %s, %s, %s, 'bank_transfer')
            """, (payload.date, datetime.now().strftime("%H:%M:%S"), payload.from_account_id, f"Transfer to {to_acc['name']}: {payload.narration}", payload.amount))

            cur.execute("""
                INSERT INTO daybook (date, time, type, method, bank_account_id, narration, paid, source_type)
                VALUES (%s, %s, 'inward', 'Bank', %s, %s, %s, 'bank_transfer')
            """, (payload.date, datetime.now().strftime("%H:%M:%S"), payload.to_account_id, f"Transfer from {from_acc['name']}: {payload.narration}", payload.amount))

    return {"message": "Transfer completed successfully", "amount": payload.amount}

# --- Users & Roles ---
@router.get("/users")
def list_users():
    return query_all("SELECT id, name, email, role, created_at FROM users ORDER BY id ASC")

@router.post("/users")
def create_user(payload: UserCreate):
    new_id = execute_insert("""
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    """, (payload.name, payload.email, payload.password, payload.role))
    return query_one("SELECT id, name, email, role FROM users WHERE id = ?", (new_id,))

# --- Settings ---
@router.get("/settings")
def get_settings():
    return query_one("SELECT * FROM settings WHERE id = 1")

@router.put("/settings")
def update_settings(payload: SettingsUpdate):
    execute_update("""
        UPDATE settings SET
            company_name = ?, business_type = ?, tagline = ?,
            phone = ?, email = ?, address = ?, gstin = ?,
            invoice_prefix = ?, purchase_prefix = ?, currency_symbol = ?,
            default_tax_rate = ?, payment_terms = ?, logo_url = ?
        WHERE id = 1
    """, (
        payload.company_name, payload.business_type, payload.tagline,
        payload.phone, payload.email, payload.address, payload.gstin,
        payload.invoice_prefix, payload.purchase_prefix, payload.currency_symbol,
        payload.default_tax_rate, payload.payment_terms, payload.logo_url or "/logo.png"
    ))
    return query_one("SELECT * FROM settings WHERE id = 1")

# --- Comprehensive Reports (Section 10) ---
@router.get("/reports/profit-loss")
def get_profit_and_loss(start_date: str = Query(None), end_date: str = Query(None)):
    date_filter = ""
    params = []
    if start_date and end_date:
        date_filter = "WHERE date BETWEEN ? AND ?"
        params = [start_date, end_date]

    # Total Sales Revenue
    sales_row = query_one(f"SELECT COALESCE(SUM(total), 0.0) AS rev FROM sales {date_filter} AND deleted_at IS NULL" if date_filter else "SELECT COALESCE(SUM(total), 0.0) AS rev FROM sales WHERE deleted_at IS NULL", tuple(params))
    sales_revenue = sales_row["rev"] if sales_row else 0.0

    # Total Purchase Cost
    purchase_row = query_one(f"SELECT COALESCE(SUM(total), 0.0) AS cost FROM purchases {date_filter} AND deleted_at IS NULL" if date_filter else "SELECT COALESCE(SUM(total), 0.0) AS cost FROM purchases WHERE deleted_at IS NULL", tuple(params))
    purchase_cost = purchase_row["cost"] if purchase_row else 0.0

    # Damages Loss
    damage_row = query_one(f"SELECT COALESCE(SUM(cost_value), 0.0) AS loss FROM damages {date_filter} AND deleted_at IS NULL" if date_filter else "SELECT COALESCE(SUM(cost_value), 0.0) AS loss FROM damages WHERE deleted_at IS NULL", tuple(params))
    damage_loss = damage_row["loss"] if damage_row else 0.0

    # Operational Expenses (Daybook Outward for expenses)
    expense_row = query_one(f"SELECT COALESCE(SUM(paid), 0.0) AS exp FROM daybook {date_filter} AND source_type IN ('expense', 'manual') AND type = 'outward' AND deleted_at IS NULL" if date_filter else "SELECT COALESCE(SUM(paid), 0.0) AS exp FROM daybook WHERE source_type IN ('expense', 'manual') AND type = 'outward' AND deleted_at IS NULL", tuple(params))
    expenses = expense_row["exp"] if expense_row else 0.0

    gross_profit = round(sales_revenue - purchase_cost, 2)
    net_profit = round(sales_revenue - purchase_cost - damage_loss - expenses, 2)

    return {
        "sales_revenue": sales_revenue,
        "purchase_cost": purchase_cost,
        "gross_profit": gross_profit,
        "damage_loss": damage_loss,
        "operating_expenses": expenses,
        "net_profit": net_profit
    }

@router.get("/reports/dues")
def get_dues_report():
    customer_dues = query_all("""
        SELECT id, name, company, phone, current_balance AS due_amount
        FROM contacts
        WHERE type IN ('Customer', 'Both') AND current_balance > 0 AND deleted_at IS NULL
        ORDER BY current_balance DESC
    """)

    supplier_payables = query_all("""
        SELECT id, name, company, phone, current_balance AS payable_amount
        FROM contacts
        WHERE type IN ('Supplier', 'Both') AND current_balance > 0 AND deleted_at IS NULL
        ORDER BY current_balance DESC
    """)

    return {
        "customer_dues": customer_dues,
        "supplier_payables": supplier_payables
    }

@router.get("/reports/gst")
def get_gst_summary():
    output_gst = query_one("SELECT COALESCE(SUM(tax), 0.0) AS gst FROM sales WHERE deleted_at IS NULL")["gst"]
    input_gst = query_one("SELECT COALESCE(SUM(tax), 0.0) AS gst FROM purchases WHERE deleted_at IS NULL")["gst"]
    net_gst_payable = round(max(0.0, output_gst - input_gst), 2)

    return {
        "output_gst": output_gst,
        "input_gst": input_gst,
        "net_gst_payable": net_gst_payable
    }
