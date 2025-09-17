#!/bin/bash
# Test script to verify middleware authentication is working correctly

echo "=========================================="
echo "MIDDLEWARE AUTHENTICATION TEST"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Testing Public Routes (Should return 200):"
echo "-------------------------------------------"

# Test public routes - these MUST work without auth
echo -n "1. Homepage (/)........................ "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS (200)${NC}"
else
    echo -e "${RED}✗ FAIL ($STATUS)${NC}"
fi

echo -n "2. Login page (/login)................. "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/login)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS (200)${NC}"
else
    echo -e "${RED}✗ FAIL ($STATUS)${NC}"
fi

echo -n "3. Register page (/register)........... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/register)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS (200)${NC}"
else
    echo -e "${RED}✗ FAIL ($STATUS)${NC}"
fi

echo -n "4. Health API (/api/health)............ "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/health)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ PASS (200)${NC}"
else
    echo -e "${RED}✗ FAIL ($STATUS)${NC}"
fi

echo ""
echo "Testing Protected Routes (Should return 401 or redirect):"
echo "----------------------------------------------------------"

# Test protected API routes - should return 401 without auth
echo -n "5. Orders API (/api/orders)............ "
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/orders)
STATUS=$(echo "$RESPONSE" | tail -n 1)
if [ "$STATUS" = "401" ]; then
    echo -e "${GREEN}✓ PASS (401 - Protected)${NC}"
else
    echo -e "${RED}✗ FAIL ($STATUS - Should be 401)${NC}"
fi

echo -n "6. Settlements API (/api/settlements).. "
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/settlements)
STATUS=$(echo "$RESPONSE" | tail -n 1)
if [ "$STATUS" = "401" ]; then
    echo -e "${GREEN}✓ PASS (401 - Protected)${NC}"
else
    echo -e "${RED}✗ FAIL ($STATUS - Should be 401)${NC}"
fi

echo -n "7. Points API (/api/points)............ "
RESPONSE=$(curl -s -w "\n%{http_code}" $BASE_URL/api/points)
STATUS=$(echo "$RESPONSE" | tail -n 1)
if [ "$STATUS" = "401" ]; then
    echo -e "${GREEN}✓ PASS (401 - Protected)${NC}"
else
    echo -e "${RED}✗ FAIL ($STATUS - Should be 401)${NC}"
fi

echo ""
echo "Testing Protected Pages (Should redirect to login):"
echo "----------------------------------------------------"

# Test protected pages - should redirect to login
echo -n "8. Dashboard (/dashboard).............. "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L $BASE_URL/dashboard)
REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" $BASE_URL/dashboard)
if [[ "$REDIRECT" == *"/login"* ]]; then
    echo -e "${GREEN}✓ PASS (Redirects to login)${NC}"
else
    echo -e "${RED}✗ FAIL (No redirect)${NC}"
fi

echo -n "9. Orders page (/orders)............... "
REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" $BASE_URL/orders)
if [[ "$REDIRECT" == *"/login"* ]]; then
    echo -e "${GREEN}✓ PASS (Redirects to login)${NC}"
else
    echo -e "${RED}✗ FAIL (No redirect)${NC}"
fi

echo ""
echo "Testing Login Functionality:"
echo "-----------------------------"

# Test login endpoint is still accessible
echo -n "10. Login API endpoint................. "
RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrongpassword"}' \
  -w "\n%{http_code}")
STATUS=$(echo "$RESPONSE" | tail -n 1)
if [ "$STATUS" = "401" ] || [ "$STATUS" = "400" ]; then
    echo -e "${GREEN}✓ PASS (Login endpoint working)${NC}"
else
    echo -e "${YELLOW}⚠ CHECK ($STATUS)${NC}"
fi

echo ""
echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="
echo ""
echo "SUMMARY:"
echo "- Public routes should return 200"
echo "- Protected API routes should return 401"
echo "- Protected pages should redirect to login"
echo "- Login endpoint should remain functional"
echo ""
echo -e "${YELLOW}NOTE: Run 'npm run dev' first to test${NC}"
