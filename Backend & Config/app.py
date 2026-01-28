from flask import Flask, jsonify, request
from flask_cors import CORS
import secrets 

app = Flask(__name__)
CORS(app)

@app.route("/api/me")
def me():
    # TEMP: replace with real auth later
    return jsonify({
        "user_id": 1,
        "name": "Admin",
        "role": "admin"
    })

@app.route("/api/save-cell", methods=["POST"])
def save_cell():
    user_role = request.headers.get("X-Role")

    if user_role != "admin":
        return {"error": "Forbidden"}, 403

    return {"status": "saved"}

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    
    # This prints the link in your VS Code terminal
    token = secrets.token_urlsafe(32)
    print(f"\n[RESET LINK FOR {email}]: http://127.0.0.1:5500/reset.html?token={token}\n")
    
    return jsonify({"message": "Reset link generated in terminal!"}), 200

if __name__ == "__main__":
    app.run(debug=True)
