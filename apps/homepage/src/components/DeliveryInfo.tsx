import { Truck, Clock, Shield, Phone, MapPin, Mail, Building, Award } from 'lucide-react'

const deliveryFeatures = [
  {
    icon: Truck,
    title: '전국 당일배송',
    description: '오후 2시 이전 주문시',
  },
  {
    icon: Clock,
    title: '시간 지정 배송',
    description: '원하는 시간 정확히',
  },
  {
    icon: Shield,
    title: '신선도 보장',
    description: '100% 만족 보증',
  },
  {
    icon: Phone,
    title: '24시간 상담',
    description: '언제든 문의 가능',
  }
]

export default function DeliveryInfo() {
  return (
    <footer className="bg-gradient-to-b from-white to-neutral-50/50 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Delivery Features - 미니멀하게 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12">
          {deliveryFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div
                key={index}
                className="text-center p-4 bg-white rounded-lg border border-neutral-100 hover:shadow-sm transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-neutral-50 mb-2">
                  <IconComponent className="w-4 h-4 text-neutral-600" strokeWidth={1.5} />
                </div>
                <h3 className="text-[12px] md:text-sm font-medium text-neutral-900 mb-0.5">
                  {feature.title}
                </h3>
                <p className="text-[10px] md:text-xs text-neutral-500">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Company Info - 프리미엄 레이아웃 */}
        <div className="border-t border-neutral-100 pt-8 md:pt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            {/* Brand */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">BLOOM</h3>
              <p className="text-[11px] md:text-xs text-neutral-500 leading-relaxed mb-4">
                특별한 순간을 더욱 아름답게 만들어드립니다.<br/>
                최고의 품질과 정성으로 마음을 전합니다.
              </p>
              <div className="flex gap-3">
                {/* Social Icons */}
                <a href="#" className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <span className="text-[10px] font-medium text-neutral-600">IG</span>
                </a>
                <a href="#" className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <span className="text-[10px] font-medium text-neutral-600">FB</span>
                </a>
                <a href="#" className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <span className="text-[10px] font-medium text-neutral-600">N</span>
                </a>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">고객센터</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-base md:text-lg font-light text-neutral-900">1588-1234</p>
                  <p className="text-[10px] md:text-xs text-neutral-500">
                    평일 09:00 - 18:00 / 주말 10:00 - 17:00
                  </p>
                </div>
                <div className="text-[11px] md:text-xs text-neutral-500 space-y-1">
                  <p>support@bloom.kr</p>
                  <p>카카오톡: @bloom</p>
                </div>
              </div>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">회사정보</h3>
              <div className="text-[11px] md:text-xs text-neutral-500 space-y-1">
                <p>주식회사 블룸</p>
                <p>대표: 홍길동</p>
                <p>사업자등록번호: 123-45-67890</p>
                <p>서울 강남구 테헤란로 123</p>
              </div>
            </div>
          </div>

          {/* Bottom Links & Copyright */}
          <div className="mt-8 md:mt-10 pt-6 md:pt-8 border-t border-neutral-100">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Links */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 text-[11px] md:text-xs">
                <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors">이용약관</a>
                <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors">개인정보처리방침</a>
                <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors">사업자정보확인</a>
                <a href="#" className="text-neutral-500 hover:text-neutral-900 transition-colors">제휴문의</a>
              </div>
              
              {/* Copyright */}
              <p className="text-[10px] md:text-xs text-neutral-400">
                © 2024 Bloom. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}