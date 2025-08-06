import axios from 'axios';
import { JuliaOSConfig } from '../config/juliaos.js';

export class BaseAgent {
  constructor(agentType) {
    this.config = JuliaOSConfig.agents[agentType];
    this.apiUrl = JuliaOSConfig.apiUrl;
    this.apiKey = JuliaOSConfig.apiKey;
    this.agentType = agentType;
  }

  async useLLM(prompt, context = {}) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/agents/llm`, {
        agent_name: this.config.name,
        prompt: prompt,
        context: context,
        strategy: this.config.strategy,
        tools: this.config.tools
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`LLM Error for ${this.agentType}:`, error.message);
      
      // Fallback to local processing if JuliaOS is unavailable
      return this.fallbackAnalysis(prompt, context);
    }
  }

  async executeStrategy(data) {
    try {
      const response = await axios.post(`${this.apiUrl}/api/agents/execute`, {
        agent_name: this.config.name,
        strategy: this.config.strategy,
        data: data,
        tools: this.config.tools
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Strategy execution error for ${this.agentType}:`, error.message);
      return this.fallbackStrategy(data);
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