from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from routes.auth import auth_bp
from routes.certificates import certificates_bp
from routes.verify import verify_bp

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS(app,
    origins=[
        "http://localhost:5173",
        "https://shridharkale.github.io",
    ],
    expose_headers=["Content-Disposition"],
    supports_credentials=True
)

# ── RATE LIMITING ──────────────────────────────────────────────────────────────
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["300 per day", "60 per hour"],
    storage_uri="memory://"
)

# ── SECURITY HEADERS ───────────────────────────────────────────────────────────
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' https://cdnjs.cloudflare.com; "
        "style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https://firebasestorage.googleapis.com; "
        "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;"
    )
    return response

# ── BLUEPRINTS ─────────────────────────────────────────────────────────────────
app.register_blueprint(auth_bp)
app.register_blueprint(certificates_bp)
app.register_blueprint(verify_bp)

# ── HEALTH CHECK ───────────────────────────────────────────────────────────────
@app.route('/api/health')
def health():
    return jsonify({"status": "ok"}), 200

# ── LOCAL DEV ONLY ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)