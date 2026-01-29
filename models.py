
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.String(10), default='team') # 'admin' or 'team'
    # LONGTEXT to hold the Base64 Profile Picture string
    profile_pic = db.Column(db.Text(length=4294967295)) 

class Manager(db.Model):
    __tablename__ = 'manager'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)

class SheetCell(db.Model):
    __tablename__ = 'sheet_cell'
    id = db.Column(db.Integer, primary_key=True)
    manager_id = db.Column(db.Integer, db.ForeignKey('manager.id'))
    row = db.Column(db.Integer)
    col = db.Column(db.Integer)
    value = db.Column(db.String(255))