import os
import uuid
import time
from typing import Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field
from database import query_one, query_all, execute_update, IS_POSTGRES

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str = Field(..., description="Username, email, or full name")
    password: str = Field(..., description="Account password")

class ChangePasswordRequest(BaseModel):
    user_id: int
    current_password: str
    new_password: str

@router.post("/login")
def login(payload: LoginRequest):
    raw_user = (payload.username or "").strip()
    raw_pass = (payload.password or "").strip()

    if not raw_user:
        raise HTTPException(status_code=400, detail="Username is required")
    if not raw_pass:
        raise HTTPException(status_code=400, detail="Password is required")

    # Dual-engine compatible SQL lookup (PostgreSQL / MySQL)
    if IS_POSTGRES:
        sql = """
            SELECT id, name, email, role, password 
            FROM users 
            WHERE LOWER(email) = LOWER(?) 
               OR LOWER(SPLIT_PART(email, '@', 1)) = LOWER(?)
               OR LOWER(name) = LOWER(?)
               OR LOWER(name) LIKE LOWER(?)
            LIMIT 1
        """
    else:
        sql = """
            SELECT id, name, email, role, password 
            FROM users 
            WHERE LOWER(email) = LOWER(?) 
               OR LOWER(SUBSTRING_INDEX(email, '@', 1)) = LOWER(?)
               OR LOWER(name) = LOWER(?)
               OR LOWER(name) LIKE LOWER(?)
            LIMIT 1
        """

    user = query_one(sql, (raw_user, raw_user, raw_user, f"%{raw_user}%"))

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Verify password match
    if user["password"] != raw_pass:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Generate token
    token = f"rp_session_{user['id']}_{uuid.uuid4().hex[:16]}"

    # Return safe user data
    return {
        "status": "success",
        "message": f"Welcome back, {user['name']}!",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@router.get("/me")
def get_current_user(user_id: Optional[int] = None):
    if not user_id:
        return {"status": "guest", "user": None}
    
    user = query_one("SELECT id, name, email, role FROM users WHERE id = ?", (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"status": "authenticated", "user": user}

@router.post("/logout")
def logout():
    return {"status": "success", "message": "Logged out successfully"}

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest):
    user = query_one("SELECT id, password FROM users WHERE id = ?", (payload.user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["password"] != payload.current_password:
        raise HTTPException(status_code=400, detail="Current password does not match")

    if len(payload.new_password.strip()) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long")

    execute_update("UPDATE users SET password = ? WHERE id = ?", (payload.new_password.strip(), payload.user_id))
    return {"status": "success", "message": "Password updated successfully"}

@router.get("/demo-users")
def get_demo_users():
    users = query_all("SELECT id, name, email, role FROM users ORDER BY id ASC")
    return {"users": users}
