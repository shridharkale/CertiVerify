import qrcode
import os
import io

def generate_qr(cert_id, verify_base_url=None):
    if verify_base_url is None:
        verify_base_url = os.environ.get(
            "VERIFY_BASE_URL",
            "https://shridharkale.github.io/CertiVerify/#/verify"
        )

    url = f"{verify_base_url}/{cert_id}"
    print(f"[QR] Generating QR for URL: {url}")

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # ✅ Save to /tmp which persists during same request on Render
    output_dir = "/tmp/qrcodes"
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, f"{cert_id}.png")
    img.save(file_path)

    return file_path