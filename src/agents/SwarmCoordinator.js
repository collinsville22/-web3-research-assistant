import BaseAgent from './BaseAgent.js';
import ResearchAgent from './ResearchAgent.js';
import ContractAgent from './ContractAgent.js';
import MarketAgent from './MarketAgent.js';
import axios from 'axios';
import { JuliaOSConfig } from '../config/juliaos.js';

export class SwarmCoordinator extends BaseAgent {
  constructor() {
    super('research');
    this.agents = {
      research: new ResearchAgent(),
      contract: new ContractAgent(),
      market: new MarketAgent()
    };
    this.swarmConfig = JuliaOSConfig.swarm;
  }

  async coordinateResearch(projectData) {
    await this.log('Starting swarm-coordinated research analysis');

    try {
      // Initialize swarm coordination with JuliaOS
      const swarmSession = await this.initializeSwarm(projectData);
      
      // Execute agents in parallel for efficiency
      const [researchResult, contractResult, marketResult] = await Promise.allSettled([
        this.agents.research.analyzeProject(projectData),
        this.analyzeContracts(projectData.contracts),
        this.agents.market.analyzeMarket(projectData)
      ]);

      // Coordinate results through JuliaOS swarm intelligence
      const coordinatedAnalysis = await this.coordinateResults({
        research: researchResult.status === 'fulfilled' ? researchResult.value : { error: researchResult.reason },
        contracts: contractResult.status === 'fulfilled' ? contractResult.value : { error: contractResult.reason },
        market: marketResult.status === 'fulfilled' ? marketResult.value : { error: marketResult.reason }
      }, swarmSession);

      const finalReport = await this.generateFinalReport(coordinatedAnalysis, projectData);

      await this.finalizeSwarm(swarmSession);

      return finalReport;
    } catch (error) {
      await this.log(`Swarm coordination failed: ${error.message}`, 'error');
      return this.generateFallbackReport(projectData, error);
    }
  }

  async initializeSwarm(projectData) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/swarm/initialize`, {
        swarm_name: this.swarmConfig.name,
        agents: this.swarmConfig.agents,
        coordination_strategy: this.swarmConfig.coordination,
        project_context: {
          name: projectData.name,
          category: projectData.category,
          complexity: this.assessProjectComplexity(projectData)
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      await this.log(`Swarm initialized: ${response.data.session_id}`);
      return response.data;
    } catch (error) {
      await this.log(`Swarm initialization failed, proceeding with local coordination: ${error.message}`, 'warn');
      return { session_id: 'local-' + Date.now(), mode: 'local' };
    }
  }

  async coordinateResults(agentResults, swarmSession) {
    if (swarmSession.mode === 'local') {
      return this.localCoordination(agentResults);
    }

    try {
      const response = await axios.post(`${this.apiUrl}/api/swarm/coordinate`, {
        session_id: swarmSession.session_id,
        agent_results: agentResults,
        coordination_type: 'consensus_analysis'
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      await this.log(`Swarm coordination failed, using local coordination: ${error.message}`, 'warn');
      return this.localCoordination(agentResults);
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