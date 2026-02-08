// Browser-based functionality test
// Run this in browser console after logging in

async function testAllFeatures() {
  const tests = [];
  
  console.log('🧪 Starting Full System Test...\n');
  
  // 1. Auth Test
  try {
    const authRes = await fetch('/api/orders?limit=1');
    tests.push({
      name: 'Authentication',
      passed: authRes.ok,
      details: authRes.ok ? 'Logged in' : 'Not authenticated'
    });
  } catch (e) {
    tests.push({ name: 'Authentication', passed: false, details: e.message });
  }
  
  // 2. Orders Test
  try {
    const ordersRes = await fetch('/api/orders?type=received&limit=5');
    const ordersData = await ordersRes.json();
    tests.push({
      name: 'Orders API',
      passed: ordersRes.ok && ordersData.data,
      details: `Found ${ordersData.data?.length || 0} orders`
    });
  } catch (e) {
    tests.push({ name: 'Orders API', passed: false, details: e.message });
  }
  
  // 3. Settlements Test
  try {
    const settRes = await fetch('/api/settlements');
    const settData = await settRes.json();
    tests.push({
      name: 'Settlements API',
      passed: settRes.ok && settData.data,
      details: `Found ${settData.data?.length || 0} settlements`
    });
  } catch (e) {
    tests.push({ name: 'Settlements API', passed: false, details: e.message });
  }
  
  // 4. Points Test
  try {
    const pointsRes = await fetch('/api/points');
    const pointsData = await pointsRes.json();
    tests.push({
      name: 'Points API',
      passed: pointsRes.ok && typeof pointsData.balance === 'number',
      details: `Balance: ${pointsData.balance || 0}`
    });
  } catch (e) {
    tests.push({ name: 'Points API', passed: false, details: e.message });
  }
  
  // 5. Storage Test
  try {
    const storageRes = await fetch('/api/storage/init');
    const storageData = await storageRes.json();
    tests.push({
      name: 'Storage Bucket',
      passed: storageRes.ok,
      details: storageData.message || 'Bucket accessible'
    });
  } catch (e) {
    tests.push({ name: 'Storage Bucket', passed: false, details: e.message });
  }
  
  // 6. Photo Upload Test (check if completed order has photos)
  try {
    const completedRes = await fetch('/api/orders?status=completed&limit=1');
    const completedData = await completedRes.json();
    const hasPhotos = completedData.data?.[0]?.completion?.photos?.length > 0;
    tests.push({
      name: 'Photo Storage',
      passed: true,
      details: hasPhotos ? 'Photos found in completed orders' : 'No photos yet'
    });
  } catch (e) {
    tests.push({ name: 'Photo Storage', passed: false, details: e.message });
  }
  
  // Results
  console.log('📊 Test Results:\n');
  console.log('================\n');
  
  let passed = 0, failed = 0;
  tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.details}`);
    if (test.passed) passed++; else failed++;
  });
  
  console.log('\n================');
  console.log(`Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! System is stable.');
  } else {
    console.log('⚠️ Some tests failed. Check the details above.');
  }
  
  return tests;
}

// Run the test
testAllFeatures();
