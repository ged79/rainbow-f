// 간단한 PNG 아이콘 생성 (canvas 없이)
const fs = require('fs');
const path = require('path');

// 최소한의 PNG 파일 생성 (1x1 픽셀)
function createMinimalPNG(filename, color = [16, 185, 129]) { // #10b981
  // PNG 헤더 + IHDR + 최소 데이터
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    Buffer.from([0, 0, 0, 13]), // IHDR length
    Buffer.from('IHDR'),
    Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0]), // 1x1, RGB
    Buffer.from([144, 119, 82, 222]), // CRC
    Buffer.from([0, 0, 0, 12]), // IDAT length
    Buffer.from('IDAT'),
    Buffer.from([8, 29, 1, 1, 0, 0, 254, 255, 0, ...color, 0]), // pixel data
    Buffer.from([32, 96, 9, 229]), // CRC
    Buffer.from([0, 0, 0, 0]), // IEND length
    Buffer.from('IEND'),
    Buffer.from([174, 66, 96, 130]) // CRC
  ]);
  
  fs.writeFileSync(path.join(__dirname, 'public', filename), png);
  console.log(`✅ ${filename} 생성`);
}

// 모든 사이즈 생성
const sizes = [16, 32, 72, 96, 128, 144, 192, 384, 512];
sizes.forEach(size => {
  createMinimalPNG(`icon-${size}x${size}.png`);
});

console.log('\n✨ 임시 PNG 아이콘 생성 완료!');
console.log('📌 실제 운영시에는 디자이너가 만든 아이콘으로 교체하세요.');