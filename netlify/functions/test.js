exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const timestamp = new Date().toISOString();
  const randomId = Math.random().toString(36).substr(2, 9);
  
  console.log(`🧪 TEST ENDPOINT CALLED:`, {
    timestamp,
    randomId,
    method: event.httpMethod,
    body: event.body,
    query: event.queryStringParameters
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'Test endpoint working!',
      timestamp,
      randomId,
      method: event.httpMethod,
      body: event.body ? JSON.parse(event.body) : null,
      query: event.queryStringParameters,
      serverTime: Date.now()
    })
  };
};