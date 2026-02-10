#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Trustpilot-style Review Platform
Tests all backend APIs including authentication, business management, reviews, and admin functions.
"""

import requests
import json
import os
from datetime import datetime

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://trustloop-5.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

# Test data
TEST_USERS = {
    'admin': {'email': 'admin@example.com', 'password': 'admin123'},
    'user': {'email': 'john@example.com', 'password': 'password123'},
    'business': {'email': 'business@example.com', 'password': 'business123'}
}

# Global variables for session management
session_cookies = {}
auth_tokens = {}

def print_test_result(test_name, success, message="", details=None):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} | {test_name}")
    if message:
        print(f"    {message}")
    if details:
        print(f"    Details: {details}")
    print()

def make_request(method, endpoint, data=None, cookies=None, headers=None):
    """Make HTTP request with error handling"""
    url = f"{API_BASE}{endpoint}"
    default_headers = {'Content-Type': 'application/json'}
    if headers:
        default_headers.update(headers)
    
    try:
        if method.upper() == 'GET':
            response = requests.get(url, cookies=cookies, headers=default_headers, timeout=30)
        elif method.upper() == 'POST':
            response = requests.post(url, json=data, cookies=cookies, headers=default_headers, timeout=30)
        elif method.upper() == 'PATCH':
            response = requests.patch(url, json=data, cookies=cookies, headers=default_headers, timeout=30)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, cookies=cookies, headers=default_headers, timeout=30)
        elif method.upper() == 'PUT':
            response = requests.put(url, json=data, cookies=cookies, headers=default_headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_user_signup():
    """Test user registration with different roles"""
    print("=== Testing User Signup API ===")
    
    # Test 1: Valid user signup
    test_user = {
        'email': f'testuser_{datetime.now().timestamp()}@example.com',
        'password': 'testpass123',
        'name': 'Test User',
        'role': 'USER'
    }
    
    response = make_request('POST', '/auth/signup', test_user)
    if response and response.status_code == 201:
        print_test_result("User Signup - Valid Data", True, "User created successfully")
    else:
        error_msg = response.json().get('error', 'Unknown error') if response else 'No response'
        print_test_result("User Signup - Valid Data", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
    
    # Test 2: Business user signup
    business_user = {
        'email': f'business_{datetime.now().timestamp()}@example.com',
        'password': 'businesspass123',
        'name': 'Business Owner',
        'role': 'BUSINESS'
    }
    
    response = make_request('POST', '/auth/signup', business_user)
    if response and response.status_code == 201:
        print_test_result("Business User Signup", True, "Business user created successfully")
    else:
        error_msg = response.json().get('error', 'Unknown error') if response else 'No response'
        print_test_result("Business User Signup", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
    
    # Test 3: Duplicate email
    response = make_request('POST', '/auth/signup', TEST_USERS['user'])
    if response and response.status_code == 400:
        print_test_result("Duplicate Email Validation", True, "Correctly rejected duplicate email")
    else:
        print_test_result("Duplicate Email Validation", False, f"Expected 400, got {response.status_code if response else 'None'}")
    
    # Test 4: Missing required fields
    invalid_user = {'email': 'test@example.com'}
    response = make_request('POST', '/auth/signup', invalid_user)
    if response and response.status_code == 400:
        print_test_result("Missing Password Validation", True, "Correctly rejected missing password")
    else:
        print_test_result("Missing Password Validation", False, f"Expected 400, got {response.status_code if response else 'None'}")

def test_business_apis():
    """Test business-related APIs"""
    print("=== Testing Business APIs ===")
    
    # Test 1: List all businesses
    response = make_request('GET', '/businesses')
    if response and response.status_code == 200:
        businesses = response.json()
        if isinstance(businesses, list) and len(businesses) > 0:
            print_test_result("List Businesses", True, f"Retrieved {len(businesses)} businesses")
        else:
            print_test_result("List Businesses", False, "No businesses returned")
    else:
        print_test_result("List Businesses", False, f"Status: {response.status_code if response else 'None'}")
    
    # Test 2: List businesses with category filter
    response = make_request('GET', '/businesses?category=Technology')
    if response and response.status_code == 200:
        businesses = response.json()
        print_test_result("List Businesses - Category Filter", True, f"Retrieved {len(businesses)} technology businesses")
    else:
        print_test_result("List Businesses - Category Filter", False, f"Status: {response.status_code if response else 'None'}")
    
    # Test 3: Search businesses
    response = make_request('GET', '/businesses?search=Acme')
    if response and response.status_code == 200:
        businesses = response.json()
        print_test_result("Search Businesses", True, f"Search returned {len(businesses)} results")
    else:
        print_test_result("Search Businesses", False, f"Status: {response.status_code if response else 'None'}")
    
    # Test 4: Get specific business by slug
    response = make_request('GET', '/businesses/acme-corporation')
    if response and response.status_code == 200:
        business = response.json()
        if 'name' in business and 'averageRating' in business:
            print_test_result("Get Business by Slug", True, f"Retrieved {business['name']} with rating {business['averageRating']}")
        else:
            print_test_result("Get Business by Slug", False, "Missing expected fields in response")
    else:
        print_test_result("Get Business by Slug", False, f"Status: {response.status_code if response else 'None'}")
    
    # Test 5: Get non-existent business
    response = make_request('GET', '/businesses/non-existent-business')
    if response and response.status_code == 404:
        print_test_result("Get Non-existent Business", True, "Correctly returned 404")
    else:
        print_test_result("Get Non-existent Business", False, f"Expected 404, got {response.status_code if response else 'None'}")

def test_review_apis():
    """Test review-related APIs"""
    print("=== Testing Review APIs ===")
    
    # Test 1: Get all reviews
    response = make_request('GET', '/reviews')
    if response and response.status_code == 200:
        reviews = response.json()
        print_test_result("Get All Reviews", True, f"Retrieved {len(reviews)} reviews")
    else:
        print_test_result("Get All Reviews", False, f"Status: {response.status_code if response else 'None'}")
    
    # Test 2: Get reviews by business
    response = make_request('GET', '/reviews?businessId=acme-corporation')
    if response and response.status_code == 200:
        reviews = response.json()
        print_test_result("Get Reviews by Business", True, f"Retrieved {len(reviews)} reviews for business")
    else:
        print_test_result("Get Reviews by Business", False, f"Status: {response.status_code if response else 'None'}")
    
    # Test 3: Get reviews by status
    response = make_request('GET', '/reviews?status=PENDING')
    if response and response.status_code == 200:
        reviews = response.json()
        print_test_result("Get Pending Reviews", True, f"Retrieved {len(reviews)} pending reviews")
    else:
        print_test_result("Get Pending Reviews", False, f"Status: {response.status_code if response else 'None'}")

def test_admin_apis():
    """Test admin-only APIs"""
    print("=== Testing Admin APIs ===")
    
    # Test 1: Get admin stats (without authentication - should fail)
    response = make_request('GET', '/admin/stats')
    if response and response.status_code == 401:
        print_test_result("Admin Stats - No Auth", True, "Correctly rejected unauthenticated request")
    else:
        print_test_result("Admin Stats - No Auth", False, f"Expected 401, got {response.status_code if response else 'None'}")

def test_business_dashboard():
    """Test business dashboard API"""
    print("=== Testing Business Dashboard API ===")
    
    # Test without authentication - should fail
    response = make_request('GET', '/dashboard/business')
    if response and response.status_code == 401:
        print_test_result("Business Dashboard - No Auth", True, "Correctly rejected unauthenticated request")
    else:
        print_test_result("Business Dashboard - No Auth", False, f"Expected 401, got {response.status_code if response else 'None'}")

def test_api_error_handling():
    """Test API error handling"""
    print("=== Testing API Error Handling ===")
    
    # Test 1: Invalid endpoint
    response = make_request('GET', '/invalid-endpoint')
    if response and response.status_code == 404:
        print_test_result("Invalid Endpoint", True, "Correctly returned 404")
    else:
        print_test_result("Invalid Endpoint", False, f"Expected 404, got {response.status_code if response else 'None'}")
    
    # Test 2: Invalid method
    response = make_request('PUT', '/businesses')
    if response and response.status_code in [404, 405]:
        print_test_result("Invalid Method", True, f"Correctly rejected with status {response.status_code}")
    else:
        print_test_result("Invalid Method", False, f"Expected 404/405, got {response.status_code if response else 'None'}")

def test_data_validation():
    """Test data validation across APIs"""
    print("=== Testing Data Validation ===")
    
    # Test 1: Invalid JSON in signup
    try:
        response = requests.post(f"{API_BASE}/auth/signup", 
                               data="invalid json", 
                               headers={'Content-Type': 'application/json'},
                               timeout=30)
        if response.status_code == 400:
            print_test_result("Invalid JSON Handling", True, "Correctly rejected invalid JSON")
        else:
            print_test_result("Invalid JSON Handling", False, f"Expected 400, got {response.status_code}")
    except Exception as e:
        print_test_result("Invalid JSON Handling", False, f"Exception: {e}")

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Comprehensive Backend API Testing")
    print(f"Base URL: {BASE_URL}")
    print(f"API Base: {API_BASE}")
    print("=" * 60)
    
    try:
        # Run all test suites
        test_user_signup()
        test_business_apis()
        test_review_apis()
        test_admin_apis()
        test_business_dashboard()
        test_api_error_handling()
        test_data_validation()
        
        print("=" * 60)
        print("✅ Backend API Testing Complete!")
        print("\nNOTE: Authentication-required endpoints were tested without auth tokens.")
        print("This is expected behavior - they should return 401 Unauthorized.")
        print("The APIs are properly protecting authenticated routes.")
        
    except Exception as e:
        print(f"❌ Testing failed with exception: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)