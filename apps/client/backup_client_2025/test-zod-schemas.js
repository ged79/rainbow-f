/**
 * Test Zod validation schemas
 * This tests the validation logic without making API calls
 */

// Import the validation schemas
const { createOrderSchema, formatValidationErrors } = require('./src/lib/validation/schemas.ts');

// Test cases
const testCases = [
  {
    name: 'Valid order',
    input: {
      product_price: 100000,
      product_quantity: 1,
      customer_name: '홍길동',
      customer_phone: '010-1234-5678',
      recipient_name: '김영희',
      recipient_phone: '010-8765-4321',
      recipient_address: '서울시 강남구',
      delivery_date: '2025-08-28',
      delivery_time: '14:00',
      product_type: '축하화환',
      product_name: '프리미엄 화환'
    },
    shouldPass: true
  },
  {
    name: 'Invalid: Negative price',
    input: {
      product_price: -50000,
      product_quantity: 1,
      customer_name: '홍길동',
      customer_phone: '010-1234-5678',
      recipient_name: '김영희',
      recipient_phone: '010-8765-4321',
      recipient_address: '서울시 강남구',
      delivery_date: '2025-08-28',
      delivery_time: '14:00',
      product_type: '축하화환',
      product_name: '프리미엄 화환'
    },
    shouldPass: false
  },
  {
    name: 'Invalid: Bad phone number',
    input: {
      product_price: 100000,
      product_quantity: 1,
      customer_name: '홍길동',
      customer_phone: '123456789', // Bad format
      recipient_name: '김영희',
      recipient_phone: '010-8765-4321',
      recipient_address: '서울시 강남구',
      delivery_date: '2025-08-28',
      delivery_time: '14:00',
      product_type: '축하화환',
      product_name: '프리미엄 화환'
    },
    shouldPass: false
  }
];

console.log('=================================');
console.log('ZOD VALIDATION SCHEMA TEST');
console.log('=================================\n');

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  console.log(`Testing: ${test.name}`);
  
  try {
    const result = createOrderSchema.parse(test.input);
    
    if (test.shouldPass) {
      console.log('  ✅ PASS - Valid data accepted');
      passed++;
    } else {
      console.log('  ❌ FAIL - Invalid data was not rejected');
      failed++;
    }
  } catch (error) {
    if (!test.shouldPass) {
      console.log('  ✅ PASS - Invalid data rejected');
      if (error.errors) {
        console.log('    Errors:', formatValidationErrors(error));
      }
      passed++;
    } else {
      console.log('  ❌ FAIL - Valid data was rejected');
      console.log('    Error:', error.message);
      failed++;
    }
  }
  console.log('');
});

console.log('=================================');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('=================================');
