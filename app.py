from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import secrets
import json
import os

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# PERSISTENCE HELPERS (File Handling)
# --------------------------------------------------
TOKEN_FILE = "tokens.json"
USER_FILE = "users.json"

def load_data(filename, default_data):
    """Loads data from a JSON file or returns default if file doesn't exist."""
    if os.path.exists(filename):
        with open(filename, "r") as f:
            try:
                return json.load(f)
            except:
                return default_data
    return default_data

def save_data(filename, data):
    """Saves a dictionary to a JSON file."""
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

# --------------------------------------------------
# DATA INITIALIZATION
# --------------------------------------------------
DEFAULT_USERS = {
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

# Load existing data from files or use defaults
USERS = load_data(USER_FILE, DEFAULT_USERS)
TOKENS = load_data(TOKEN_FILE, {})

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

        # Retrieve user from the stored token mapping
        request.current_user = TOKENS[token]
        return f(*args, **kwargs)
    return decorated

# --------------------------------------------------
# LOGIN
# --------------------------------------------------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = USERS.get(email)

    if not user or user["password"] != password:
        return jsonify({"message": "Invalid credentials"}), 401

    token = secrets.token_urlsafe(32)
    
    # Store token in memory and save to file for persistence
    TOKENS[token] = user
    save_data(TOKEN_FILE, TOKENS)

    return jsonify({
        "token": token,
        "username": user["username"],
        "role": user["role"]
    })

# --------------------------------------------------
# SESSION CHECK
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

    # Add new user to dictionary
    USERS[email] = {
        "id": len(USERS) + 1,
        "username": data.get("username", "user"),
        "password": data.get("password", "1234"),
        "role": "user",
        "profilePic": None
    }
    
    # Permanently save new user to file
    save_data(USER_FILE, USERS)

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

    # Save changes to the profile permanently
    save_data(USER_FILE, USERS)

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

if __name__ == "__main__":
    app.run(port=5000, debug=True)

# Add this route to app.py
@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")

    # Basic Validation
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if email in USERS:
        return jsonify({"error": "User already exists"}), 400

    # Add the new user
    USERS[email] = {
        "id": len(USERS) + 1,
        "username": username or "New User",
        "password": password,
        "role": "user",  # Default new signups to 'user' role
        "profilePic": None
    }

    # Save to users.json permanently
    save_data(USER_FILE, USERS)

    return jsonify({"message": "Registration successful"}), 201    