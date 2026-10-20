import json
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from database import query_all, query_one, execute_insert, execute_update, get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])

class ClientFieldCreate(BaseModel):
    field_key: str = Field(..., description="Unique slug for field e.g. site_address")
    field_label: str = Field(..., description="Human readable label")
    field_type: str = Field("text", description="text, number, select, date, boolean")
    options: Optional[str] = ""
    placeholder: Optional[str] = ""
    default_value: Optional[str] = ""
    is_required: bool = False
    is_active: bool = True
    sort_order: int = 0

class ClientFieldUpdate(BaseModel):
    field_label: Optional[str] = None
    field_type: Optional[str] = None
    options: Optional[str] = None
    placeholder: Optional[str] = None
    default_value: Optional[str] = None
    is_required: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

# --- DYNAMIC CLIENT FIELDS CRUD ---
@router.get("/client-fields")
def list_client_fields(active_only: bool = False):
    """List dynamic custom fields configured for clients/customers."""
    sql = "SELECT * FROM client_custom_fields"
    if active_only:
        sql += " WHERE is_active = TRUE"
    sql += " ORDER BY sort_order ASC, id ASC;"
    return query_all(sql)

@router.post("/client-fields")
def create_client_field(payload: ClientFieldCreate):
    """Add a new dynamic field to client profiles."""
    key = payload.field_key.strip().lower().replace(" ", "_")
    
    # Check if key already exists
    exists = query_one("SELECT id FROM client_custom_fields WHERE field_key = ?", (key,))
    if exists:
        raise HTTPException(status_code=400, detail=f"Field key '{key}' already exists.")

    new_id = execute_insert("""
        INSERT INTO client_custom_fields (field_key, field_label, field_type, options, placeholder, default_value, is_required, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        key, payload.field_label.strip(), payload.field_type, payload.options or "",
        payload.placeholder or "", payload.default_value or "", payload.is_required,
        payload.is_active, payload.sort_order
    ))

    return query_one("SELECT * FROM client_custom_fields WHERE id = ?", (new_id,))

@router.put("/client-fields/{field_id}")
def update_client_field(field_id: int, payload: ClientFieldUpdate):
    exists = query_one("SELECT * FROM client_custom_fields WHERE id = ?", (field_id,))
    if not exists:
        raise HTTPException(status_code=404, detail="Field not found")

    new_label = payload.field_label if payload.field_label is not None else exists["field_label"]
    new_type = payload.field_type if payload.field_type is not None else exists["field_type"]
    new_opts = payload.options if payload.options is not None else exists["options"]
    new_ph = payload.placeholder if payload.placeholder is not None else exists["placeholder"]
    new_def = payload.default_value if payload.default_value is not None else exists["default_value"]
    new_req = payload.is_required if payload.is_required is not None else exists["is_required"]
    new_act = payload.is_active if payload.is_active is not None else exists["is_active"]
    new_sort = payload.sort_order if payload.sort_order is not None else exists["sort_order"]

    execute_update("""
        UPDATE client_custom_fields SET
            field_label = ?, field_type = ?, options = ?, placeholder = ?,
            default_value = ?, is_required = ?, is_active = ?, sort_order = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_label, new_type, new_opts, new_ph, new_def, new_req, new_act, new_sort, field_id))

    return query_one("SELECT * FROM client_custom_fields WHERE id = ?", (field_id,))

@router.delete("/client-fields/{field_id}")
def delete_client_field(field_id: int):
    exists = query_one("SELECT id FROM client_custom_fields WHERE id = ?", (field_id,))
    if not exists:
        raise HTTPException(status_code=404, detail="Field not found")

    execute_update("DELETE FROM client_custom_fields WHERE id = ?", (field_id,))
    return {"message": "Dynamic client field deleted successfully", "id": field_id}

# --- DOCUMENTATION PDF (CLIENT STOCK & OPERATIONS MANUAL) ---
@router.get("/documentation/stock-guide-pdf")
@router.head("/documentation/stock-guide-pdf")
def download_stock_guide_pdf():
    static_dir = Path(__file__).resolve().parent.parent / "static"
    pdf_path = static_dir / "Billora_Client_Stock_and_Operations_Guide.pdf"
    
    if not pdf_path.exists():
        # Generate on the fly
        import subprocess
        script = Path(__file__).resolve().parent.parent / "generate_client_docs.py"
        if script.exists():
            import sys
        subprocess.run([sys.executable, str(script)], check=True)

    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Documentation PDF not found")

    return FileResponse(
        str(pdf_path),
        media_type="application/pdf",
        filename="Billora_Client_Stock_and_Operations_Guide.pdf"
    )


# --- USER MODELS ---
class UserCreateAdmin(BaseModel):
    name: str = Field(..., description="User's full name")
    email: str = Field(..., description="Email address or username handle")
    password: str = Field(..., description="Plain password")
    role: str = Field("sales", description="sudo, admin, accountant, sales, store")
    status: str = Field("Active", description="Active or Suspended")

class UserUpdateAdmin(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class CompanySettingsUpdate(BaseModel):
    company_name: str
    business_type: Optional[str] = ""
    tagline: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    invoice_prefix: Optional[str] = "BIL26-27 "
    purchase_prefix: Optional[str] = "PUR-BIL-"
    currency_symbol: Optional[str] = "₹"
    default_tax_rate: Optional[float] = 18.0
    payment_terms: Optional[str] = "Net 30 Days"
    logo_url: Optional[str] = "/logo.png"

# --- USERS & ROLES MANAGEMENT ---
@router.get("/users")
def get_all_users():
    """List all registered system users with their active roles and statuses."""
    return query_all("SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY id ASC;")

@router.post("/users")
def create_system_user(payload: UserCreateAdmin):
    """Create a new staff or admin user and set their role."""
    email_clean = payload.email.strip().lower()
    
    # Check duplicate
    exists = query_one("SELECT id FROM users WHERE LOWER(email) = ?", (email_clean,))
    if exists:
        raise HTTPException(status_code=400, detail=f"User with email/username '{email_clean}' already exists.")

    new_id = execute_insert("""
        INSERT INTO users (name, email, password, role, status)
        VALUES (?, ?, ?, ?, ?)
    """, (
        payload.name.strip(), email_clean, payload.password.strip(),
        payload.role.strip().lower(), payload.status.strip()
    ))

    return query_one("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?", (new_id,))

@router.put("/users/{user_id}")
def update_system_user(user_id: int, payload: UserUpdateAdmin):
    """Update user details and set/change their system role."""
    target = query_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    new_name = payload.name.strip() if payload.name is not None else target["name"]
    new_email = payload.email.strip().lower() if payload.email is not None else target["email"]
    new_role = payload.role.strip().lower() if payload.role is not None else target["role"]
    new_status = payload.status.strip() if payload.status is not None else target.get("status", "Active")

    # If updating email, check uniqueness
    if new_email != target["email"]:
        dup = query_one("SELECT id FROM users WHERE LOWER(email) = ? AND id != ?", (new_email, user_id))
        if dup:
            raise HTTPException(status_code=400, detail=f"Email '{new_email}' already in use by another user.")

    # Guard: Do not allow changing sudo user to non-sudo if it's user id 5
    if target["role"] == "sudo" and new_role != "sudo" and user_id == 5:
        raise HTTPException(status_code=400, detail="Cannot downgrade the root Sudo user.")

    if payload.password and payload.password.strip():
        execute_update("""
            UPDATE users SET
                name = ?, email = ?, password = ?, role = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (new_name, new_email, payload.password.strip(), new_role, new_status, user_id))
    else:
        execute_update("""
            UPDATE users SET
                name = ?, email = ?, role = ?, status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (new_name, new_email, new_role, new_status, user_id))

    return query_one("SELECT id, name, email, role, status, updated_at FROM users WHERE id = ?", (user_id,))

@router.delete("/users/{user_id}")
def delete_system_user(user_id: int):
    """Delete a staff user from the system (Sudo user cannot be deleted)."""
    target = query_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target["role"] == "sudo" or user_id == 5:
        raise HTTPException(status_code=400, detail="The root Sudo Master user cannot be deleted.")

    execute_update("DELETE FROM users WHERE id = ?", (user_id,))
    return {"message": f"User '{target['name']}' deleted successfully.", "id": user_id}

# --- CLIENT & SITE DETAILS (COMPANY SETTINGS) ---
@router.get("/company-settings")
def get_company_settings():
    """Get company site branding and configuration details."""
    return query_one("SELECT * FROM settings WHERE id = 1;")

@router.put("/company-settings")
def update_company_settings(payload: CompanySettingsUpdate):
    """Update company site branding and configuration details (Sudo / Admin)."""
    execute_update("""
        UPDATE settings SET
            company_name = ?, business_type = ?, tagline = ?,
            phone = ?, email = ?, address = ?, gstin = ?,
            invoice_prefix = ?, purchase_prefix = ?, currency_symbol = ?,
            default_tax_rate = ?, payment_terms = ?, logo_url = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
    """, (
        payload.company_name.strip(), payload.business_type or "", payload.tagline or "",
        payload.phone or "", payload.email or "", payload.address or "", payload.gstin or "",
        payload.invoice_prefix or "BIL26-27 ", payload.purchase_prefix or "PUR-BIL-",
        payload.currency_symbol or "₹", payload.default_tax_rate or 18.0, payload.payment_terms or "Net 30 Days",
        payload.logo_url or "/logo.png"
    ))
    return query_one("SELECT * FROM settings WHERE id = 1;")
