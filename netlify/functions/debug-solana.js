// Minimal Solana Tracker API test
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

  const API_KEY = '2bd9911b-59a9-4db3-a45a-d243f9f7da80';
  const TEST_TOKEN = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'; // BONK
  
  console.log('🔥 STARTING DIRECT SOLANA TRACKER TEST');
  console.log('🔑 API Key:', API_KEY);
  console.log('🪙 Test Token:', TEST_TOKEN);

  // Test different header combinations
  const headerTests = [
    { 'X-API-Key': API_KEY },
    { 'x-api-key': API_KEY },
    { 'Authorization': `Bearer ${API_KEY}` },
    { 'Authorization': `${API_KEY}` },
    { 'api-key': API_KEY },
    { 'apikey': API_KEY }
  ];

  // Test different base URLs
  const baseUrls = [
    'https://data.solanatracker.io/api/v1',
    'https://api.solanatracker.io',
    'https://data.solanatracker.io',
    'https://solanatracker.io/api'
  ];

  const results = [];

  for (let i = 0; i < baseUrls.length; i++) {
    const baseUrl = baseUrls[i];
    
    for (let j = 0; j < headerTests.length; j++) {
      const authHeader = headerTests[j];
      
      const testUrl = `${baseUrl}/tokens/${TEST_TOKEN}`;
      
      try {
        console.log(`\n🚀 Testing: ${testUrl}`);
        console.log(`🔐 Headers:`, authHeader);
        
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 15000
        });

        console.log(`📊 Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ SUCCESS! Got data:`, Object.keys(data));
          
          results.push({
            url: testUrl,
            headers: authHeader,
            status: response.status,
            success: true,
            dataKeys: Object.keys(data),
            sampleData: JSON.stringify(data).substring(0, 500) + '...'
          });
        } else {
          const errorText = await response.text();
          console.log(`❌ Error: ${response.status} - ${errorText}`);
          
          results.push({
            url: testUrl,
            headers: authHeader,
            status: response.status,
            success: false,
            error: errorText
          });
        }
        
      } catch (error) {
        console.log(`❌ Fetch Error: ${error.message}`);
        
        results.push({
          url: testUrl,
          headers: authHeader,
          success: false,
          error: error.message,
          type: 'network_error'
        });
      }
    }
  }

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n📈 SUMMARY:`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  if (successful.length > 0) {
    console.log(`🎯 WORKING ENDPOINTS:`);
    successful.forEach(s => {
      console.log(`   ${s.url} with headers:`, s.headers);
    });
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Solana Tracker Direct Test Complete',
      apiKey: API_KEY,
      testToken: TEST_TOKEN,
      results: {
        successful,
        failed,
        total: results.length
      },
      summary: {
        totalTests: results.length,
        successCount: successful.length,
        failureCount: failed.length,
        workingEndpoints: successful.map(s => ({ url: s.url, headers: s.headers }))
      }
    })
  };
};