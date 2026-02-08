// PNG 아이콘 자동 생성 (canvas 패키지 필요)
// npm install canvas 실행 후 사용

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 192, 384, 512];

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 배경 - 녹색
  ctx.fillStyle = '#10b981';
  const radius = size * 0.15;
  
  // 둥근 사각형
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();

  // 텍스트로 간단한 꽃 이모지
  ctx.fillStyle = 'white';
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌸', size / 2, size / 2);

  return canvas;
}

// canvas 패키지 확인
try {
  sizes.forEach(size => {
    const canvas = createIcon(size);
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(__dirname, 'public', `icon-${size}x${size}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`✅ Created: icon-${size}x${size}.png`);
  });
  console.log('\n✨ 모든 PNG 아이콘 생성 완료!');
} catch (error) {
  console.log('❌ canvas 패키지가 필요합니다.');
  console.log('실행: npm install canvas');
  console.log('또는 브라우저에서: http://localhost:3000/icon-generator.html');
}
