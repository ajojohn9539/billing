from fastapi import APIRouter, HTTPException, Query
from database import get_db, query_all, query_one, execute_insert, execute_update
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/damages", tags=["Damage Entry"])

class DamageCreate(BaseModel):
    date: str
    product_id: int
    qty: float = Field(gt=0.0)
    reason: str = "Broken in transit" # Broken in transit, Cutting loss, Handling, Other
    remarks: Optional[str] = ""
    photo: Optional[str] = None

class DamageUpdate(DamageCreate):
    pass

@router.get("")
def list_damages(
    product_id: int = Query(None),
    reason: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    query = ["""
        SELECT d.*, p.name AS product_name, p.code AS product_code, p.unit, p.purchase_price
        FROM damages d
        JOIN products p ON d.product_id = p.id
        WHERE d.deleted_at IS NULL
    """]
    params = []

    if product_id:
        query.append("AND d.product_id = ?")
        params.append(product_id)

    if reason:
        query.append("AND d.reason = ?")
        params.append(reason)

    if start_date:
        query.append("AND d.date >= ?")
        params.append(start_date)

    if end_date:
        query.append("AND d.date <= ?")
        params.append(end_date)

    query.append("ORDER BY d.date DESC, d.id DESC")
    return query_all(" ".join(query), tuple(params))

@router.post("")
def create_damage(payload: DamageCreate):
    prod = query_one("SELECT id, name, purchase_price, current_stock FROM products WHERE id = ? AND deleted_at IS NULL", (payload.product_id,))
    if not prod:
        raise HTTPException(status_code=400, detail="Product not found")

    if payload.qty > prod["current_stock"]:
        raise HTTPException(
            status_code=400,
            detail=f"Damage quantity ({payload.qty}) exceeds available stock ({prod['current_stock']}) for '{prod['name']}'"
        )

    # Cost value (auto = purchase price * quantity)
    cost_val = round(prod["purchase_price"] * payload.qty, 2)

    with get_db() as conn:
        with conn.cursor() as cur:
            # 1. Insert damage record
            cur.execute("""
                INSERT INTO damages (date, product_id, qty, reason, cost_value, remarks, photo)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (payload.date, payload.product_id, payload.qty, payload.reason, cost_val, payload.remarks or "", payload.photo))
            damage_id = cur.lastrowid

            # 2. Reduce current stock
            cur.execute("UPDATE products SET current_stock = current_stock - %s WHERE id = %s", (payload.qty, payload.product_id))

            # 3. Stock movement
            cur.execute("""
                INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, remarks)
                VALUES (%s, 'damage', %s, 'damages', %s, %s, %s)
            """, (payload.product_id, -payload.qty, damage_id, payload.date, f"Damage: {payload.reason}"))

    return query_one("""
        SELECT d.*, p.name AS product_name, p.unit
        FROM damages d
        JOIN products p ON d.product_id = p.id
        WHERE d.id = ?
    """, (damage_id,))

@router.delete("/{damage_id}")
def delete_damage(damage_id: int):
    damage = query_one("SELECT * FROM damages WHERE id = ? AND deleted_at IS NULL", (damage_id,))
    if not damage:
        raise HTTPException(status_code=404, detail="Damage record not found")

    with get_db() as conn:
        with conn.cursor() as cur:
            # Restore stock
            cur.execute("UPDATE products SET current_stock = current_stock + %s WHERE id = %s", (damage["qty"], damage["product_id"]))
            cur.execute("DELETE FROM stock_movements WHERE reference_type = 'damages' AND reference_id = %s", (damage_id,))
            cur.execute("UPDATE damages SET deleted_at = CURRENT_TIMESTAMP WHERE id = %s", (damage_id,))

    return {"message": "Damage record removed and stock restored successfully", "id": damage_id}
