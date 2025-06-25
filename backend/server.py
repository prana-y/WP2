from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = "your-secret-key-here"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app
app = FastAPI(title="Wedding Planner API")
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    hashed_password: str
    wedding_date: Optional[datetime] = None
    partner_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    wedding_date: Optional[datetime] = None
    partner_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Budget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    planned_amount: float
    spent_amount: float = 0.0
    vendor: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BudgetCreate(BaseModel):
    category: str
    planned_amount: float
    vendor: Optional[str] = None
    notes: Optional[str] = None

class Guest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    rsvp_status: str = "pending"  # pending, accepted, declined
    dietary_restrictions: Optional[str] = None
    plus_one: bool = False
    group: Optional[str] = None  # family, friends, work, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GuestCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    rsvp_status: str = "pending"
    dietary_restrictions: Optional[str] = None
    plus_one: bool = False
    group: Optional[str] = None

class Vendor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    category: str  # photographer, florist, caterer, etc.
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    price_quote: Optional[float] = None
    rating: Optional[int] = None  # 1-5
    status: str = "researching"  # researching, contacted, quoted, booked
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VendorCreate(BaseModel):
    name: str
    category: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    price_quote: Optional[float] = None
    rating: Optional[int] = None
    status: str = "researching"
    notes: Optional[str] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    category: str
    due_date: Optional[datetime] = None
    completed: bool = False
    priority: str = "medium"  # low, medium, high
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    due_date: Optional[datetime] = None
    priority: str = "medium"
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class Venue(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    venue_type: str  # church, reception, outdoor, etc.
    address: str
    capacity: Optional[int] = None
    price: Optional[float] = None
    rating: Optional[int] = None
    status: str = "considering"  # considering, visited, booked
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VenueCreate(BaseModel):
    name: str
    venue_type: str
    address: str
    capacity: Optional[int] = None
    price: Optional[float] = None
    rating: Optional[int] = None
    status: str = "considering"
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    notes: Optional[str] = None

# Auth functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Auth routes
@api_router.post("/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user_dict["hashed_password"] = hashed_password
    
    user = User(**user_dict)
    await db.users.insert_one(user.dict())
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@api_router.get("/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Budget routes
@api_router.post("/budget", response_model=Budget)
async def create_budget(budget_data: BudgetCreate, current_user: User = Depends(get_current_user)):
    budget_dict = budget_data.dict()
    budget_dict["user_id"] = current_user.id
    budget = Budget(**budget_dict)
    await db.budgets.insert_one(budget.dict())
    return budget

@api_router.get("/budget", response_model=List[Budget])
async def get_budgets(current_user: User = Depends(get_current_user)):
    budgets = await db.budgets.find({"user_id": current_user.id}).to_list(1000)
    return [Budget(**budget) for budget in budgets]

@api_router.put("/budget/{budget_id}")
async def update_budget(budget_id: str, budget_data: BudgetCreate, current_user: User = Depends(get_current_user)):
    await db.budgets.update_one(
        {"id": budget_id, "user_id": current_user.id},
        {"$set": budget_data.dict()}
    )
    return {"message": "Budget updated"}

# Guest routes
@api_router.post("/guests", response_model=Guest)
async def create_guest(guest_data: GuestCreate, current_user: User = Depends(get_current_user)):
    guest_dict = guest_data.dict()
    guest_dict["user_id"] = current_user.id
    guest = Guest(**guest_dict)
    await db.guests.insert_one(guest.dict())
    return guest

@api_router.get("/guests", response_model=List[Guest])
async def get_guests(current_user: User = Depends(get_current_user)):
    guests = await db.guests.find({"user_id": current_user.id}).to_list(1000)
    return [Guest(**guest) for guest in guests]

@api_router.put("/guests/{guest_id}")
async def update_guest(guest_id: str, guest_data: GuestCreate, current_user: User = Depends(get_current_user)):
    await db.guests.update_one(
        {"id": guest_id, "user_id": current_user.id},
        {"$set": guest_data.dict()}
    )
    return {"message": "Guest updated"}

# Vendor routes
@api_router.post("/vendors", response_model=Vendor)
async def create_vendor(vendor_data: VendorCreate, current_user: User = Depends(get_current_user)):
    vendor_dict = vendor_data.dict()
    vendor_dict["user_id"] = current_user.id
    vendor = Vendor(**vendor_dict)
    await db.vendors.insert_one(vendor.dict())
    return vendor

@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(current_user: User = Depends(get_current_user)):
    vendors = await db.vendors.find({"user_id": current_user.id}).to_list(1000)
    return [Vendor(**vendor) for vendor in vendors]

# Task routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    task_dict = task_data.dict()
    task_dict["user_id"] = current_user.id
    task = Task(**task_dict)
    await db.tasks.insert_one(task.dict())
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(current_user: User = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": current_user.id}).to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    await db.tasks.update_one(
        {"id": task_id, "user_id": current_user.id},
        {"$set": task_data.dict()}
    )
    return {"message": "Task updated"}

# Venue routes
@api_router.post("/venues", response_model=Venue)
async def create_venue(venue_data: VenueCreate, current_user: User = Depends(get_current_user)):
    venue_dict = venue_data.dict()
    venue_dict["user_id"] = current_user.id
    venue = Venue(**venue_dict)
    await db.venues.insert_one(venue.dict())
    return venue

@api_router.get("/venues", response_model=List[Venue])
async def get_venues(current_user: User = Depends(get_current_user)):
    venues = await db.venues.find({"user_id": current_user.id}).to_list(1000)
    return [Venue(**venue) for venue in venues]

# Analytics routes
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)):
    # Budget analytics
    budgets = await db.budgets.find({"user_id": current_user.id}).to_list(1000)
    total_planned = sum(b.get("planned_amount", 0) for b in budgets)
    total_spent = sum(b.get("spent_amount", 0) for b in budgets)
    
    # Guest analytics
    guests = await db.guests.find({"user_id": current_user.id}).to_list(1000)
    guest_stats = {
        "total": len(guests),
        "accepted": len([g for g in guests if g.get("rsvp_status") == "accepted"]),
        "declined": len([g for g in guests if g.get("rsvp_status") == "declined"]),
        "pending": len([g for g in guests if g.get("rsvp_status") == "pending"])
    }
    
    # Task analytics
    tasks = await db.tasks.find({"user_id": current_user.id}).to_list(1000)
    task_stats = {
        "total": len(tasks),
        "completed": len([t for t in tasks if t.get("completed")]),
        "pending": len([t for t in tasks if not t.get("completed")])
    }
    
    # Vendor analytics
    vendors = await db.vendors.find({"user_id": current_user.id}).to_list(1000)
    vendor_stats = {
        "total": len(vendors),
        "booked": len([v for v in vendors if v.get("status") == "booked"])
    }
    
    return {
        "budget": {
            "total_planned": total_planned,
            "total_spent": total_spent,
            "remaining": total_planned - total_spent,
            "categories": len(set(b.get("category") for b in budgets))
        },
        "guests": guest_stats,
        "tasks": task_stats,
        "vendors": vendor_stats
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
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