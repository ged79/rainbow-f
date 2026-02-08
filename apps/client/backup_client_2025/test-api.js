// API Integration Tests
// Run: node test-api.js (requires running Next.js server)

const BASE_URL = 'http://localhost:3000/api';

// Test configuration
const tests = {
  health: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    return {
      name: 'Health Check',
      passed: res.ok && data.status === 'healthy',
      details: data
    };
  },
  
  orders: async (token) => {
    const res = await fetch(`${BASE_URL}/orders?type=received&limit=5`, {
      headers: { 'Cookie': `sb-access-token=${token}` }
    });
    return {
      name: 'Get Orders',
      passed: res.ok,
      details: await res.json()
    };
  },
  
  settlements: async (token) => {
    const res = await fetch(`${BASE_URL}/settlements`, {
      headers: { 'Cookie': `sb-access-token=${token}` }
    });
    return {
      name: 'Get Settlements',
      passed: res.ok,
      details: await res.json()
    };
  },
  
  points: async (token) => {
    const res = await fetch(`${BASE_URL}/points`, {
      headers: { 'Cookie': `sb-access-token=${token}` }
    });
    return {
      name: 'Get Points',
      passed: res.ok,
      details: await res.json()
    };
  }
};

// Run tests
async function runTests() {
  console.log('=== API Test Suite ===\n');
  
  // Get auth token from browser localStorage or pass as argument
  const token = process.argv[2];
  
  if (!token) {
    console.log('⚠️  No auth token provided. Run authenticated tests from browser console.');
    console.log('   Or pass token: node test-api.js YOUR_TOKEN\n');
  }
  
  for (const [key, test] of Object.entries(tests)) {
    try {
      if (key !== 'health' && !token) continue;
      
      const result = await test(token);
      console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
      if (!result.passed && result.details) {
        console.log('   Error:', result.details.error || result.details);
      }
    } catch (error) {
      console.log(`❌ ${key}: ${error.message}`);
    }
  }
  
  console.log('\n=== Test Complete ===');
}

runTests();
