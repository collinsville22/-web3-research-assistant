// Test Solana Tracker API connectivity
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const API_KEY = '2bd9911b-59a9-4db3-a45a-d243f9f7da80';
    const BASE_URL = 'https://api.solanatracker.io';
    
    // Test with a well-known Solana token (e.g., BONK)
    const testToken = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'; // BONK token
    
    console.log('🧪 Testing Solana Tracker API...');
    console.log('🔑 API Key:', API_KEY.slice(0, 8) + '...' + API_KEY.slice(-4));
    console.log('🌐 Base URL:', BASE_URL);
    console.log('🪙 Test Token:', testToken);
    
    const testHeaders = {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Test different endpoint variations
    const endpoints = [
      `${BASE_URL}/tokens/${testToken}`,
      `${BASE_URL}/token/${testToken}`,
      `${BASE_URL}/v1/tokens/${testToken}`,
      `${BASE_URL}/api/tokens/${testToken}`,
      `${BASE_URL}/tokens/${testToken}/holders`,
      `${BASE_URL}/token/${testToken}/trades`
    ];
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🚀 Testing endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: testHeaders,
          timeout: 10000
        });
        
        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            endpoint,
            status: response.status,
            success: true,
            dataKeys: Object.keys(data || {}),
            dataType: Array.isArray(data) ? `array[${data.length}]` : typeof data,
            sample: JSON.stringify(data).slice(0, 200) + '...'
          });
        } else {
          const errorText = await response.text();
          results.push({
            endpoint,
            status: response.status,
            success: false,
            error: errorText,
            headers: Object.fromEntries(response.headers.entries())
          });
        }
      } catch (fetchError) {
        results.push({
          endpoint,
          success: false,
          error: fetchError.message,
          type: 'fetch_error'
        });
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Solana Tracker API Test Complete',
        apiKey: API_KEY.slice(0, 8) + '...' + API_KEY.slice(-4),
        baseUrl: BASE_URL,
        testToken,
        results,
        summary: {
          totalTests: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        },
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Test failed',
        message: error.message,
        stack: error.stack
      })
    };
  }
};