# 🤖 Web3 Research Assistant

An AI-powered decentralized application for comprehensive Web3 project research and due diligence, built with the **JuliaOS framework**. This dApp leverages autonomous AI agents and swarm intelligence to analyze blockchain projects across multiple dimensions including technology, security, market dynamics, and risk assessment.

## 🎯 Overview

The Web3 Research Assistant demonstrates the power of JuliaOS by coordinating multiple AI agents that work together to provide comprehensive analysis of Web3 projects. It combines:

- **AI Agent Execution** using JuliaOS's `agent.useLLM()` API
- **Swarm Intelligence** for coordinated multi-agent analysis  
- **Blockchain Integration** supporting Ethereum, Solana, and other chains
- **Advanced Risk Assessment** through automated security audits
- **Real-time Market Intelligence** and sentiment analysis

## 🏗️ Architecture

### Core Components

1. **ResearchAgent** - Analyzes project fundamentals, documentation, and team
2. **ContractAgent** - Performs smart contract security audits and functionality analysis
3. **MarketAgent** - Evaluates market position, sentiment, and competitive landscape
4. **SwarmCoordinator** - Orchestrates agent collaboration using JuliaOS swarm APIs

### JuliaOS Integration

```javascript
// Core agent functionality using JuliaOS
async useLLM(prompt, context = {}) {
  const response = await axios.post(`${this.apiUrl}/api/agents/llm`, {
    agent_name: this.config.name,
    prompt: prompt,
    context: context,
    strategy: this.config.strategy,
    tools: this.config.tools
  });
  return response.data;
}

// Swarm coordination
const swarmSession = await this.initializeSwarm(projectData);
const coordinatedAnalysis = await this.coordinateResults(agentResults, swarmSession);
```

## 🚀 Quick Start

### Prerequisites

- **Julia** (v1.11.4+) - [Download Julia](https://julialang.org/downloads/)
- **Python** (v3.11+) - Required for JuliaOS backend
- **Node.js** (v18+) - For the dApp frontend/API
- **JuliaOS Backend** - Follow [JuliaOS setup guide](https://docs.juliaos.com)

### 1. Install JuliaOS Backend

```bash
# Clone JuliaOS repository
git clone https://github.com/Juliaoscode/JuliaOS.git
cd JuliaOS/backend

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start with Docker (recommended)
docker compose up

# OR start manually
julia --project=. -e "using Pkg; Pkg.instantiate()"
julia --project=. src/main.jl
```

### 2. Setup Web3 Research Assistant

```bash
# Clone this repository
git clone <your-repo-url>
cd web3-research-assistant

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys and JuliaOS endpoint
```

### 3. Configure Environment

Edit `.env` file with your configuration:

```bash
# JuliaOS Configuration
JULIAOS_API_URL=http://localhost:8000
JULIAOS_API_KEY=your_api_key_here

# OpenAI API Key (for LLM functionality)
OPENAI_API_KEY=your_openai_api_key_here

# Blockchain RPC URLs
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ETHERSCAN_API_KEY=your_etherscan_api_key

# External APIs for enhanced research
COINGECKO_API_KEY=your_coingecko_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

## 📊 Usage

### Command Line Interface

```bash
# Generate example project data
npm start example

# Analyze a project from file
npm start analyze -f example-project.json

# Analyze with manual input
npm start analyze -n "Uniswap" -c "DeFi" -w "https://uniswap.org"

# Analyze specific contract
npm start contract -a "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984" -b "ethereum"

# Start API server
npm start server
```

### Web Interface

```bash
# Start the API server
npm start server

# Open browser to http://localhost:3000
# Use the interactive web interface to analyze projects
```

### API Endpoints

```bash
# Health check
GET /health

# Full project analysis
POST /api/research
{
  "name": "Project Name",
  "category": "DeFi",
  "website": "https://example.com",
  "whitepaper": "https://example.com/whitepaper.pdf",
  "token_symbol": "TOKEN",
  "contracts": [
    {
      "address": "0x...",
      "blockchain": "ethereum"
    }
  ]
}

# Individual agent analysis
POST /api/research/basic      # Research agent only
POST /api/research/contract   # Contract agent only  
POST /api/research/market     # Market agent only
```

## 🔬 Example Analysis Flow

1. **Input Project Data**
   ```json
   {
     "name": "DeFi Innovation Protocol",
     "category": "DeFi", 
     "website": "https://defi-innovation.example.com",
     "contracts": [
       {
         "address": "0x1234...",
         "blockchain": "ethereum"
       }
     ]
   }
   ```

2. **Swarm Coordination**
   - Initialize JuliaOS swarm session
   - Deploy Research, Contract, and Market agents in parallel
   - Each agent uses `agent.useLLM()` for AI-powered analysis

3. **AI Analysis Results**
   ```json
   {
     "overall_recommendation": "BUY",
     "consensus_score": 78,
     "confidence_level": 0.85,
     "executive_summary": "Strong fundamentals with medium security risk",
     "key_findings": [
       "Innovative tokenomics design",
       "Experienced team with DeFi background",
       "Active community growth"
     ],
     "risk_factors": [
       "Unaudited smart contracts",
       "High market volatility"  
     ]
   }
   ```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Test individual components
node src/tests/agents.test.js

# Integration test with live JuliaOS backend
npm run test:integration
```

## 🏛️ JuliaOS Framework Features Demonstrated

### ✅ Required Features

- **Agent Execution**: All agents use `agent.useLLM()` for AI-powered analysis
- **Autonomous Operation**: Agents work independently with minimal human intervention
- **Strategy-Based Processing**: Each agent follows specific analysis strategies

### 🌟 Optional Features (Implemented)

- **Swarm Integration**: `SwarmCoordinator` uses JuliaOS swarm APIs for multi-agent orchestration
- **Blockchain Functionality**: Native support for Ethereum and Solana contract analysis  
- **Web Interface**: Custom React-style frontend for enhanced user experience
- **Cross-Chain Support**: Analyzes projects across multiple blockchain networks

### 🔧 Advanced Capabilities

- **Consensus Mechanisms**: Agents coordinate to reach consensus on risk assessments
- **Conflict Resolution**: Automatic detection and reporting of conflicting agent assessments
- **Fallback Systems**: Graceful degradation when JuliaOS backend is unavailable
- **Real-time Processing**: Streaming analysis results with progress indicators

## 📁 Project Structure

```
web3-research-assistant/
├── src/
│   ├── agents/                 # AI Agent implementations
│   │   ├── BaseAgent.js       # JuliaOS integration base class
│   │   ├── ResearchAgent.js   # Project fundamentals analysis
│   │   ├── ContractAgent.js   # Smart contract security audit
│   │   ├── MarketAgent.js     # Market intelligence & sentiment  
│   │   └── SwarmCoordinator.js # Multi-agent orchestration
│   ├── api/
│   │   └── server.js          # Express.js API server
│   ├── config/
│   │   └── juliaos.js         # JuliaOS configuration
│   ├── public/
│   │   └── index.html         # Web interface
│   ├── tests/
│   │   └── agents.test.js     # Comprehensive test suite
│   └── index.js               # CLI entry point
├── package.json
├── .env.example
└── README.md
```

## 🛡️ Security & Risk Management

### Built-in Security Features

- **API Key Protection**: Secure handling of external API credentials
- **Input Validation**: Comprehensive validation of user inputs
- **Rate Limiting**: Protection against API abuse
- **Error Handling**: Graceful error recovery and user feedback

### Risk Assessment Framework

The dApp provides multi-layered risk assessment:

1. **Technical Risk**: Smart contract vulnerabilities, code quality
2. **Market Risk**: Price volatility, liquidity concerns  
3. **Operational Risk**: Team background, project governance
4. **Regulatory Risk**: Compliance and legal considerations

## 🚀 Deployment

### Local Development

```bash
npm run dev
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start server --port 8080

# Or deploy to cloud platform
# (Vercel, Netlify, AWS, etc.)
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 3000
CMD ["npm", "start", "server"]
```

## 📊 Performance & Scalability

- **Parallel Processing**: Agents execute concurrently for faster analysis
- **Caching**: Intelligent caching of API responses and analysis results
- **Load Balancing**: Multiple agent instances for high-throughput scenarios
- **Monitoring**: Built-in performance metrics and health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **JuliaOS Team** for providing the AI agent framework
- **Solana Foundation** for blockchain infrastructure
- **OpenAI** for LLM capabilities
- **Web3 Community** for inspiration and feedback

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/your-username/web3-research-assistant/issues)
- **Documentation**: [Project Wiki](https://github.com/your-username/web3-research-assistant/wiki)
- **Community**: [Discord Server](https://discord.gg/your-discord)

---

**⚠️ Disclaimer**: This tool is for educational and research purposes only. It should not be considered as financial advice. Always conduct your own research and consult with financial professionals before making investment decisions.

**Built with ❤️ using JuliaOS Framework**