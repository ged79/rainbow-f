-- =============================================
-- Seed Data for Development
-- =============================================

-- Test user (password: test123456)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'test@flower.com',
    crypt('test123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
);

-- Test store
INSERT INTO stores (
    user_id,
    store_code,
    business_name,
    owner_name,
    business_license,
    phone,
    email,
    address,
    service_areas,
    bank_name,
    account_number,
    account_holder,
    status,
    points_balance
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'TEST001',
    '테스트 꽃집',
    '홍길동',
    '123-45-67890',
    '010-1234-5678',
    'test@flower.com',
    '{"sido": "서울특별시", "sigungu": "강남구", "dong": "역삼동", "detail": "123-45"}',
    ARRAY['서울특별시', '경기도'],
    '국민은행',
    '123-456-789012',
    '홍길동',
    'active',
    1000000
);
