from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import secrets 

app = Flask(__name__)
CORS(app)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if 'Authorization' header is present
        if 'Authorization' in request.headers:
            # Split "Bearer <token>"
            auth_header = request.headers['Authorization']
            token = auth_header.split(" ")[1] if " " in auth_header else None

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            # Here you would verify the token (e.g., jwt.decode)
            # For now, we'll just check if it matches our storage
            if token != "your-stored-secret-token":
                raise Exception("Invalid Token")
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(*args, **kwargs)
    return decorated

@app.route('/api/stats', methods=['GET'])
@token_required
def get_stats():
    # This code only runs if the token check passes
    return jsonify({
        'count': 1250,
        'status': 'Active',
        'server_time': '2026-01-31'
    })

@app.route("/api/me")
def me():
    # Once you implement real auth, you'll get the user ID from the session
    # For now, we'll fetch the first user as a placeholder
    user = User.query.get(1) 
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "user_id": user.id,
        "username": user.username, # Use 'username' or 'name' based on your model
        "email": user.email,
        "role": user.role,
        "phone": getattr(user, 'phone', "N/A"),
        "profilePic": getattr(user, 'profile_pic', None) # Base64 string from DB
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

@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    # In a real app, use session.get('user_id')
    user_id = 1 
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"message": "User not found"}), 404

    data = request.json
    
    # Update fields if they are provided in the request
    if 'name' in data:
        user.username = data['name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'profilePic' in data:
        # This stores the full Base64 string into your LONGTEXT column
        user.profile_pic = data['profilePic']

    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully!",
            "profilePic": user.profile_pic
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/managers', methods=['GET'])
@token_required # Using the decorator we created earlier
def get_managers():
    # In a real app, you would fetch this from your database
    manager_list = [
        {"id": 1, "name": "Manager A"},
        {"id": 2, "name": "Manager B"},
        {"id": 3, "name": "Manager C"}
    ]
    return jsonify(manager_list)


if __name__ == '__main__':
    app.run(debug=True) 