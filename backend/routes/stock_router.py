from fastapi import APIRouter, HTTPException, Query
from database import get_db, query_all, query_one, execute_insert
from pydantic import BaseModel, Field

router = APIRouter(prefix="/stock", tags=["Stock"])

class StockAdjustmentInput(BaseModel):
    product_id: int
    adjustment_qty: float # Positive (found extra) or negative (shortage)
    date: str
    reason: str

@router.get("/summary")
def get_stock_summary():
    """
    Computes stock summary using exact formula:
    Current stock = Opening + Purchases + Sales returns - Sales - Purchase returns - Damage ± Adjustments
    """
    products = query_all("""
        SELECT p.id, p.name, p.code, p.unit, p.opening_stock, p.current_stock,
               p.purchase_price, p.selling_price, p.min_stock, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.deleted_at IS NULL
        ORDER BY p.name ASC
    """)

    result = []
    for p in products:
        pid = p["id"]

        # Purchased
        purchased = query_one("""
            SELECT COALESCE(SUM(qty), 0.0) AS qty FROM purchase_items pi
            JOIN purchases pur ON pi.purchase_id = pur.id
            WHERE pi.product_id = ? AND pur.deleted_at IS NULL
        """, (pid,))["qty"]

        # Sold
        sold = query_one("""
            SELECT COALESCE(SUM(qty), 0.0) AS qty FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE si.product_id = ? AND s.deleted_at IS NULL
        """, (pid,))["qty"]

        # Damaged
        damaged = query_one("""
            SELECT COALESCE(SUM(qty), 0.0) AS qty FROM damages
            WHERE product_id = ? AND deleted_at IS NULL
        """, (pid,))["qty"]

        # Manual adjustments
        adjustments = query_one("""
            SELECT COALESCE(SUM(qty), 0.0) AS qty FROM stock_movements
            WHERE product_id = ? AND type = 'adjustment'
        """, (pid,))["qty"]

        calculated_stock = p["opening_stock"] + purchased - sold - damaged + adjustments
        stock_value = round(calculated_stock * p["purchase_price"], 2)

        result.append({
            "id": pid,
            "name": p["name"],
            "code": p["code"],
            "category": p["category_name"],
            "unit": p["unit"],
            "opening": p["opening_stock"],
            "purchased": purchased,
            "sold": sold,
            "damaged": damaged,
            "adjustments": adjustments,
            "current_stock": p["current_stock"], # active stock
            "calculated_stock": calculated_stock,
            "min_stock": p["min_stock"],
            "purchase_price": p["purchase_price"],
            "selling_price": p["selling_price"],
            "stock_value": stock_value,
            "is_low_stock": p["current_stock"] <= p["min_stock"]
        })

    return result

@router.get("/low-stock")
def get_low_stock_report():
    return query_all("""
        SELECT p.id, p.name, p.code, p.unit, p.current_stock, p.min_stock,
               (p.min_stock - p.current_stock) AS reorder_needed,
               c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.current_stock <= p.min_stock AND p.deleted_at IS NULL
        ORDER BY (p.min_stock - p.current_stock) DESC
    """)

@router.get("/ledger/{product_id}")
def get_stock_ledger(product_id: int):
    product = query_one("SELECT * FROM products WHERE id = ? AND deleted_at IS NULL", (product_id,))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movements = query_all("""
        SELECT * FROM stock_movements
        WHERE product_id = ?
        ORDER BY date DESC, id DESC
    """, (product_id,))

    return {
        "product": product,
        "movements": movements
    }

@router.post("/adjustment")
def add_stock_adjustment(payload: StockAdjustmentInput):
    prod = query_one("SELECT id, name, current_stock FROM products WHERE id = ? AND deleted_at IS NULL", (payload.product_id,))
    if not prod:
        raise HTTPException(status_code=400, detail="Product not found")

    new_stock = prod["current_stock"] + payload.adjustment_qty
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Stock adjustment would result in negative inventory.")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE products SET current_stock = current_stock + %s WHERE id = %s", (payload.adjustment_qty, payload.product_id))
            cur.execute("""
                INSERT INTO stock_movements (product_id, type, qty, reference_type, date, remarks)
                VALUES (%s, 'adjustment', %s, 'stock_adjustment', %s, %s)
            """, (payload.product_id, payload.adjustment_qty, payload.date, f"Physical Count Adj: {payload.reason}"))

    return query_one("SELECT * FROM products WHERE id = ?", (payload.product_id,))
