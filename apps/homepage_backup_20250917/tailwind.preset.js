// tailwind.config.js 추가 설정
module.exports = {
  theme: {
    extend: {
      spacing: {
        'section': '80px',  // 섹션 간격
        'container': '1280px', // 컨테이너 최대폭
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.1)',
        'nav': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      }
    }
  }
}