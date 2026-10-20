-- ====================================================================
-- ROCK PALACE - STONE SHOP ACCOUNTING & BILLING DATABASE SCHEMA
-- Target Database: PostgreSQL / Supabase
-- Compatible with: Aster Billing System (FastAPI + React)
-- ====================================================================

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Admin / Owner',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. CONTACTS (Customers, Suppliers, Both)
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL DEFAULT 'Customer',
    name VARCHAR(200) NOT NULL,
    company VARCHAR(200),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    gstin VARCHAR(50),
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance_type VARCHAR(50) NOT NULL DEFAULT 'To Receive',
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts (type);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts (name);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);

-- 3. CATEGORIES & SUB-CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    parent_id INT REFERENCES categories(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'product',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type);

-- 4. PRODUCTS & STONE ITEMS
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    sub_category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    unit VARCHAR(50) NOT NULL DEFAULT 'sq.ft',
    size_thickness VARCHAR(100),
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    hsn_code VARCHAR(50) DEFAULT '6802',
    opening_stock DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    current_stock DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    min_stock DECIMAL(12,2) NOT NULL DEFAULT 10.00,
    image VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_code ON products (code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);

-- 5. BANK ACCOUNTS
CREATE TABLE IF NOT EXISTS bank_accounts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    account_number VARCHAR(100),
    bank_name VARCHAR(150),
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. PURCHASES (Stock Inward)
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    invoice_no VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    notes TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    transport_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    round_off DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases (date);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases (status);

-- 7. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    qty DECIMAL(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    rate DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. SALES (Stock Outward)
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    bill_no VARCHAR(100) NOT NULL UNIQUE,
    date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    vehicle_no VARCHAR(100),
    delivery_address TEXT,
    notes TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    transport_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    round_off DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales (customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales (date);
CREATE INDEX IF NOT EXISTS idx_sales_bill_no ON sales (bill_no);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales (status);

-- 9. SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    qty DECIMAL(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    rate DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. DAMAGES (Damage Entry)
CREATE TABLE IF NOT EXISTS damages (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    qty DECIMAL(12,2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    cost_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    remarks TEXT,
    photo VARCHAR(255),
    created_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_damages_date ON damages (date);

-- 11. STOCK MOVEMENTS (Stock Audit Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    qty DECIMAL(12,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    date DATE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sm_product ON stock_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_sm_date ON stock_movements (date);

-- 12. DAYBOOK (Daily Inward / Outward Cash & Bank Register)
CREATE TABLE IF NOT EXISTS daybook (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type VARCHAR(50) NOT NULL,
    category_id INT,
    sub_category_id INT,
    method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    cheque_date DATE,
    cheque_status VARCHAR(50) DEFAULT 'cleared',
    bank_account_id INT NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
    document_no VARCHAR(100),
    narration TEXT NOT NULL,
    to_be_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    excess DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    source_type VARCHAR(50),
    source_id INT,
    created_by INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_daybook_date ON daybook (date);
CREATE INDEX IF NOT EXISTS idx_daybook_type ON daybook (type);
CREATE INDEX IF NOT EXISTS idx_daybook_method ON daybook (method);

-- 13. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. SETTINGS & BUSINESS PROFILE
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL DEFAULT 'Rock Palace',
    business_type VARCHAR(100) DEFAULT 'Stone Shop (Granite & Marble)',
    tagline VARCHAR(200) DEFAULT 'Premium Granite, Marble & Stone Solutions',
    phone VARCHAR(50) DEFAULT '+91 98401 23456',
    email VARCHAR(150) DEFAULT 'billing@rockpalace.com',
    address TEXT,
    gstin VARCHAR(50) DEFAULT '33AABCR1234F1Z5',
    invoice_prefix VARCHAR(50) DEFAULT 'RP/BILL/',
    purchase_prefix VARCHAR(50) DEFAULT 'RP/PUR/',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    default_tax_rate DECIMAL(5,2) DEFAULT 18.00,
    payment_terms TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- LEGACY TABLES (Optional compatibility for older routes)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    email VARCHAR(150),
    phone VARCHAR(50),
    billing_address TEXT,
    shipping_address TEXT,
    tax_id VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INT,
    item_description TEXT NOT NULL,
    quantity DECIMAL(12,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    transaction_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- SEED DATA SPECIFICALLY FOR ROCK PALACE (STONE SHOP)
-- ====================================================================

-- 1. Default Users
INSERT INTO users (id, name, email, password, role, status) VALUES
(1, 'Billora Admin', 'admin@billora.com', 'RockPalace2026!', 'admin', 'Active'),
(2, 'Ganesh (Accountant)', 'accountant@billora.com', 'ganesh123', 'accountant', 'Active'),
(3, 'Muthu (Sales Staff)', 'sales@billora.com', 'muthu123', 'sales', 'Active'),
(4, 'Ramesh (Store Keeper)', 'store@billora.com', 'ramesh123', 'store', 'Active'),
(5, 'Billora Super Sudo', 'sudo@billora.com', 'SudoMaster2026!', 'sudo', 'Active')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;

-- 2. Bank Accounts
INSERT INTO bank_accounts (id, name, account_number, bank_name, opening_balance, current_balance) VALUES
(1, 'Cash in Hand (Shop Drawer)', 'CASH-MAIN', 'Cash', 25000.00, 48500.00),
(2, 'State Bank of India - Current A/c', 'SBI-38910294812', 'State Bank of India', 150000.00, 245000.00),
(3, 'HDFC Bank - Commercial', 'HDFC-50200049182', 'HDFC Bank', 200000.00, 185000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Settings
INSERT INTO settings (id, company_name, business_type, tagline, phone, email, address, gstin, invoice_prefix, purchase_prefix, currency_symbol, default_tax_rate, payment_terms) VALUES
(1, 'JR MARBLES & GRANITES', 'Marbles & Granites (Chengamanadu)', 'Wholesale & Retail Granite, Marble & Natural Stones • Chengamanadu', '9460110878, 8504882265', 'jrmarbleschengamanadu@gmail.com', 'Chengamanadu, Kottarakkara, Kollam District, Kerala - 691557', '32FGZPR5431L1ZL', 'JR26-27 ', 'JR/PUR/', '₹', 18.00, '1. This Subject to Kottarakkara Jurisdiction Only.
2. Payment Should be drawn in favour of above bank details
3. Goods once sold cannot be taken back or exchanged
4. Our responsibility ceases the moment goods leave our Showroom
5. We are not responsible for damage pilferage during transit')
ON CONFLICT (id) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    business_type = EXCLUDED.business_type,
    tagline = EXCLUDED.tagline,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    gstin = EXCLUDED.gstin,
    invoice_prefix = EXCLUDED.invoice_prefix,
    payment_terms = EXCLUDED.payment_terms;

-- 4. Categories
INSERT INTO categories (id, name, parent_id, type) VALUES
(1, 'Granite', NULL, 'product'),
(2, 'Marble', NULL, 'product'),
(3, 'Tiles', NULL, 'product'),
(4, 'Slab', NULL, 'product'),
(5, 'Block', NULL, 'product'),
(6, 'Natural Stone', NULL, 'product'),
(10, 'Shop Rent', NULL, 'expense'),
(11, 'Staff Salary', NULL, 'expense'),
(12, 'Loading & Unloading', NULL, 'expense'),
(13, 'Vehicle Fuel & Transport', NULL, 'expense'),
(14, 'Electricity & Generator', NULL, 'expense'),
(20, 'Sales Receipt', NULL, 'income'),
(21, 'Other Income', NULL, 'income')
ON CONFLICT (id) DO NOTHING;

-- 5. Contacts (Customers & Suppliers)
INSERT INTO contacts (id, type, name, company, phone, email, address, city, state, gstin, opening_balance, balance_type, current_balance, credit_limit, notes, status) VALUES
(1, 'Supplier', 'Rajasthan Granites & Quarry Ltd', 'Rajasthan Granites', '9829012345', 'sales@rajgranites.in', 'Plot 45, Quarry Industrial Area, Jalore', 'Jalore', 'Rajasthan', '08AABCR9912K1Z9', 50000.00, 'To Pay', 68000.00, 500000.00, 'Direct supplier for Black Galaxy and Tan Brown', 'Active'),
(2, 'Supplier', 'Kishangarh Marble Emporium', 'Kishangarh Marbles', '9414019283', 'kishangarh@stonehub.com', 'RIICO Phase II, Kishangarh', 'Ajmer', 'Rajasthan', '08AABCK3319M1Z2', 0.00, 'To Pay', 15000.00, 300000.00, 'Italian and Makrana white marble dealer', 'Active'),
(3, 'Customer', 'Anand Builders & Developers', 'Anand Builders', '9841098765', 'anand@anandbuilders.in', '77 Mount Road, Teynampet', 'Chennai', 'Tamil Nadu', '33AABCA8819L1Z1', 20000.00, 'To Receive', 34500.00, 200000.00, 'Regular builder client, credit terms 15 days', 'Active'),
(4, 'Customer', 'Kavitha Interior Design Studio', 'Kavitha Interiors', '9840234567', 'kavitha@kavithadesigns.com', '12 2nd Main Road, Anna Nagar', 'Chennai', 'Tamil Nadu', '33AABCK4412P1Z0', 0.00, 'To Receive', 12000.00, 100000.00, 'Premium residential interior designer', 'Active'),
(5, 'Customer', 'Walk-in Customer (Retail)', 'Retail Cash Sales', '9940000000', 'cash@rockpalace.com', 'Counter Sales, Chennai', 'Chennai', 'Tamil Nadu', NULL, 0.00, 'To Receive', 0.00, 0.00, 'Default contact for over-the-counter purchases', 'Active'),
(6, 'Both', 'Southern Stone Transport & Logistics', 'Southern Stones', '9840556677', 'logistics@southernstones.com', '40 Bye-pass Road, Madurai', 'Madurai', 'Tamil Nadu', '33AABCS8891D1Z8', 5000.00, 'To Pay', 5000.00, 50000.00, 'Provides vehicle transport and purchases scrap tiles', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 6. Products (Stone items: Granite, Marble, Tiles, Slabs, Blocks)
INSERT INTO products (id, name, code, category_id, unit, size_thickness, purchase_price, selling_price, tax_percent, hsn_code, opening_stock, current_stock, min_stock, status) VALUES
(1, 'Black Galaxy Granite (Polished Slab)', 'GRP-BLK-GAL', 1, 'sq.ft', '18mm Thickness', 140.00, 195.00, 18.00, '6802', 1500.00, 1850.00, 200.00, 'Active'),
(2, 'Italian Statuario White Marble', 'MAR-IT-STAT', 2, 'sq.ft', '20mm Polished', 420.00, 580.00, 18.00, '6802', 800.00, 950.00, 100.00, 'Active'),
(3, 'Kota Stone Blue Grey (Honed)', 'KOT-GRY-2X2', 6, 'sq.ft', '22mm Calibrated', 28.00, 42.00, 12.00, '6802', 3000.00, 3600.00, 500.00, 'Active'),
(4, 'Kadappa Black Limestone Tiles', 'KAD-BLK-TILES', 3, 'sq.ft', '20mm 1x1 ft', 32.00, 48.00, 12.00, '6802', 2500.00, 2900.00, 400.00, 'Active'),
(5, 'Tan Brown South Indian Granite', 'GRP-TAN-BRN', 1, 'sq.ft', '18mm Gangsaw Slabs', 95.00, 135.00, 18.00, '6802', 1200.00, 1400.00, 150.00, 'Active'),
(6, 'Teakwood Sandstone Tiles', 'SAN-TKW-TILES', 3, 'sq.ft', '15mm Polished', 65.00, 92.00, 12.00, '6802', 800.00, 800.00, 100.00, 'Active'),
(7, 'Granite Kerb Stones (Rough Cut)', 'GR-KERB-BLK', 5, 'piece', '100x30x15 cm', 450.00, 680.00, 18.00, '6802', 150.00, 135.00, 30.00, 'Active')
ON CONFLICT (id) DO NOTHING;

-- 7. Sample Purchase (Stock Inward)
INSERT INTO purchases (id, supplier_id, invoice_no, date, payment_method, notes, subtotal, discount, tax, transport_charges, round_off, total, paid, due, status, created_by) VALUES
(1, 1, 'RAJ/INV/8819', '2026-10-01', 'RTGS-NEFT', 'Full truckload gangsaw Black Galaxy Slabs from Jalore', 70000.00, 1000.00, 12420.00, 3500.00, 0.00, 84920.00, 50000.00, 34920.00, 'Partly paid', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO purchase_items (id, purchase_id, product_id, qty, unit, rate, discount, tax_percent, tax_amount, total) VALUES
(1, 1, 1, 500.00, 'sq.ft', 140.00, 1000.00, 18.00, 12420.00, 81420.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_movements (id, product_id, type, qty, reference_type, reference_id, date, remarks) VALUES
(1, 1, 'purchase', 500.00, 'purchases', 1, '2026-10-01', 'Purchase Invoice RAJ/INV/8819')
ON CONFLICT (id) DO NOTHING;

-- 8. Sample Sales (Stock Outward)
INSERT INTO sales (id, customer_id, bill_no, date, payment_method, vehicle_no, delivery_address, notes, subtotal, discount, tax, transport_charges, round_off, total, paid, due, status, created_by) VALUES
(1, 3, 'RP/BILL/2026/001', '2026-10-05', 'Bank', 'TN-11-AB-4050', 'Site: Villa 14, OMR Navalur, Chennai', 'Living room and lobby flooring supply', 29250.00, 500.00, 5175.00, 1500.00, 0.00, 35425.00, 20000.00, 15425.00, 'Partly paid', 1),
(2, 4, 'RP/BILL/2026/002', '2026-10-08', 'UPI', 'Auto TN-09-Q-2819', 'Flat 4B, Shanthi Colony, Anna Nagar', 'Italian Statuario kitchen counter top', 11600.00, 200.00, 2052.00, 500.00, 0.00, 13952.00, 13952.00, 0.00, 'Paid', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (id, sale_id, product_id, qty, unit, rate, discount, tax_percent, tax_amount, total) VALUES
(1, 1, 1, 150.00, 'sq.ft', 195.00, 500.00, 18.00, 5175.00, 33925.00),
(2, 2, 2, 20.00, 'sq.ft', 580.00, 200.00, 18.00, 2052.00, 13452.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_movements (id, product_id, type, qty, reference_type, reference_id, date, remarks) VALUES
(2, 1, 'sale', -150.00, 'sales', 1, '2026-10-05', 'Sales Bill RP/BILL/2026/001 to Anand Builders'),
(3, 2, 'sale', -20.00, 'sales', 2, '2026-10-08', 'Sales Bill RP/BILL/2026/002 to Kavitha Interiors')
ON CONFLICT (id) DO NOTHING;

-- 9. Sample Damage Entry
INSERT INTO damages (id, date, product_id, qty, reason, cost_value, remarks, created_by) VALUES
(1, '2026-10-06', 7, 15.00, 'Broken in transit', 6750.00, 'Unloading crane sling slip caused cracked corner slabs', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_movements (id, product_id, type, qty, reference_type, reference_id, date, remarks) VALUES
(4, 7, 'damage', -15.00, 'damages', 1, '2026-10-06', 'Broken in transit - Crane unloading slip')
ON CONFLICT (id) DO NOTHING;

-- 10. Sample Daybook Entries
INSERT INTO daybook (id, date, time, type, category_id, sub_category_id, method, cheque_date, cheque_status, bank_account_id, document_no, narration, to_be_paid, paid, excess, source_type, source_id, created_by) VALUES
(1, '2026-10-01', '11:30:00', 'outward', NULL, NULL, 'RTGS-NEFT', NULL, 'cleared', 2, 'RAJ/INV/8819', 'Payment to Rajasthan Granites for Inv RAJ/INV/8819', 84920.00, 50000.00, 0.00, 'purchase', 1, 1),
(2, '2026-10-05', '14:15:00', 'inward', 20, NULL, 'Bank', NULL, 'cleared', 2, 'RP/BILL/2026/001', 'Advance received from Anand Builders for Bill RP/BILL/2026/001', 35425.00, 20000.00, 0.00, 'sale', 1, 1),
(3, '2026-10-06', '10:00:00', 'outward', 12, NULL, 'Cash', NULL, 'cleared', 1, 'VCH-LOAD-01', 'Crane unloading fee at yard for Black Galaxy slabs', 3500.00, 3500.00, 0.00, 'expense', NULL, 1),
(4, '2026-10-08', '16:45:00', 'inward', 20, NULL, 'UPI', NULL, 'cleared', 2, 'RP/BILL/2026/002', 'Full payment received from Kavitha Interiors', 13952.00, 13952.00, 0.00, 'sale', 2, 1)
ON CONFLICT (id) DO NOTHING;

-- Sync serial sequence counters so new insertions don't hit duplicate key errors
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('bank_accounts', 'id'), COALESCE((SELECT MAX(id) FROM bank_accounts), 1));
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1));
SELECT setval(pg_get_serial_sequence('contacts', 'id'), COALESCE((SELECT MAX(id) FROM contacts), 1));
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1));
SELECT setval(pg_get_serial_sequence('purchases', 'id'), COALESCE((SELECT MAX(id) FROM purchases), 1));
SELECT setval(pg_get_serial_sequence('purchase_items', 'id'), COALESCE((SELECT MAX(id) FROM purchase_items), 1));
SELECT setval(pg_get_serial_sequence('sales', 'id'), COALESCE((SELECT MAX(id) FROM sales), 1));
SELECT setval(pg_get_serial_sequence('sale_items', 'id'), COALESCE((SELECT MAX(id) FROM sale_items), 1));
SELECT setval(pg_get_serial_sequence('damages', 'id'), COALESCE((SELECT MAX(id) FROM damages), 1));
SELECT setval(pg_get_serial_sequence('stock_movements', 'id'), COALESCE((SELECT MAX(id) FROM stock_movements), 1));
SELECT setval(pg_get_serial_sequence('daybook', 'id'), COALESCE((SELECT MAX(id) FROM daybook), 1));
SELECT setval(pg_get_serial_sequence('audit_logs', 'id'), COALESCE((SELECT MAX(id) FROM audit_logs), 1));
