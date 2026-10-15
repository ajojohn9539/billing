import os
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_pdf(output_path):
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    primary_color = colors.HexColor('#0369a1') # JR Blue
    dark_slate = colors.HexColor('#0f172a')
    muted_slate = colors.HexColor('#475569')
    light_bg = colors.HexColor('#f8fafc')
    border_color = colors.HexColor('#cbd5e1')
    accent_green = colors.HexColor('#059669')

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        alignment=1, # Center
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=dark_slate,
        alignment=1,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=dark_slate,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=dark_slate,
        spaceAfter=6
    )

    code_style = ParagraphStyle(
        'DocCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#0284c7'),
        backColor=colors.HexColor('#f1f5f9'),
        borderPadding=4,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=dark_slate,
        leftIndent=15,
        spaceAfter=3
    )

    elements = []

    # Logo if available
    logo_path = Path(__file__).resolve().parent / "static" / "logo.jpg"
    if logo_path.exists():
        img = Image(str(logo_path), width=1.4*inch, height=1.4*inch)
        img.hAlign = 'CENTER'
        elements.append(img)
        elements.append(Spacer(1, 8))

    elements.append(Paragraph("JR MARBLES & GRANITES", title_style))
    elements.append(Paragraph("CHENGAMANADU, KOTTARAKKARA, KERALA • GSTIN: 32FGZPR5431L1ZL<br/><b>System Architecture, GST Invoicing & Automated Backup Manual</b>", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=14))

    # Section 1: Executive Overview
    elements.append(Paragraph("1. Business Profile & System Master Data", h1_style))
    elements.append(Paragraph("This documentation outlines the complete operational, invoicing, data import, and automated daily backup architecture for <b>JR Marbles & Granites (Chengamanadu)</b>.", body_style))

    biz_table_data = [
        [Paragraph("<b>Business Name</b>", body_style), Paragraph("JR MARBLES & GRANITES", body_style)],
        [Paragraph("<b>Location / Address</b>", body_style), Paragraph("Chengamanadu, Kottarakkara, Kollam District, Kerala - 691557", body_style)],
        [Paragraph("<b>Contact Mobiles</b>", body_style), Paragraph("9460110878, 8504882265", body_style)],
        [Paragraph("<b>GSTIN (Kerala Code 32)</b>", body_style), Paragraph("<b>32FGZPR5431L1ZL</b>", body_style)],
        [Paragraph("<b>Indian Bank Account</b>", body_style), Paragraph("Account No: <b>7944010222</b> (Current A/c, Chengamanadu Branch)", body_style)],
        [Paragraph("<b>Bank IFSC Code</b>", body_style), Paragraph("<b>IDIB 000C046</b>", body_style)],
        [Paragraph("<b>Invoice Series Prefix</b>", body_style), Paragraph("<b>JR26-27 </b> (e.g., JR26-27 014)", body_style)],
        [Paragraph("<b>Primary Stone HSN Code</b>", body_style), Paragraph("<b>6802</b> (Worked monumental or building stone / Granite slabs)", body_style)],
        [Paragraph("<b>Default GST Rate</b>", body_style), Paragraph("18% (CGST 9% + SGST 9% within Kerala State)", body_style)],
        [Paragraph("<b>Jurisdiction</b>", body_style), Paragraph("Kottarakkara Jurisdiction Only", body_style)]
    ]
    t1 = Table(biz_table_data, colWidths=[2.2*inch, 4.8*inch])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t1)
    elements.append(Spacer(1, 10))

    # Section 2: User Access & Roles
    elements.append(Paragraph("2. User Accounts & Access Control", h1_style))
    elements.append(Paragraph("The system features Role-Based Access Control (RBAC) protecting all billing and accounting modules with session tokens:", body_style))
    
    users_data = [
        ["Role / Designation", "Username / Login ID", "Default Password", "Permissions"],
        ["Owner / Admin", "admin (or admin@jrmarbles.com)", "admin123", "Full unrestricted administrative access, settings, user management"],
        ["Accountant", "ganesh (or ganesh@jrmarbles.com)", "ganesh123", "Daybook, bank accounts, ledgers, tax reports, profit & loss"],
        ["Sales Counter", "muthu (or muthu@jrmarbles.com)", "muthu123", "GST billing, sales invoices, customer receipts, quotes"],
        ["Yard & Store Keeper", "ramesh (or ramesh@jrmarbles.com)", "ramesh123", "Stock inventory, quarry purchases, damage entry, low-stock reports"]
    ]
    t2 = Table([[Paragraph(f"<b>{c}</b>" if r==0 else c, body_style) for c in row] for r, row in enumerate(users_data)], colWidths=[1.6*inch, 2.1*inch, 1.2*inch, 2.1*inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e0f2fe')),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 12))

    # Section 3: Data Import Module
    elements.append(Paragraph("3. Previous Date Data Import Module (XML, Excel, SQL)", h1_style))
    elements.append(Paragraph("A dedicated import module allows backfilling or importing historical records from legacy software, previous dates, or external spreadsheets:", body_style))
    elements.append(Paragraph("• <b>XML Import (.xml):</b> Standard hierarchical format supporting &lt;sales&gt;, &lt;products&gt;, &lt;contacts&gt;, and &lt;daybook&gt; tags.", bullet_style))
    elements.append(Paragraph("• <b>Excel / CSV Import (.xlsx, .csv):</b> Multi-column tabular format automatically reading columns: Bill No, Date, Customer, Vehicle No, Quantity, Rate, Total.", bullet_style))
    elements.append(Paragraph("• <b>SQL Dump Import (.sql):</b> Standard SQL script with INSERT statements directly executed into Supabase PostgreSQL.", bullet_style))
    elements.append(Paragraph("• <b>Date Override:</b> When importing, users can preserve the original transaction dates in the file or apply a target previous date.", bullet_style))

    # Section 4: Automated Cron Backup System
    elements.append(Paragraph("4. Automated Daily Cron Backup to Email & Google Drive", h1_style))
    elements.append(Paragraph("To ensure zero data loss, the system includes an automated daily backup daemon with flexible configuration:", body_style))
    
    backup_features = [
        [Paragraph("<b>Target Recipient Email</b>", body_style), Paragraph("<b>ajojohn.dev@gmail.com</b> (configurable dynamically in the UI)", body_style)],
        [Paragraph("<b>Default Backup Schedule</b>", body_style), Paragraph("<b>0 23 * * *</b> (Daily at 11:00 PM IST)", body_style)],
        [Paragraph("<b>Backup File Format</b>", body_style), Paragraph("<b>XML (.xml)</b> (Structured standard with metadata, sales, inventory, and daybook)", body_style)],
        [Paragraph("<b>Google Drive Integration</b>", body_style), Paragraph("Uploads or syncs XML backup directly to designated Google Drive folder / Webhook", body_style)],
        [Paragraph("<b>Auto-Clear Previous Data</b>", body_style), Paragraph("Optional safety feature to archive and clear transactions prior to a threshold date", body_style)],
        [Paragraph("<b>Manual One-Click Trigger</b>", body_style), Paragraph("Instant 'Run Backup Now' button in the dashboard to generate and send backups immediately", body_style)]
    ]
    t3 = Table(backup_features, colWidths=[2.2*inch, 4.8*inch])
    t3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t3)
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("<b>Linux / Server Crontab Installation:</b>", h2_style))
    elements.append(Paragraph("To enable daily cron execution on Hostinger, VPS, or local Linux servers, add this entry to crontab (<code>crontab -e</code>):", body_style))
    elements.append(Paragraph("0 23 * * * cd /var/www/html/billing-app/backend && ./venv/bin/python cron_backup.py >> /var/log/jr_backup.log 2>&1", code_style))

    # Section 5: XML Data Schema Specification
    elements.append(Paragraph("5. XML Backup & Import Specification", h1_style))
    elements.append(Paragraph("The standard XML structure for daily backups and historical imports follows this schema:", body_style))
    xml_sample = """&lt;jr_marbles_backup version="1.0" export_date="2026-10-15"&gt;
  &lt;metadata&gt;
    &lt;company&gt;JR MARBLES &amp; GRANITES&lt;/company&gt;
    &lt;gstin&gt;32FGZPR5431L1ZL&lt;/gstin&gt;
    &lt;bank_account&gt;7944010222 (INDIAN BANK)&lt;/bank_account&gt;
  &lt;/metadata&gt;
  &lt;sales&gt;
    &lt;sale bill_no="JR26-27 014" date="2026-06-30" vehicle_no="KL 16 G 2675" customer="Binu" total="2655.00" status="Paid"&gt;
      &lt;item product="Regular Granite slab" hsn="6802" qty="45" rate="50" tax_percent="18" total="2655.00"/&gt;
    &lt;/sale&gt;
  &lt;/sales&gt;
&lt;/jr_marbles_backup&gt;"""
    elements.append(Paragraph(xml_sample.replace('\n', '<br/>').replace(' ', '&nbsp;'), code_style))

    # Section 6: GST Tax Invoice Specifications
    elements.append(Paragraph("6. GST Tax Invoice Compliance (Kerala State Code 32)", h1_style))
    elements.append(Paragraph("Every printed invoice follows Kerala state GST compliance with dual CGST 9% and SGST 9% taxes for intra-state supply, complete with reverse charge declarations, vehicle transport numbers, and Indian Bank payment details.", body_style))

    # Footer note
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1, color=border_color, spaceBefore=4, spaceAfter=8))
    elements.append(Paragraph("<b>JR Marbles & Granites</b> • Chengamanadu, Kottarakkara, Kerala • System Manual v1.2", ParagraphStyle('Foot', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=8, textColor=muted_slate, alignment=1)))

    doc.build(elements)
    print(f"PDF generated successfully at {output_path}")

if __name__ == '__main__':
    out_dir = Path(__file__).resolve().parent / "static"
    out_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = out_dir / "JR_Marbles_Billing_and_Backup_Documentation.pdf"
    generate_pdf(pdf_path)

    pub_dir = Path(__file__).resolve().parent.parent / "frontend" / "public"
    pub_dir.mkdir(parents=True, exist_ok=True)
    generate_pdf(pub_dir / "JR_Marbles_Billing_and_Backup_Documentation.pdf")
