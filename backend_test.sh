#!/bin/bash

# Comprehensive Backend API Testing Script for Trustpilot-style Review Platform
# Tests all backend APIs including authentication, business management, reviews, and admin functions.

BASE_URL="https://trustloop-5.preview.emergentagent.com"
API_BASE="${BASE_URL}/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test results
print_test_result() {
    local test_name="$1"
    local expected_status="$2"
    local actual_status="$3"
    local message="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$expected_status" = "$actual_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} | $test_name"
        [ -n "$message" ] && echo "    $message"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC} | $test_name"
        echo "    Expected: $expected_status, Got: $actual_status"
        [ -n "$message" ] && echo "    $message"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    echo
}

# Function to make API calls and extract status code
make_api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local headers="$4"
    
    if [ -n "$data" ]; then
        if [ -n "$headers" ]; then
            curl -s -X "$method" "${API_BASE}${endpoint}" -H "Content-Type: application/json" $headers -d "$data" -w "%{http_code}" -o /tmp/api_response
        else
            curl -s -X "$method" "${API_BASE}${endpoint}" -H "Content-Type: application/json" -d "$data" -w "%{http_code}" -o /tmp/api_response
        fi
    else
        if [ -n "$headers" ]; then
            curl -s -X "$method" "${API_BASE}${endpoint}" $headers -w "%{http_code}" -o /tmp/api_response
        else
            curl -s -X "$method" "${API_BASE}${endpoint}" -w "%{http_code}" -o /tmp/api_response
        fi
    fi
}

echo "🚀 Starting Comprehensive Backend API Testing"
echo "Base URL: $BASE_URL"
echo "API Base: $API_BASE"
echo "============================================================"

# Test 1: Authentication APIs
echo "=== Testing Authentication APIs ==="

# Test 1.1: Valid user signup
timestamp=$(date +%s)
test_user="{\"email\":\"testuser_${timestamp}@example.com\",\"password\":\"testpass123\",\"name\":\"Test User\",\"role\":\"USER\"}"
status=$(make_api_call "POST" "/auth/signup" "$test_user")
print_test_result "User Signup - Valid Data" "201" "$status" "User registration with USER role"

# Test 1.2: Business user signup
business_user="{\"email\":\"business_${timestamp}@example.com\",\"password\":\"businesspass123\",\"name\":\"Business Owner\",\"role\":\"BUSINESS\"}"
status=$(make_api_call "POST" "/auth/signup" "$business_user")
print_test_result "Business User Signup" "201" "$status" "User registration with BUSINESS role"

# Test 1.3: Admin user signup
admin_user="{\"email\":\"admin_${timestamp}@example.com\",\"password\":\"adminpass123\",\"name\":\"Admin User\",\"role\":\"ADMIN\"}"
status=$(make_api_call "POST" "/auth/signup" "$admin_user")
print_test_result "Admin User Signup" "201" "$status" "User registration with ADMIN role"

# Test 1.4: Duplicate email validation
duplicate_user="{\"email\":\"john@example.com\",\"password\":\"password123\"}"
status=$(make_api_call "POST" "/auth/signup" "$duplicate_user")
print_test_result "Duplicate Email Validation" "400" "$status" "Should reject existing email"

# Test 1.5: Missing password validation
invalid_user="{\"email\":\"test@example.com\"}"
status=$(make_api_call "POST" "/auth/signup" "$invalid_user")
print_test_result "Missing Password Validation" "400" "$status" "Should require password field"

# Test 1.6: Missing email validation
invalid_user2="{\"password\":\"password123\"}"
status=$(make_api_call "POST" "/auth/signup" "$invalid_user2")
print_test_result "Missing Email Validation" "400" "$status" "Should require email field"

# Test 2: Business APIs
echo "=== Testing Business APIs ==="

# Test 2.1: List all businesses
status=$(make_api_call "GET" "/businesses")
print_test_result "List All Businesses" "200" "$status" "Should return list of businesses"

# Test 2.2: List businesses with category filter
status=$(make_api_call "GET" "/businesses?category=Technology")
print_test_result "List Businesses - Category Filter" "200" "$status" "Should filter by Technology category"

# Test 2.3: List businesses with search
status=$(make_api_call "GET" "/businesses?search=Acme")
print_test_result "Search Businesses" "200" "$status" "Should search for 'Acme'"

# Test 2.4: Get specific business by slug
status=$(make_api_call "GET" "/businesses/acme-corporation")
print_test_result "Get Business by Slug" "200" "$status" "Should return Acme Corporation details"

# Test 2.5: Get non-existent business
status=$(make_api_call "GET" "/businesses/non-existent-business")
print_test_result "Get Non-existent Business" "404" "$status" "Should return 404 for non-existent business"

# Test 2.6: Create new business (POST)
new_business="{\"name\":\"Test Business ${timestamp}\",\"slug\":\"test-business-${timestamp}\",\"category\":\"Technology\",\"description\":\"A test business\"}"
status=$(make_api_call "POST" "/businesses" "$new_business")
print_test_result "Create New Business" "201" "$status" "Should create new business"

# Test 2.7: Create business with duplicate slug
duplicate_business="{\"name\":\"Duplicate Business\",\"slug\":\"acme-corporation\",\"category\":\"Technology\"}"
status=$(make_api_call "POST" "/businesses" "$duplicate_business")
print_test_result "Create Business - Duplicate Slug" "400" "$status" "Should reject duplicate slug"

# Test 2.8: Create business with missing required fields
invalid_business="{\"name\":\"Invalid Business\"}"
status=$(make_api_call "POST" "/businesses" "$invalid_business")
print_test_result "Create Business - Missing Fields" "400" "$status" "Should require slug and category"

# Test 3: Review APIs
echo "=== Testing Review APIs ==="

# Test 3.1: Get all reviews
status=$(make_api_call "GET" "/reviews")
print_test_result "Get All Reviews" "200" "$status" "Should return all reviews"

# Test 3.2: Get reviews by business ID
status=$(make_api_call "GET" "/reviews?businessId=acme-corporation")
print_test_result "Get Reviews by Business" "200" "$status" "Should return reviews for specific business"

# Test 3.3: Get reviews by status
status=$(make_api_call "GET" "/reviews?status=PENDING")
print_test_result "Get Pending Reviews" "200" "$status" "Should return pending reviews"

# Test 3.4: Get reviews by status - APPROVED
status=$(make_api_call "GET" "/reviews?status=APPROVED")
print_test_result "Get Approved Reviews" "200" "$status" "Should return approved reviews"

# Test 3.5: Submit review without authentication (should fail)
review_data="{\"businessId\":\"acme-corporation\",\"rating\":5,\"title\":\"Great service\",\"content\":\"Excellent experience\"}"
status=$(make_api_call "POST" "/reviews" "$review_data")
print_test_result "Submit Review - No Auth" "401" "$status" "Should require authentication"

# Test 4: Admin APIs
echo "=== Testing Admin APIs ==="

# Test 4.1: Get admin stats without authentication
status=$(make_api_call "GET" "/admin/stats")
print_test_result "Admin Stats - No Auth" "401" "$status" "Should require admin authentication"

# Test 4.2: Moderate review without authentication
moderate_data="{\"status\":\"APPROVED\"}"
status=$(make_api_call "PATCH" "/admin/reviews/review-4/moderate" "$moderate_data")
print_test_result "Moderate Review - No Auth" "401" "$status" "Should require admin authentication"

# Test 5: Business Dashboard API
echo "=== Testing Business Dashboard API ==="

# Test 5.1: Get business dashboard without authentication
status=$(make_api_call "GET" "/dashboard/business")
print_test_result "Business Dashboard - No Auth" "401" "$status" "Should require business user authentication"

# Test 6: Business Claiming API
echo "=== Testing Business Claiming API ==="

# Test 6.1: Claim business without authentication
status=$(make_api_call "POST" "/businesses/global-services/claim" "{}")
print_test_result "Claim Business - No Auth" "401" "$status" "Should require business user authentication"

# Test 7: Review Reply API
echo "=== Testing Review Reply API ==="

# Test 7.1: Reply to review without authentication
reply_data="{\"content\":\"Thank you for your review!\"}"
status=$(make_api_call "POST" "/reviews/review-1/reply" "$reply_data")
print_test_result "Reply to Review - No Auth" "401" "$status" "Should require business owner authentication"

# Test 8: Individual Review Operations
echo "=== Testing Individual Review Operations ==="

# Test 8.1: Get specific review
status=$(make_api_call "GET" "/reviews/review-1")
print_test_result "Get Specific Review" "200" "$status" "Should return specific review details"

# Test 8.2: Get non-existent review
status=$(make_api_call "GET" "/reviews/non-existent-review")
print_test_result "Get Non-existent Review" "404" "$status" "Should return 404 for non-existent review"

# Test 8.3: Update review without authentication
update_data="{\"title\":\"Updated title\",\"content\":\"Updated content\"}"
status=$(make_api_call "PATCH" "/reviews/review-4" "$update_data")
print_test_result "Update Review - No Auth" "401" "$status" "Should require authentication"

# Test 8.4: Delete review without authentication
status=$(make_api_call "DELETE" "/reviews/review-4")
print_test_result "Delete Review - No Auth" "401" "$status" "Should require authentication"

# Test 9: API Error Handling
echo "=== Testing API Error Handling ==="

# Test 9.1: Invalid endpoint
status=$(make_api_call "GET" "/invalid-endpoint")
print_test_result "Invalid Endpoint" "404" "$status" "Should return 404 for invalid endpoint"

# Test 9.2: Invalid HTTP method
status=$(make_api_call "PUT" "/businesses")
print_test_result "Invalid HTTP Method" "404" "$status" "Should handle unsupported methods"

# Test 9.3: Invalid JSON data
status=$(curl -s -X POST "${API_BASE}/auth/signup" -H "Content-Type: application/json" -d "invalid json" -w "%{http_code}" -o /tmp/api_response)
print_test_result "Invalid JSON Data" "400" "$status" "Should reject malformed JSON"

# Test 10: Data Validation
echo "=== Testing Data Validation ==="

# Test 10.1: Business creation with invalid category
invalid_category_business="{\"name\":\"Test Business\",\"slug\":\"test-slug-${timestamp}\",\"category\":\"\",\"description\":\"Test\"}"
status=$(make_api_call "POST" "/businesses" "$invalid_category_business")
print_test_result "Business Creation - Empty Category" "400" "$status" "Should reject empty category"

# Test 10.2: User signup with invalid email format
invalid_email_user="{\"email\":\"invalid-email\",\"password\":\"password123\"}"
status=$(make_api_call "POST" "/auth/signup" "$invalid_email_user")
print_test_result "User Signup - Invalid Email Format" "400" "$status" "Should validate email format"

# Summary
echo "============================================================"
echo "🏁 Backend API Testing Complete!"
echo
echo "📊 Test Results Summary:"
echo "  Total Tests: $TOTAL_TESTS"
echo -e "  ${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed: $FAILED_TESTS${NC}"
echo

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the results above.${NC}"
    exit 1
fi