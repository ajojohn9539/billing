-- ====================================================================
-- SEED DATA FOR BILLING SOFTWARE DEMONSTRATION
-- ====================================================================

-- 1. Default Company Profile
INSERT OR REPLACE INTO settings (
    id, company_name, tagline, email, phone, address, tax_id, 
    currency_symbol, currency_code, invoice_prefix, default_tax_rate, 
    payment_terms, bank_name, bank_account_no, bank_routing_no, notes
) VALUES (
    1,
    'Apex Technologies Inc.',
    'Next-Gen Cloud & Enterprise Solutions',
    'invoicing@apextech.io',
    '+1 (555) 389-0192',
    '742 Evergreen Terrace, Suite 500, San Francisco, CA 94107',
    'TAX-US-94817293',
    '$',
    'USD',
    'INV-2026-',
    10.0,
    'Payment due within 15 days of issue date. Late payments incur a 1.5% fee.',
    'Silicon Valley National Bank',
    'SVB-8839201948',
    'ROUT-12100035',
    'Thank you for partnering with Apex Technologies. Wire payments must reference Invoice Number.'
);

-- 2. Customers
INSERT OR IGNORE INTO customers (id, name, company_name, email, phone, billing_address, tax_id, notes) VALUES
(1, 'Sarah Jenkins', 'Quantum Dynamics LLC', 'sarah.j@quantumdyn.com', '+1 (555) 492-1102', '450 Innovation Parkway, Austin, TX 78701', 'TX-883910', 'Key enterprise customer, net-30 terms'),
(2, 'Marcus Vance', 'Vance & Sterling Media', 'marcus@vancemedia.co', '+1 (555) 721-3944', '120 Madison Avenue, New York, NY 10016', 'NY-992014', 'Media production and digital assets partner'),
(3, 'Elena Rostova', 'AeroFlow Engineering', 'elena.r@aeroflow.de', '+1 (555) 603-8821', '88 Aero Blvd, Suite 200, Seattle, WA 98101', 'WA-771829', 'Aerospace engineering consultancy'),
(4, 'David Chen', 'OmniPay FinTech Labs', 'dchen@omnipaylabs.io', '+1 (555) 314-9900', '300 Montgomery St, San Francisco, CA 94104', 'CA-102938', 'Fast-growing fintech client'),
(5, 'Amara Diallo', 'Sahara Solar Solutions', 'amara@saharasolar.org', '+1 (555) 882-7491', '1400 Desert View Dr, Phoenix, AZ 85001', 'AZ-556182', 'Renewable energy infrastructure provider');

-- 3. Products / Services
INSERT OR IGNORE INTO products (id, name, sku, description, unit_price, tax_rate, unit, stock_quantity, category) VALUES
(1, 'Enterprise Cloud Architecture', 'SRV-CLOUD-01', 'Full-stack cloud infrastructure design, AWS/GCP migration, high availability setup', 2500.00, 10.0, 'project', 50, 'Consulting'),
(2, 'Custom Web Application Dev', 'DEV-WEB-APP', 'Full-stack React & Python modern software engineering per sprint', 3800.00, 10.0, 'sprint', 40, 'Development'),
(3, 'UI/UX Design Sprint', 'DSN-SPRINT', 'Design thinking workshop, wireframes, high-fidelity prototypes in Figma', 1800.00, 10.0, 'sprint', 30, 'Design'),
(4, 'Cybersecurity Audit & Pentest', 'SEC-AUDIT-01', 'Comprehensive application penetration testing and vulnerability mitigation report', 2200.00, 10.0, 'audit', 20, 'Security'),
(5, 'Dedicated High-Availability Hosting', 'HST-DEDICATED', 'Fully managed cloud cluster with 99.99% uptime SLA and 24/7 monitoring', 450.00, 10.0, 'month', 100, 'Hosting'),
(6, '24/7 Priority SLA Support', 'SUP-PRIORITY', 'Guaranteed 1-hour response SLA, bug fixing, and continuous health checks', 750.00, 10.0, 'month', 50, 'Support'),
(7, 'API Integration & Middleware', 'DEV-API-INT', 'Third-party payment gateways, ERP, CRM webhook data sync pipelines', 1200.00, 10.0, 'integration', 35, 'Development'),
(8, 'Database Optimization & Tuning', 'DB-OPT-01', 'SQL query tuning, index restructuring, and latency reduction', 1500.00, 10.0, 'service', 25, 'Database');

-- 4. Sample Invoices
-- Invoice 1: Paid in Full
INSERT OR IGNORE INTO invoices (
    id, invoice_number, customer_id, issue_date, due_date,
    subtotal, tax_total, discount_total, grand_total, paid_amount, balance_due,
    status, notes, terms
) VALUES (
    1, 'INV-2026-0001', 1, '2026-09-01', '2026-09-16',
    5000.00, 500.00, 200.00, 5300.00, 5300.00, 0.00,
    'paid', 'Phase 1 Cloud infrastructure migration completed on schedule.', 'Net 15 days.'
);

-- Items for Invoice 1
INSERT OR IGNORE INTO invoice_items (id, invoice_id, product_id, item_name, description, quantity, unit_price, tax_rate, tax_amount, total) VALUES
(1, 1, 1, 'Enterprise Cloud Architecture', 'AWS architecture design and migration', 2, 2500.00, 10.0, 500.00, 5000.00);

-- Payment for Invoice 1
INSERT OR IGNORE INTO payments (id, invoice_id, amount, payment_date, payment_method, transaction_reference, notes) VALUES
(1, 1, 5300.00, '2026-09-10', 'Bank Transfer', 'WIRE-TX-9902184', 'Full wire payment received');

-- Invoice 2: Partially Paid
INSERT OR IGNORE INTO invoices (
    id, invoice_number, customer_id, issue_date, due_date,
    subtotal, tax_total, discount_total, grand_total, paid_amount, balance_due,
    status, notes, terms
) VALUES (
    2, 'INV-2026-0002', 2, '2026-09-15', '2026-09-30',
    5600.00, 560.00, 0.00, 6160.00, 3000.00, 3160.00,
    'partially_paid', 'Digital asset workflow & UI sprint. 50% advance received.', 'Net 15 days.'
);

INSERT OR IGNORE INTO invoice_items (id, invoice_id, product_id, item_name, description, quantity, unit_price, tax_rate, tax_amount, total) VALUES
(2, 2, 2, 'Custom Web Application Dev', 'Client portal sprint 1', 1, 3800.00, 10.0, 380.00, 3800.00),
(3, 2, 3, 'UI/UX Design Sprint', 'Figma interactive prototypes', 1, 1800.00, 10.0, 180.00, 1800.00);

INSERT OR IGNORE INTO payments (id, invoice_id, amount, payment_date, payment_method, transaction_reference, notes) VALUES
(2, 2, 3000.00, '2026-09-18', 'Credit Card', 'STRIPE-CH-382910', '50% initial milestone deposit');

-- Invoice 3: Pending
INSERT OR IGNORE INTO invoices (
    id, invoice_number, customer_id, issue_date, due_date,
    subtotal, tax_total, discount_total, grand_total, paid_amount, balance_due,
    status, notes, terms
) VALUES (
    3, 'INV-2026-0003', 3, '2026-10-01', '2026-10-20',
    3700.00, 370.00, 100.00, 3970.00, 0.00, 3970.00,
    'pending', 'Security audit & SQL performance tuning for AeroFlow.', 'Due by October 20, 2026.'
);

INSERT OR IGNORE INTO invoice_items (id, invoice_id, product_id, item_name, description, quantity, unit_price, tax_rate, tax_amount, total) VALUES
(4, 3, 4, 'Cybersecurity Audit & Pentest', 'API penetration testing report', 1, 2200.00, 10.0, 220.00, 2200.00),
(5, 3, 8, 'Database Optimization & Tuning', 'Postgres query indexing & query plan speedups', 1, 1500.00, 10.0, 150.00, 1500.00);

-- Invoice 4: Overdue
INSERT OR IGNORE INTO invoices (
    id, invoice_number, customer_id, issue_date, due_date,
    subtotal, tax_total, discount_total, grand_total, paid_amount, balance_due,
    status, notes, terms
) VALUES (
    4, 'INV-2026-0004', 4, '2026-08-15', '2026-09-01',
    4900.00, 490.00, 0.00, 5390.00, 0.00, 5390.00,
    'overdue', 'OmniPay integration sprint. Payment reminder sent.', 'Net 15 days. OVERDUE.'
);

INSERT OR IGNORE INTO invoice_items (id, invoice_id, product_id, item_name, description, quantity, unit_price, tax_rate, tax_amount, total) VALUES
(6, 4, 2, 'Custom Web Application Dev', 'Custom webhook receiver & reconciliation engine', 1, 3800.00, 10.0, 380.00, 3800.00),
(7, 4, 7, 'API Integration & Middleware', 'OmniPay gateway connection', 1, 1100.00, 10.0, 110.00, 1100.00);

-- Invoice 5: Paid
INSERT OR IGNORE INTO invoices (
    id, invoice_number, customer_id, issue_date, due_date,
    subtotal, tax_total, discount_total, grand_total, paid_amount, balance_due,
    status, notes, terms
) VALUES (
    5, 'INV-2026-0005', 5, '2026-09-25', '2026-10-10',
    2400.00, 240.00, 0.00, 2640.00, 2640.00, 0.00,
    'paid', 'Hosting SLA & support for September 2026.', 'Net 15 days.'
);

INSERT OR IGNORE INTO invoice_items (id, invoice_id, product_id, item_name, description, quantity, unit_price, tax_rate, tax_amount, total) VALUES
(8, 5, 5, 'Dedicated High-Availability Hosting', 'Q3 Multi-zone hosting cluster', 2, 450.00, 10.0, 90.00, 900.00),
(9, 5, 6, '24/7 Priority SLA Support', '2 months support SLA', 2, 750.00, 10.0, 150.00, 1500.00);

INSERT OR IGNORE INTO payments (id, invoice_id, amount, payment_date, payment_method, transaction_reference, notes) VALUES
(3, 5, 2640.00, '2026-10-05', 'Bank Transfer', 'WIRE-AZ-881902', 'Settled via automated ACH wire');
