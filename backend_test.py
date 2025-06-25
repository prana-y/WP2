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
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Return appropriate exit code
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    print("\n🚀 Starting Wedding Planner API Tests")
    print(f"🔗 Testing API at: {API_URL}")
    sys.exit(run_tests())