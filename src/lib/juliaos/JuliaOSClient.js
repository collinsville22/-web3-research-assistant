// JuliaOS Client for Next.js integration
export class JuliaOSClient {
  constructor() {
    this.baseUrl = process.env.JULIAOS_API_URL || 'https://api.juliaos.com';
    this.apiKey = process.env.JULIAOS_API_KEY;
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.getHeaders()
      });
      
      if (response.ok) {
        return { available: true, data: await response.json() };
      } else {
        return { available: false, error: 'JuliaOS API not responding' };
      }
    } catch (error) {
      console.warn('JuliaOS not available, using fallback analysis:', error.message);
      return { available: false, error: error.message };
    }
  }

  async createAgent(type, name, description) {
    try {
      const response = await fetch(`${this.baseUrl}/agents`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type: type,
          name: name,
          description: description,
          capabilities: this.getAgentCapabilities(type)
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Failed to create ${type} agent`);
      }
    } catch (error) {
      console.error(`JuliaOS agent creation failed: ${error.message}`);
      return null;
    }
  }

  async runAgent(agentId, task) {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/run`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          task: task,
          endpoint: '/api/agents/llm', // JuliaOS LLM processing endpoint
          api_version: 'v1'
        })
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Agent execution failed');
      }
    } catch (error) {
      console.error(`JuliaOS agent execution failed: ${error.message}`);
      return null;
    }
  }

  async waitForCompletion(agentId, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}/status`, {
          headers: this.getHeaders()
        });

        if (response.ok) {
          const status = await response.json();
          if (status.state === 'completed') {
            return status;
          } else if (status.state === 'failed') {
            throw new Error(status.error || 'Agent execution failed');
          }
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Status check failed:', error.message);
        break;
      }
    }

    throw new Error('Agent execution timeout');
  }

  async deleteAgent(agentId) {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      console.error('Agent cleanup failed:', error.message);
      return false;
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'TokenAI/1.0'
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  getAgentCapabilities(type) {
    switch (type) {
      case 'research':
        return [
          'market_analysis',
          'community_assessment',
          'project_research',
          'risk_evaluation'
        ];
      case 'contract':
        return [
          'smart_contract_analysis',
          'security_assessment',
          'code_review',
          'vulnerability_detection'
        ];
      case 'market':
        return [
          'price_analysis',
          'volume_assessment',
          'liquidity_analysis',
          'trend_prediction'
        ];
      default:
        return ['general_analysis'];
    }
  }
}

export default JuliaOSClient;