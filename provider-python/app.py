from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Provider Python Microservice")

USERS = [
    {"id": 1, "name": "Alice", "email": "alice@example.com"},
    {"id": 2, "name": "Bob"}, #I have removed email to make dis 1 fail deliberatley
]


class User(BaseModel):
    id: int
    name: str
    email: str


@app.get("/users", response_model=List[User])
def get_users():
    return USERS


@app.get("/users/{user_id}", response_model=User)
def get_user(user_id: int):
    user = next((u for u in USERS if u["id"] == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
