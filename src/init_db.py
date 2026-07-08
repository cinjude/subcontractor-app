"""
One-off script: creates all tables in the database pointed to by
DATABASE_URL, directly from the SQLAlchemy models (bypassing the
broken initial Alembic migration).

Run this ONCE against a fresh/empty database (like your new Neon DB).
"""
from app import app, db

with app.app_context():
    db.create_all()
    print("All tables created successfully.")