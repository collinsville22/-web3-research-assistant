import express from 'express';
import dotenv from 'dotenv';
import SwarmCoordinator from '../agents/SwarmCoordinator.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(dirname(__dirname), 'public')));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

const swarmCoordinator = new SwarmCoordinator();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Web3 Research Assistant',
    timestamp: new Date().toISOString()
  });
});

// Main research endpoint
app.post('/api/research', async (req, res) => {
  try {
    const projectData = req.body;
    
    // Validate required fields
    if (!projectData.name) {
      return res.status(400).json({
        error: 'Project name is required',
        status: 'error'
      });
    }

    // Set default values
    projectData.category = projectData.category || 'Unknown';
    projectData.contracts = projectData.contracts || [];

    console.log(`Starting research for project: ${projectData.name}`);

    // Execute swarm-coordinated research
    const researchReport = await swarmCoordinator.coordinateResearch(projectData);

    res.json({
      status: 'success',
      report: researchReport,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Research API error:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Individual agent endpoints for testing
app.post('/api/research/basic', async (req, res) => {
  try {
    const researchAgent = swarmCoordinator.agents.research;
    const result = await researchAgent.analyzeProject(req.body);
    res.json({ status: 'success', analysis: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/research/contract', async (req, res) => {
  try {
    const { address, blockchain = 'ethereum' } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Contract address is required' });
    }

    const contractAgent = swarmCoordinator.agents.contract;
    const result = await contractAgent.analyzeContract(address, blockchain);
    res.json({ status: 'success', analysis: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.post('/api/research/market', async (req, res) => {
  try {
    const marketAgent = swarmCoordinator.agents.market;
    const result = await marketAgent.analyzeMarket(req.body);
    res.json({ status: 'success', analysis: result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Get example project data
app.get('/api/example', (req, res) => {
  res.json({
    name: "ExampleDeFi Protocol",
    category: "DeFi",
    website: "https://example.com",
    whitepaper: "https://example.com/whitepaper.pdf",
    token_symbol: "EXMPL",
    contracts: [
      {
        address: "0x1234567890123456789012345678901234567890",
        blockchain: "ethereum",
        purpose: "main_contract"
      },
      {
        address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        blockchain: "solana",
        purpose: "token_program"
      }
    ],
    description: "A decentralized finance protocol for yield farming and liquidity provision",
    social_links: {
      twitter: "https://twitter.com/exampledefi",
      discord: "https://discord.gg/exampledefi",
      telegram: "https://t.me/exampledefi"
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    status: 'error',
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'POST /api/research',
      'POST /api/research/basic',
      'POST /api/research/contract',
      'POST /api/research/market',
      'GET /api/example'
    ]
  });
});

app.listen(port, () => {
  console.log(`🚀 Web3 Research Assistant API running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔬 Research endpoint: http://localhost:${port}/api/research`);
  console.log(`📋 Example data: http://localhost:${port}/api/example`);
});

export default app;