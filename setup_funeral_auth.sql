-- funeral_homes 테이블에 login_id 컬럼 추가 (없을 경우)
ALTER TABLE funeral_homes 
ADD COLUMN IF NOT EXISTS login_id TEXT UNIQUE;

-- 영동병원장례식장 테스트 계정 생성
-- 비밀번호: yeongdong2024! (bcrypt 해시)
UPDATE funeral_homes 
SET 
  login_id = 'yeongdong',
  password_hash = '$2a$10$YourBcryptHashHere'
WHERE name = '영동병원장례식장';

-- 새 장례식장 추가 시 예시
-- INSERT INTO funeral_homes (name, login_id, password_hash, status)
-- VALUES ('테스트장례식장', 'test', '$2a$10$...', 'active');

-- 확인
SELECT id, name, login_id, status FROM funeral_homes;
