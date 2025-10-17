// 임시 아이콘 생성 스크립트 (SVG를 사용한 간단한 아이콘)
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 192, 384, 512];

// 간단한 꽃 아이콘 SVG
const createSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#10b981" rx="${size * 0.15}"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.5}" fill="white" text-anchor="middle" dy=".35em">🌸</text>
</svg>
`;

// 각 사이즈별 SVG 생성
sizes.forEach(size => {
  const svg = createSvgIcon(size);
  const filename = path.join(__dirname, 'public', `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

// 작은 사이즈들도 생성
[16, 32].forEach(size => {
  const svg = createSvgIcon(size);
  const filename = path.join(__dirname, 'public', `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

console.log('✅ 모든 아이콘 생성 완료!');
console.log('주의: 실제 배포시에는 PNG 아이콘으로 변환하세요.');
