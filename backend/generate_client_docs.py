import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_pdf():
    base_dir = Path(__file__).resolve().parent
    static_dir = base_dir / "static"
    static_dir.mkdir(parents=True, exist_ok=True)
    
    frontend_public = base_dir.parent / "frontend" / "public"
    frontend_public.mkdir(parents=True, exist_ok=True)
    
    pdf_filename = "Billora_Client_Stock_and_Operations_Guide.pdf"
    output_path = static_dir / pdf_filename
    frontend_path = frontend_public / pdf_filename

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0f172a'),
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0284c7'),
        alignment=0
    )
    h1_style = ParagraphStyle(
        'ChapterH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=6
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=8,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    bullet_style = ParagraphStyle(
        'BulletText',
        parent=body_style,
        leftIndent=12,
        spaceBefore=2,
        spaceAfter=2
    )
    code_style = ParagraphStyle(
        'CodeSnippet',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#094067'),
        backColor=colors.HexColor('#f1f5f9'),
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6
    )

    story = []

    # Header with Logo & Brand
    logo_path = static_dir / "logo.jpg"
    header_data = []
    
    brand_p = Paragraph(
        "<b>BILLORA ERP</b><br/><font size='10' color='#64748b'>Smart GST Billing & Stone Inventory ERP System</font>",
        title_style
    )
    
    if logo_path.exists():
        img = Image(str(logo_path), width=1.1*inch, height=1.1*inch)
        header_table = Table([[img, brand_p]], colWidths=[1.3*inch, 5.7*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(header_table)
    else:
        story.append(brand_p)

    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284c7'), spaceBefore=6, spaceAfter=12))

    # Doc Title
    story.append(Paragraph("Client Operations Manual: How to Add Stock & Manage Inventory", title_style))
    story.append(Paragraph("Official Guide for Registering Purchasers (Suppliers), General Goods & Stone Items (Granite & Marble)", subtitle_style))
    story.append(Spacer(1, 10))

    # Introduction
    intro_text = (
        "<b>Welcome to Billora!</b> This operations manual walks your administrative and inventory staff through "
        "the standard operating procedures for cataloging goods, registering wholesale stone purchasers/suppliers, "
        "and properly structuring dimensional stone items (Granite slabs, Marble blocks, Quartz, and Adhesives). "
        "Proper data entry ensures seamless billing, automated stock deductions, and real-time Daybook accounting."
    )
    story.append(Paragraph(intro_text, body_style))
    story.append(Spacer(1, 10))

    # --- CHAPTER 1: ADDING PURCHASERS (SUPPLIERS) ---
    story.append(Paragraph("1. How to Add Purchasers / Stone Suppliers", h1_style))
    p1_desc = (
        "Purchasers (Suppliers / Quarry Vendors) supply raw granite blocks, gangsaw polished slabs, and consumables. "
        "Registering their profile accurately establishes their accounts payable ledger and enables GST Input Tax Credit (ITC)."
    )
    story.append(Paragraph(p1_desc, body_style))
    story.append(Spacer(1, 4))

    p1_steps = [
        "<b>Step 1:</b> Navigate to the top navigation bar and click <b>'Contacts'</b>.",
        "<b>Step 2:</b> Click the blue <b>'+ Add Contact'</b> button in the top right corner.",
        "<b>Step 3:</b> Set <b>Contact Type</b> to <b>'Supplier'</b> (or <i>'Both'</i> if they also purchase goods from you).",
        "<b>Step 4:</b> Enter the Supplier's <b>Full Name</b> and <b>Company Name</b> (e.g. <i>'Rajasthan Granites & Quarry Mines Ltd'</i>).",
        "<b>Step 5:</b> Provide primary <b>Mobile / Phone</b> and <b>Email</b> for purchase orders and payment receipts.",
        "<b>Step 6:</b> Enter the Supplier's <b>15-digit GSTIN</b> (e.g. <i>08AABCR1234F1Z5</i>). This is vital for GST 3B tax reconciliation.",
        "<b>Step 7:</b> Specify the <b>Quarry / Yard Address, City, and State</b>.",
        "<b>Step 8:</b> If there is an existing credit balance from prior transactions, enter it into <b>Opening Balance</b> with <b>'To Pay'</b>.",
        "<b>Step 9:</b> Click <b>'Save Contact'</b>. The supplier is now ready to receive Purchase Bills."
    ]
    for step in p1_steps:
        story.append(Paragraph(f"• {step}", bullet_style))
    story.append(Spacer(1, 8))

    # Supplier Table Example
    sup_data = [
        ["Field", "Example Value", "Description / Purpose"],
        ["Contact Type", "Supplier", "Identifies entity for purchase vouchers & payables"],
        ["Name", "Rajasthan Granites Ltd", "Quarry or distributor company name"],
        ["GSTIN", "08AABCR1234F1Z5", "Required for GST B2B purchase bills"],
        ["Balance Type", "To Pay", "Initial outstanding payable to vendor"],
        ["Credit Limit", "₹ 5,00,000", "Maximum credit threshold before payment block"]
    ]
    t_sup = Table(sup_data, colWidths=[1.8*inch, 2.3*inch, 2.9*inch])
    t_sup.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white])
    ]))
    story.append(t_sup)
    story.append(Spacer(1, 14))

    # --- CHAPTER 2: ADDING GENERAL ITEMS ---
    story.append(Paragraph("2. How to Add General Inventory Items", h1_style))
    p2_desc = (
        "General items include consumables, chemicals, tools, epoxy sealants, diamond blades, and hardware accessories. "
        "These are typically sold in units of <i>piece, box, kg, or packet</i> rather than square feet."
    )
    story.append(Paragraph(p2_desc, body_style))
    story.append(Spacer(1, 4))

    p2_steps = [
        "<b>Step 1:</b> Click <b>'Products'</b> in the top navigation bar.",
        "<b>Step 2:</b> Click the <b>'+ Add Product'</b> button.",
        "<b>Step 3:</b> Enter the <b>Product Name</b> (e.g. <i>'Tenax Epoxy Stone Adhesive 5kg'</i>).",
        "<b>Step 4:</b> Provide a unique <b>Product Code / SKU</b> (e.g. <i>'BIL-ADH-005'</i>). If left blank, Billora auto-generates one.",
        "<b>Step 5:</b> Select or type the <b>Category</b> (e.g. <i>'Adhesives & Chemicals'</i>).",
        "<b>Step 6:</b> Choose the <b>Unit</b> of measurement: select <b>'box'</b>, <b>'piece'</b>, or <b>'kg'</b>.",
        "<b>Step 7:</b> Set the <b>HSN Code</b> (e.g. <i>'3506'</i> for prepared glues & adhesives).",
        "<b>Step 8:</b> Enter <b>Purchase Price</b> (vendor cost) and <b>Selling Price</b> (retail/wholesale price before or after tax).",
        "<b>Step 9:</b> Set <b>Tax Percent</b> to <b>18.0%</b> (Standard GST rate).",
        "<b>Step 10:</b> Enter <b>Opening Stock</b> (current inventory on hand) and <b>Minimum Alert Stock</b>.",
        "<b>Step 11:</b> Click <b>'Save Product'</b>."
    ]
    for step in p2_steps:
        story.append(Paragraph(f"• {step}", bullet_style))
    story.append(Spacer(1, 14))

    # --- CHAPTER 3: ADDING STONE ITEMS (GRANITE & MARBLE) ---
    story.append(Paragraph("3. How to Add Stone Items (Granite, Marble & Natural Slabs)", h1_style))
    p3_desc = (
        "Natural stone items (Granite, Marble, Quartz, Sandstone) have unique industry attributes: "
        "they are measured in <b>Square Feet (Sq.Ft)</b>, categorized under <b>HSN 6802</b>, "
        "and vary by thickness, polishing finish, and quarry origin."
    )
    story.append(Paragraph(p3_desc, body_style))
    story.append(Spacer(1, 4))

    p3_steps = [
        "<b>Step 1:</b> Click <b>'Products'</b> -> <b>'+ Add Product'</b>.",
        "<b>Step 2:</b> Enter the authentic <b>Stone Name</b> (e.g. <i>'Black Galaxy Granite Slab'</i> or <i>'Italian White Carrara Marble'</i>).",
        "<b>Step 3:</b> Set <b>Category</b> to <b>'Granite'</b> or <b>'Marble'</b>.",
        "<b>Step 4:</b> Set <b>Unit</b> to <b>'sqft'</b> (Crucial: all sales rate math calculates per sq.ft).",
        "<b>Step 5:</b> Enter <b>Size / Thickness</b> in the description field (e.g. <i>'18mm Premium Gangsaw Polished Slabs'</i> or <i>'20mm Honed Slabs'</i>).",
        "<b>Step 6:</b> Enter <b>HSN Code: '6802'</b> (Worked monumental or building stone & articles thereof).",
        "<b>Step 7:</b> Enter <b>Purchase Price (₹/sqft)</b>: Quarry cost per square foot.",
        "<b>Step 8:</b> Enter <b>Selling Price (₹/sqft)</b>: Base billing rate per square foot.",
        "<b>Step 9:</b> Set <b>Tax Rate</b> to <b>18.0%</b> (standard GST for processed marble/granite slabs).",
        "<b>Step 10:</b> Enter <b>Opening Stock in Total Sq.Ft</b>: e.g. <i>1200.0</i> sqft.",
        "<b>Step 11:</b> Click <b>'Save Product'</b>."
    ]
    for step in p3_steps:
        story.append(Paragraph(f"• {step}", bullet_style))
    story.append(Spacer(1, 8))

    # Stone Formula Box
    formula_text = (
        "<b>Square Feet (Sq.Ft) Calculation Formula for Slabs:</b><br/>"
        "<code>Sq.Ft per Piece = (Length in inches × Height in inches) ÷ 144</code><br/>"
        "<code>Total Billable Sq.Ft = Sq.Ft per Piece × Number of Slabs</code><br/>"
        "<i>Example: A slab of 108 inches (9 ft) × 36 inches (3 ft) = 3,888 ÷ 144 = 27.0 Sq.Ft. If customer buys 10 slabs, Quantity = 270.0 sqft.</i>"
    )
    story.append(Paragraph(formula_text, code_style))
    story.append(Spacer(1, 8))

    # Stone Items Comparison Table
    stone_data = [
        ["Product Name", "Category", "Unit", "Size / Thickness", "HSN", "Rate (₹/sqft)", "Opening Stock"],
        ["Black Galaxy Granite", "Granite", "sqft", "18mm Polished Slabs", "6802", "₹ 175.00", "1,200 sqft"],
        ["Italian Carrara Marble", "Marble", "sqft", "20mm Imported Slabs", "6802", "₹ 350.00", "800 sqft"],
        ["Tan Brown Granite", "Granite", "sqft", "18mm Polished Slabs", "6802", "₹ 98.00", "1,500 sqft"],
        ["Kishangarh Wonder White", "Marble", "sqft", "16mm Mirror Polished", "6802", "₹ 85.00", "1,000 sqft"]
    ]
    t_stone = Table(stone_data, colWidths=[1.6*inch, 0.9*inch, 0.6*inch, 1.4*inch, 0.6*inch, 1.0*inch, 0.9*inch])
    t_stone.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#f8fafc'), colors.white])
    ]))
    story.append(t_stone)
    story.append(Spacer(1, 14))

    # --- CHAPTER 4: ADMIN PANEL & DYNAMIC CLIENT FIELDS ---
    story.append(Paragraph("4. Admin Panel & Dynamic Client Fields Guide", h1_style))
    p4_desc = (
        "In Billora, specialized administrative modules (Backup & Migration, Dynamic Client Fields, Data Reset) "
        "are strictly restricted to the <b>Admin Panel</b> to protect operational security. Non-admin staff "
        "(Cashiers, Yard Keepers) have view and billing access only."
    )
    story.append(Paragraph(p4_desc, body_style))
    story.append(Spacer(1, 4))

    p4_steps = [
        "<b>Configuring Dynamic Client Fields:</b> In the Admin Panel, select <b>'Dynamic Client Fields'</b> to add custom properties for your stone clients.",
        "<b>Common Field Examples:</b> <i>'Site Delivery Route'</i> (text), <i>'Alternate WhatsApp Phone'</i> (text), <i>'Architect / Contractor Name'</i> (text), <i>'Payment Credit Period'</i> (number), <i>'Preferred Stone Finish'</i> (select dropdown).",
        "<b>Automatic Form Binding:</b> Once added in the Admin Panel, all client creation forms dynamically render these fields.",
        "<b>Automated Daily XML Backup:</b> Configured to send an encrypted XML database snapshot daily at 11:00 PM to <code>ajojohn.dev@gmail.com</code> and sync with Google Drive."
    ]
    for step in p4_steps:
        story.append(Paragraph(f"• {step}", bullet_style))
    story.append(Spacer(1, 14))

    # --- CHAPTER 5: SALES BILLING & DAYBOOK FLOW ---
    story.append(Paragraph("5. Invoicing & Automated Daybook Accounting Flow", h1_style))
    p5_desc = (
        "Every time a sales bill is generated in Billora, the ERP executes three simultaneous automated updates:"
    )
    story.append(Paragraph(p5_desc, body_style))
    story.append(Spacer(1, 4))

    p5_steps = [
        "<b>1. Stock Reduction:</b> The exact square footage or unit count is instantly decremented from product current stock and logged into <code>stock_movements</code>.",
        "<b>2. Customer Balance:</b> If the bill is partly paid or credit, the unpaid balance is automatically added to the customer's receivable balance.",
        "<b>3. Daybook Inward Entry:</b> All collected payments (Cash, RTGS, UPI, Cheque) post immediately into the <b>Daybook</b>, maintaining real-time daily cash and bank balances."
    ]
    for step in p5_steps:
        story.append(Paragraph(f"• {step}", bullet_style))
    story.append(Spacer(1, 14))

    # Signoff footer
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceBefore=8, spaceAfter=8))
    footer_text = (
        "<b>Billora Billing & Inventory System</b> • Powered by Advanced ERP Engine<br/>"
        "Chengamanadu, Kottarakkara, Kerala • Support: admin@billora.com • Hotline: +91 9460110878"
    )
    story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=body_style, alignment=1, textColor=colors.HexColor('#64748b'))))

    doc.build(story)
    
    # Also copy to frontend public directory
    import shutil
    shutil.copy2(str(output_path), str(frontend_path))
    print(f"Documentation PDF generated successfully at:\n- {output_path}\n- {frontend_path}")

if __name__ == "__main__":
    generate_pdf()
