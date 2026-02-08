-- =============================================
-- 보안 강화 데이터베이스 스키마 업데이트
-- =============================================

-- 1. 회원 테이블 보안 강화
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS email_encrypted TEXT,
ADD COLUMN IF NOT EXISTS login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_attempt TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS password_history JSONB DEFAULT '[]'::jsonb;

-- 2. 주문 테이블 보안 강화
ALTER TABLE customer_orders
ADD COLUMN IF NOT EXISTS customer_phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS recipient_phone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS delivery_address_encrypted TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS fraud_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE;

-- 3. 세션 관리 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN DEFAULT TRUE
);

-- 4. 보안 감사 로그 테이블
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL, -- login, logout, password_change, order_placed, etc.
  member_id UUID REFERENCES members(id),
  ip_address INET,
  user_agent TEXT,
  event_data JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. IP 차단 리스트
CREATE TABLE IF NOT EXISTS ip_blocklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET UNIQUE NOT NULL,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  blocked_until TIMESTAMP WITH TIME ZONE, -- NULL = 영구 차단
  created_by VARCHAR(100)
);

-- 6. Rate Limiting 추적
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL, -- IP, user_id, etc.
  endpoint VARCHAR(255) NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  window_end TIMESTAMP WITH TIME ZONE,
  blocked BOOLEAN DEFAULT FALSE
);

-- 7. SMS 인증 기록
CREATE TABLE IF NOT EXISTS sms_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50), -- signup, password_reset, login
  attempts INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- 8. 결제 보안 정보
CREATE TABLE IF NOT EXISTS payment_security (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES customer_orders(id) ON DELETE CASCADE,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100) UNIQUE,
  payment_key TEXT, -- 암호화된 결제 키
  card_last_four VARCHAR(4),
  card_type VARCHAR(20),
  risk_assessment JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =============================================
-- 인덱스 추가 (성능 최적화)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_members_phone_encrypted ON members(phone_encrypted);
CREATE INDEX IF NOT EXISTS idx_members_email_encrypted ON members(email_encrypted);
CREATE INDEX IF NOT EXISTS idx_members_login_attempts ON members(login_attempts);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_member ON user_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_audit_member ON security_audit_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocklist_ip ON ip_blocklist(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit ON rate_limit_tracking(identifier, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_verifications(phone_number, created_at DESC);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

-- 세션 테이블 RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own sessions" ON user_sessions
  FOR SELECT USING (member_id = auth.uid());

CREATE POLICY "Users can delete their own sessions" ON user_sessions
  FOR DELETE USING (member_id = auth.uid());

-- 감사 로그는 관리자만 조회 가능
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit logs" ON security_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =============================================
-- 트리거 함수
-- =============================================

-- 로그인 실패 시 자동 계정 잠금
CREATE OR REPLACE FUNCTION check_login_attempts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.login_attempts >= 5 THEN
    NEW.account_locked_until := NOW() + INTERVAL '30 minutes';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lock_account_on_failed_attempts
  BEFORE UPDATE OF login_attempts ON members
  FOR EACH ROW
  EXECUTE FUNCTION check_login_attempts();

-- 비밀번호 변경 시 히스토리 저장
CREATE OR REPLACE FUNCTION save_password_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.password != NEW.password THEN
    NEW.password_history = NEW.password_history || 
      jsonb_build_object(
        'password_hash', OLD.password,
        'changed_at', NOW()
      );
    NEW.password_changed_at = NOW();
    
    -- 최근 10개만 유지
    IF jsonb_array_length(NEW.password_history) > 10 THEN
      NEW.password_history = NEW.password_history - 0;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_password_changes
  BEFORE UPDATE OF password ON members
  FOR EACH ROW
  EXECUTE FUNCTION save_password_history();

-- 세션 활동 자동 업데이트
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_on_activity
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- =============================================
-- 저장 프로시저
-- =============================================

-- 만료된 세션 정리
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  DELETE FROM user_sessions 
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 만료된 SMS 인증 정리
CREATE OR REPLACE FUNCTION cleanup_expired_sms_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM sms_verifications 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Rate limit 정리
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_tracking 
  WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 정기 작업 스케줄링 (pg_cron 필요)
-- =============================================

-- pg_cron이 설치되어 있다면 아래 주석 해제
-- SELECT cron.schedule('cleanup-sessions', '*/10 * * * *', 'SELECT cleanup_expired_sessions();');
-- SELECT cron.schedule('cleanup-sms', '0 * * * *', 'SELECT cleanup_expired_sms_verifications();');
-- SELECT cron.schedule('cleanup-rate-limits', '*/30 * * * *', 'SELECT cleanup_rate_limits();');