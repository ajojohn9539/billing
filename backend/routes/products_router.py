from fastapi import APIRouter, HTTPException, Query
from database import query_all, query_one, execute_insert, execute_update
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/products", tags=["Products"])

class ProductCreate(BaseModel):
    name: str
    code: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[int] = None
    category: Optional[str] = None
    sub_category_id: Optional[int] = None
    unit: Optional[str] = "piece" # sq.ft, sq.m, piece, ton, cubic ft, pcs
    size_thickness: Optional[str] = ""
    purchase_price: Optional[float] = 0.0
    selling_price: Optional[float] = None
    unit_price: Optional[float] = None
    tax_percent: Optional[float] = None
    tax_rate: Optional[float] = None
    hsn_code: Optional[str] = "6802"
    opening_stock: Optional[float] = None
    stock_quantity: Optional[float] = None
    min_stock: Optional[float] = 10.0
    status: Optional[str] = "Active"
    description: Optional[str] = ""

class ProductUpdate(ProductCreate):
    pass

class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None
    type: str = "product"

def map_product_row(row: dict) -> dict:
    if not row:
        return row
    r = dict(row)
    r["sku"] = r.get("code") or ""
    r["unit_price"] = r.get("selling_price") or 0.0
    r["tax_rate"] = r.get("tax_percent") or 0.0
    r["stock_quantity"] = r.get("current_stock") or 0.0
    r["category"] = r.get("category_name") or "General"
    r["description"] = r.get("size_thickness") or ""
    return r

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
    rows = query_all(" ".join(query), tuple(params))
    return [map_product_row(r) for r in rows]

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
    return map_product_row(row)

@router.post("")
def create_product(payload: ProductCreate):
    code = (payload.code or payload.sku or "").strip()
    if not code:
        code = f"PRD-{int(datetime.now().timestamp()) % 100000:04d}"

    # Check unique code
    exists = query_one("SELECT id FROM products WHERE code = ? AND deleted_at IS NULL", (code,))
    if exists:
        # Append timestamp suffix if code collides
        code = f"{code}-{int(datetime.now().timestamp()) % 1000}"

    # Resolve category_id
    cat_id = payload.category_id
    if not cat_id:
        cat_name = (payload.category or "General").strip()
        cat_row = query_one("SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1", (cat_name,))
        if cat_row:
            cat_id = cat_row['id']
        else:
            cat_id = execute_insert("INSERT INTO categories (name, type) VALUES (?, 'product')", (cat_name,))

    selling_price = payload.selling_price if payload.selling_price is not None else (payload.unit_price or 0.0)
    tax_percent = payload.tax_percent if payload.tax_percent is not None else (payload.tax_rate if payload.tax_rate is not None else 18.0)
    opening_stock = payload.opening_stock if payload.opening_stock is not None else (payload.stock_quantity or 0.0)
    unit = payload.unit or "piece"
    size_thickness = payload.size_thickness or payload.description or ""
    status = payload.status or "Active"
    purchase_price = payload.purchase_price or 0.0
    hsn_code = payload.hsn_code or "6802"
    min_stock = payload.min_stock if payload.min_stock is not None else 10.0

    sql = """
        INSERT INTO products (name, code, category_id, sub_category_id, unit, size_thickness,
                             purchase_price, selling_price, tax_percent, hsn_code,
                             opening_stock, current_stock, min_stock, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    new_id = execute_insert(sql, (
        payload.name.strip(), code, cat_id, payload.sub_category_id,
        unit, size_thickness, purchase_price, selling_price,
        tax_percent, hsn_code, opening_stock,
        opening_stock, min_stock, status
    ))

    # Record opening stock movement
    if opening_stock > 0:
        execute_insert("""
            INSERT INTO stock_movements (product_id, type, qty, reference_type, date, remarks)
            VALUES (?, 'opening', ?, 'opening_stock', CURRENT_DATE, 'Initial Opening Stock')
        """, (new_id, opening_stock))

    return get_product(new_id)

@router.put("/{product_id}")
def update_product(product_id: int, payload: ProductUpdate):
    exists = query_one("SELECT id FROM products WHERE id = ? AND deleted_at IS NULL", (product_id,))
    if not exists:
        raise HTTPException(status_code=404, detail="Product not found")

    code = (payload.code or payload.sku or exists.get("code") or "").strip()
    if code:
        duplicate_code = query_one("SELECT id FROM products WHERE code = ? AND id != ? AND deleted_at IS NULL", (code, product_id))
        if duplicate_code:
            raise HTTPException(status_code=400, detail=f"Product code '{code}' already used by another item.")

    cat_id = payload.category_id or exists.get("category_id")
    if not cat_id and payload.category:
        cat_name = payload.category.strip()
        cat_row = query_one("SELECT id FROM categories WHERE LOWER(name) = LOWER(?) LIMIT 1", (cat_name,))
        cat_id = cat_row['id'] if cat_row else cat_id

    selling_price = payload.selling_price if payload.selling_price is not None else (payload.unit_price if payload.unit_price is not None else exists.get("selling_price", 0.0))
    tax_percent = payload.tax_percent if payload.tax_percent is not None else (payload.tax_rate if payload.tax_rate is not None else exists.get("tax_percent", 18.0))
    unit = payload.unit or exists.get("unit", "piece")
    size_thickness = payload.size_thickness or payload.description or exists.get("size_thickness", "")
    status = payload.status or exists.get("status", "Active")
    purchase_price = payload.purchase_price if payload.purchase_price is not None else exists.get("purchase_price", 0.0)
    hsn_code = payload.hsn_code or exists.get("hsn_code", "6802")
    min_stock = payload.min_stock if payload.min_stock is not None else exists.get("min_stock", 10.0)

    sql = """
        UPDATE products SET
            name = ?, code = ?, category_id = ?, sub_category_id = ?,
            unit = ?, size_thickness = ?, purchase_price = ?, selling_price = ?,
            tax_percent = ?, hsn_code = ?, min_stock = ?, status = ?
        WHERE id = ?
    """
    execute_update(sql, (
        payload.name.strip(), code, cat_id, payload.sub_category_id,
        unit, size_thickness, purchase_price, selling_price,
        tax_percent, hsn_code, min_stock, status,
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
