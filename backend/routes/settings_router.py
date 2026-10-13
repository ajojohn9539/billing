from fastapi import APIRouter, HTTPException
from database import query_one, execute_update
from models import SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_settings():
    row = query_one("SELECT * FROM settings WHERE id = 1;")
    if not row:
        raise HTTPException(status_code=404, detail="Settings not found")
    return row

@router.put("")
def update_settings(payload: SettingsUpdate):
    sql = """
    UPDATE settings SET
        company_name = ?,
        tagline = ?,
        email = ?,
        phone = ?,
        address = ?,
        tax_id = ?,
        currency_symbol = ?,
        currency_code = ?,
        invoice_prefix = ?,
        default_tax_rate = ?,
        payment_terms = ?,
        bank_name = ?,
        bank_account_no = ?,
        bank_routing_no = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1;
    """
    params = (
        payload.company_name,
        payload.tagline or "",
        payload.email or "",
        payload.phone or "",
        payload.address or "",
        payload.tax_id or "",
        payload.currency_symbol,
        payload.currency_code,
        payload.invoice_prefix,
        payload.default_tax_rate,
        payload.payment_terms or "",
        payload.bank_name or "",
        payload.bank_account_no or "",
        payload.bank_routing_no or "",
        payload.notes or "",
    )
    execute_update(sql, params)
    return query_one("SELECT * FROM settings WHERE id = 1;")
