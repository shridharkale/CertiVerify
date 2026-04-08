from dotenv import load_dotenv
load_dotenv()
from flask import Flask
from flask_cors import CORS

# Import route blueprints
from routes.auth import auth_bp
from routes.certificates import certificates_bp
from routes.verify import verify_bp

# ── Create the Flask app ──────────────────────────────────────────────────────
app = Flask(__name__)

# ── Enable CORS ───────────────────────────────────────────────────────────────
# This lets the frontend (React/Next.js) communicate with this backend
# without getting blocked by the browser's same-origin policy.
CORS(app)

# ── Register Blueprints (route groups) ────────────────────────────────────────
# Each blueprint lives in its own file under routes/
app.register_blueprint(auth_bp)          # /api/auth/...
app.register_blueprint(certificates_bp)  # /api/certificates/...
app.register_blueprint(verify_bp)        # /api/verify/...

# ── Run the app ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # debug=True → auto-reloads when you save a file (great for development)
    app.run(debug=True, port=5000)
app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # add this line
CORS(app)
app.run(debug = True, host="0.0.0.0",port=5000)