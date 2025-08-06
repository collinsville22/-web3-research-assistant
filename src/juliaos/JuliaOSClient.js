import axios from 'axios';

/**
 * JuliaOS API Client for Web3 Research Assistant
 * Real integration with JuliaOS backend server
 * 
 * API Documentation: https://docs.juliaos.com/api-documentation/api-reference
 * Backend Repository: https://github.com/Juliaoscode/JuliaOS/tree/main/backend
 */
export default class JuliaOSClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://127.0.0.1:8052';
    this.apiVersion = config.apiVersion || 'v1';
    this.timeout = config.timeout || 30000;
    this.connected = false;
    
    this.client = axios.create({
      baseURL: `${this.baseURL}/api/${this.apiVersion}`,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[JULIAOS] 🚀 ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[JULIAOS] ❌ Request Error:', error.message);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[JULIAOS] ✅ ${response.status} ${response.config.url}`);
        this.connected = true;
        return response;
      },
      (error) => {
        console.error(`[JULIAOS] ❌ ${error.response?.status || 'Network'} Error:`, error.message);
        this.connected = false;
        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check - verify JuliaOS backend is available
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/agents');
      return { 
        available: true, 
        status: 'connected',
        backend: 'JuliaOS',
        version: this.apiVersion
      };
    } catch (error) {
      return { 
        available: false, 
        status: 'disconnected',
        error: error.message,
        fallback: 'Using local analysis'
      };
    }
  }

  /**
   * Create a Web3 Research Agent in JuliaOS
   */
  async createResearchAgent(name, description = 'Web3 project research agent') {
    const agentConfig = {
      id: `web3-research-${Date.now()}`,
      name: name,
      description: description,
      blueprint: {
        tools: [
          {
            name: 'llm_chat',
            config: {
              model: 'gemini',
              max_tokens: 4000,
              temperature: 0.7
            }
          },
          {
            name: 'scrape_article_text',
            config: {
              timeout: 10000
            }
          }
        ],
        strategy: {
          name: 'plan_and_execute',
          config: {
            max_iterations: 5,
            thinking_budget: 10000
          }
        },
        trigger: {
          type: 'webhook',
          params: {}
        }
      }
    };

    const response = await this.client.post('/agents', agentConfig);
    return response.data;
  }

  /**
   * Create a Contract Analysis Agent
   */
  async createContractAgent(name, description = 'Smart contract security analysis agent') {
    const agentConfig = {
      id: `contract-analyzer-${Date.now()}`,
      name: name,
      description: description,
      blueprint: {
        tools: [
          {
            name: 'llm_chat',
            config: {
              model: 'gemini',
              max_tokens: 6000,
              temperature: 0.3
            }
          }
        ],
        strategy: {
          name: 'plan_and_execute',
          config: {
            max_iterations: 3,
            focus: 'security_analysis'
          }
        },
        trigger: {
          type: 'webhook',
          params: {}
        }
      }
    };

    const response = await this.client.post('/agents', agentConfig);
    return response.data;
  }

  /**
   * Execute agent with project data
   */
  async runAgent(agentId, projectData) {
    const payload = {
      project_name: projectData.name,
      category: projectData.category,
      website: projectData.website,
      whitepaper: projectData.whitepaper,
      token_symbol: projectData.token_symbol,
      description: projectData.description,
      contracts: projectData.contracts || [],
      task: 'comprehensive_analysis',
      timestamp: new Date().toISOString()
    };

    const response = await this.client.post(`/agents/${agentId}/webhook`, payload);
    return response.data;
  }

  /**
   * Get agent execution results
   */
  async getAgentOutput(agentId) {
    const response = await this.client.get(`/agents/${agentId}/output`);
    return response.data;
  }

  /**
   * Get agent execution logs for debugging
   */
  async getAgentLogs(agentId) {
    const response = await this.client.get(`/agents/${agentId}/logs`);
    return response.data;
  }

  /**
   * List all available tools in JuliaOS
   */
  async listTools() {
    const response = await this.client.get('/tools');
    return response.data;
  }

  /**
   * List all available strategies in JuliaOS
   */
  async listStrategies() {
    const response = await this.client.get('/strategies');
    return response.data;
  }

  /**
   * Start an agent
   */
  async startAgent(agentId) {
    const response = await this.client.put(`/agents/${agentId}`, {
      state: 'RUNNING'
    });
    return response.data;
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId) {
    const response = await this.client.put(`/agents/${agentId}`, {
      state: 'STOPPED'
    });
    return response.data;
  }

  /**
   * Delete an agent when done
   */
  async deleteAgent(agentId) {
    await this.client.delete(`/agents/${agentId}`);
    console.log(`[JULIAOS] 🗑️ Agent ${agentId} deleted`);
  }

  /**
   * Get agent information
   */
  async getAgent(agentId) {
    const response = await this.client.get(`/agents/${agentId}`);
    return response.data;
  }

  /**
   * List all agents
   */
  async listAgents() {
    const response = await this.client.get('/agents');
    return response.data;
  }

  /**
   * Wait for agent to complete execution
   */
  async waitForCompletion(agentId, maxWaitTime = 60000) {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const agent = await this.getAgent(agentId);
          const logs = await this.getAgentLogs(agentId);
          
          // Check if agent has completed (this depends on JuliaOS implementation)
          if (logs.status === 'completed' || agent.state === 'STOPPED') {
            const output = await this.getAgentOutput(agentId);
            resolve(output);
            return;
          }

          // Check timeout
          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error(`Agent ${agentId} execution timeout after ${maxWaitTime}ms`));
            return;
          }

          // Continue polling
          setTimeout(checkStatus, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }
}