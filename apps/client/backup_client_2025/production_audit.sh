#!/bin/bash
# Production Readiness Checklist for Flower Delivery Platform
# Date: 2025-01-27

echo "========================================="
echo "PRODUCTION READINESS AUDIT"
echo "========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "📋 CHECKING CRITICAL ITEMS..."
echo ""

# 1. Environment Variables
echo "1. Environment Configuration:"
if [ -f ".env.production.example" ]; then
    echo -e "${GREEN}✓${NC} Production env example exists"
else
    echo -e "${YELLOW}⚠${NC} Missing .env.production.example"
fi

# 2. Check for console.log statements
echo ""
echo "2. Console Statements Check:"
CONSOLE_COUNT=$(grep -r "console\." --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)
if [ $CONSOLE_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No console statements found"
else
    echo -e "${YELLOW}⚠${NC} Found $CONSOLE_COUNT console statements"
fi

# 3. Check for TODO comments
echo ""
echo "3. TODO Comments Check:"
TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | wc -l)
if [ $TODO_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No TODO/FIXME comments"
else
    echo -e "${YELLOW}⚠${NC} Found $TODO_COUNT TODO/FIXME comments"
fi

# 4. TypeScript errors
echo ""
echo "4. TypeScript Compilation:"
echo "Running type check..."
pnpm type-check 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} TypeScript compilation successful"
else
    echo -e "${RED}✗${NC} TypeScript errors found"
fi

# 5. Check for hardcoded secrets
echo ""
echo "5. Security Check:"
SECRET_COUNT=$(grep -r "sk_\|pk_\|api_key\|secret" --include="*.ts" --include="*.tsx" src/ 2>/dev/null | grep -v "process.env" | wc -l)
if [ $SECRET_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No hardcoded secrets found"
else
    echo -e "${RED}✗${NC} Potential hardcoded secrets found: $SECRET_COUNT"
fi

echo ""
echo "========================================="
echo "SUMMARY"
echo "========================================="