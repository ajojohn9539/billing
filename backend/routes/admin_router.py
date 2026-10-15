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

