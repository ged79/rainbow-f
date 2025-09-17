#!/bin/bash
# Rollback script for bottleneck fixes

echo "=== ROLLBACK BOTTLENECK FIXES ==="
echo ""

echo "1. Rollback homepage API..."
read -p "Restore original homepage API? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  cp homepage/src/app/api/orders/route.backup.ts homepage/src/app/api/orders/route.ts
  echo "✅ Original API restored"
fi

echo ""
echo "2. Keep message queue table? (no data loss)"
read -p "Drop message queue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "DROP TABLE IF EXISTS message_queue;" # | psql $DATABASE_URL
  echo "✅ Message queue dropped"
fi

echo ""
echo "3. Keep store coverage view? (read-only, safe)"
read -p "Drop coverage view? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "DROP MATERIALIZED VIEW IF EXISTS store_service_coverage;" # | psql $DATABASE_URL
  echo "✅ Coverage view dropped"
fi

echo "Rollback complete"
