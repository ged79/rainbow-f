#!/bin/bash
# System Test Script for Flower Delivery Platform
# Run all tests to ensure system stability

echo "==================================="
echo "Flower Delivery System Test Suite"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url)
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $name (Status: $response)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $name (Expected: $expected_status, Got: $response)"
        ((TESTS_FAILED++))
    fi
}

echo ""
echo "1. Testing Public Endpoints"
echo "----------------------------"
test_endpoint "Homepage" "$BASE_URL/" "200"
test_endpoint "Login Page" "$BASE_URL/login" "200"
test_endpoint "Register Page" "$BASE_URL/register" "200"
test_endpoint "Health Check" "$BASE_URL/api/health" "200"

echo ""
echo "2. Testing Protected API Endpoints (should return 401)"
echo "-------------------------------------------------------"
test_endpoint "Orders API" "$BASE_URL/api/orders" "401"
test_endpoint "Settlements API" "$BASE_URL/api/settlements" "401"
test_endpoint "Points API" "$BASE_URL/api/points" "401"

echo ""
echo "3. Testing Storage"
echo "------------------"
echo "Checking if order-photos bucket is accessible..."
curl -s "$BASE_URL/api/storage/init" | grep -q "success"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Storage bucket verified"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Storage bucket needs initialization"
fi

echo ""
echo "==================================="
echo "Test Results"
echo "==================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! System is stable.${NC}"
else
    echo -e "${RED}Some tests failed. Please review.${NC}"
fi
