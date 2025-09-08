#!/usr/bin/env node

/**
 * CORS Test Script for SmartPay Backend
 * 
 * This script helps test CORS configuration by making requests to your backend
 * from different origins to verify the CORS setup is working correctly.
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://smartpay-2qq5.onrender.com';
const TEST_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://smartpay-v1-0.onrender.com' // Your live frontend domain
];

async function testCORS() {
  console.log('🧪 Testing CORS Configuration for SmartPay Backend');
  console.log(`📡 Backend URL: ${BACKEND_URL}`);
  console.log('='.repeat(60));

  for (const origin of TEST_ORIGINS) {
    console.log(`\n🌐 Testing origin: ${origin}`);
    
    try {
      // Test health endpoint
      const response = await axios.get(`${BACKEND_URL}/health`, {
        headers: {
          'Origin': origin,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      console.log(`✅ Health check successful (${response.status})`);
      console.log(`📊 Response: ${JSON.stringify(response.data, null, 2)}`);

    } catch (error) {
      if (error.response) {
        console.log(`❌ Request failed with status: ${error.response.status}`);
        console.log(`📝 Error: ${error.response.data?.message || error.message}`);
      } else if (error.request) {
        console.log(`❌ No response received from server`);
        console.log(`📝 Error: ${error.message}`);
      } else {
        console.log(`❌ Request setup error: ${error.message}`);
      }
    }
  }

  // Test preflight request
  console.log('\n🔄 Testing Preflight (OPTIONS) Request');
  try {
    const response = await axios.options(`${BACKEND_URL}/api/users`, {
      headers: {
        'Origin': TEST_ORIGINS[0],
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      },
      timeout: 5000
    });

    console.log(`✅ Preflight request successful (${response.status})`);
    console.log(`📋 CORS Headers: ${JSON.stringify(response.headers, null, 2)}`);

  } catch (error) {
    console.log(`❌ Preflight request failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 CORS testing completed!');
  console.log('\n💡 Tips:');
  console.log('- If tests fail, check your ALLOWED_ORIGINS environment variable');
  console.log('- Make sure your backend server is running');
  console.log('- Verify the backend URL is correct');
  console.log('- Check server logs for CORS-related errors');
}

// Run the test
if (require.main === module) {
  testCORS().catch(console.error);
}

module.exports = { testCORS };
