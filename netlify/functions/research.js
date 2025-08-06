// Simplified serverless function for Netlify
export async function handler(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: 'Method not allowed'
      })
    };
  }

  try {
    console.log('Function started, parsing request body...');
    const projectData = JSON.parse(event.body);
    
    // Validate required fields
    if (!projectData.name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Project name is required',
          status: 'error'
        })
      };
    }

    console.log(`Starting analysis for project: ${projectData.name}`);

    // Set default values
    projectData.category = projectData.category || 'Unknown';
    projectData.contracts = projectData.contracts || [];

    // Simplified analysis without JuliaOS for now (to test the function works)
    const mockAnalysisResult = {
      project_name: projectData.name,
      analysis_timestamp: new Date().toISOString(),
      overall_recommendation: 'HOLD',
      consensus_score: Math.floor(Math.random() * 40) + 50, // 50-90
      confidence_level: Math.random() * 0.5 + 0.5, // 0.5-1.0
      
      executive_summary: `Mock analysis completed for ${projectData.name}. This is a demonstration of the Web3 Research Assistant using serverless functions. In production, this would coordinate multiple AI agents through the JuliaOS framework.`,
      
      key_findings: [
        'Serverless function deployment successful',
        'API endpoint responding correctly', 
        'CORS configuration working',
        'Project data validation passed'
      ],
      
      risk_factors: [
        'This is a demonstration with mock data',
        'Connect to JuliaOS backend for real AI analysis',
        'Add environment variables for API keys'
      ],
      
      detailed_analysis: {
        research: {
          overall_score: Math.floor(Math.random() * 30) + 60,
          website_quality: 'medium',
          team_analysis: 'Available in full version'
        },
        contracts: {
          total_contracts: projectData.contracts.length,
          message: 'Contract analysis available with JuliaOS backend'
        },
        market: {
          market_score: Math.floor(Math.random() * 30) + 50,
          social_sentiment: 'neutral',
          message: 'Market intelligence available with API keys'
        }
      },
      
      conflicts_identified: [],
      next_steps: [
        'Set up JuliaOS backend for full AI analysis',
        'Configure API keys in Netlify environment variables',
        'Connect to blockchain RPC endpoints'
      ],
      
      disclaimer: 'This is a demonstration mode. Full analysis requires JuliaOS backend connection.',
      demo_mode: true
    };

    console.log('Analysis completed, returning results...');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        report: mockAnalysisResult,
        generated_at: new Date().toISOString(),
        mode: 'demo'
      })
    };

  } catch (error) {
    console.error('Research API error:', error);
    console.error('Error stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message || 'Internal server error',
        details: 'Check Netlify function logs for more information',
        timestamp: new Date().toISOString()
      })
    };
  }
}