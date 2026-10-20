import sys
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from main import app
from database import query_all, query_one

client = TestClient(app)

# --- MODULE 1: AUTHENTICATION & ADMIN PERMISSIONS ---
def test_authentication_and_roles():
    # Admin login
    res_admin = client.post("/api/auth/login", json={
        "username": "admin",
        "password": "RockPalace2026!"
    })
    assert res_admin.status_code == 200
    admin_data = res_admin.json()
    assert admin_data["user"]["role"] == "admin"
    assert "token" in admin_data

    # Staff login
    res_staff = client.post("/api/auth/login", json={
        "username": "sales",
        "password": "muthu123"
    })
    assert res_staff.status_code == 200
    assert res_staff.json()["user"]["role"] == "sales"

# --- MODULE 2: DYNAMIC CLIENT FIELDS CRUD ---
def test_dynamic_client_fields():
    # 1. List fields
    res = client.get("/api/admin/client-fields")
    assert res.status_code == 200
    fields = res.json()
    assert len(fields) >= 5
    keys = [f["field_key"] for f in fields]
    assert "site_address" in keys
    assert "alternate_phone" in keys
    assert "stone_preference" in keys

    # 2. Create new dynamic field
    res_create = client.post("/api/admin/client-fields", json={
        "field_key": "test_delivery_slot",
        "field_label": "Preferred Delivery Slot",
        "field_type": "select",
        "options": "Morning (8am-12pm),Afternoon (1pm-5pm)",
        "placeholder": "Select delivery slot",
        "is_required": False,
        "is_active": True,
        "sort_order": 10
    })
    assert res_create.status_code == 200
    new_field = res_create.json()
    field_id = new_field["id"]
    assert new_field["field_label"] == "Preferred Delivery Slot"

    # 3. Update field
    res_update = client.put(f"/api/admin/client-fields/{field_id}", json={
        "field_label": "Site Unloading Slot",
        "is_required": True
    })
    assert res_update.status_code == 200
    assert res_update.json()["field_label"] == "Site Unloading Slot"
    assert res_update.json()["is_required"] is True

    # 4. Delete field
    res_delete = client.delete(f"/api/admin/client-fields/{field_id}")
    assert res_delete.status_code == 200

# --- MODULE 3: 5 STOCK ITEMS INTEGRITY (GRANITE, MARBLE, ADHESIVE) ---
def test_stock_items():
    res = client.get("/api/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) >= 5

    names = [p["name"] for p in products]
    assert "Black Galaxy Granite Slab" in names
    assert "Italian White Carrara Marble" in names
    assert "Tan Brown Granite" in names
    assert "Kishangarh Wonder White Marble" in names
    assert "Tenax Epoxy Stone Adhesive 5kg" in names

    for p in products:
        assert p["current_stock"] >= 0
        assert p["selling_price"] > 0
        assert p["hsn_code"] in ("6802", "3506")
        if "Slab" in p["name"] or "Granite" in p["name"] or "Marble" in p["name"]:
            assert p["unit"] == "sqft"

# --- MODULE 4: CONTACTS & SUPPLIERS ---
def test_contacts_and_purchasers():
    res = client.get("/api/contacts")
    assert res.status_code == 200
    contacts = res.json()
    assert len(contacts) >= 4

    types = [c["type"] for c in contacts]
    assert "Supplier" in types
    assert "Customer" in types

    suppliers = [c for c in contacts if c["type"] == "Supplier"]
    assert len(suppliers) >= 1
    assert any("Supplier" in s.get("type", "") for s in suppliers)

    customer = next(c for c in contacts if "Kovoor Builders" in c["name"])
    assert customer["custom_fields"] is not None
    # Customer should have pending balance from partial sale
    assert customer["current_balance"] == 15075.0

# --- MODULE 5: 5 DEMO SALES TRANSACTIONS ---
def test_5_demo_sales():
    res = client.get("/api/sales")
    assert res.status_code == 200
    sales = res.json()
    assert len(sales) >= 5

    bill_nos = [s["bill_no"] for s in sales]
    assert "BIL26-27 002" in bill_nos
    assert "BIL26-27 003" in bill_nos
    assert "BIL26-27 004" in bill_nos
    assert "BIL26-27 005" in bill_nos

    
    # Check sale 4 (Partial Cash with ₹15,075 due)
    s4 = next(s for s in sales if s["bill_no"] == "BIL26-27 004")
    assert s4["total"] == 25075.0
    assert s4["paid"] == 10000.0
    assert s4["due"] == 15075.0
    assert s4["status"] == "Partly paid"

# --- MODULE 6: DAYBOOK RECONCILIATION ---
def test_daybook_reconciliation():
    res = client.get("/api/daybook?limit=50")
    assert res.status_code == 200
    entries = res.json()
    assert len(entries) >= 3

    inward_amounts = [float(e["paid"]) for e in entries if e["type"] == "inward"]
    total_inward = sum(inward_amounts)
    assert total_inward > 0

    methods = [e["method"] for e in entries]
    assert "Cash" in methods
    assert "RTGS/NEFT" in methods
    assert "UPI" in methods
    assert "Cheque" in methods

    # Test summary bar
    res_summary = client.get("/api/daybook/summary-bar")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    assert "total_balance" in summary
    assert "daily_balance" in summary

# --- MODULE 7: DOCUMENTATION PDF ENDPOINTS ---
def test_documentation_pdf_download():
    # Client stock addition manual
    res_stock_pdf = client.get("/api/admin/documentation/stock-guide-pdf")
    assert res_stock_pdf.status_code == 200
    assert res_stock_pdf.headers["content-type"] == "application/pdf"
    assert len(res_stock_pdf.content) > 100000

    # System backup documentation
    res_backup_pdf = client.get("/api/backup/documentation/pdf")
    assert res_backup_pdf.status_code == 200
    assert res_backup_pdf.headers["content-type"] == "application/pdf"
    assert len(res_backup_pdf.content) > 100000


# --- MODULE 8: SUDO USER & ROLES MANAGEMENT ---
def test_sudo_and_user_roles_management():
    # 1. Sudo login
    res_sudo = client.post("/api/auth/login", json={
        "username": "sudo",
        "password": "SudoMaster2026!"
    })
    assert res_sudo.status_code == 200
    sudo_user = res_sudo.json()["user"]
    assert sudo_user["role"] == "sudo"

    # 2. List all users
    res_users = client.get("/api/admin/users")
    assert res_users.status_code == 200
    users = res_users.json()
    assert len(users) >= 5
    roles = [u["role"] for u in users]
    assert "sudo" in roles
    assert "admin" in roles
    assert "sales" in roles

    # 3. Create a test user with role
    res_create = client.post("/api/admin/users", json={
        "name": "Test Yard Supervisor",
        "email": "supervisor@billora.com",
        "password": "super123password",
        "role": "store",
        "status": "Active"
    })
    assert res_create.status_code == 200
    created = res_create.json()
    uid = created["id"]
    assert created["role"] == "store"

    # 4. Change user role to accountant
    res_update = client.put(f"/api/admin/users/{uid}", json={
        "role": "accountant"
    })
    assert res_update.status_code == 200
    assert res_update.json()["role"] == "accountant"

    # 5. Delete test user
    res_del = client.delete(f"/api/admin/users/{uid}")
    assert res_del.status_code == 200

    # 6. Guard: Ensure sudo user cannot be deleted
    res_del_sudo = client.delete("/api/admin/users/5")
    assert res_del_sudo.status_code == 400

# --- MODULE 9: CLIENT & SITE DETAILS (COMPANY SETTINGS) ---
def test_company_site_settings_management():
    # 1. Get settings
    res = client.get("/api/admin/company-settings")
    assert res.status_code == 200
    data = res.json()
    assert "BILLORA" in data["company_name"] or "MARBLES" in data["company_name"]
    assert data["gstin"] == "32FGZPR5431L1ZL"

    # 2. Update settings
    res_up = client.put("/api/admin/company-settings", json={
        "company_name": "BILLORA MARBLES & GRANITES",
        "business_type": "Granite, Marble & Natural Stone ERP",
        "tagline": "Smart GST Billing & Stone Inventory ERP System",
        "phone": "9460110878, 8504882265",
        "email": "admin@billora.com",
        "address": "Chengamanadu, Kottarakkara, Kollam, Kerala - 691557",
        "gstin": "32FGZPR5431L1ZL",
        "invoice_prefix": "BIL26-27 ",
        "purchase_prefix": "PUR-BIL-",
        "currency_symbol": "₹",
        "default_tax_rate": 18.0,
        "payment_terms": "Net 30 Days"
    })
    assert res_up.status_code == 200
    assert res_up.json()["company_name"] == "BILLORA MARBLES & GRANITES"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
