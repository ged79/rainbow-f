export default function TestImage() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">이미지 테스트</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg mb-2">1. img 태그로 직접 로드</h2>
          <img src="/장례식.jpg" alt="장례식" className="w-64 h-48 object-cover" />
        </div>

        <div>
          <h2 className="text-lg mb-2">2. background-image로 로드</h2>
          <div 
            className="w-64 h-48 bg-cover bg-center"
            style={{ backgroundImage: `url(/장례식.jpg)` }}
          />
        </div>

        <div>
          <h2 className="text-lg mb-2">3. background-image 블러 효과</h2>
          <div 
            className="w-64 h-48 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(/장례식.jpg)`,
              filter: 'blur(20px) brightness(0.3)'
            }}
          />
        </div>

        <div>
          <h2 className="text-lg mb-2">4. 실제 적용될 스타일 (relative parent)</h2>
          <div className="relative w-64 h-48">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(/장례식.jpg)`,
                filter: 'blur(20px) brightness(0.3)',
                transform: 'scale(1.1)'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-gray-50" />
            <div className="relative z-10 flex items-center justify-center h-full">
              <p className="text-white text-xl font-bold">테스트 텍스트</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
