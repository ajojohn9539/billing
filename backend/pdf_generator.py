import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm

def number_to_words_inr(num):
    n = int(round(float(num or 0)))
    if n == 0:
        return "Rupees Zero Only"

    a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
         'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

    def in_words(val):
        if val < 20:
            return a[val]
        digit = val % 10
        return b[val // 10] + ((' ' + a[digit]) if digit else '')

    words = ""
    crore = n // 10000000
    rem = n % 10000000
    lakh = rem // 100000
    rem = rem % 100000
    thousand = rem // 1000
    rem = rem % 1000
    hundred = rem // 100
    rem = rem % 100

    if crore:
        words += in_words(crore) + " Crore "
    if lakh:
        words += in_words(lakh) + " Lakh "
    if thousand:
        words += in_words(thousand) + " Thousand "
    if hundred:
        words += in_words(hundred) + " Hundred "
    if rem:
        if words != "":
            words += "and "
        words += in_words(rem) + " "

    return "Rupees " + words.strip() + " Only"

def build_estimate_pdf(estimate: dict, items: list, company: dict = None, bank: dict = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    company = company or {}
    bank = bank or {}
    company_name = company.get("company_name", "BILLORA MARBLES & GRANITES")
    tagline = company.get("tagline", "Granite, Marble & Natural Stone Proforma Quotation")
    phone = company.get("phone", "+91 9460110878, 8504882265")
    address = company.get("address", "Chengamanadu, Kottarakkara, Kollam, Kerala - 691557")
    gstin = company.get("gstin", "32FGZPR5431L1ZL")

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    
    sub_title = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )
    
    badge_style = ParagraphStyle(
        'DocBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e40af'),
        alignment=1
    )

    body_bold = ParagraphStyle(
        'BodyB',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a')
    )
    
    body_reg = ParagraphStyle(
        'BodyR',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # 1. Company Header Banner
    story.append(Paragraph(f"<b>{company_name}</b>", title_style))
    story.append(Paragraph(f"{address} | Phone: {phone} | GSTIN: {gstin}", sub_title))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>ESTIMATION BILL / PRICE QUOTATION</b>", badge_style))
    story.append(Paragraph("<font color='#64748b' size='7'><i>(ESTIMATION ONLY - DOES NOT REFLECT STOCK OR ACCOUNTING LEDGER)</i></font>", sub_title))
    story.append(Spacer(1, 8))

    # 2. Meta Grid (Bill No, Date, Customer Details)
    est_no = estimate.get("estimate_no", "EST-001")
    est_date = str(estimate.get("date", datetime.now().strftime("%Y-%m-%d")))
    valid_until = str(estimate.get("valid_until", "15 Days"))
    cust_name = estimate.get("customer_name") or estimate.get("display_customer_name") or "Valued Client"
    cust_phone = estimate.get("customer_phone") or estimate.get("display_customer_phone") or "—"
    cust_addr = estimate.get("customer_address") or "—"
    cust_gstin = estimate.get("customer_gstin") or "—"

    meta_table_data = [
        [
            Paragraph("<b>CUSTOMER / CLIENT DETAILS</b>", body_bold),
            Paragraph("<b>ESTIMATION METADATA</b>", body_bold)
        ],
        [
            Paragraph(f"<b>Name:</b> {cust_name}<br/><b>Phone:</b> {cust_phone}<br/><b>Address:</b> {cust_addr}<br/><b>GSTIN:</b> {cust_gstin}", body_reg),
            Paragraph(f"<b>Estimate No:</b> <font color='#1e40af'><b>{est_no}</b></font><br/><b>Date:</b> {est_date}<br/><b>Valid Until:</b> {valid_until}<br/><b>Status:</b> {estimate.get('status', 'Draft')}", body_reg)
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[260, 260])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # 3. Items Table
    headers = ["S.No", "Stone / Slab Description", "HSN", "Size (LxH)", "Qty", "Rate (₹)", "GST%", "Total (₹)"]
    items_rows = [[Paragraph(f"<b>{h}</b>", body_bold) for h in headers]]

    for idx, it in enumerate(items, 1):
        name = it.get("item_name") or it.get("product_name") or "Stone Slab"
        desc = it.get("item_description", "")
        full_name = f"<b>{name}</b>" + (f"<br/><font size='7' color='#64748b'>{desc}</font>" if desc else "")
        hsn = it.get("hsn_code", "6802")
        dims = "—"
        if it.get("length_in") and it.get("height_in"):
            dims = f"{it['length_in']}x{it['height_in']} in"
            if it.get("pieces"):
                dims += f" ({it['pieces']} pcs)"
        qty_str = f"{float(it.get('qty', 0)):.2f} {it.get('unit', 'sq.ft')}"
        rate_str = f"{float(it.get('rate', 0)):.2f}"
        gst_str = f"{float(it.get('tax_percent', 18)):.1f}%"
        tot_str = f"{float(it.get('total', 0)):.2f}"

        items_rows.append([
            Paragraph(str(idx), body_reg),
            Paragraph(full_name, body_reg),
            Paragraph(str(hsn), body_reg),
            Paragraph(dims, body_reg),
            Paragraph(qty_str, body_reg),
            Paragraph(rate_str, body_reg),
            Paragraph(gst_str, body_reg),
            Paragraph(tot_str, body_bold)
        ])

    t_items = Table(items_rows, colWidths=[28, 160, 42, 65, 60, 55, 40, 70])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#0f172a')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
        ('ALIGN', (4,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 8))

    # 4. Totals & Bank Details Split Table
    subtotal = float(estimate.get("subtotal", 0))
    discount = float(estimate.get("discount", 0))
    tax = float(estimate.get("tax", 0))
    transport = float(estimate.get("transport_charges", 0))
    round_off = float(estimate.get("round_off", 0))
    grand_total = float(estimate.get("total", 0))

    bank_name = bank.get("bank_name", "INDIAN BANK")
    acc_name = bank.get("account_name", company_name)
    acc_no = bank.get("account_number", "50100456123489")
    ifsc = bank.get("ifsc_code", "IDIB000K123")
    branch = bank.get("branch", "Kottarakkara")

    words = number_to_words_inr(grand_total)

    terms_text = estimate.get("terms") or "1. Estimate valid for 15 days. 2. Stock and shade subject to availability. 3. Transportation extra. 4. Final measurements on actual slab dispatch."

    left_block = f"""
    <b>Total in Words:</b><br/>{words}<br/><br/>
    <b>Bank Details for Advance:</b><br/>
    Bank: <b>{bank_name}</b> | Branch: {branch}<br/>
    A/C Name: {acc_name}<br/>
    A/C No: <b>{acc_no}</b> | IFSC: <b>{ifsc}</b><br/><br/>
    <b>Terms & Conditions:</b><br/>
    <font size='7' color='#475569'>{terms_text.replace(chr(10), '<br/>')}</font>
    """

    right_rows = [
        [Paragraph("Subtotal Before Tax:", body_reg), Paragraph(f"₹ {subtotal:,.2f}", body_reg)],
        [Paragraph("Discount:", body_reg), Paragraph(f"- ₹ {discount:,.2f}", body_reg)],
        [Paragraph("GST Tax Amount (18%):", body_reg), Paragraph(f"₹ {tax:,.2f}", body_reg)],
        [Paragraph("Transport Charges:", body_reg), Paragraph(f"₹ {transport:,.2f}", body_reg)],
        [Paragraph("Round Off:", body_reg), Paragraph(f"₹ {round_off:,.2f}", body_reg)],
        [Paragraph("<b>ESTIMATED TOTAL:</b>", body_bold), Paragraph(f"<b><font size='10' color='#1e40af'>₹ {grand_total:,.2f}</font></b>", body_bold)],
    ]
    t_right = Table(right_rows, colWidths=[120, 95])
    t_right.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#eff6ff')),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))

    split_data = [
        [Paragraph(left_block, body_reg), t_right]
    ]
    t_split = Table(split_data, colWidths=[305, 215])
    t_split.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_split)
    story.append(Spacer(1, 14))

    # 5. Signatory Block
    sig_data = [
        [
            Paragraph("<font size='7' color='#64748b'>Certified that this estimate is issued without prejudice and does not constitute a tax deduction voucher.</font>", body_reg),
            Paragraph(f"For <b>{company_name}</b><br/><br/><br/><b>Authorized Signatory</b>", ParagraphStyle('Sig', parent=styles['Normal'], alignment=2, fontName='Helvetica', fontSize=8))
        ]
    ]
    t_sig = Table(sig_data, colWidths=[330, 190])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ]))
    story.append(t_sig)

    doc.build(story)
    return buffer.getvalue()

def build_sale_pdf(sale: dict, items: list, company: dict = None, bank: dict = None) -> bytes:
    """Generates official GST Sales Tax Invoice PDF"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    company = company or {}
    bank = bank or {}
    company_name = company.get("company_name", "BILLORA MARBLES & GRANITES")
    phone = company.get("phone", "+91 9460110878, 8504882265")
    address = company.get("address", "Chengamanadu, Kottarakkara, Kollam, Kerala - 691557")
    gstin = company.get("gstin", "32FGZPR5431L1ZL")

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=15, leading=18, textColor=colors.HexColor('#0f172a'), alignment=1)
    sub_title = ParagraphStyle('Sub', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=colors.HexColor('#475569'), alignment=1)
    badge_style = ParagraphStyle('Badge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=12, textColor=colors.HexColor('#059669'), alignment=1)
    body_bold = ParagraphStyle('BB', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor('#0f172a'))
    body_reg = ParagraphStyle('BR', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10, textColor=colors.HexColor('#334155'))

    story = []
    story.append(Paragraph(f"<b>{company_name}</b>", title_style))
    story.append(Paragraph(f"{address} | Phone: {phone} | GSTIN: {gstin}", sub_title))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>TAX INVOICE (RULE 46 GST)</b>", badge_style))
    story.append(Spacer(1, 8))

    bill_no = sale.get("bill_no", "BIL-001")
    sale_date = str(sale.get("date", datetime.now().strftime("%Y-%m-%d")))
    cust_name = sale.get("customer_name") or "Client"
    cust_phone = sale.get("customer_phone") or "—"
    cust_addr = sale.get("delivery_address") or sale.get("customer_address") or "—"
    cust_gstin = sale.get("gstin") or "—"
    vehicle_no = sale.get("vehicle_no") or "—"
    eway_bill = sale.get("eway_bill_no") or "—"

    meta_table_data = [
        [
            Paragraph("<b>DETAILS OF RECEIVER / BILLED TO</b>", body_bold),
            Paragraph("<b>INVOICE & TRANSPORT DETAILS</b>", body_bold)
        ],
        [
            Paragraph(f"<b>Name:</b> {cust_name}<br/><b>Phone:</b> {cust_phone}<br/><b>Address:</b> {cust_addr}<br/><b>GSTIN:</b> {cust_gstin}", body_reg),
            Paragraph(f"<b>Invoice No:</b> <font color='#059669'><b>{bill_no}</b></font><br/><b>Date:</b> {sale_date}<br/><b>Vehicle No:</b> {vehicle_no}<br/><b>E-Way Bill:</b> {eway_bill}", body_reg)
        ]
    ]
    t_meta = Table(meta_table_data, colWidths=[260, 260])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    headers = ["S.No", "Product / Marble / Granite", "HSN", "Qty", "Rate (₹)", "GST%", "Total (₹)"]
    items_rows = [[Paragraph(f"<b>{h}</b>", body_bold) for h in headers]]

    for idx, it in enumerate(items, 1):
        name = it.get("product_name") or "Stone Slab"
        hsn = it.get("hsn_code", "6802")
        qty_str = f"{float(it.get('qty', 0)):.2f} {it.get('unit', 'sq.ft')}"
        rate_str = f"{float(it.get('rate', 0)):.2f}"
        gst_str = f"{float(it.get('tax_percent', 18)):.1f}%"
        tot_str = f"{float(it.get('total', 0)):.2f}"

        items_rows.append([
            Paragraph(str(idx), body_reg),
            Paragraph(f"<b>{name}</b>", body_reg),
            Paragraph(str(hsn), body_reg),
            Paragraph(qty_str, body_reg),
            Paragraph(rate_str, body_reg),
            Paragraph(gst_str, body_reg),
            Paragraph(tot_str, body_bold)
        ])

    t_items = Table(items_rows, colWidths=[30, 200, 50, 70, 55, 45, 70])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#0f172a')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (2,-1), 'CENTER'),
        ('ALIGN', (3,0), (-1,-1), 'RIGHT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_items)
    story.append(Spacer(1, 8))

    subtotal = float(sale.get("subtotal", 0))
    tax = float(sale.get("tax", 0))
    grand_total = float(sale.get("total", 0))
    paid = float(sale.get("paid", 0))
    due = float(sale.get("due", 0))

    bank_name = bank.get("bank_name", "INDIAN BANK")
    acc_no = bank.get("account_number", "50100456123489")
    ifsc = bank.get("ifsc_code", "IDIB000K123")

    words = number_to_words_inr(grand_total)

    left_block = f"""
    <b>Total in Words:</b><br/>{words}<br/><br/>
    <b>Bank Account Details:</b><br/>
    Bank: <b>{bank_name}</b><br/>
    A/C No: <b>{acc_no}</b> | IFSC: <b>{ifsc}</b><br/><br/>
    <b>Terms of Sale:</b><br/>
    <font size='7' color='#475569'>Goods once sold cannot be taken back. Interest @18% p.a. charged after due date.</font>
    """

    right_rows = [
        [Paragraph("Taxable Subtotal:", body_reg), Paragraph(f"₹ {subtotal:,.2f}", body_reg)],
        [Paragraph("CGST (9%):", body_reg), Paragraph(f"₹ {(tax/2):,.2f}", body_reg)],
        [Paragraph("SGST (9%):", body_reg), Paragraph(f"₹ {(tax/2):,.2f}", body_reg)],
        [Paragraph("<b>TOTAL AMOUNT:</b>", body_bold), Paragraph(f"<b>₹ {grand_total:,.2f}</b>", body_bold)],
        [Paragraph("Amount Paid:", body_reg), Paragraph(f"₹ {paid:,.2f}", body_reg)],
        [Paragraph("<b>Balance Due:</b>", body_bold), Paragraph(f"<b>₹ {due:,.2f}</b>", body_bold)],
    ]
    t_right = Table(right_rows, colWidths=[120, 95])
    t_right.setStyle(TableStyle([
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#fef2f2') if due > 0 else colors.HexColor('#ecfdf5')),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))

    split_data = [
        [Paragraph(left_block, body_reg), t_right]
    ]
    t_split = Table(split_data, colWidths=[305, 215])
    t_split.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(t_split)
    story.append(Spacer(1, 14))

    sig_data = [
        [
            Paragraph("<font size='7' color='#64748b'>Certified that the particulars given above are true and correct.</font>", body_reg),
            Paragraph(f"For <b>{company_name}</b><br/><br/><br/><b>Authorized Signatory</b>", ParagraphStyle('Sig', parent=styles['Normal'], alignment=2, fontName='Helvetica', fontSize=8))
        ]
    ]
    t_sig = Table(sig_data, colWidths=[330, 190])
    t_sig.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
    ]))
    story.append(t_sig)

    doc.build(story)
    return buffer.getvalue()
