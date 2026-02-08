/**
 * Quick API validation test
 * Tests the activated validation on the live API
 */

const BASE_URL = 'http://localhost:3000';

async function testValidation() {
  console.log('================================================');
  console.log('   TESTING LIVE API VALIDATION');
  console.log('================================================\n');

  // Test 1: Invalid negative price
  console.log('Test 1: Negative price (should fail)');
  try {
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_price: -50000, // Negative price
        product_quantity: 1,
        customer_name: '테스트',
        customer_phone: '010-1234-5678',
        recipient_name: '수령인',
        recipient_phone: '010-8765-4321',
        recipient_address: '서울시 강남구',
        delivery_date: '2025-08-28',
        delivery_time: '14:00',
        product_type: '근조화환',
        product_name: '테스트 상품'
      })
    });
    
    const result = await response.json();
    
    if (response.status === 400 && result.details?.product_price) {
      console.log('  ✅ PASS - Validation caught negative price');
      console.log('  Error:', result.details.product_price);
    } else if (response.status === 401) {
      console.log('  ⚠️  Need authentication to test fully');
    } else {
      console.log('  ❌ FAIL - Negative price was accepted!');
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }

  console.log('');

  // Test 2: Invalid phone number
  console.log('Test 2: Invalid phone format (should fail)');
  try {
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_price: 100000,
        product_quantity: 1,
        customer_name: '테스트',
        customer_phone: '123456789', // Bad format
        recipient_name: '수령인',
        recipient_phone: '010-8765-4321',
        recipient_address: '서울시 강남구',
        delivery_date: '2025-08-28',
        delivery_time: '14:00',
        product_type: '근조화환',
        product_name: '테스트 상품'
      })
    });
    
    const result = await response.json();
    
    if (response.status === 400 && result.details?.customer_phone) {
      console.log('  ✅ PASS - Validation caught bad phone format');
      console.log('  Error:', result.details.customer_phone);
    } else if (response.status === 401) {
      console.log('  ⚠️  Need authentication to test fully');
    } else {
      console.log('  ❌ FAIL - Invalid phone was accepted!');
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }

  console.log('');

  // Test 3: Zero quantity
  console.log('Test 3: Zero quantity (should fail)');
  try {
    const response = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_price: 100000,
        product_quantity: 0, // Zero quantity
        customer_name: '테스트',
        customer_phone: '010-1234-5678',
        recipient_name: '수령인',
        recipient_phone: '010-8765-4321',
        recipient_address: '서울시 강남구',
        delivery_date: '2025-08-28',
        delivery_time: '14:00',
        product_type: '근조화환',
        product_name: '테스트 상품'
      })
    });
    
    const result = await response.json();
    
    if (response.status === 400 && result.details?.product_quantity) {
      console.log('  ✅ PASS - Validation caught zero quantity');
      console.log('  Error:', result.details.product_quantity);
    } else if (response.status === 401) {
      console.log('  ⚠️  Need authentication to test fully');
    } else {
      console.log('  ❌ FAIL - Zero quantity was accepted!');
    }
  } catch (error) {
    console.log('  ❌ Error:', error.message);
  }

  console.log('\n================================================');
  console.log('VALIDATION TEST COMPLETE');
  console.log('================================================');
  console.log('\nIf you see 401 errors, that means authentication');
  console.log('is working. Login and test through the UI.');
}

// Run the test
testValidation().catch(console.error);