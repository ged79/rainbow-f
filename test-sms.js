// SMS API 테스트
// 브라우저 콘솔에서 실행

fetch('http://localhost:3000/api/sms/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '010-7741-4569',
    message: '[테스트] SMS 발송 테스트입니다'
  })
})
.then(res => res.json())
.then(data => console.log('결과:', data))
.catch(err => console.error('에러:', err))
