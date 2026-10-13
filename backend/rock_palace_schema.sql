-- ====================================================================
-- ROCK PALACE - STONE SHOP ACCOUNTING & BILLING DATABASE SCHEMA
-- System: Aster Billing (Web-based accounting & billing + MySQL)
-- Target Database: billing (MySQL / phpMyAdmin)
-- ====================================================================

CREATE DATABASE IF NOT EXISTS billing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE billing;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS & ROLES
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin / Owner', 'Accountant', 'Sales staff', 'Store keeper') NOT NULL DEFAULT 'Admin / Owner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. CONTACTS (Customers, Suppliers, Both)
DROP TABLE IF EXISTS contacts;
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('Customer', 'Supplier', 'Both') NOT NULL DEFAULT 'Customer',
    name VARCHAR(200) NOT NULL,
    company VARCHAR(200) NULL,
    phone VARCHAR(50) NULL,
    email VARCHAR(150) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    gstin VARCHAR(50) NULL,
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    balance_type ENUM('To Receive', 'To Pay') NOT NULL DEFAULT 'To Receive',
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_by INT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_contacts_type (type),
    INDEX idx_contacts_name (name),
    INDEX idx_contacts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CATEGORIES & SUB-CATEGORIES
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    parent_id INT NULL DEFAULT NULL,
    type ENUM('product', 'expense', 'income') NOT NULL DEFAULT 'product',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_categories_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PRODUCTS & STONE ITEMS
DROP TABLE IF EXISTS products;
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL,
    sub_category_id INT NULL DEFAULT NULL,
    unit ENUM('sq.ft', 'sq.m', 'piece', 'ton', 'cubic ft') NOT NULL DEFAULT 'sq.ft',
    size_thickness VARCHAR(100) NULL,
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    hsn_code VARCHAR(50) DEFAULT '6802',
    opening_stock DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    current_stock DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    min_stock DECIMAL(12,2) NOT NULL DEFAULT 10.00,
    image VARCHAR(255) NULL,
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_by INT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_products_name (name),
    INDEX idx_products_code (code),
    INDEX idx_products_category (category_id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BANK ACCOUNTS
DROP TABLE IF EXISTS bank_accounts;
CREATE TABLE bank_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    account_number VARCHAR(100) NULL,
    bank_name VARCHAR(150) NULL,
    opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. PURCHASES
DROP TABLE IF EXISTS purchases;
CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    payment_method ENUM('Cash', 'Bank', 'RTGS-NEFT', 'Cheque', 'UPI') NOT NULL DEFAULT 'Cash',
    notes TEXT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    transport_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    round_off DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('Unpaid', 'Partly paid', 'Paid') NOT NULL DEFAULT 'Unpaid',
    created_by INT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_purchases_supplier (supplier_id),
    INDEX idx_purchases_date (date),
    INDEX idx_purchases_status (status),
    FOREIGN KEY (supplier_id) REFERENCES contacts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. PURCHASE ITEMS
DROP TABLE IF EXISTS purchase_items;
CREATE TABLE purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    qty DECIMAL(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    rate DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. SALES
DROP TABLE IF EXISTS sales;
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    bill_no VARCHAR(100) NOT NULL UNIQUE,
    date DATE NOT NULL,
    payment_method ENUM('Cash', 'Bank', 'RTGS-NEFT', 'Cheque', 'UPI') NOT NULL DEFAULT 'Cash',
    vehicle_no VARCHAR(100) NULL,
    delivery_address TEXT NULL,
    notes TEXT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    transport_charges DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    round_off DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    due DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('Unpaid', 'Partly paid', 'Paid') NOT NULL DEFAULT 'Unpaid',
    created_by INT NULL,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_sales_customer (customer_id),
    INDEX idx_sales_date (date),
    INDEX idx_sales_bill_no (bill_no),
    INDEX idx_sales_status (status),
    FOREIGN KEY (customer_id) REFERENCES contacts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SALE ITEMS
DROP TABLE IF EXISTS sale_items;
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    qty DECIMAL(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    rate DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. DAMAGES (Damage Entry)
DROP TABLE IF EXISTS damages;
CREATE TABLE damages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    product_id INT NOT NULL,
    qty DECIMAL(12,2) NOT NULL,
    reason ENUM('Broken in transit', 'Cutting loss', 'Handling', 'Other') NOT NULL,
    cost_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    remarks TEXT NULL,
    photo VARCHAR(255) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_damages_date (date),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. STOCK MOVEMENTS (Stock Audit Ledger)
DROP TABLE IF EXISTS stock_movements;
CREATE TABLE stock_movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    type ENUM('opening', 'purchase', 'sale', 'damage', 'adjustment', 'purchase_return', 'sales_return') NOT NULL,
    qty DECIMAL(12,2) NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id INT NULL,
    date DATE NOT NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sm_product (product_id),
    INDEX idx_sm_date (date),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. DAYBOOK (Daily Inward / Outward Cash & Bank Register)
DROP TABLE IF EXISTS daybook;
CREATE TABLE daybook (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    time TIME NOT NULL,
    type ENUM('inward', 'outward') NOT NULL,
    category_id INT NULL,
    sub_category_id INT NULL,
    method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    cheque_date DATE NULL,
    cheque_status ENUM('cleared', 'pending') DEFAULT 'cleared',
    bank_account_id INT NOT NULL,
    document_no VARCHAR(100) NULL,
    narration TEXT NOT NULL,
    to_be_paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    excess DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    source_type VARCHAR(50) NULL,
    source_id INT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_daybook_date (date),
    INDEX idx_daybook_type (type),
    INDEX idx_daybook_method (method),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. AUDIT LOGS
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action ENUM('create', 'update', 'delete', 'login') NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. SETTINGS & BUSINESS PROFILE
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================================
-- SEED DATA SPECIFICALLY FOR ROCK PALACE (STONE SHOP)
-- ====================================================================

-- 1. Users
INSERT INTO users (id, name, email, password, role) VALUES
(1, 'Rock Palace Admin', 'admin@rockpalace.com', '$2b$12$e5Vl0hQ9hZ4hP8/fI8kY8O4j2lK.56oR2wF0CgD8eW56f1.3', 'Admin / Owner'),
(2, 'Senthil Kumar (Accountant)', 'accountant@rockpalace.com', '$2b$12$e5Vl0hQ9hZ4hP8/fI8kY8O4j2lK.56oR2wF0CgD8eW56f1.3', 'Accountant'),
(3, 'Ravi Verma (Sales)', 'sales@rockpalace.com', '$2b$12$e5Vl0hQ9hZ4hP8/fI8kY8O4j2lK.56oR2wF0CgD8eW56f1.3', 'Sales staff'),
(4, 'Murugan (Store Keeper)', 'store@rockpalace.com', '$2b$12$e5Vl0hQ9hZ4hP8/fI8kY8O4j2lK.56oR2wF0CgD8eW56f1.3', 'Store keeper');

-- 2. Bank Accounts
INSERT INTO bank_accounts (id, name, account_number, bank_name, opening_balance, current_balance) VALUES
(1, 'Cash in Hand (Shop Drawer)', 'CASH-MAIN', 'Cash', 25000.00, 48500.00),
(2, 'State Bank of India - Current A/c', 'SBI-38910294812', 'State Bank of India', 150000.00, 245000.00),
(3, 'HDFC Bank - Commercial', 'HDFC-50200049182', 'HDFC Bank', 200000.00, 185000.00);

-- 3. Settings
INSERT INTO settings (id, company_name, business_type, tagline, phone, email, address, gstin, invoice_prefix, purchase_prefix, currency_symbol, default_tax_rate, payment_terms) VALUES
(1, 'Rock Palace', 'Granite, Marble & Natural Stones', 'Wholesale & Retail Quarry Direct Stone Merchants', '+91 98401 23456 / 044 2841 9900', 'billing@rockpalace.com', '120/4 GST Road, Tambaram East, Chennai, Tamil Nadu - 600045', '33AABCR1234F1Z5', 'RP/BILL/', 'RP/PUR/', '₹', 18.00, 'Goods once sold cannot be returned without prior inspection. Loading charges applicable. Immediate payment on presentation.');

-- 4. Categories
-- Product categories
INSERT INTO categories (id, name, parent_id, type) VALUES
(1, 'Granite', NULL, 'product'),
(2, 'Marble', NULL, 'product'),
(3, 'Tiles', NULL, 'product'),
(4, 'Slab', NULL, 'product'),
(5, 'Block', NULL, 'product'),
(6, 'Natural Stone', NULL, 'product'),
-- Expense categories
(10, 'Shop Rent', NULL, 'expense'),
(11, 'Staff Salary', NULL, 'expense'),
(12, 'Loading & Unloading', NULL, 'expense'),
(13, 'Vehicle Fuel & Transport', NULL, 'expense'),
(14, 'Electricity & Generator', NULL, 'expense'),
-- Income categories
(20, 'Sales Receipt', NULL, 'income'),
(21, 'Other Income', NULL, 'income');

-- 5. Contacts (Customers & Suppliers)
INSERT INTO contacts (id, type, name, company, phone, email, address, city, state, gstin, opening_balance, balance_type, current_balance, credit_limit, notes, status) VALUES
(1, 'Supplier', 'Rajasthan Granites & Quarry Ltd', 'Rajasthan Granites', '9829012345', 'sales@rajgranites.in', 'Plot 45, Quarry Industrial Area, Jalore', 'Jalore', 'Rajasthan', '08AABCR9912K1Z9', 50000.00, 'To Pay', 68000.00, 500000.00, 'Direct supplier for Black Galaxy and Tan Brown', 'Active'),
(2, 'Supplier', 'Kishangarh Marble Emporium', 'Kishangarh Marbles', '9414019283', 'kishangarh@stonehub.com', 'RIICO Phase II, Kishangarh', 'Ajmer', 'Rajasthan', '08AABCK3319M1Z2', 0.00, 'To Pay', 15000.00, 300000.00, 'Italian and Makrana white marble dealer', 'Active'),
(3, 'Customer', 'Anand Builders & Developers', 'Anand Builders', '9841098765', 'anand@anandbuilders.in', '77 Mount Road, Teynampet', 'Chennai', 'Tamil Nadu', '33AABCA8819L1Z1', 20000.00, 'To Receive', 34500.00, 200000.00, 'Regular builder client, credit terms 15 days', 'Active'),
(4, 'Customer', 'Kavitha Interior Design Studio', 'Kavitha Interiors', '9840234567', 'kavitha@kavithadesigns.com', '12 2nd Main Road, Anna Nagar', 'Chennai', 'Tamil Nadu', '33AABCK4412P1Z0', 0.00, 'To Receive', 12000.00, 100000.00, 'Premium residential interior designer', 'Active'),
(5, 'Customer', 'Walk-in Customer (Retail)', 'Retail Cash Sales', '9940000000', 'cash@rockpalace.com', 'Counter Sales, Chennai', 'Chennai', 'Tamil Nadu', NULL, 0.00, 'To Receive', 0.00, 0.00, 'Default contact for over-the-counter purchases', 'Active'),
(6, 'Both', 'Southern Stone Transport & Logistics', 'Southern Stones', '9840556677', 'logistics@southernstones.com', '40 Bye-pass Road, Madurai', 'Madurai', 'Tamil Nadu', '33AABCS8891D1Z8', 5000.00, 'To Pay', 5000.00, 50000.00, 'Provides vehicle transport and purchases scrap tiles', 'Active');

-- 6. Products (Stone items: Granite, Marble, Tiles, Slabs, Blocks)
INSERT INTO products (id, name, code, category_id, unit, size_thickness, purchase_price, selling_price, tax_percent, hsn_code, opening_stock, current_stock, min_stock, status) VALUES
(1, 'Black Galaxy Granite (Polished Slab)', 'GRP-BLK-GAL', 1, 'sq.ft', '18mm Thickness', 140.00, 195.00, 18.00, '6802', 1500.00, 1850.00, 200.00, 'Active'),
(2, 'Italian Statuario White Marble', 'MAR-IT-STAT', 2, 'sq.ft', '20mm Polished', 420.00, 580.00, 18.00, '6802', 800.00, 950.00, 100.00, 'Active'),
(3, 'Kota Stone Blue Grey (Honed)', 'KOT-GRY-2X2', 6, 'sq.ft', '22mm Calibrated', 28.00, 42.00, 12.00, '6802', 3000.00, 3600.00, 500.00, 'Active'),
(4, 'Kadappa Black Limestone Tiles', 'KAD-BLK-TILES', 3, 'sq.ft', '20mm 1x1 ft', 32.00, 48.00, 12.00, '6802', 2500.00, 2900.00, 400.00, 'Active'),
(5, 'Tan Brown South Indian Granite', 'GRP-TAN-BRN', 1, 'sq.ft', '18mm Gangsaw Slabs', 95.00, 135.00, 18.00, '6802', 1200.00, 1400.00, 150.00, 'Active'),
(6, 'Teakwood Sandstone Tiles', 'SAN-TKW-TILES', 3, 'sq.ft', '15mm Polished', 65.00, 92.00, 12.00, '6802', 800.00, 800.00, 100.00, 'Active'),
(7, 'Granite Kerb Stones (Rough Cut)', 'GR-KERB-BLK', 5, 'piece', '100x30x15 cm', 450.00, 680.00, 18.00, '6802', 150.00, 135.00, 30.00, 'Active');

-- 7. Sample Purchase (Stock Inward)
INSERT INTO purchases (id, supplier_id, invoice_no, date, payment_method, notes, subtotal, discount, tax, transport_charges, round_off, total, paid, due, status, created_by) VALUES
(1, 1, 'RAJ/INV/8819', '2026-10-01', 'RTGS-NEFT', 'Full truckload gangsaw Black Galaxy Slabs from Jalore', 70000.00, 1000.00, 12420.00, 3500.00, 0.00, 84920.00, 50000.00, 34920.00, 'Partly paid', 1);

INSERT INTO purchase_items (id, purchase_id, product_id, qty, unit, rate, discount, tax_percent, tax_amount, total) VALUES
(1, 1, 1, 500.00, 'sq.ft', 140.00, 1000.00, 18.00, 12420.00, 81420.00);

INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, remarks) VALUES
(1, 'purchase', 500.00, 'purchases', 1, '2026-10-01', 'Purchase Invoice RAJ/INV/8819');

-- 8. Sample Sales (Stock Outward)
INSERT INTO sales (id, customer_id, bill_no, date, payment_method, vehicle_no, delivery_address, notes, subtotal, discount, tax, transport_charges, round_off, total, paid, due, status, created_by) VALUES
(1, 3, 'RP/BILL/2026/001', '2026-10-05', 'Bank', 'TN-11-AB-4050', 'Site: Villa 14, OMR Navalur, Chennai', 'Living room and lobby flooring supply', 29250.00, 500.00, 5175.00, 1500.00, 0.00, 35425.00, 20000.00, 15425.00, 'Partly paid', 1),
(2, 4, 'RP/BILL/2026/002', '2026-10-08', 'UPI', 'Auto TN-09-Q-2819', 'Flat 4B, Shanthi Colony, Anna Nagar', 'Italian Statuario kitchen counter top', 11600.00, 200.00, 2052.00, 500.00, 0.00, 13952.00, 13952.00, 0.00, 'Paid', 1);

INSERT INTO sale_items (id, sale_id, product_id, qty, unit, rate, discount, tax_percent, tax_amount, total) VALUES
(1, 1, 1, 150.00, 'sq.ft', 195.00, 500.00, 18.00, 5175.00, 33925.00),
(2, 2, 2, 20.00, 'sq.ft', 580.00, 200.00, 18.00, 2052.00, 13452.00);

INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, remarks) VALUES
(1, 'sale', -150.00, 'sales', 1, '2026-10-05', 'Sales Bill RP/BILL/2026/001 to Anand Builders'),
(2, 'sale', -20.00, 'sales', 2, '2026-10-08', 'Sales Bill RP/BILL/2026/002 to Kavitha Interiors');

-- 9. Sample Damage Entry
INSERT INTO damages (id, date, product_id, qty, reason, cost_value, remarks, created_by) VALUES
(1, '2026-10-06', 7, 15.00, 'Broken in transit', 6750.00, 'Unloading crane sling slip caused cracked corner slabs', 4);

INSERT INTO stock_movements (product_id, type, qty, reference_type, reference_id, date, remarks) VALUES
(7, 'damage', -15.00, 'damages', 1, '2026-10-06', 'Broken in transit - Crane unloading slip');

-- 10. Sample Daybook Entries
INSERT INTO daybook (id, date, time, type, category_id, sub_category_id, method, cheque_date, cheque_status, bank_account_id, document_no, narration, to_be_paid, paid, excess, source_type, source_id, created_by) VALUES
(1, '2026-10-01', '11:30:00', 'outward', NULL, NULL, 'RTGS-NEFT', NULL, 'cleared', 2, 'RAJ/INV/8819', 'Payment to Rajasthan Granites for Inv RAJ/INV/8819', 84920.00, 50000.00, 0.00, 'purchase', 1, 1),
(2, '2026-10-05', '14:15:00', 'inward', 20, NULL, 'Bank', NULL, 'cleared', 2, 'RP/BILL/2026/001', 'Advance received from Anand Builders for Bill RP/BILL/2026/001', 35425.00, 20000.00, 0.00, 'sale', 1, 1),
(3, '2026-10-07', '16:00:00', 'outward', 12, NULL, 'Cash', NULL, 'cleared', 1, 'VCH-EXP-01', 'Crane unloading charges for granite truckload', 3500.00, 3500.00, 0.00, 'expense', NULL, 1),
(4, '2026-10-08', '17:20:00', 'inward', 20, NULL, 'UPI', NULL, 'cleared', 2, 'RP/BILL/2026/002', 'Full payment received from Kavitha Interiors via GPay', 13952.00, 13952.00, 0.00, 'sale', 2, 1);
