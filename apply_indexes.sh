#!/bin/bash
# DB 인덱스 적용 스크립트

echo "📊 DB 인덱스 생성 시작..."
echo "⏱️  예상 소요 시간: 10-30초"
echo ""
echo "다음 인덱스들이 생성됩니다:"
echo "- customer_orders: phone, name 조회 최적화"
echo "- orders: 주문번호, 날짜, 상태 조회 최적화"
echo "- settlements: 정산 조회 최적화"
echo "- point_transactions: 포인트 내역 최적화"
echo "- coupons: 쿠폰 조회 최적화"
echo ""
echo "📝 Supabase SQL Editor에서 add_performance_indexes.sql 실행하세요"
echo ""
echo "실행 후 확인 쿼리:"
echo "SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';"
