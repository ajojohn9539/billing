import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from main import app
from database import query_one, query_all

client = TestClient(app)

def test_estimation_does_not_reflect_stock_or_account():
    # 1. Pick an active product & customer
    prod = query_one("SELECT id, current_stock FROM products WHERE status = 'Active' ORDER BY id ASC LIMIT 1")
    assert prod is not None, "Product must exist in catalog"
    initial_stock = float(prod["current_stock"])

    cust = query_one("SELECT id, name, phone, current_balance FROM contacts WHERE type IN ('Customer', 'Both') AND deleted_at IS NULL ORDER BY id ASC LIMIT 1")
    assert cust is not None, "Customer must exist"
    initial_balance = float(cust["current_balance"] or 0)

    # 2. Count stock movements and daybook entries before
    sm_count_before = query_one("SELECT COUNT(*) AS c FROM stock_movements")["c"]
    daybook_count_before = query_one("SELECT COUNT(*) AS c FROM daybook")["c"]

    # 3. Create an Estimation Bill for 45 sq.ft
    qty_to_quote = 45.0
    rate = 120.0
    payload = {
        "customer_id": cust["id"],
        "customer_name": cust["name"],
        "customer_phone": cust.get("phone") or "9447123456",
        "date": "2026-10-23",
        "valid_until": "2026-11-07",
        "status": "Draft",
        "transport_charges": 500.0,
        "round_off": 0.0,
        "notes": "Test proforma estimate - should not reflect stock or ledger",
        "items": [
            {
                "product_id": prod["id"],
                "item_name": "Galaxy Black Granite",
                "hsn_code": "6802",
                "length_in": 72.0,
                "height_in": 36.0,
                "pieces": 3,
                "qty": qty_to_quote,
                "unit": "sq.ft",
                "rate": rate,
                "discount": 0.0,
                "tax_percent": 18.0
            }
        ]
    }

    res = client.post("/api/estimates", json=payload)
    assert res.status_code == 200, f"Estimate creation failed: {res.text}"
    est_data = res.json()
    est_id = est_data["id"]
    assert est_id > 0
    assert "estimate_no" in est_data

    # 4. CRITICAL VERIFICATION: Stock must NOT be deducted!
    prod_after = query_one("SELECT current_stock FROM products WHERE id = ?", (prod["id"],))
    final_stock = float(prod_after["current_stock"])
    assert final_stock == initial_stock, f"Stock was deducted! Expected {initial_stock}, got {final_stock}"

    # 5. CRITICAL VERIFICATION: Customer accounting ledger balance must NOT be altered!
    cust_after = query_one("SELECT current_balance FROM contacts WHERE id = ?", (cust["id"],))
    final_balance = float(cust_after["current_balance"] or 0)
    assert final_balance == initial_balance, f"Account balance was altered! Expected {initial_balance}, got {final_balance}"

    # 6. CRITICAL VERIFICATION: No stock movements or daybook transactions!
    sm_count_after = query_one("SELECT COUNT(*) AS c FROM stock_movements")["c"]
    daybook_count_after = query_one("SELECT COUNT(*) AS c FROM daybook")["c"]
    assert sm_count_after == sm_count_before, "Stock movements were inserted for an estimate!"
    assert daybook_count_after == daybook_count_before, "Daybook entries were inserted for an estimate!"

    print(f"PASSED: Estimate {est_data['estimate_no']} created without touching stock or accounting ledger!")
    return est_id

def test_estimate_pdf_generation():
    # Fetch first available estimate
    est = query_one("SELECT id, estimate_no FROM estimates WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1")
    assert est is not None, "Estimate must exist"

    res = client.get(f"/api/estimates/{est['id']}/pdf")
    assert res.status_code == 200, f"PDF generation failed: {res.text}"
    assert res.headers.get("content-type") == "application/pdf"
    assert res.content.startswith(b"%PDF"), "Response is not a valid PDF file"
    assert len(res.content) > 1000, f"PDF too small: {len(res.content)} bytes"
    print(f"PASSED: Estimation Bill PDF generated successfully ({len(res.content)} bytes)!")

def test_estimate_email_dispatch():
    est = query_one("SELECT id, estimate_no FROM estimates WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1")
    assert est is not None

    email_payload = {
        "recipient_email": "test.client@example.com",
        "subject": f"Stone Quotation {est['estimate_no']}",
        "message": "Please review your marble and granite estimate quotation."
    }
    res = client.post(f"/api/estimates/{est['id']}/send-email", json=email_payload)
    assert res.status_code == 200, f"Send email failed: {res.text}"
    data = res.json()
    assert data["success"] is True
    assert data["recipient"] == "test.client@example.com"
    assert "status" in data
    print(f"PASSED: Estimation Bill Email module executed successfully (status: {data['status']})!")

def test_estimate_whatsapp_sharing():
    est = query_one("SELECT id, estimate_no FROM estimates WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1")
    assert est is not None

    # Test GET whatsapp share link & message
    res_get = client.get(f"/api/estimates/{est['id']}/whatsapp?phone=9876543210")
    assert res_get.status_code == 200
    wa_data = res_get.json()
    assert "url" in wa_data
    assert "https://api.whatsapp.com/send" in wa_data["url"]
    assert "text" in wa_data
    assert est["estimate_no"] in wa_data["text"]

    # Test POST send whatsapp
    post_payload = {
        "phone": "9876543210",
        "message": f"Stone Estimate {est['estimate_no']} from Billora Marbles"
    }
    res_post = client.post(f"/api/estimates/{est['id']}/send-whatsapp", json=post_payload)
    assert res_post.status_code == 200
    assert res_post.json()["success"] is True
    print("PASSED: Estimation Bill WhatsApp sharing module executed successfully!")

def test_sales_pdf_and_whatsapp():
    sale = query_one("SELECT id, bill_no FROM sales WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1")
    if sale:
        # Test PDF
        res_pdf = client.get(f"/api/sales/{sale['id']}/pdf")
        assert res_pdf.status_code == 200
        assert res_pdf.content.startswith(b"%PDF")

        # Test WhatsApp
        res_wa = client.get(f"/api/sales/{sale['id']}/whatsapp?phone=9447000000")
        assert res_wa.status_code == 200
        assert "url" in res_wa.json()
        print("PASSED: Sales Bill PDF and WhatsApp sharing tested successfully!")

def test_convert_estimate_to_sale_flow():
    # 1. Create a fresh estimate
    prod = query_one("SELECT id, current_stock FROM products WHERE status = 'Active' ORDER BY id ASC LIMIT 1")
    cust = query_one("SELECT id, name FROM contacts WHERE type IN ('Customer', 'Both') AND deleted_at IS NULL LIMIT 1")
    initial_stock = float(prod["current_stock"])

    qty_to_convert = 10.0
    payload = {
        "customer_id": cust["id"],
        "customer_name": cust["name"],
        "date": "2026-10-23",
        "status": "Approved",
        "items": [{
            "product_id": prod["id"],
            "item_name": "Premium Granite",
            "qty": qty_to_convert,
            "unit": "sq.ft",
            "rate": 100.0,
            "tax_percent": 18.0
        }]
    }
    res_est = client.post("/api/estimates", json=payload)
    est_id = res_est.json()["id"]

    # 2. Before conversion, stock should still be un-deducted
    prod_check = query_one("SELECT current_stock FROM products WHERE id = ?", (prod["id"],))
    assert float(prod_check["current_stock"]) == initial_stock

    # 3. Explicitly convert to sale
    res_conv = client.post(f"/api/estimates/{est_id}/convert-to-sale")
    assert res_conv.status_code == 200
    conv_data = res_conv.json()
    assert "sale_id" in conv_data
    assert "bill_no" in conv_data

    # 4. NOW stock MUST be deducted
    prod_after = query_one("SELECT current_stock FROM products WHERE id = ?", (prod["id"],))
    assert float(prod_after["current_stock"]) == initial_stock - qty_to_convert, "Stock was not deducted after conversion!"

    print(f"PASSED: Conversion to official sale bill {conv_data['bill_no']} verified with stock reduction!")
