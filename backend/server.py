from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
import json


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# WebSocket connections manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}  # document_id -> {user_id: websocket}
        self.user_info: Dict[str, Dict[str, Any]] = {}  # document_id -> {user_id: user_info}

    async def connect(self, websocket: WebSocket, document_id: str, user_id: str, user_name: str):
        await websocket.accept()
        
        if document_id not in self.active_connections:
            self.active_connections[document_id] = {}
            self.user_info[document_id] = {}
        
        self.active_connections[document_id][user_id] = websocket
        self.user_info[document_id][user_id] = {
            "user_id": user_id,
            "user_name": user_name,
            "connected_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Notify others about new user
        await self.broadcast_presence(document_id)

    def disconnect(self, document_id: str, user_id: str):
        if document_id in self.active_connections and user_id in self.active_connections[document_id]:
            del self.active_connections[document_id][user_id]
        if document_id in self.user_info and user_id in self.user_info[document_id]:
            del self.user_info[document_id][user_id]
        
        # Clean empty document rooms
        if document_id in self.active_connections and not self.active_connections[document_id]:
            del self.active_connections[document_id]
        if document_id in self.user_info and not self.user_info[document_id]:
            del self.user_info[document_id]

    async def send_personal_message(self, message: str, document_id: str, user_id: str):
        if document_id in self.active_connections and user_id in self.active_connections[document_id]:
            websocket = self.active_connections[document_id][user_id]
            await websocket.send_text(message)

    async def broadcast(self, message: str, document_id: str, exclude_user: Optional[str] = None):
        if document_id in self.active_connections:
            for user_id, websocket in self.active_connections[document_id].items():
                if exclude_user and user_id == exclude_user:
                    continue
                try:
                    await websocket.send_text(message)
                except:
                    # Connection is broken, clean it up
                    self.disconnect(document_id, user_id)

    async def broadcast_presence(self, document_id: str):
        if document_id in self.user_info:
            presence_data = {
                "type": "presence",
                "users": list(self.user_info[document_id].values())
            }
            await self.broadcast(json.dumps(presence_data), document_id)

manager = ConnectionManager()


# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str = ""
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    collaborators: List[str] = Field(default_factory=list)

class DocumentCreate(BaseModel):
    title: str

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_data: dict) -> str:
    to_encode = user_data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_jwt_token(token)
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)


# Authentication routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(username=user_data.username)
    
    user_dict = user.dict()
    user_dict["password_hash"] = hashed_password
    
    await db.users.insert_one(user_dict)
    
    # Create JWT token
    token = create_jwt_token({"user_id": user.id, "username": user.username})
    
    return Token(access_token=token, user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"username": user_data.username})
    if not user_doc or not verify_password(user_data.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    user = User(**user_doc)
    
    # Create JWT token
    token = create_jwt_token({"user_id": user.id, "username": user.username})
    
    return Token(access_token=token, user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# Document routes
@api_router.post("/documents", response_model=Document)
async def create_document(doc_data: DocumentCreate, current_user: User = Depends(get_current_user)):
    document = Document(
        title=doc_data.title,
        created_by=current_user.id,
        collaborators=[current_user.id]
    )
    
    await db.documents.insert_one(document.dict())
    return document

@api_router.get("/documents", response_model=List[Document])
async def get_documents(current_user: User = Depends(get_current_user)):
    documents = await db.documents.find({
        "collaborators": current_user.id
    }).to_list(100)
    
    return [Document(**doc) for doc in documents]

@api_router.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str, current_user: User = Depends(get_current_user)):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if user has access
    if current_user.id not in document["collaborators"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return Document(**document)

@api_router.put("/documents/{document_id}", response_model=Document)
async def update_document(
    document_id: str, 
    doc_data: DocumentUpdate, 
    current_user: User = Depends(get_current_user)
):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if user has access
    if current_user.id not in document["collaborators"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    update_data = {k: v for k, v in doc_data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.documents.update_one({"id": document_id}, {"$set": update_data})
    
    updated_document = await db.documents.find_one({"id": document_id})
    return Document(**updated_document)

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: User = Depends(get_current_user)):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Only creator can delete
    if document["created_by"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only creator can delete document")
    
    await db.documents.delete_one({"id": document_id})
    return {"message": "Document deleted successfully"}


# WebSocket endpoint for real-time collaboration
@app.websocket("/ws/{document_id}")
async def websocket_endpoint(websocket: WebSocket, document_id: str, token: str = None):
    if not token:
        await websocket.close(code=1008, reason="Token required")
        return
    
    try:
        # Verify token
        payload = decode_jwt_token(token)
        user_id = payload.get("user_id")
        username = payload.get("username")
        
        if not user_id or not username:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        # Verify document access
        document = await db.documents.find_one({"id": document_id})
        if not document or user_id not in document["collaborators"]:
            await websocket.close(code=1008, reason="Access denied")
            return
        
        # Connect user
        await manager.connect(websocket, document_id, user_id, username)
        
        try:
            while True:
                data = await websocket.receive_text()
                message_data = json.loads(data)
                
                # Broadcast to all other users in the document
                await manager.broadcast(data, document_id, exclude_user=user_id)
                
        except WebSocketDisconnect:
            manager.disconnect(document_id, user_id)
            await manager.broadcast_presence(document_id)
            
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason="Internal error")


# Health check
@api_router.get("/")
async def root():
    return {"message": "Collaborative Editor API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()