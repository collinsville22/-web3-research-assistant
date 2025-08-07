// Real AI-powered analysis for Netlify Functions with JuliaOS and External APIs
import { SwarmCoordinator } from '../../src/agents/SwarmCoordinator.js';

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ status: 'error', error: 'Method not allowed' })
    };
  }

  try {
    console.log('Starting AI-powered analysis...');
    const projectData = JSON.parse(event.body);
    
    if (!projectData.name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Project name is required', status: 'error' })
      };
    }

    // Set defaults
    projectData.category = projectData.category || 'Unknown';
    projectData.contracts = projectData.contracts || [];

    console.log(`Analyzing ${projectData.name} in ${projectData.category} category with real JuliaOS and external APIs...`);

    // Initialize SwarmCoordinator with real agents
    const swarmCoordinator = new SwarmCoordinator();
    
    // Execute real swarm-coordinated research with external APIs
    const analysisResult = await swarmCoordinator.coordinateResearch(projectData);

    console.log('Analysis completed successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        report: analysisResult,
        generated_at: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        error: error.message || 'Analysis failed',
        timestamp: new Date().toISOString()
      })
    };
  }
}

