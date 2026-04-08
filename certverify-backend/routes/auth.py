from flask import Blueprint, request, jsonify

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # Simple mock response for now
    # Replace this with real Firebase auth later
    if email and password:
        return jsonify({
            "token": "mock-token-123",
            "user": {"email": email, "name": "User"}
        }), 200
    
    return jsonify({"error": "Email and password required"}), 400


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    organisation = data.get("organisation")

    if not all([name, email, password]):
        return jsonify({"error": "name, email, password required"}), 400

    # Mock success response
    return jsonify({"message": "Registered successfully"}), 201