from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("users-service")

app = FastAPI(title="Users Service", version="1.0.0")

class User(BaseModel):
    id: int
    name: str
    email: str

class CreateUserRequest(BaseModel):
    name: str
    email: str

_users: List[dict] = [
    {"id": 1, "name": "Alice Nguyen",  "email": "alice@example.com"},
    {"id": 2, "name": "Bob Smith",     "email": "bob@example.com"},
    {"id": 3, "name": "Carol Johnson", "email": "carol@example.com"},
]
_next_id = 4

@app.get("/health")
def health():
    return {"status": "ok", "service": "users"}


@app.get("/users", response_model=List[User])
def list_users():
    logger.info("GET /users")
    return _users


@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int):
    logger.info(f"GET /users/{user_id}")
    user = next((u for u in _users if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/users", response_model=User, status_code=201)
def create_user(body: CreateUserRequest):
    global _next_id
    user = {"id": _next_id, "name": body.name, "email": body.email}
    _users.append(user)
    _next_id += 1
    logger.info(f"Created user id={user['id']}")
    return user


@app.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int):
    global _users
    before = len(_users)
    _users = [u for u in _users if u["id"] != user_id]
    if len(_users) == before:
        raise HTTPException(status_code=404, detail="User not found")
