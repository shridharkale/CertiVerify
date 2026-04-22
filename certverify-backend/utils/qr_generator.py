
import qrcode
import os


def generate_qr(cert_id, verify_base_url=None):
    if verify_base_url is None:
       verify_base_url = os.environ.get("VERIFY_BASE_URL", "http://localhost:5173/#/verify")
    
    url = f"{verify_base_url}/{cert_id}"
    print(f"[QR] Generating QR for URL: {url}")

    
    output_dir = "qrcodes"
    os.makedirs(output_dir, exist_ok=True)

    
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