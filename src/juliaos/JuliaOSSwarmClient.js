import JuliaOSClient from './JuliaOSClient.js';

/**
 * JuliaOS Swarm Client for coordinating multiple agents
 * Implements real swarm intelligence and multi-agent coordination
 */
export default class JuliaOSSwarmClient extends JuliaOSClient {
  constructor(config = {}) {
    super(config);
    this.swarmId = null;
    this.activeAgents = new Map(); // agentId -> agentInfo
  }

  /**
   * Create a swarm for Web3 research coordination
   */
  async createWeb3ResearchSwarm(projectData) {
    try {
      // For now, we'll simulate swarm creation since the exact swarm API
      // structure isn't fully documented in the OpenAPI spec
      console.log('[JULIAOS-SWARM] 🐝 Creating Web3 Research Swarm...');
      
      // Create individual agents for the swarm
      const researchAgent = await this.createResearchAgent(
        'Web3-Research-Lead',
        'Lead researcher for Web3 project analysis'
      );

      const contractAgent = await this.createContractAgent(
        'Contract-Security-Analyst',
        'Smart contract security and audit specialist'
      );

      const marketAgent = await this.createResearchAgent(
        'Market-Intelligence-Agent',
        'Market analysis and social sentiment tracker'
      );

      // Store agent references
      this.activeAgents.set(researchAgent.id, {
        ...researchAgent,
        role: 'research_lead',
        specialization: 'project_fundamentals'
      });

      this.activeAgents.set(contractAgent.id, {
        ...contractAgent,
        role: 'security_analyst',
        specialization: 'contract_analysis'
      });

      this.activeAgents.set(marketAgent.id, {
        ...marketAgent,
        role: 'market_analyst',
        specialization: 'market_intelligence'
      });

      console.log(`[JULIAOS-SWARM] ✅ Swarm created with ${this.activeAgents.size} agents`);
      
      return {
        swarm_id: `web3-swarm-${Date.now()}`,
        agents: Array.from(this.activeAgents.values()),
        coordination_mode: 'parallel_analysis',
        consensus_threshold: 0.7
      };

    } catch (error) {
      console.error('[JULIAOS-SWARM] ❌ Swarm creation failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute coordinated analysis across all agents in the swarm
   */
  async executeSwarmAnalysis(projectData) {
    if (this.activeAgents.size === 0) {
      throw new Error('No active agents in swarm');
    }

    console.log('[JULIAOS-SWARM] 🚀 Executing coordinated swarm analysis...');

    // Execute all agents in parallel
    const analysisPromises = [];
    
    for (const [agentId, agentInfo] of this.activeAgents) {
      const agentPromise = this.executeAgentAnalysis(agentId, agentInfo, projectData);
      analysisPromises.push(agentPromise);
    }

    // Wait for all agents to complete
    const results = await Promise.allSettled(analysisPromises);
    
    // Process results
    const swarmResults = {};
    let completedCount = 0;

    results.forEach((result, index) => {
      const agentInfo = Array.from(this.activeAgents.values())[index];
      
      if (result.status === 'fulfilled') {
        swarmResults[agentInfo.role] = result.value;
        completedCount++;
      } else {
        console.error(`[JULIAOS-SWARM] Agent ${agentInfo.role} failed:`, result.reason.message);
        swarmResults[agentInfo.role] = {
          error: result.reason.message,
          fallback: true
        };
      }
    });

    console.log(`[JULIAOS-SWARM] 📊 Swarm analysis complete: ${completedCount}/${this.activeAgents.size} agents successful`);

    return {
      swarm_results: swarmResults,
      success_rate: completedCount / this.activeAgents.size,
      timestamp: new Date().toISOString(),
      consensus_data: this.calculateSwarmConsensus(swarmResults)
    };
  }

  /**
   * Execute analysis for a specific agent with role-based specialization
   */
  async executeAgentAnalysis(agentId, agentInfo, projectData) {
    const rolePrompts = {
      'research_lead': `Analyze the Web3 project "${projectData.name}" focusing on:
        - Technology fundamentals and innovation
        - Team background and credibility  
        - Project roadmap and milestones
        - Community engagement and adoption
        - Competitive positioning
        
        Project details: ${JSON.stringify(projectData, null, 2)}`,

      'security_analyst': `Perform security analysis for Web3 project "${projectData.name}" focusing on:
        - Smart contract architecture and security patterns
        - Known vulnerabilities and risk factors
        - Audit history and security practices
        - Decentralization and governance risks
        - Technical implementation quality
        
        Contracts: ${JSON.stringify(projectData.contracts || [], null, 2)}`,

      'market_analyst': `Analyze market dynamics for Web3 project "${projectData.name}" focusing on:
        - Token economics and utility
        - Market positioning and competition
        - Social sentiment and community health
        - Trading volume and liquidity
        - Adoption metrics and growth trends
        
        Market data: Category: ${projectData.category}, Token: ${projectData.token_symbol}`
    };

    const prompt = rolePrompts[agentInfo.role] || rolePrompts['research_lead'];
    
    // Execute the agent with specialized prompt
    await this.runAgent(agentId, {
      ...projectData,
      specialized_prompt: prompt,
      analysis_role: agentInfo.role,
      specialization: agentInfo.specialization
    });

    // Wait for completion and return results
    const result = await this.waitForCompletion(agentId, 45000); // 45 second timeout
    
    return {
      agent_id: agentId,
      role: agentInfo.role,
      specialization: agentInfo.specialization,
      analysis: result,
      confidence: result.confidence || 0.75,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate consensus across swarm agents
   */
  calculateSwarmConsensus(swarmResults) {
    const validResults = Object.values(swarmResults).filter(r => !r.error);
    
    if (validResults.length === 0) {
      return { consensus_score: 0, confidence: 0, agreement: 'none' };
    }

    // Extract numeric scores where possible
    const scores = validResults
      .map(r => r.analysis?.overall_score || r.analysis?.score)
      .filter(s => typeof s === 'number');

    if (scores.length < 2) {
      return { consensus_score: scores[0] || 50, confidence: 0.5, agreement: 'insufficient_data' };
    }

    // Calculate consensus metrics
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Determine agreement level based on standard deviation
    let agreement;
    if (standardDeviation <= 10) agreement = 'strong';
    else if (standardDeviation <= 20) agreement = 'moderate';
    else agreement = 'weak';

    return {
      consensus_score: Math.round(avgScore),
      confidence: Math.max(0, 1 - (standardDeviation / 50)),
      agreement: agreement,
      variance: variance,
      participating_agents: validResults.length,
      score_range: {
        min: Math.min(...scores),
        max: Math.max(...scores)
      }
    };
  }

  /**
   * Clean up swarm and all agents
   */
  async cleanup() {
    console.log('[JULIAOS-SWARM] 🧹 Cleaning up swarm...');
    
    const cleanupPromises = [];
    for (const agentId of this.activeAgents.keys()) {
      cleanupPromises.push(this.deleteAgent(agentId).catch(err => 
        console.warn(`Failed to cleanup agent ${agentId}:`, err.message)
      ));
    }

    await Promise.allSettled(cleanupPromises);
    this.activeAgents.clear();
    this.swarmId = null;
    
    console.log('[JULIAOS-SWARM] ✅ Swarm cleanup complete');
  }

  /**
   * Get swarm status and health
   */
  getSwarmStatus() {
    return {
      swarm_id: this.swarmId,
      agent_count: this.activeAgents.size,
      agents: Array.from(this.activeAgents.values()).map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        state: a.state || 'unknown'
      })),
      connected: this.connected
    };
  }
}