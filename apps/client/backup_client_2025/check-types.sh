#!/bin/bash
echo "🔍 Checking TypeScript errors..."
cd /c/work_station/flower/apps/client
npx tsc --noEmit --pretty 2>&1 | tee typescript-errors.txt
echo ""
echo "📊 Error Summary:"
grep -c "error TS" typescript-errors.txt 2>/dev/null || echo "0 errors"
