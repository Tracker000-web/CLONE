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

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from models import db, User, Manager, Cell  # Import your models

app = Flask(__name__)

# Replace with your actual MySQL credentials
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://user:password@localhost/your_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()
@app.route('/api/managers', methods=['GET'])
def get_managers():
    managers = Manager.query.all()
    return jsonify([manager.to_dict() for manager in managers])


@app.route('/api/cells', methods=['GET'])
def get_cells():    
    cells = Cell.query.all()
    return jsonify([cell.to_dict() for cell in cells])     

@app.route('/api/users', methods=['GET'])
def get_users():    
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

if __name__ == '__main__':
    app.run(debug=True)

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    # Basic logic to save user to DB via SQLAlchemy
    new_user = User(email=data['email'], role='user') # Default to user
    new_user.set_password(data['password']) # Assuming you have a hashing method
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created"}), 201

@app.route('/api/login', methods=['POST'])
def login():   
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']): # Assuming you have a password check method
        return jsonify({"message": "Login successful", "role": user.role}), 200
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    token = data.get('token')
    new_password = data.get('new_password')
    
    # Here you would verify the token and find the user
    # For simplicity, let's assume we find the user directly
    user = User.query.filter_by(email=data.get('email')).first()
    if user:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({"message": "Password reset successful"}), 200
    return jsonify({"error": "Invalid token or user not found"}), 400


@app.route('/api/save-cell', methods=['POST'])
def save_cell():
    role = request.headers.get('X-Role')
    if role != 'admin':
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    # Find the cell or create a new one
    cell = Cell.query.filter_by(manager_id=data['managerId'], row=data['row'], col=data['col']).first()
    
    if cell:
        cell.content = data['content']
    else:
        cell = Cell(manager_id=data['managerId'], row=data['row'], col=data['col'], content=data['content'])
        db.session.add(cell)
    
    db.session.commit()
    return jsonify({"status": "success"})


if __name__ == '__main__':
    app.run(debug=True) 