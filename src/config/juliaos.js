import dotenv from 'dotenv';

dotenv.config();

export const JuliaOSConfig = {
  apiUrl: process.env.JULIAOS_API_URL || 'http://localhost:8000',
  apiKey: process.env.JULIAOS_API_KEY,
  
  // Agent configuration
  agents: {
    research: {
      name: 'web3-researcher',
      strategy: 'comprehensive_analysis',
      tools: ['web_scraper', 'document_analyzer', 'sentiment_analyzer']
    },
    contract: {
      name: 'contract-analyzer',
      strategy: 'security_audit',
      tools: ['solidity_parser', 'vulnerability_scanner', 'gas_analyzer']
    },
    market: {
      name: 'market-intelligence',
      strategy: 'market_analysis',
      tools: ['price_tracker', 'volume_analyzer', 'social_monitor']
    }
  },

  // Swarm configuration
  swarm: {
    name: 'research-swarm',
    coordination: 'consensus_based',
    agents: ['research', 'contract', 'market']
  }
};

export default JuliaOSConfig;