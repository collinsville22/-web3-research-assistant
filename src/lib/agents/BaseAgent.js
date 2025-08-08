import JuliaOSClient from '../juliaos/JuliaOSClient.js';

export class BaseAgent {
  constructor(agentType, config = {}) {
    this.agentType = agentType;
    this.config = {
      name: `${agentType}Agent`,
      description: `Advanced ${agentType} analysis agent for token research`,
      strategy: config.strategy || 'comprehensive_analysis',
      ...config
    };
    this.juliaos = new JuliaOSClient();
    this.agentId = null;
  }

  /**
   * Initialize the agent in JuliaOS backend
   */
  async initialize() {
    try {
      const health = await this.juliaos.healthCheck();
      if (!health.available) {
        console.warn(`JuliaOS not available: ${health.error}. Using fallback analysis.`);
        return null;
      }

      // Create agent in JuliaOS
      const agent = await this.juliaos.createAgent(
        this.agentType,
        this.config.name,
        this.config.description
      );

      if (agent) {
        this.agentId = agent.id;
        await this.log(`Agent initialized with ID: ${this.agentId}`);
        return agent;
      }
    } catch (error) {
      await this.log(`Agent initialization failed: ${error.message}`, 'warn');
    }
    
    return null;
  }

  /**
   * Execute analysis using JuliaOS agent.useLLM() equivalent
   * Uses JuliaOS /api/agents/llm endpoint for LLM processing
   */
  async useLLM(prompt, context = {}) {
    try {
      // Initialize agent if not already done
      if (!this.agentId) {
        const agent = await this.initialize();
        if (!agent) {
          return this.fallbackAnalysis(prompt, context);
        }
      }

      // Prepare LLM request with JuliaOS format
      const task = {
        name: `${this.agentType}-llm-analysis`,
        prompt: prompt,
        context: context,
        type: 'llm_processing',
        endpoint: '/api/agents/llm', // JuliaOS LLM processing endpoint
        api_version: 'v1',
        agent_type: this.agentType
      };

      // Run the agent with the prompt and context
      const execution = await this.juliaos.runAgent(this.agentId, task);
      if (!execution) {
        throw new Error('Agent execution failed');
      }

      // Wait for completion and get results
      const result = await this.juliaos.waitForCompletion(this.agentId);
      
      return {
        analysis: result.output || result.result,
        confidence: result.confidence || 0.85,
        source: 'juliaos',
        agent_id: this.agentId,
        llm_endpoint: '/api/agents/llm', // Reference to JuliaOS LLM endpoint
        timestamp: new Date().toISOString()
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
        return this.fallbackStrategy(data);
      }

      const task = {
        name: `${this.agentType}-strategy`,
        strategy: this.config.strategy,
        data: data,
        type: 'strategy_execution'
      };

      // Execute strategy through JuliaOS
      const execution = await this.juliaos.runAgent(this.agentId, task);
      if (!execution) {
        throw new Error('Strategy execution failed');
      }

      const result = await this.juliaos.waitForCompletion(this.agentId);
      
      return {
        result: result.output || result.result,
        recommendations: result.recommendations || [],
        confidence: result.confidence || 0.8,
        source: 'juliaos',
        timestamp: new Date().toISOString()
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
        await this.juliaos.deleteAgent(this.agentId);
        await this.log(`Agent ${this.agentId} cleaned up`);
      } catch (error) {
        await this.log(`Cleanup failed: ${error.message}`, 'warn');
      }
      this.agentId = null;
    }
  }

  // Fallback methods for when JuliaOS is unavailable
  fallbackAnalysis(prompt, context) {
    return {
      analysis: `Fallback analysis for: ${prompt}. Context: ${JSON.stringify(context)}`,
      confidence: 0.6,
      source: 'local_fallback',
      timestamp: new Date().toISOString()
    };
  }

  fallbackStrategy(_data) {
    return {
      result: `Fallback strategy executed for ${this.agentType}`,
      recommendations: ['Consider upgrading to JuliaOS for enhanced analysis'],
      confidence: 0.4,
      source: 'local_fallback',
      timestamp: new Date().toISOString()
    };
  }

  async log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.agentType.toUpperCase()}] ${level.toUpperCase()}: ${message}`);
  }
}

export default BaseAgent;