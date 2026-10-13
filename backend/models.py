from typing import List, Optional
from pydantic import BaseModel, Field

# --- Settings Models ---
class SettingsUpdate(BaseModel):
    company_name: str
    tagline: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    address: Optional[str] = ""
    tax_id: Optional[str] = ""
    currency_symbol: str = "$"
    currency_code: str = "USD"
    invoice_prefix: str = "INV-"
    default_tax_rate: float = Field(default=10.0, ge=0.0)
    payment_terms: Optional[str] = ""
    bank_name: Optional[str] = ""
    bank_account_no: Optional[str] = ""
    bank_routing_no: Optional[str] = ""
    notes: Optional[str] = ""

# --- Customer Models ---
class CustomerBase(BaseModel):
    name: str
    company_name: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    billing_address: Optional[str] = ""
    shipping_address: Optional[str] = ""
    tax_id: Optional[str] = ""
    notes: Optional[str] = ""

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    pass

# --- Product Models ---
class ProductBase(BaseModel):
    name: str
    sku: Optional[str] = ""
    description: Optional[str] = ""
    unit_price: float = Field(ge=0.0)
    tax_rate: float = Field(default=0.0, ge=0.0)
    unit: str = "pcs"
    stock_quantity: int = Field(default=100, ge=0)
    category: Optional[str] = "Services"

class ProductCreate(ProductBase):
    pass

class ProductUpdate(ProductBase):
    pass

# --- Invoice Models ---
class InvoiceItemInput(BaseModel):
    product_id: Optional[int] = None
    item_name: str
    description: Optional[str] = ""
    quantity: float = Field(gt=0.0)
    unit_price: float = Field(ge=0.0)
    tax_rate: float = Field(default=0.0, ge=0.0)

class InvoiceCreate(BaseModel):
    invoice_number: Optional[str] = None
    customer_id: int
    issue_date: str
    due_date: str
    discount_total: float = Field(default=0.0, ge=0.0)
    notes: Optional[str] = ""
    terms: Optional[str] = ""
    status: Optional[str] = "pending"
    items: List[InvoiceItemInput]

class InvoiceStatusUpdate(BaseModel):
    status: str

# --- Payment Models ---
class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float = Field(gt=0.0)
    payment_date: str
    payment_method: str = "Bank Transfer"
    transaction_reference: Optional[str] = ""
    notes: Optional[str] = ""
