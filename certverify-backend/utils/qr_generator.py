"""
utils/qr_generator.py
---------------------
BUG FIX #2: QR code URL now reads from environment variable VERIFY_BASE_URL.
- Local dev:   set VERIFY_BASE_URL=http://192.168.x.x:5000/api/verify  (your machine's IP)
- Production:  set VERIFY_BASE_URL=https://your-app.onrender.com/api/verify
This makes QR codes scannable on phones AND work in production.
"""
import qrcode
import os


def generate_qr(cert_id, verify_base_url=None):
    """
    Generates a QR code image for a certificate and saves it to disk.

    Args:
        cert_id         (str): The unique certificate ID e.g. "CERT-2026-0001"
        verify_base_url (str): Optional override. If not given, reads from env.

    Returns:
        str: File path to the saved QR code image e.g. "qrcodes/CERT-2026-0001.png"
    """

    # ✅ BUG FIX #2: Read base URL from environment variable
    # Set this in your .env or Render dashboard
    if verify_base_url is None:
        verify_base_url = os.environ.get(
            "VERIFY_BASE_URL",
            "http://localhost:5000/api/verify"  # safe fallback for local dev
        )

    # Build the full verification URL encoded in the QR code
    url = f"{verify_base_url}/{cert_id}"
    print(f"[QR] Generating QR for URL: {url}")

    # Make sure the qrcodes/ folder exists
    output_dir = "qrcodes"
    os.makedirs(output_dir, exist_ok=True)

    # Create the QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    file_path = os.path.join(output_dir, f"{cert_id}.png")
    img.save(file_path)

    return file_path