const fs = require('fs');
const path = require('path');

// 192x192 파일을 읽어서 다른 이름으로 복사
const source = path.join(__dirname, 'public', 'icon-192x192.png');
const sourceData = fs.readFileSync(source);

// 필요한 사이즈들 (192x192 파일을 그대로 복사)
const sizes = [72, 96, 128, 144, 384];

sizes.forEach(size => {
  const dest = path.join(__dirname, 'public', `icon-${size}x${size}.png`);
  fs.writeFileSync(dest, sourceData);
  console.log(`✅ icon-${size}x${size}.png 생성`);
});

console.log('\n✨ 모든 PWA 아이콘 준비 완료!');
console.log('📱 이제 PWA로 설치 가능합니다.');