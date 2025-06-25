import requests
import unittest
import json
from datetime import datetime
import uuid
import sys

# Backend URL from frontend/.env
BACKEND_URL = "https://e98646cb-84b6-452d-98e4-23dfcbd69864.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

class WeddingPlannerAPITest(unittest.TestCase):
    def setUp(self):
        # Generate unique email for testing to avoid conflicts
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "password123"
        self.test_user = {
            "email": self.test_email,
            "password": self.test_password,
            "full_name": "John Doe",
            "partner_name": "Jane Smith",
            "wedding_date": "2025-06-15"
        }
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        
    def test_01_register(self):
        """Test user registration"""
        print(f"\n🔍 Testing user registration with email: {self.test_email}")
        
        response = requests.post(
            f"{API_URL}/register",
            headers=self.headers,
            json=self.test_user
        )
        
        self.assertEqual(response.status_code, 200, f"Registration failed: {response.text}")
        data = response.json()
        self.assertIn("access_token", data, "Token not found in response")
        self.assertIn("token_type", data, "Token type not found in response")
        
        # Save token for subsequent tests
        self.token = data["access_token"]
        self.headers["Authorization"] = f"Bearer {self.token}"
        
        print("✅ Registration successful")
        return self.token, self.headers
        
    def test_02_login(self):
        """Test user login"""
        print("\n🔍 Testing user login")
        
        # Make sure we have a registered user first
        if not self.token:
            self.test_01_register()
        
        login_data = {
            "email": self.test_email,
            "password": self.test_password
        }
        
        response = requests.post(
            f"{API_URL}/login",
            headers={"Content-Type": "application/json"},
            json=login_data
        )
        
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        data = response.json()
        self.assertIn("access_token", data, "Token not found in response")
        
        # Update token
        self.token = data["access_token"]
        self.headers["Authorization"] = f"Bearer {self.token}"
        
        print("✅ Login successful")
        
    def test_03_get_user_profile(self):
        """Test getting user profile"""
        print("\n🔍 Testing get user profile")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            
        response = requests.get(
            f"{API_URL}/me",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get profile failed: {response.text}")
        data = response.json()
        self.assertEqual(data["email"], self.test_email, "Email in profile doesn't match")
        self.assertEqual(data["full_name"], self.test_user["full_name"], "Full name in profile doesn't match")
        
        print("✅ User profile retrieved successfully")
        
    def test_04_create_budget_item(self):
        """Test creating a budget item"""
        print("\n🔍 Testing budget item creation")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            
        budget_data = {
            "category": "Venue",
            "planned_amount": 5000.0,
            "vendor": "Grand Hotel",
            "notes": "Includes ceremony and reception spaces"
        }
        
        response = requests.post(
            f"{API_URL}/budget",
            headers=self.headers,
            json=budget_data
        )
        
        self.assertEqual(response.status_code, 200, f"Budget creation failed: {response.text}")
        data = response.json()
        self.assertEqual(data["category"], budget_data["category"], "Category doesn't match")
        self.assertEqual(data["planned_amount"], budget_data["planned_amount"], "Planned amount doesn't match")
        
        # Save budget ID for later tests
        self.budget_id = data["id"]
        
        print("✅ Budget item created successfully")
        
    def test_05_get_budget_items(self):
        """Test getting budget items"""
        print("\n🔍 Testing get budget items")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_04_create_budget_item()
            
        response = requests.get(
            f"{API_URL}/budget",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get budget items failed: {response.text}")
        data = response.json()
        self.assertIsInstance(data, list, "Response is not a list")
        
        if len(data) > 0:
            self.assertEqual(data[0]["category"], "Venue", "Category doesn't match")
            self.assertEqual(data[0]["planned_amount"], 5000.0, "Planned amount doesn't match")
        
        print(f"✅ Retrieved {len(data)} budget items successfully")
        
    def test_06_get_analytics(self):
        """Test getting analytics dashboard"""
        print("\n🔍 Testing analytics dashboard")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_04_create_budget_item()
            
        response = requests.get(
            f"{API_URL}/analytics/dashboard",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get analytics failed: {response.text}")
        data = response.json()
        
        # Check structure of analytics response
        self.assertIn("budget", data, "Budget section missing in analytics")
        self.assertIn("guests", data, "Guests section missing in analytics")
        self.assertIn("tasks", data, "Tasks section missing in analytics")
        self.assertIn("vendors", data, "Vendors section missing in analytics")
        
        # Check budget analytics
        self.assertEqual(data["budget"]["total_planned"], 5000.0, "Total planned amount doesn't match")
        self.assertEqual(data["budget"]["total_spent"], 0.0, "Total spent amount should be 0")
        
        print("✅ Analytics dashboard retrieved successfully")

    def test_07_create_guest(self):
        """Test creating a guest"""
        print("\n🔍 Testing guest creation")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            
        guest_data = {
            "name": "Alex Johnson",
            "email": "alex@example.com",
            "phone": "555-123-4567",
            "rsvp_status": "pending",
            "dietary_restrictions": "Vegetarian",
            "plus_one": True,
            "group": "Friends"
        }
        
        response = requests.post(
            f"{API_URL}/guests",
            headers=self.headers,
            json=guest_data
        )
        
        self.assertEqual(response.status_code, 200, f"Guest creation failed: {response.text}")
        data = response.json()
        self.assertEqual(data["name"], guest_data["name"], "Name doesn't match")
        self.assertEqual(data["email"], guest_data["email"], "Email doesn't match")
        self.assertEqual(data["rsvp_status"], guest_data["rsvp_status"], "RSVP status doesn't match")
        
        # Save guest ID for later tests
        self.guest_id = data["id"]
        
        print("✅ Guest created successfully")
        
    def test_08_get_guests(self):
        """Test getting guests"""
        print("\n🔍 Testing get guests")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_07_create_guest()
            
        response = requests.get(
            f"{API_URL}/guests",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get guests failed: {response.text}")
        data = response.json()
        self.assertIsInstance(data, list, "Response is not a list")
        
        if len(data) > 0:
            self.assertEqual(data[0]["name"], "Alex Johnson", "Name doesn't match")
            self.assertEqual(data[0]["group"], "Friends", "Group doesn't match")
        
        print(f"✅ Retrieved {len(data)} guests successfully")
        
    def test_09_update_guest(self):
        """Test updating a guest"""
        print("\n🔍 Testing guest update")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_07_create_guest()
            
        update_data = {
            "name": "Alex Johnson",
            "email": "alex@example.com",
            "phone": "555-123-4567",
            "rsvp_status": "accepted",  # Changed from pending to accepted
            "dietary_restrictions": "Vegetarian",
            "plus_one": True,
            "group": "Friends"
        }
        
        response = requests.put(
            f"{API_URL}/guests/{self.guest_id}",
            headers=self.headers,
            json=update_data
        )
        
        self.assertEqual(response.status_code, 200, f"Guest update failed: {response.text}")
        
        # Verify the update
        response = requests.get(
            f"{API_URL}/guests",
            headers=self.headers
        )
        
        data = response.json()
        updated_guest = next((g for g in data if g["id"] == self.guest_id), None)
        self.assertIsNotNone(updated_guest, "Updated guest not found")
        self.assertEqual(updated_guest["rsvp_status"], "accepted", "RSVP status not updated")
        
        print("✅ Guest updated successfully")
        
    def test_10_create_vendor(self):
        """Test creating a vendor"""
        print("\n🔍 Testing vendor creation")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            
        vendor_data = {
            "name": "Elegant Photography",
            "category": "Photographer",
            "contact_person": "Michael Smith",
            "email": "michael@elegantphoto.com",
            "phone": "555-987-6543",
            "address": "123 Main St, Anytown, USA",
            "price_quote": 2500.0,
            "rating": 5,
            "status": "contacted",
            "notes": "Specializes in candid shots"
        }
        
        response = requests.post(
            f"{API_URL}/vendors",
            headers=self.headers,
            json=vendor_data
        )
        
        self.assertEqual(response.status_code, 200, f"Vendor creation failed: {response.text}")
        data = response.json()
        self.assertEqual(data["name"], vendor_data["name"], "Name doesn't match")
        self.assertEqual(data["category"], vendor_data["category"], "Category doesn't match")
        self.assertEqual(data["status"], vendor_data["status"], "Status doesn't match")
        
        # Save vendor ID for later tests
        self.vendor_id = data["id"]
        
        print("✅ Vendor created successfully")
        
    def test_11_get_vendors(self):
        """Test getting vendors"""
        print("\n🔍 Testing get vendors")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_10_create_vendor()
            
        response = requests.get(
            f"{API_URL}/vendors",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get vendors failed: {response.text}")
        data = response.json()
        self.assertIsInstance(data, list, "Response is not a list")
        
        if len(data) > 0:
            self.assertEqual(data[0]["name"], "Elegant Photography", "Name doesn't match")
            self.assertEqual(data[0]["category"], "Photographer", "Category doesn't match")
        
        print(f"✅ Retrieved {len(data)} vendors successfully")
        
    def test_12_create_task(self):
        """Test creating a task"""
        print("\n🔍 Testing task creation")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            
        task_data = {
            "title": "Book venue tour",
            "description": "Schedule a tour of the Grand Hotel",
            "category": "Venue",
            "due_date": "2024-12-15T00:00:00.000Z",
            "priority": "high",
            "assigned_to": "John",
            "notes": "Call ahead to confirm availability"
        }
        
        response = requests.post(
            f"{API_URL}/tasks",
            headers=self.headers,
            json=task_data
        )
        
        self.assertEqual(response.status_code, 200, f"Task creation failed: {response.text}")
        data = response.json()
        self.assertEqual(data["title"], task_data["title"], "Title doesn't match")
        self.assertEqual(data["category"], task_data["category"], "Category doesn't match")
        self.assertEqual(data["priority"], task_data["priority"], "Priority doesn't match")
        
        # Save task ID for later tests
        self.task_id = data["id"]
        
        print("✅ Task created successfully")
        
    def test_13_get_tasks(self):
        """Test getting tasks"""
        print("\n🔍 Testing get tasks")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_12_create_task()
            
        response = requests.get(
            f"{API_URL}/tasks",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get tasks failed: {response.text}")
        data = response.json()
        self.assertIsInstance(data, list, "Response is not a list")
        
        if len(data) > 0:
            self.assertEqual(data[0]["title"], "Book venue tour", "Title doesn't match")
            self.assertEqual(data[0]["priority"], "high", "Priority doesn't match")
        
        print(f"✅ Retrieved {len(data)} tasks successfully")
        
    def test_14_update_task(self):
        """Test updating a task"""
        print("\n🔍 Testing task update")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_12_create_task()
            
        update_data = {
            "title": "Book venue tour",
            "description": "Schedule a tour of the Grand Hotel",
            "category": "Venue",
            "due_date": "2024-12-15T00:00:00.000Z",
            "priority": "high",
            "assigned_to": "John",
            "notes": "Call ahead to confirm availability",
            "completed": True  # Mark as completed
        }
        
        response = requests.put(
            f"{API_URL}/tasks/{self.task_id}",
            headers=self.headers,
            json=update_data
        )
        
        self.assertEqual(response.status_code, 200, f"Task update failed: {response.text}")
        
        # Verify the update
        response = requests.get(
            f"{API_URL}/tasks",
            headers=self.headers
        )
        
        data = response.json()
        updated_task = next((t for t in data if t["id"] == self.task_id), None)
        self.assertIsNotNone(updated_task, "Updated task not found")
        self.assertEqual(updated_task["completed"], True, "Task not marked as completed")
        
        print("✅ Task updated successfully")
        
    def test_15_create_venue(self):
        """Test creating a venue"""
        print("\n🔍 Testing venue creation")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            
        venue_data = {
            "name": "Grand Ballroom",
            "venue_type": "Reception Hall",
            "address": "456 Park Ave, Anytown, USA",
            "capacity": 200,
            "price": 8000.0,
            "rating": 4,
            "status": "considering",
            "contact_person": "Sarah Johnson",
            "phone": "555-789-0123",
            "email": "events@grandballroom.com",
            "notes": "Beautiful chandeliers and dance floor"
        }
        
        response = requests.post(
            f"{API_URL}/venues",
            headers=self.headers,
            json=venue_data
        )
        
        self.assertEqual(response.status_code, 200, f"Venue creation failed: {response.text}")
        data = response.json()
        self.assertEqual(data["name"], venue_data["name"], "Name doesn't match")
        self.assertEqual(data["venue_type"], venue_data["venue_type"], "Venue type doesn't match")
        self.assertEqual(data["capacity"], venue_data["capacity"], "Capacity doesn't match")
        
        # Save venue ID for later tests
        self.venue_id = data["id"]
        
        print("✅ Venue created successfully")
        
    def test_16_get_venues(self):
        """Test getting venues"""
        print("\n🔍 Testing get venues")
        
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_15_create_venue()
            
        response = requests.get(
            f"{API_URL}/venues",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get venues failed: {response.text}")
        data = response.json()
        self.assertIsInstance(data, list, "Response is not a list")
        
        if len(data) > 0:
            self.assertEqual(data[0]["name"], "Grand Ballroom", "Name doesn't match")
            self.assertEqual(data[0]["venue_type"], "Reception Hall", "Venue type doesn't match")
        
        print(f"✅ Retrieved {len(data)} venues successfully")
        
    def test_17_updated_analytics(self):
        """Test analytics with all data types"""
        print("\n🔍 Testing comprehensive analytics")
        
        # Make sure we have data of all types
        if not self.token:
            self.token, self.headers = self.test_01_register()
            self.test_04_create_budget_item()
            self.test_07_create_guest()
            self.test_10_create_vendor()
            self.test_12_create_task()
            self.test_15_create_venue()
            
        response = requests.get(
            f"{API_URL}/analytics/dashboard",
            headers=self.headers
        )
        
        self.assertEqual(response.status_code, 200, f"Get analytics failed: {response.text}")
        data = response.json()
        
        # Check that all sections have data
        self.assertGreater(data["budget"]["total_planned"], 0, "Budget data missing")
        self.assertGreater(data["guests"]["total"], 0, "Guest data missing")
        self.assertGreater(data["tasks"]["total"], 0, "Task data missing")
        self.assertGreater(data["vendors"]["total"], 0, "Vendor data missing")
        
        print("✅ Comprehensive analytics retrieved successfully")

def run_tests():
    # Create a test suite
    test_suite = unittest.TestSuite()
    
    # Add tests in order
    test_suite.addTest(WeddingPlannerAPITest('test_01_register'))
    test_suite.addTest(WeddingPlannerAPITest('test_02_login'))
    test_suite.addTest(WeddingPlannerAPITest('test_03_get_user_profile'))
    test_suite.addTest(WeddingPlannerAPITest('test_04_create_budget_item'))
    test_suite.addTest(WeddingPlannerAPITest('test_05_get_budget_items'))
    test_suite.addTest(WeddingPlannerAPITest('test_06_get_analytics'))
    test_suite.addTest(WeddingPlannerAPITest('test_07_create_guest'))
    test_suite.addTest(WeddingPlannerAPITest('test_08_get_guests'))
    test_suite.addTest(WeddingPlannerAPITest('test_09_update_guest'))
    test_suite.addTest(WeddingPlannerAPITest('test_10_create_vendor'))
    test_suite.addTest(WeddingPlannerAPITest('test_11_get_vendors'))
    test_suite.addTest(WeddingPlannerAPITest('test_12_create_task'))
    test_suite.addTest(WeddingPlannerAPITest('test_13_get_tasks'))
    test_suite.addTest(WeddingPlannerAPITest('test_14_update_task'))
    test_suite.addTest(WeddingPlannerAPITest('test_15_create_venue'))
    test_suite.addTest(WeddingPlannerAPITest('test_16_get_venues'))
    test_suite.addTest(WeddingPlannerAPITest('test_17_updated_analytics'))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Return appropriate exit code
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    print("\n🚀 Starting Wedding Planner API Tests")
    print(f"🔗 Testing API at: {API_URL}")
    sys.exit(run_tests())