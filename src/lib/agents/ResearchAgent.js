import { BaseAgent } from './BaseAgent.js';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super('research', {
      name: 'TokenResearchAgent',
      description: 'Advanced token research and fundamental analysis agent',
      strategy: 'comprehensive_token_research'
    });
  }

  /**
   * Analyze project fundamentals using JuliaOS and external APIs
   */
  async analyzeProject(projectData) {
    const prompt = `
Analyze this token project for fundamental strength and legitimacy:

Project: ${projectData.tokenInfo?.name || 'Unknown'} (${projectData.tokenInfo?.symbol || 'N/A'})
Description: ${projectData.tokenInfo?.description || 'No description available'}

Market Data:
- Market Cap: $${(projectData.analysis?.keyMetrics?.marketCap || 0).toLocaleString()}
- 24h Volume: $${(projectData.analysis?.keyMetrics?.volume24h || 0).toLocaleString()}
- 24h Change: ${(projectData.analysis?.keyMetrics?.priceChange24h || 0).toFixed(2)}%

Community Metrics:
- Community Score: ${projectData.marketData?.community_score || 'N/A'}
- Developer Score: ${projectData.marketData?.developer_score || 'N/A'}
- Public Interest: ${projectData.marketData?.public_interest_score || 'N/A'}

Please provide:
1. Project legitimacy assessment
2. Community engagement analysis  
3. Development activity evaluation
4. Market position analysis
5. Overall research score (0-100)

Focus on identifying red flags, growth potential, and competitive advantages.
`;

    const context = {
      projectData,
      analysisType: 'fundamental_research',
      dataSource: 'coingecko_birdeye_dexscreener',
      timestamp: new Date().toISOString()
    };

    try {
      // Use JuliaOS agent.useLLM() for analysis
      const llmResult = await this.useLLM(prompt, context);
      
      return {
        overall_score: this.extractScore(llmResult.analysis) || 75,
        legitimacy_assessment: this.extractSection(llmResult.analysis, 'legitimacy') || 'Assessment pending',
        community_analysis: this.extractSection(llmResult.analysis, 'community') || 'Analysis in progress',
        development_activity: this.extractSection(llmResult.analysis, 'development') || 'Evaluation ongoing', 
        market_position: this.extractSection(llmResult.analysis, 'market') || 'Position analysis pending',
        key_findings: this.extractFindings(llmResult.analysis, projectData),
        confidence: llmResult.confidence,
        source: llmResult.source,
        agent_used: 'ResearchAgent',
        llm_endpoint: llmResult.llm_endpoint,
        timestamp: llmResult.timestamp
      };
    } catch (error) {
      console.error('Research analysis failed:', error);
      
      // Enhanced fallback with real data
      return this.enhancedFallbackAnalysis(projectData);
    }
  }

  /**
   * Enhanced fallback analysis using real market data
   */
  enhancedFallbackAnalysis(projectData) {
    let score = 50; // Base score
    const findings = [];

    // Analyze market cap
    const marketCap = projectData.analysis?.keyMetrics?.marketCap || 0;
    if (marketCap > 1000000000) {
      score += 20;
      findings.push('Large market capitalization indicates established project');
    } else if (marketCap > 100000000) {
      score += 10;
      findings.push('Moderate market cap suggests growth potential');
    }

    // Analyze community metrics
    if (projectData.marketData?.community_score > 50) {
      score += 15;
      findings.push('Strong community engagement detected');
    }

    // Analyze development activity
    if (projectData.marketData?.developer_score > 50) {
      score += 15;
      findings.push('Active development team identified');
    }

    return {
      overall_score: Math.min(score, 100),
      legitimacy_assessment: 'Automated assessment based on market metrics',
      community_analysis: `Community score: ${projectData.marketData?.community_score || 'N/A'}`,
      development_activity: `Developer score: ${projectData.marketData?.developer_score || 'N/A'}`,
      market_position: `Market cap ranking and competitive analysis`,
      key_findings: findings,
      confidence: 0.7,
      source: 'enhanced_fallback',
      agent_used: 'ResearchAgent',
      timestamp: new Date().toISOString()
    };
  }

  // Helper methods to extract information from LLM responses
  extractScore(analysis) {
    const scoreMatch = analysis.match(/score[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : null;
  }

  extractSection(analysis, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]*(.*?)(?=\\n\\d+\\.|\\n[A-Z]|$)`, 'is');
    const match = analysis.match(regex);
    return match ? match[1].trim() : null;
  }

  extractFindings(analysis, projectData) {
    const findings = [];
    
    // Extract from LLM analysis if available
    const findingsMatch = analysis.match(/findings?[:\s]*(.*?)(?=\n\d+\.|$)/is);
    if (findingsMatch) {
      const extractedFindings = findingsMatch[1].split('\n').filter(f => f.trim());
      findings.push(...extractedFindings);
    }

    // Add data-driven findings
    if (projectData.analysis?.keyMetrics?.marketCap > 500000000) {
      findings.push('Significant market capitalization indicates institutional interest');
    }

    return findings.slice(0, 5); // Limit to top 5 findings
  }
}

export default ResearchAgent;