-- ====================================================================
-- BILLING & INVOICING SOFTWARE - SQL DATABASE SCHEMA (SQLite / SQL92)
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. BUSINESS PROFILE & SETTINGS
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT NOT NULL DEFAULT 'Apex Innovations Inc.',
    tagline TEXT DEFAULT 'Enterprise Software & Cloud Services',
    email TEXT DEFAULT 'billing@apexinnovations.com',
    phone TEXT DEFAULT '+1 (555) 234-5678',
    address TEXT DEFAULT '100 Enterprise Way, Suite 400, San Francisco, CA 94105',
    tax_id TEXT DEFAULT 'US-EIN-94-3829104',
    currency_symbol TEXT NOT NULL DEFAULT '$',
    currency_code TEXT NOT NULL DEFAULT 'USD',
    invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
    default_tax_rate REAL NOT NULL DEFAULT 10.0,
    payment_terms TEXT DEFAULT 'Payment is due within 15 days of invoice date.',
    bank_name TEXT DEFAULT 'Silicon Valley Commercial Bank',
    bank_account_no TEXT DEFAULT '987654321098',
    bank_routing_no TEXT DEFAULT '121000358',
    notes TEXT DEFAULT 'Thank you for your business. For billing inquiries, contact billing@apexinnovations.com',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS / CLIENTS
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company_name TEXT,
    email TEXT,
    phone TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    tax_id TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS & SERVICES CATALOG
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    description TEXT,
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    tax_rate REAL NOT NULL DEFAULT 0.0 CHECK (tax_rate >= 0),
    unit TEXT NOT NULL DEFAULT 'pcs',
    stock_quantity INTEGER NOT NULL DEFAULT 100,
    category TEXT NOT NULL DEFAULT 'Services',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0.0,
    tax_total REAL NOT NULL DEFAULT 0.0,
    discount_total REAL NOT NULL DEFAULT 0.0,
    grand_total REAL NOT NULL DEFAULT 0.0,
    paid_amount REAL NOT NULL DEFAULT 0.0,
    balance_due REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled')),
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. INVOICE LINE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    quantity REAL NOT NULL CHECK (quantity > 0),
    unit_price REAL NOT NULL CHECK (unit_price >= 0),
    tax_rate REAL NOT NULL DEFAULT 0.0,
    tax_amount REAL NOT NULL DEFAULT 0.0,
    total REAL NOT NULL
);

-- 6. PAYMENTS / TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount REAL NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'Credit Card', 'UPI', 'PayPal', 'Cheque', 'Other')),
    transaction_reference TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- ====================================================================
-- SQL VIEWS FOR REPORTING & ANALYTICS
-- ====================================================================
DROP VIEW IF EXISTS v_invoice_summary;
CREATE VIEW v_invoice_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.customer_id,
    c.name AS customer_name,
    c.company_name AS customer_company,
    c.email AS customer_email,
    c.phone AS customer_phone,
    i.issue_date,
    i.due_date,
    i.subtotal,
    i.tax_total,
    i.discount_total,
    i.grand_total,
    i.paid_amount,
    i.balance_due,
    i.status,
    i.notes,
    i.terms,
    i.created_at,
    (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) AS item_count
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id;

DROP VIEW IF EXISTS v_customer_summary;
CREATE VIEW v_customer_summary AS
SELECT 
    c.id,
    c.name,
    c.company_name,
    c.email,
    c.phone,
    COUNT(i.id) AS total_invoices,
    COALESCE(SUM(i.grand_total), 0) AS total_billed,
    COALESCE(SUM(i.paid_amount), 0) AS total_paid,
    COALESCE(SUM(i.balance_due), 0) AS outstanding_balance
FROM customers c
LEFT JOIN invoices i ON c.id = i.customer_id
GROUP BY c.id;
