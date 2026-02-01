from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import secrets

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# FAKE USER STORE (replace with DB later)
# --------------------------------------------------
USERS = {
    "admin@test.com": {
        "id": 1,
        "username": "admin",
        "password": "admin123",
        "role": "admin",
        "profilePic": None
    },
    "user@test.com": {
        "id": 2,
        "username": "user",
        "password": "user123",
        "role": "user",
        "profilePic": None
    }
}

# Simple token store (for now)
TOKENS = {}

# --------------------------------------------------
# AUTH DECORATOR
# --------------------------------------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization")

        if not auth or not auth.startswith("Bearer "):
            return jsonify({"message": "Unauthorized"}), 401

        token = auth.split(" ")[1]

        if token not in TOKENS:
            return jsonify({"message": "Invalid token"}), 401

        request.current_user = TOKENS[token]
        return f(*args, **kwargs)

    return decorated

# --------------------------------------------------
# LOGIN
# --------------------------------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = USERS.get(email)

    if not user or user["password"] != password:
        return jsonify({"message": "Invalid credentials"}), 401

    token = secrets.token_urlsafe(32)
    TOKENS[token] = user

    return jsonify({
        "token": token,
        "username": user["username"],
        "role": user["role"]
    })

# --------------------------------------------------
# SESSION CHECK (api.js -> checkSession)
# --------------------------------------------------
@app.route("/api/me", methods=["GET"])
@token_required
def api_me():
    user = request.current_user
    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "profilePic": user["profilePic"]
    })

# --------------------------------------------------
# ADD USER (ADMIN ONLY)
# --------------------------------------------------
@app.route("/add-user", methods=["POST"])
@token_required
def add_user():
    current = request.current_user

    if current["role"] != "admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.json
    email = data.get("email")

    if email in USERS:
        return jsonify({"error": "User already exists"}), 400

    USERS[email] = {
        "id": len(USERS) + 1,
        "username": data.get("username", "user"),
        "password": data.get("password", "1234"),
        "role": "user",
        "profilePic": None
    }

    return jsonify({"message": "User added"}), 201

# --------------------------------------------------
# UPDATE PROFILE
# --------------------------------------------------
@app.route("/api/update-profile", methods=["POST"])
@token_required
def update_profile():
    user = request.current_user
    data = request.json

    if "name" in data:
        user["username"] = data["name"]

    if "profilePic" in data:
        user["profilePic"] = data["profilePic"]

    return jsonify({
        "message": "Profile updated",
        "profilePic": user["profilePic"]
    })

# --------------------------------------------------
# SAVE CELL (ADMIN ONLY)
# --------------------------------------------------
@app.route("/api/save-cell", methods=["POST"])
@token_required
def save_cell():
    role = request.headers.get("X-Role")

    if role != "admin":
        return jsonify({"error": "Forbidden"}), 403

    return jsonify({"status": "saved"})

# --------------------------------------------------
# FORGOT PASSWORD (DEV MODE)
# --------------------------------------------------
@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json
    email = data.get("email")

    token = secrets.token_urlsafe(32)
    print(f"\nRESET LINK FOR {email}:")
    print(f"http://127.0.0.1:5500/reset.html?token={token}\n")

    return jsonify({"message": "Reset link generated"}), 200

# --------------------------------------------------
# RUN SERVER (ONCE)
# --------------------------------------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
