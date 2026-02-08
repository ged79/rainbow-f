const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'public');
const OPTIMIZED_DIR = path.join(PUBLIC_DIR, 'optimized');

// 최적화 설정
const SIZES = {
  thumbnail: 200,    // 썸네일
  small: 400,        // 모바일
  medium: 800,       // 태블릿
  large: 1200,       // 데스크톱
  original: 1920     // 최대 크기
};

const QUALITY = {
  webp: 85,
  jpeg: 85
};

// 디렉토리 생성
if (!fs.existsSync(OPTIMIZED_DIR)) {
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

async function optimizeImage(inputPath, filename) {
  const ext = path.extname(filename).toLowerCase();
  const nameWithoutExt = path.basename(filename, ext);
  
  // 이미 최적화된 파일이거나 아이콘이면 건너뛰기
  if (
    filename.startsWith('icon-') || 
    filename === 'favicon.ico' ||
    filename === 'placeholder.jpg' ||
    filename === 'apple-touch-icon.png' ||
    ext === '.svg' ||
    ext === '.html' ||
    ext === '.js' ||
    ext === '.json'
  ) {
    console.log(`⏭️  Skip: ${filename}`);
    return;
  }

  console.log(`\n🔄 Processing: ${filename}`);
  
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    console.log(`   Original: ${metadata.width}x${metadata.height}, ${(metadata.size / 1024).toFixed(0)}KB`);
    
    let processedCount = 0;
    
    // WebP 변환 (여러 사이즈)
    for (const [sizeName, width] of Object.entries(SIZES)) {
      if (metadata.width < width && sizeName !== 'thumbnail') continue;
      
      const outputPath = path.join(OPTIMIZED_DIR, `${nameWithoutExt}-${sizeName}.webp`);
      
      await sharp(inputPath)
        .resize(width, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp({ quality: QUALITY.webp })
        .toFile(outputPath);
      
      const stats = fs.statSync(outputPath);
      console.log(`   ✅ ${sizeName}: ${(stats.size / 1024).toFixed(0)}KB (WebP)`);
      processedCount++;
    }
    
    // 원본 형식으로도 1개 생성 (fallback)
    const fallbackPath = path.join(OPTIMIZED_DIR, `${nameWithoutExt}-fallback.jpg`);
    await sharp(inputPath)
      .resize(1200, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: QUALITY.jpeg })
      .toFile(fallbackPath);
    
    const fallbackStats = fs.statSync(fallbackPath);
    console.log(`   ✅ fallback: ${(fallbackStats.size / 1024).toFixed(0)}KB (JPEG)`);
    
    console.log(`   ✨ Generated ${processedCount + 1} variants`);
    
  } catch (error) {
    console.error(`   ❌ Error processing ${filename}:`, error.message);
  }
}

async function optimizeAllImages() {
  console.log('🚀 Starting image optimization...\n');
  console.log(`Input directory: ${PUBLIC_DIR}`);
  console.log(`Output directory: ${OPTIMIZED_DIR}\n`);
  
  const startTime = Date.now();
  
  const files = fs.readdirSync(PUBLIC_DIR);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  });
  
  console.log(`Found ${imageFiles.length} images to optimize\n`);
  console.log('='.repeat(60));
  
  for (const file of imageFiles) {
    const inputPath = path.join(PUBLIC_DIR, file);
    await optimizeImage(inputPath, file);
  }
  
  console.log('\n' + '='.repeat(60));
  
  // 통계 계산
  const originalSize = files.reduce((sum, file) => {
    const filePath = path.join(PUBLIC_DIR, file);
    if (fs.statSync(filePath).isFile()) {
      return sum + fs.statSync(filePath).size;
    }
    return sum;
  }, 0);
  
  const optimizedFiles = fs.readdirSync(OPTIMIZED_DIR);
  const optimizedSize = optimizedFiles.reduce((sum, file) => {
    return sum + fs.statSync(path.join(OPTIMIZED_DIR, file)).size;
  }, 0);
  
  const savedSize = originalSize - optimizedSize;
  const savedPercent = ((savedSize / originalSize) * 100).toFixed(1);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('\n📊 Optimization Summary:');
  console.log(`   Original size:  ${(originalSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Optimized size: ${(optimizedSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   Saved:          ${(savedSize / (1024 * 1024)).toFixed(2)} MB (${savedPercent}%)`);
  console.log(`   Files created:  ${optimizedFiles.length}`);
  console.log(`   Time taken:     ${elapsed}s`);
  console.log('\n✅ Optimization complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Review optimized images in public/optimized/');
  console.log('   2. Update code to use optimized images');
  console.log('   3. Test image loading performance');
}

// 실행
optimizeAllImages().catch(console.error);
