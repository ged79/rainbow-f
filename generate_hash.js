// bcrypt 해시 생성 유틸리티
// 사용법: node generate_hash.js <password>

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('사용법: node generate_hash.js <password>');
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n비밀번호:', password);
console.log('해시:', hash);
console.log('\nSQL 업데이트 명령:');
console.log(`UPDATE funeral_homes SET password_hash = '${hash}' WHERE login_id = 'your_login_id';`);
