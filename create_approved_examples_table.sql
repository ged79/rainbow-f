-- 승인된 배송 사례 테이블 생성
CREATE TABLE approved_delivery_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_order_id UUID REFERENCES customer_orders(id),
  product_name TEXT NOT NULL,
  original_image_url TEXT NOT NULL,
  processed_image_url TEXT, -- 리본 제거된 이미지
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_approved_examples_product ON approved_delivery_examples(product_name);
CREATE INDEX idx_approved_examples_approved ON approved_delivery_examples(is_approved);