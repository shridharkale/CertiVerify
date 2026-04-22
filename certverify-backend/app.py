from dotenv import load_dotenv
load_dotenv()
from flask import Flask
from flask_cors import CORS

from routes.auth import auth_bp
from routes.certificates import certificates_bp
from routes.verify import verify_bp

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  

CORS(app, origins=[
    "http://localhost:5173",                          
    "https://shridharkale.github.io",                
])

app.register_blueprint(auth_bp)
app.register_blueprint(certificates_bp)
app.register_blueprint(verify_bp)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)