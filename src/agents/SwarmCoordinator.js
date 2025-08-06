import BaseAgent from './BaseAgent.js';
import JuliaOSSwarmClient from '../juliaos/JuliaOSSwarmClient.js';
import ResearchAgent from './ResearchAgent.js';
import ContractAgent from './ContractAgent.js';
import MarketAgent from './MarketAgent.js';
import { JuliaOSConfig } from '../config/juliaos.js';

export class SwarmCoordinator extends BaseAgent {
  constructor() {
    super('research');
    this.juliaosSwarm = new JuliaOSSwarmClient();
    this.fallbackAgents = {
      research: new ResearchAgent(),
      contract: new ContractAgent(),
      market: new MarketAgent()
    };
    this.swarmConfig = JuliaOSConfig.swarm;
    this.useJuliaOS = false;
  }

  async coordinateResearch(projectData) {
    await this.log('Starting swarm-coordinated research analysis');

    try {
      // Try to initialize JuliaOS swarm first
      const swarmSession = await this.initializeSwarm(projectData);
      
      let coordinatedAnalysis;
      
      if (this.useJuliaOS) {
        // Use real JuliaOS swarm coordination
        await this.log('Executing JuliaOS swarm analysis');
        const swarmResults = await this.juliaosSwarm.executeSwarmAnalysis(projectData);
        coordinatedAnalysis = this.processJuliaOSResults(swarmResults);
      } else {
        // Fallback to local agent coordination
        await this.log('Using fallback agent coordination');
        coordinatedAnalysis = await this.executeFallbackAnalysis(projectData);
      }

      const finalReport = await this.generateFinalReport(coordinatedAnalysis, projectData);

      // Cleanup swarm resources
      await this.finalizeSwarm();

      return finalReport;
    } catch (error) {
      await this.log(`Swarm coordination failed: ${error.message}`, 'error');
      return this.generateFallbackReport(projectData, error);
    }
  }

  async initializeSwarm(projectData) {
    try {
      // Check JuliaOS availability
      const health = await this.juliaosSwarm.healthCheck();
      
      if (health.available) {
        await this.log('Initializing JuliaOS swarm intelligence');
        const swarmData = await this.juliaosSwarm.createWeb3ResearchSwarm(projectData);
        this.useJuliaOS = true;
        
        return {
          session_id: swarmData.swarm_id,
          mode: 'juliaos_swarm',
          agents: swarmData.agents,
          coordination: 'real_time_ai'
        };
      } else {
        throw new Error(health.error || 'JuliaOS backend not available');
      }

    } catch (error) {
      await this.log(`JuliaOS swarm initialization failed, using fallback: ${error.message}`, 'warn');
      this.useJuliaOS = false;
      
      return { 
        session_id: 'local-' + Date.now(), 
        mode: 'local_fallback',
        agents: ['research', 'contract', 'market'],
        coordination: 'local_processing'
      };
    }
  }

  /**
   * Process results from JuliaOS swarm execution
   */
  processJuliaOSResults(swarmResults) {
    const { swarm_results, consensus_data } = swarmResults;
    
    return {
      consensus_score: consensus_data.consensus_score,
      confidence_level: consensus_data.confidence,
      weighted_recommendation: this.generateRecommendationFromScore(consensus_data.consensus_score),
      conflicting_assessments: consensus_data.agreement === 'weak' ? ['score_variance_high'] : [],
      
      // Map JuliaOS agent results to expected format
      research: swarm_results.research_lead || {},
      contracts: swarm_results.security_analyst || {},
      market: swarm_results.market_analyst || {},
      
      swarm_intelligence: {
        success_rate: swarmResults.success_rate,
        participating_agents: consensus_data.participating_agents,
        agreement_level: consensus_data.agreement,
        score_variance: consensus_data.variance
      }
    };
  }

  /**
   * Execute fallback analysis using local agents
   */
  async executeFallbackAnalysis(projectData) {
    // Execute local agents in parallel
    const [researchResult, contractResult, marketResult] = await Promise.allSettled([
      this.fallbackAgents.research.analyzeProject(projectData),
      this.analyzeContracts(projectData.contracts),
      this.fallbackAgents.market.analyzeMarket(projectData)
    ]);

    // Process fallback results
    const agentResults = {
      research: researchResult.status === 'fulfilled' ? researchResult.value : { error: researchResult.reason },
      contracts: contractResult.status === 'fulfilled' ? contractResult.value : { error: contractResult.reason },
      market: marketResult.status === 'fulfilled' ? marketResult.value : { error: marketResult.reason }
    };

    return this.localCoordination(agentResults);
  }

  async finalizeSwarm() {
    if (this.useJuliaOS) {
      try {
        await this.juliaosSwarm.cleanup();
        await this.log('JuliaOS swarm cleanup completed');
      } catch (error) {
        await this.log(`Swarm cleanup warning: ${error.message}`, 'warn');
      }
    }
  }

  localCoordination(agentResults) {
    // Fallback coordination logic when JuliaOS swarm is unavailable
    const coordination = {
      consensus_score: this.calculateConsensusScore(agentResults),
      conflicting_assessments: this.findConflicts(agentResults),
      weighted_recommendation: this.generateWeightedRecommendation(agentResults),
      confidence_level: this.calculateOverallConfidence(agentResults)
    };

    return coordination;
  }

  async analyzeContracts(contracts) {
    if (!contracts || contracts.length === 0) {
      return { message: 'No contracts provided for analysis' };
    }

    const contractAnalyses = await Promise.allSettled(
      contracts.map(contract => 
        this.agents.contract.analyzeContract(contract.address, contract.blockchain)
      )
    );

    return {
      total_contracts: contracts.length,
      analyses: contractAnalyses.map((result, index) => ({
        contract: contracts[index],
        analysis: result.status === 'fulfilled' ? result.value : { error: result.reason }
      })),
      overall_security_score: this.calculateOverallSecurityScore(contractAnalyses),
      highest_risk_contract: this.findHighestRiskContract(contractAnalyses)
    };
  }

  calculateConsensusScore(results) {
    const scores = [];
    
    if (results.research && !results.research.error) {
      scores.push(results.research.overall_score || 50);
    }
    if (results.contracts && !results.contracts.error && results.contracts.overall_security_score) {
      scores.push(results.contracts.overall_security_score);
    }
    if (results.market && !results.market.error) {
      scores.push(results.market.market_score || 50);
    }

    if (scores.length === 0) return 30; // Low confidence when no valid scores

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / scores.length;
    
    // Lower consensus score if there's high variance between agents
    return Math.max(0, average - (variance > 400 ? 20 : 0));
  }

  findConflicts(results) {
    const conflicts = [];

    // Check for conflicting risk assessments
    if (results.research && results.contracts) {
      const researchRisk = this.getRiskLevel(results.research.overall_score);
      const contractRisk = results.contracts.highest_risk_contract?.risk_level;
      
      if (researchRisk !== contractRisk && contractRisk) {
        conflicts.push({
          type: 'risk_assessment',
          research_says: researchRisk,
          contract_says: contractRisk
        });
      }
    }

    // Check for market vs research conflicts
    if (results.research && results.market) {
      const researchSentiment = results.research.overall_score > 70 ? 'positive' : 'negative';
      const marketSentiment = results.market.social_sentiment;
      
      if (researchSentiment !== marketSentiment && marketSentiment !== 'neutral') {
        conflicts.push({
          type: 'sentiment_mismatch',
          research_sentiment: researchSentiment,
          market_sentiment: marketSentiment
        });
      }
    }

    return conflicts;
  }

  generateWeightedRecommendation(results) {
    const weights = { research: 0.4, contracts: 0.35, market: 0.25 };
    let totalWeight = 0;
    let weightedScore = 0;

    if (results.research && !results.research.error) {
      weightedScore += (results.research.overall_score || 50) * weights.research;
      totalWeight += weights.research;
    }

    if (results.contracts && !results.contracts.error && results.contracts.overall_security_score) {
      weightedScore += results.contracts.overall_security_score * weights.contracts;
      totalWeight += weights.contracts;
    }

    if (results.market && !results.market.error) {
      weightedScore += (results.market.market_score || 50) * weights.market;
      totalWeight += weights.market;
    }

    const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 30;

    if (finalScore >= 80) return 'STRONG BUY';
    if (finalScore >= 65) return 'BUY';
    if (finalScore >= 50) return 'HOLD';
    if (finalScore >= 35) return 'SELL';
    return 'STRONG SELL';
  }

  calculateOverallConfidence(results) {
    let totalConfidence = 0;
    let validResults = 0;

    ['research', 'contracts', 'market'].forEach(agent => {
      if (results[agent] && !results[agent].error) {
        totalConfidence += (results[agent].confidence || 0.5);
        validResults++;
      }
    });

    return validResults > 0 ? totalConfidence / validResults : 0.3;
  }

  async generateFinalReport(coordinatedAnalysis, projectData) {
    const reportPrompt = `
    Generate a comprehensive investment research report based on this coordinated analysis:
    ${JSON.stringify(coordinatedAnalysis)}
    
    For project: ${projectData.name}
    Category: ${projectData.category}
    `;

    const finalReport = await this.useLLM(reportPrompt, {
      task: 'final_report_generation',
      coordination: coordinatedAnalysis
    });

    return {
      project_name: projectData.name,
      analysis_timestamp: new Date().toISOString(),
      overall_recommendation: coordinatedAnalysis.weighted_recommendation,
      consensus_score: coordinatedAnalysis.consensus_score,
      confidence_level: coordinatedAnalysis.confidence_level,
      
      executive_summary: finalReport.executive_summary || 'Analysis completed with limited data',
      key_findings: finalReport.key_findings || [],
      risk_factors: finalReport.risks || [],
      opportunities: finalReport.opportunities || [],
      
      detailed_analysis: {
        research: coordinatedAnalysis.research || {},
        contracts: coordinatedAnalysis.contracts || {},
        market: coordinatedAnalysis.market || {}
      },
      
      conflicts_identified: coordinatedAnalysis.conflicting_assessments || [],
      next_steps: finalReport.next_steps || ['Monitor project development', 'Await additional data'],
      
      disclaimer: 'This analysis is for informational purposes only and should not be considered financial advice.'
    };
  }

  async finalizeSwarm(swarmSession) {
    if (swarmSession.mode === 'local') return;

    try {
      await axios.post(`${this.apiUrl}/api/swarm/finalize`, {
        session_id: swarmSession.session_id
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      await this.log(`Swarm session finalized: ${swarmSession.session_id}`);
    } catch (error) {
      await this.log(`Swarm finalization warning: ${error.message}`, 'warn');
    }
  }

  generateFallbackReport(projectData, error) {
    return {
      project_name: projectData.name,
      analysis_timestamp: new Date().toISOString(),
      overall_recommendation: 'INSUFFICIENT_DATA',
      error: error.message,
      executive_summary: 'Analysis failed due to technical issues. Manual review recommended.',
      disclaimer: 'This analysis failed and should not be used for investment decisions.'
    };
  }

  assessProjectComplexity(projectData) {
    let complexity = 'medium';
    
    if (projectData.contracts && projectData.contracts.length > 3) complexity = 'high';
    if (projectData.category && ['DeFi', 'Layer 1', 'Infrastructure'].includes(projectData.category)) complexity = 'high';
    if (!projectData.whitepaper && !projectData.website) complexity = 'low';
    
    return complexity;
  }

  getRiskLevel(score) {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }

  generateRecommendationFromScore(score) {
    if (score >= 80) return 'STRONG BUY';
    if (score >= 65) return 'BUY';
    if (score >= 50) return 'HOLD';
    if (score >= 35) return 'SELL';
    return 'STRONG SELL';
  }

  calculateOverallSecurityScore(contractAnalyses) {
    const validAnalyses = contractAnalyses
      .filter(result => result.status === 'fulfilled' && result.value.security_score)
      .map(result => result.value.security_score);

    if (validAnalyses.length === 0) return 50;

    return validAnalyses.reduce((a, b) => a + b, 0) / validAnalyses.length;
  }

  findHighestRiskContract(contractAnalyses) {
    let highestRisk = null;
    let lowestScore = 100;

    contractAnalyses.forEach(result => {
      if (result.status === 'fulfilled' && result.value.security_score < lowestScore) {
        lowestScore = result.value.security_score;
        highestRisk = result.value;
      }
    });

    return highestRisk;
  }
}

export default SwarmCoordinator;