import JuliaOSClient from '../juliaos/JuliaOSClient.js';
import { JuliaOSConfig } from '../config/juliaos.js';

export class BaseAgent {
  constructor(agentType) {
    this.config = JuliaOSConfig.agents[agentType];
    this.agentType = agentType;
    this.juliaos = new JuliaOSClient();
    this.agentId = null; // Will be set when agent is created in JuliaOS
  }

  /**
   * Initialize the agent in JuliaOS backend
   */
  async initialize() {
    try {
      const health = await this.juliaos.healthCheck();
      if (!health.available) {
        throw new Error(health.error || 'JuliaOS backend not available');
      }

      // Create agent based on type
      let agent;
      if (this.agentType === 'research') {
        agent = await this.juliaos.createResearchAgent(
          this.config.name,
          this.config.description
        );
      } else if (this.agentType === 'contract') {
        agent = await this.juliaos.createContractAgent(
          this.config.name,
          this.config.description
        );
      } else {
        agent = await this.juliaos.createResearchAgent(
          this.config.name,
          this.config.description
        );
      }

      this.agentId = agent.id;
      await this.juliaos.startAgent(this.agentId);
      await this.log(`Agent initialized with ID: ${this.agentId}`);
      
      return agent;
    } catch (error) {
      await this.log(`Agent initialization failed: ${error.message}`, 'warn');
      return null;
    }
  }

  /**
   * Execute analysis using real JuliaOS agent
   */
  async useLLM(prompt, context = {}) {
    try {
      if (!this.agentId) {
        await this.initialize();
      }

      if (!this.agentId) {
        throw new Error('Agent not initialized');
      }

      // Run the agent with the prompt and context
      await this.juliaos.runAgent(this.agentId, {
        name: `${this.agentType}-analysis`,
        prompt: prompt,
        context: context,
        ...context
      });

      // Wait for completion and get results
      const result = await this.juliaos.waitForCompletion(this.agentId);
      
      return {
        analysis: result.output || result.result,
        confidence: result.confidence || 0.85,
        source: 'juliaos',
        agent_id: this.agentId
      };

    } catch (error) {
      await this.log(`JuliaOS execution failed: ${error.message}`, 'warn');
      
      // Fallback to local processing if JuliaOS is unavailable
      return this.fallbackAnalysis(prompt, context);
    }
  }

  /**
   * Execute strategy using JuliaOS backend
   */
  async executeStrategy(data) {
    try {
      if (!this.agentId) {
        await this.initialize();
      }

      if (!this.agentId) {
        throw new Error('Agent not initialized');
      }

      // Execute strategy through JuliaOS
      await this.juliaos.runAgent(this.agentId, {
        name: `${this.agentType}-strategy`,
        strategy: this.config.strategy,
        data: data
      });

      const result = await this.juliaos.waitForCompletion(this.agentId);
      
      return {
        result: result.output || result.result,
        recommendations: result.recommendations || [],
        confidence: result.confidence || 0.8,
        source: 'juliaos'
      };

    } catch (error) {
      await this.log(`JuliaOS strategy execution failed: ${error.message}`, 'warn');
      return this.fallbackStrategy(data);
    }
  }

  /**
   * Clean up agent when done
   */
  async cleanup() {
    if (this.agentId) {
      try {
        await this.juliaos.stopAgent(this.agentId);
        await this.juliaos.deleteAgent(this.agentId);
        await this.log(`Agent ${this.agentId} cleaned up`);
      } catch (error) {
        await this.log(`Cleanup failed: ${error.message}`, 'warn');
      }
      this.agentId = null;
    }
  }

  fallbackAnalysis(prompt, context) {
    return {
      analysis: `Fallback analysis for: ${prompt}`,
      confidence: 0.5,
      source: 'local_fallback'
    };
  }

  fallbackStrategy(data) {
    return {
      result: 'Fallback strategy executed',
      recommendations: [],
      confidence: 0.3
    };
  }

  async log(message, level = 'info') {
    console.log(`[${this.agentType.toUpperCase()}] ${level.toUpperCase()}: ${message}`);
  }
}

export default BaseAgent;