import { ResearchAgent } from './ResearchAgent.js';
import { MarketAgent } from './MarketAgent.js';
import { ContractAgent } from './ContractAgent.js';

export class SwarmCoordinator {
  constructor() {
    // Initialize agent swarm
    this.agents = {
      research: new ResearchAgent(),
      market: new MarketAgent(),
      contract: new ContractAgent()
    };
    
    this.coordinationId = this.generateCoordinationId();
  }

  /**
   * Coordinate multi-agent research using JuliaOS framework
   */
  async coordinateResearch(projectData) {
    console.log(`🤖 Starting swarm coordination: ${this.coordinationId}`);
    console.log(`📊 Analyzing token: ${projectData.tokenInfo?.name || 'Unknown'}`);

    try {
      // Execute all agents in parallel for efficiency
      const [researchResult, marketResult, contractResult] = await Promise.allSettled([
        this.agents.research.analyzeProject(projectData),
        this.agents.market.analyzeMarket(projectData),
        this.executeContractAnalysis(projectData)
      ]);

      // Process results and handle any failures
      const research = this.processAgentResult(researchResult, 'research');
      const market = this.processAgentResult(marketResult, 'market');
      const contract = this.processAgentResult(contractResult, 'contract');

      // Calculate consensus using swarm intelligence
      const consensusScore = this.calculateConsensusScore(research, market, contract);
      
      // Generate coordinated analysis
      const coordinatedAnalysis = await this.generateCoordinatedAnalysis(
        research, market, contract, consensusScore
      );

      console.log(`✅ Swarm analysis complete: ${consensusScore}/100 consensus`);

      return {
        // Overall swarm results
        consensus_score: consensusScore,
        overall_recommendation: this.generateOverallRecommendation(consensusScore),
        confidence_level: this.calculateOverallConfidence(research, market, contract),
        
        // Executive summary
        executive_summary: coordinatedAnalysis.summary,
        key_findings: coordinatedAnalysis.findings,
        risk_factors: coordinatedAnalysis.risks,
        
        // Individual agent results
        detailed_analysis: {
          research: research,
          market: market,
          contract: contract
        },
        
        // Swarm metadata
        swarm_coordination: {
          coordination_id: this.coordinationId,
          agents_used: ['ResearchAgent', 'MarketAgent', 'ContractAgent'],
          juliaos_framework: true,
          analysis_timestamp: new Date().toISOString(),
          data_sources: ['CoinGecko', 'Birdeye', 'DexScreener'],
          llm_endpoints_used: this.getLLMEndpointsUsed(research, market, contract)
        }
      };

    } catch (error) {
      console.error('Swarm coordination failed:', error);
      return this.generateFailsafeAnalysis(projectData, error);
    } finally {
      // Cleanup all agents
      await this.cleanupAgents();
    }
  }

  /**
   * Execute contract analysis with proper address handling
   */
  async executeContractAnalysis(projectData) {
    // Extract contract address from project data
    let contractAddress = projectData.tokenInfo?.address;
    
    // If no direct address, try to derive from token data
    if (!contractAddress && projectData.marketData?.contract_address) {
      contractAddress = projectData.marketData.contract_address;
    }
    
    // If still no address, use symbol for analysis
    if (!contractAddress) {
      contractAddress = projectData.tokenInfo?.symbol || 'UNKNOWN';
    }

    // Determine blockchain (default to ethereum for established tokens)
    let blockchain = 'ethereum';
    if (contractAddress && contractAddress.length < 40) {
      blockchain = 'solana'; // Solana addresses are typically shorter
    }

    return await this.agents.contract.analyzeContract(contractAddress, blockchain);
  }

  /**
   * Process individual agent results and handle failures
   */
  processAgentResult(result, agentType) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    } else {
      console.warn(`${agentType} agent failed:`, result.reason);
      return this.generateAgentFallback(agentType);
    }
  }

  /**
   * Calculate consensus score using swarm intelligence
   */
  calculateConsensusScore(research, market, contract) {
    const scores = [];
    const weights = { research: 0.4, market: 0.4, contract: 0.2 };
    
    // Collect scores from each agent
    if (research.overall_score) scores.push({ score: research.overall_score, weight: weights.research });
    if (market.market_score) scores.push({ score: market.market_score, weight: weights.market });
    if (contract.security_score) scores.push({ score: contract.security_score, weight: weights.contract });
    
    // Calculate weighted average
    if (scores.length === 0) return 50; // Default neutral score
    
    const weightedSum = scores.reduce((sum, item) => sum + (item.score * item.weight), 0);
    const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
    
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Generate coordinated analysis by synthesizing agent results
   */
  async generateCoordinatedAnalysis(research, market, contract, consensusScore) {
    // Synthesize findings from all agents
    const allFindings = [
      ...(research.key_findings || []),
      ...(market.market_insights || []),
      ...(contract.recommendations || [])
    ];

    // Synthesize risks from all agents
    const allRisks = [
      ...(research.key_findings ? [] : ['Research analysis limitations detected']),
      ...(market.market_insights ? [] : ['Market analysis limitations detected']),
      ...(contract.risk_factors || [])
    ];

    // Generate executive summary based on consensus
    let summary;
    if (consensusScore >= 80) {
      summary = 'Multi-agent analysis reveals strong fundamentals across research, market, and technical dimensions. High confidence recommendation.';
    } else if (consensusScore >= 60) {
      summary = 'Swarm analysis shows positive indicators with some areas requiring caution. Moderate confidence in assessment.';
    } else if (consensusScore >= 40) {
      summary = 'Mixed signals detected across multiple analysis dimensions. Neutral stance recommended pending further research.';
    } else {
      summary = 'Multiple risk factors identified through comprehensive multi-agent analysis. High caution advised.';
    }

    return {
      summary,
      findings: allFindings.slice(0, 6), // Top 6 findings
      risks: allRisks.slice(0, 5) // Top 5 risks
    };
  }

  /**
   * Generate overall recommendation based on consensus
   */
  generateOverallRecommendation(consensusScore) {
    if (consensusScore >= 80) return 'STRONG BUY';
    if (consensusScore >= 65) return 'BUY';
    if (consensusScore >= 45) return 'HOLD';
    if (consensusScore >= 30) return 'SELL';
    return 'STRONG SELL';
  }

  /**
   * Calculate overall confidence from agent confidences
   */
  calculateOverallConfidence(research, market, contract) {
    const confidences = [
      research.confidence || 0.5,
      market.confidence || 0.5,
      contract.confidence || 0.5
    ];
    
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  /**
   * Get LLM endpoints used across all agents
   */
  getLLMEndpointsUsed(research, market, contract) {
    const endpoints = [];
    if (research.llm_endpoint) endpoints.push(research.llm_endpoint);
    if (market.llm_endpoint) endpoints.push(market.llm_endpoint);
    if (contract.llm_endpoint) endpoints.push(contract.llm_endpoint);
    
    return [...new Set(endpoints)]; // Remove duplicates
  }

  /**
   * Generate agent fallback when agent fails
   */
  generateAgentFallback(agentType) {
    const timestamp = new Date().toISOString();
    
    switch (agentType) {
      case 'research':
        return {
          overall_score: 50,
          legitimacy_assessment: 'Research analysis unavailable',
          key_findings: ['Agent temporarily unavailable'],
          confidence: 0.3,
          source: 'fallback',
          timestamp
        };
      case 'market':
        return {
          market_score: 50,
          price_analysis: 'Market analysis unavailable',
          market_insights: ['Agent temporarily unavailable'],
          confidence: 0.3,
          source: 'fallback',
          timestamp
        };
      case 'contract':
        return {
          security_score: 50,
          risk_level: 'MEDIUM',
          security_assessment: 'Contract analysis unavailable',
          risk_factors: ['Agent temporarily unavailable'],
          confidence: 0.3,
          source: 'fallback',
          timestamp
        };
      default:
        return { confidence: 0.3, source: 'fallback', timestamp };
    }
  }

  /**
   * Generate failsafe analysis when entire swarm fails
   */
  generateFailsafeAnalysis(projectData, error) {
    console.error('Generating failsafe analysis due to swarm failure:', error.message);
    
    return {
      consensus_score: 50,
      overall_recommendation: 'HOLD',
      confidence_level: 0.4,
      executive_summary: 'Analysis temporarily unavailable. Basic metrics provided.',
      key_findings: ['Multi-agent analysis system temporarily unavailable'],
      risk_factors: ['Unable to perform comprehensive analysis'],
      detailed_analysis: {
        research: this.generateAgentFallback('research'),
        market: this.generateAgentFallback('market'),
        contract: this.generateAgentFallback('contract')
      },
      swarm_coordination: {
        coordination_id: this.coordinationId,
        agents_used: [],
        juliaos_framework: false,
        analysis_timestamp: new Date().toISOString(),
        error: error.message,
        fallback_mode: true
      }
    };
  }

  /**
   * Cleanup all agents after analysis
   */
  async cleanupAgents() {
    try {
      await Promise.all([
        this.agents.research.cleanup(),
        this.agents.market.cleanup(),
        this.agents.contract.cleanup()
      ]);
      console.log(`🧹 Agent cleanup completed for coordination: ${this.coordinationId}`);
    } catch (error) {
      console.warn('Agent cleanup failed:', error.message);
    }
  }

  /**
   * Generate unique coordination ID
   */
  generateCoordinationId() {
    return `swarm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default SwarmCoordinator;