from fastapi import APIRouter, HTTPException, Query
from database import get_db, query_all, query_one, execute_insert, execute_update, record_audit_log
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

router = APIRouter(prefix="/daybook", tags=["Daybook"])

class DaybookEntryCreate(BaseModel):
    date: str
    time: Optional[str] = None
    type: str = "outward" # inward, outward
    category_id: Optional[int] = None
    sub_category_id: Optional[int] = None
    method: str = "Cash" # Cash, RTGS/NEFT, Cheque, UPI, Card
    cheque_date: Optional[str] = None
    cheque_status: str = "cleared" # cleared, pending
    bank_account_id: int = 1
    document_no: Optional[str] = ""
    narration: str
    to_be_paid: float = 0.0
    paid: float = Field(gt=0.0)
    excess: float = 0.0

@router.get("/summary-bar")
def get_daybook_summary(date_filter: str = Query(None)):
    target_date = date_filter or date.today().isoformat()

    # Inward for date
    inward_row = query_one("""
        SELECT COALESCE(SUM(paid), 0.0) AS total_inward
        FROM daybook
        WHERE type = 'inward' AND date = ? AND deleted_at IS NULL
    """, (target_date,))
    inward = inward_row["total_inward"] if inward_row else 0.0

    # Outward for date
    outward_row = query_one("""
        SELECT COALESCE(SUM(paid), 0.0) AS total_outward
        FROM daybook
        WHERE type = 'outward' AND date = ? AND deleted_at IS NULL
    """, (target_date,))
    outward = outward_row["total_outward"] if outward_row else 0.0

    daily_balance = round(inward - outward, 2)

    # Total Balance across all bank accounts
    tot_bank = query_one("SELECT COALESCE(SUM(current_balance), 0.0) AS total_cash FROM bank_accounts")
    total_balance = tot_bank["total_cash"] if tot_bank else 0.0

    return {
        "date": target_date,
        "total_balance": total_balance,
        "inward": inward,
        "outward": outward,
        "daily_balance": daily_balance
    }

@router.get("")
def list_daybook(
    date_filter: str = Query(None),
    type: str = Query(None),
    method: str = Query(None),
    search: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    query = ["""
        SELECT d.*, c.name AS category_name, sc.name AS sub_category_name, ba.name AS account_name
        FROM daybook d
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN categories sc ON d.sub_category_id = sc.id
        LEFT JOIN bank_accounts ba ON d.bank_account_id = ba.id
        WHERE d.deleted_at IS NULL
    """]
    params = []

    if date_filter:
        query.append("AND d.date = ?")
        params.append(date_filter)
    elif start_date and end_date:
        query.append("AND d.date BETWEEN ? AND ?")
        params.extend([start_date, end_date])
    elif start_date:
        query.append("AND d.date >= ?")
        params.append(start_date)
    elif end_date:
        query.append("AND d.date <= ?")
        params.append(end_date)

    if type and type.lower() != 'all':
        query.append("AND d.type = ?")
        params.append(type.lower())

    if method and method.lower() != 'all':
        query.append("AND d.method = ?")
        params.append(method)

    if search:
        term = f"%{search.strip()}%"
        query.append("AND (d.document_no LIKE ? OR d.narration LIKE ?)")
        params.extend([term, term])

    query.append("ORDER BY d.date DESC, d.time DESC, d.id DESC")
    return query_all(" ".join(query), tuple(params))

@router.post("")
def create_daybook_entry(payload: DaybookEntryCreate):
    entry_time = payload.time or datetime.now().strftime("%H:%M:%S")

    # If method is Cheque, set status to pending if not specified
    chq_status = "pending" if payload.method == "Cheque" else payload.cheque_status

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO daybook (date, time, type, category_id, sub_category_id,
                                    method, cheque_date, cheque_status, bank_account_id,
                                    document_no, narration, to_be_paid, paid, excess, source_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'manual')
            """, (
                payload.date, entry_time, payload.type, payload.category_id, payload.sub_category_id,
                payload.method, payload.cheque_date, chq_status, payload.bank_account_id,
                payload.document_no or "", payload.narration, payload.to_be_paid, payload.paid,
                payload.excess
            ))
            new_id = cur.lastrowid

            # Update bank account balance (if cleared)
            if chq_status == "cleared":
                if payload.type == "inward":
                    cur.execute("UPDATE bank_accounts SET current_balance = current_balance + %s WHERE id = %s", (payload.paid, payload.bank_account_id))
                else:
                    cur.execute("UPDATE bank_accounts SET current_balance = current_balance - %s WHERE id = %s", (payload.paid, payload.bank_account_id))

    return query_one("SELECT * FROM daybook WHERE id = ?", (new_id,))

@router.post("/{entry_id}/clear-cheque")
def clear_cheque_entry(entry_id: int):
    entry = query_one("SELECT * FROM daybook WHERE id = ? AND deleted_at IS NULL", (entry_id,))
    if not entry:
        raise HTTPException(status_code=404, detail="Daybook entry not found")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE daybook SET cheque_status = 'cleared' WHERE id = %s", (entry_id,))
            if entry["type"] == "inward":
                cur.execute("UPDATE bank_accounts SET current_balance = current_balance + %s WHERE id = %s", (entry["paid"], entry["bank_account_id"]))
            else:
                cur.execute("UPDATE bank_accounts SET current_balance = current_balance - %s WHERE id = %s", (entry["paid"], entry["bank_account_id"]))

    return query_one("SELECT * FROM daybook WHERE id = ?", (entry_id,))

@router.delete("/{entry_id}")
def delete_daybook_entry(entry_id: int):
    entry = query_one("SELECT * FROM daybook WHERE id = ? AND deleted_at IS NULL", (entry_id,))
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    with get_db() as conn:
        with conn.cursor() as cur:
            # Reverse bank balance effect if cleared
            if entry["cheque_status"] == "cleared":
                if entry["type"] == "inward":
                    cur.execute("UPDATE bank_accounts SET current_balance = current_balance - %s WHERE id = %s", (entry["paid"], entry["bank_account_id"]))
                else:
                    cur.execute("UPDATE bank_accounts SET current_balance = current_balance + %s WHERE id = %s", (entry["paid"], entry["bank_account_id"]))

            cur.execute("UPDATE daybook SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s", (entry_id,))

    return {"message": "Daybook entry deleted successfully", "id": entry_id}
