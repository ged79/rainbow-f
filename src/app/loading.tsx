export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-screen relative">
        <img 
          src="/데이지.jpg" 
          alt="Loading" 
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse">
              <h2 className="text-2xl font-light text-white mb-2">BLOOM</h2>
              <p className="text-white/80">잠시만 기다려주세요...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}