import os
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas


def generate_certificate(name, event, date, cert_id, logo_path, qr_path=None, role="Participant"):
    """
    Generates a PDF certificate and saves it to the generated_certs/ folder.

    Args:
        name      (str): Participant's full name          e.g. "Alice Johnson"
        event     (str): Name of the event                e.g. "PyCon India 2026"
        date      (str): Date of the event                e.g. "April 7, 2026"
        cert_id   (str): Unique certificate ID            e.g. "abc-123-xyz"
        logo_path (str): File path to a logo image        e.g. "assets/logo.png"
        qr_path   (str): File path to QR code image       e.g. "qrcodes/abc-123.png"
        role      (str): Participant's role (optional)    e.g. "Speaker", default "Participant"

    Returns:
        str: The file path of the saved PDF  e.g. "generated_certs/abc-123-xyz.pdf"
    """

    # ── Step 1: Make sure the output folder exists ────────────────────────────
    # exist_ok=True means no error if the folder already exists
    output_dir = "generated_certs"
    os.makedirs(output_dir, exist_ok=True)

    # ── Step 2: Build the output file path ───────────────────────────────────
    # Each certificate gets its own file named after the unique cert_id
    file_path = os.path.join(output_dir, f"{cert_id}.pdf")

    # ── Step 3: Create the PDF canvas ────────────────────────────────────────
    # landscape(A4) → wide format (29.7 cm × 21 cm) — classic certificate look
    page_width, page_height = landscape(A4)
    c = canvas.Canvas(file_path, pagesize=landscape(A4))

    # ── Step 4: Draw outer border ─────────────────────────────────────────────
    c.setStrokeColor(colors.HexColor("#2C3E50"))   # dark navy
    c.setLineWidth(6)
    # rect(x, y, width, height) — origin is the BOTTOM-LEFT corner
    c.rect(1.5 * cm, 1.5 * cm,
           page_width - 3 * cm, page_height - 3 * cm)

    # Draw inner gold accent border for a premium layered look
    c.setLineWidth(1.5)
    c.setStrokeColor(colors.HexColor("#E8B84B"))   # gold
    c.rect(1.9 * cm, 1.9 * cm,
           page_width - 3.8 * cm, page_height - 3.8 * cm)

    # ── Step 5: Add logo ──────────────────────────────────────────────────────
    # Only draw the logo if the file actually exists on disk
    if logo_path and os.path.exists(logo_path):
        c.drawImage(logo_path,
                    2.5 * cm, page_height - 5 * cm,   # top-left position
                    width=3.5 * cm, height=3.5 * cm,
                    preserveAspectRatio=True, mask="auto")

    # ── Step 6: Main heading ──────────────────────────────────────────────────
    c.setFont("Times-Bold", 36)
    c.setFillColor(colors.HexColor("#2C3E50"))
    # drawCentredString(x_center, y, text) — x is the horizontal center point
    c.drawCentredString(page_width / 2, page_height - 4.5 * cm,
                        "Certificate of Participation")

    # ── Step 7: Gold divider line below heading ───────────────────────────────
    c.setStrokeColor(colors.HexColor("#E8B84B"))
    c.setLineWidth(1.5)
    c.line(6 * cm, page_height - 5.2 * cm,
           page_width - 6 * cm, page_height - 5.2 * cm)

    # ── Step 8: Intro text ────────────────────────────────────────────────────
    c.setFont("Times-Roman", 16)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawCentredString(page_width / 2, page_height - 6.5 * cm,
                        "This is to certify that")

    # ── Step 9: Participant name (large & prominent) ──────────────────────────
    c.setFont("Times-BoldItalic", 42)
    c.setFillColor(colors.HexColor("#1A252F"))
    c.drawCentredString(page_width / 2, page_height - 8.5 * cm, name)

    # ── Step 10: Role description line ───────────────────────────────────────
    c.setFont("Times-Roman", 16)
    c.setFillColor(colors.HexColor("#555555"))
    c.drawCentredString(page_width / 2, page_height - 10 * cm,
                        f"has successfully participated as a {role} in")

    # ── Step 11: Event name ───────────────────────────────────────────────────
    c.setFont("Times-Bold", 22)
    c.setFillColor(colors.HexColor("#2C3E50"))
    c.drawCentredString(page_width / 2, page_height - 11.5 * cm, event)

    # ── Step 12: Date ─────────────────────────────────────────────────────────
    c.setFont("Times-Roman", 14)
    c.setFillColor(colors.HexColor("#777777"))
    c.drawCentredString(page_width / 2, page_height - 12.8 * cm,
                        f"Held on {date}")

    # ── Step 13: Second gold divider ─────────────────────────────────────────
    c.setStrokeColor(colors.HexColor("#E8B84B"))
    c.setLineWidth(1)
    c.line(6 * cm, page_height - 13.5 * cm,
           page_width - 6 * cm, page_height - 13.5 * cm)

    # ── Step 14: Certificate ID (small text, bottom-left) ────────────────────
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#AAAAAA"))
    c.drawString(2.5 * cm, 2.8 * cm, f"Certificate ID: {cert_id}")

    # ── Step 15: QR code image (bottom-right) ────────────────────────────────
    # The QR code lets anyone scan and verify this certificate instantly
    if qr_path and os.path.exists(qr_path):
        qr_size = 3 * cm
        c.drawImage(qr_path,
                    page_width - qr_size - 2.5 * cm,  # x: near right edge
                    2.2 * cm,                          # y: near bottom edge
                    width=qr_size, height=qr_size,
                    preserveAspectRatio=True, mask="auto")

    # ── Step 16: Save the PDF to disk ─────────────────────────────────────────
    c.save()

    # ── Step 17: Return the path so the caller knows where to find the file ───
    return file_path
