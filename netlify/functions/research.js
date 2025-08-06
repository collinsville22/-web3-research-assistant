import SwarmCoordinator from '../../src/agents/SwarmCoordinator.js';

const swarmCoordinator = new SwarmCoordinator();

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

    // Set default values
    projectData.category = projectData.category || 'Unknown';
    projectData.contracts = projectData.contracts || [];

    console.log(`Starting research for project: ${projectData.name}`);

    // Execute swarm-coordinated research
    const researchReport = await swarmCoordinator.coordinateResearch(projectData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        report: researchReport,
        generated_at: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Research API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}