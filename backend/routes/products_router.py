from fastapi import APIRouter, HTTPException, Query
from database import query_all, query_one, execute_insert, execute_update
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/products", tags=["Products"])

class ProductCreate(BaseModel):
    name: str
    code: str
    category_id: int
    sub_category_id: Optional[int] = None
    unit: str = "sq.ft" # sq.ft, sq.m, piece, ton, cubic ft
    size_thickness: Optional[str] = ""
    purchase_price: float = 0.0
    selling_price: float = 0.0
    tax_percent: float = 18.0
    hsn_code: Optional[str] = "6802"
    opening_stock: float = 0.0
    min_stock: float = 10.0
    status: str = "Active"

class ProductUpdate(ProductCreate):
    pass

class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None
    type: str = "product"

@router.get("/categories")
def get_categories(type: str = Query(None)):
    if type:
        return query_all("SELECT * FROM categories WHERE type = ? ORDER BY name ASC", (type,))
    return query_all("SELECT * FROM categories ORDER BY name ASC")

@router.post("/categories")
def create_category(payload: CategoryCreate):
    cat_id = execute_insert(
        "INSERT INTO categories (name, parent_id, type) VALUES (?, ?, ?)",
        (payload.name.strip(), payload.parent_id, payload.type)
    )
    return query_one("SELECT * FROM categories WHERE id = ?", (cat_id,))

@router.get("")
def list_products(category_id: int = Query(None), search: str = Query(None), status: str = Query(None)):
    query = ["""
        SELECT p.*, c.name AS category_name, sc.name AS sub_category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN categories sc ON p.sub_category_id = sc.id
        WHERE p.deleted_at IS NULL
    """]
    params = []

    if category_id:
        query.append("AND p.category_id = ?")
        params.append(category_id)

    if status and status.lower() != 'all':
        query.append("AND p.status = ?")
        params.append(status)

    if search:
        term = f"%{search.strip()}%"
        query.append("AND (p.name LIKE ? OR p.code LIKE ? OR p.hsn_code LIKE ?)")
        params.extend([term, term, term])

    query.append("ORDER BY p.name ASC")
    return query_all(" ".join(query), tuple(params))

@router.get("/{product_id}")
def get_product(product_id: int):
    row = query_one("""
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.deleted_at IS NULL
    """, (product_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Product not found")
    return row

@router.post("")
def create_product(payload: ProductCreate):
    # Check unique SKU
    exists = query_one("SELECT id FROM products WHERE code = ? AND deleted_at IS NULL", (payload.code.strip(),))
    if exists:
        raise HTTPException(status_code=400, detail=f"Product with code '{payload.code}' already exists.")

    sql = """
        INSERT INTO products (name, code, category_id, sub_category_id, unit, size_thickness,
                             purchase_price, selling_price, tax_percent, hsn_code,
                             opening_stock, current_stock, min_stock, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    new_id = execute_insert(sql, (
        payload.name.strip(), payload.code.strip(), payload.category_id, payload.sub_category_id,
        payload.unit, payload.size_thickness or "", payload.purchase_price, payload.selling_price,
        payload.tax_percent, payload.hsn_code or "6802", payload.opening_stock,
        payload.opening_stock, payload.min_stock, payload.status
    ))

    # Record opening stock movement
    if payload.opening_stock > 0:
        execute_insert("""
            INSERT INTO stock_movements (product_id, type, qty, reference_type, date, remarks)
            VALUES (?, 'opening', ?, 'opening_stock', CURRENT_DATE, 'Initial Opening Stock')
        """, (new_id, payload.opening_stock))

    return get_product(new_id)

@router.put("/{product_id}")
def update_product(product_id: int, payload: ProductUpdate):
    exists = query_one("SELECT id FROM products WHERE id = ? AND deleted_at IS NULL", (product_id,))
    if not exists:
        raise HTTPException(status_code=404, detail="Product not found")

    duplicate_code = query_one("SELECT id FROM products WHERE code = ? AND id != ? AND deleted_at IS NULL", (payload.code.strip(), product_id))
    if duplicate_code:
        raise HTTPException(status_code=400, detail=f"Product code '{payload.code}' already used by another item.")

    sql = """
        UPDATE products SET
            name = ?, code = ?, category_id = ?, sub_category_id = ?,
            unit = ?, size_thickness = ?, purchase_price = ?, selling_price = ?,
            tax_percent = ?, hsn_code = ?, min_stock = ?, status = ?
        WHERE id = ?
    """
    execute_update(sql, (
        payload.name.strip(), payload.code.strip(), payload.category_id, payload.sub_category_id,
        payload.unit, payload.size_thickness or "", payload.purchase_price, payload.selling_price,
        payload.tax_percent, payload.hsn_code or "6802", payload.min_stock, payload.status,
        product_id
    ))
    return get_product(product_id)

@router.delete("/{product_id}")
def delete_product(product_id: int):
    # Rule in documentation: only if product was never used in a purchase, sale or damage entry; otherwise mark Inactive.
    p_cnt = query_one("SELECT COUNT(*) AS c FROM purchase_items WHERE product_id = ?", (product_id,))
    s_cnt = query_one("SELECT COUNT(*) AS c FROM sale_items WHERE product_id = ?", (product_id,))
    d_cnt = query_one("SELECT COUNT(*) AS c FROM damages WHERE product_id = ? AND deleted_at IS NULL", (product_id,))

    if (p_cnt and p_cnt['c'] > 0) or (s_cnt and s_cnt['c'] > 0) or (d_cnt and d_cnt['c'] > 0):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete product linked to historical transactions or damage entries. Marked as Inactive instead."
        )

    execute_update("UPDATE products SET deleted_at = CURRENT_TIMESTAMP, status = 'Inactive' WHERE id = ?", (product_id,))
    return {"message": "Product deleted successfully", "id": product_id}
