-- Add left and right image columns to products table
ALTER TABLE products
ADD COLUMN image_left45 VARCHAR(500),
ADD COLUMN image_right45 VARCHAR(500);

-- Add comment
COMMENT ON COLUMN products.image_left45 IS '상품 좌측 45도 이미지 URL';
COMMENT ON COLUMN products.image_right45 IS '상품 우측 45도 이미지 URL';
