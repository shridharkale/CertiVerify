import os
import io
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

def generate_certificate(name, event, date, cert_id, logo_path, qr_path=None, role="Participant", organisation=""):
    buffer = io.BytesIO()
    page_width, page_height = landscape(A4)
    c = canvas.Canvas(buffer, pagesize=landscape(A4))

    c.setStrokeColor(colors.HexColor("#2C3E50"))
    c.setLineWidth(6)
    c.rect(1.5*cm, 1.5*cm, page_width-3*cm, page_height-3*cm)

    c.setLineWidth(1.5)
    c.setStrokeColor(colors.HexColor("#E8B84B"))
    c.rect(1.9*cm, 1.9*cm, page_width-3.8*cm, page_height-3.8*cm)

    if logo_path and os.path.exists(logo_path):
        c.drawImage(logo_path, 2.5*cm, page_height-5*cm,
                    width=3.5*cm, height=3.5*cm,
                    preserveAspectRatio=True, mask="auto")

    c.setFont("Times-Bold", 36)
    c.setFillColor(colors.HexColor("#2C3E50"))
    c.drawCentredString(page_width/2, page_height-4.5*cm, "Certificate of Participation")

    c.setStrokeColor(colors.HexColor("#E8B84B"))
    c.setLineWidth(1.5)
    c.line(6*cm, page_height-5.2*cm, page_width-6*cm, page_height-5.2*cm)

    c.setFont("Times-Roman", 16)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawCentredString(page_width/2, page_height-6.5*cm, "This is to certify that")

    c.setFont("Times-BoldItalic", 42)
    c.setFillColor(colors.HexColor("#1A252F"))
    c.drawCentredString(page_width/2, page_height-8.5*cm, name)

    c.setFont("Times-Roman", 16)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawCentredString(page_width/2, page_height-10*cm,
                        f"has successfully participated as a {role} in")

    c.setFont("Times-Bold", 22)
    c.setFillColor(colors.HexColor("#2C3E50"))
    c.drawCentredString(page_width/2, page_height-11.5*cm, event)

    c.setFont("Times-Roman", 14)
    c.setFillColor(colors.HexColor("#777777"))
    c.drawCentredString(page_width/2, page_height-12.8*cm, f"Held on {date}")

    c.setStrokeColor(colors.HexColor("#E8B84B"))
    c.setLineWidth(1)
    c.line(6*cm, page_height-13.5*cm, page_width-6*cm, page_height-13.5*cm)

    if organisation:
        c.setFont("Times-Bold", 13)
        c.setFillColor(colors.HexColor("#2C3E50"))
        c.drawCentredString(page_width/2, page_height-14.5*cm,
                            f"Issued by: {organisation}")

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#AAAAAA"))
    c.drawString(2.5*cm, 2.8*cm, f"Certificate ID: {cert_id}")

    if qr_path and os.path.exists(qr_path):
        qr_size = 3*cm
        c.drawImage(qr_path,
                    page_width-qr_size-2.5*cm, 2.2*cm,
                    width=qr_size, height=qr_size,
                    preserveAspectRatio=True, mask="auto")

    c.save()
    buffer.seek(0)
    return buffer.getvalue()