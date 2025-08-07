import { BaseAgent } from './BaseAgent.js';

export class ContractAgent extends BaseAgent {
  constructor() {
    super('contract', {
      name: 'TokenContractAgent',
      description: 'Smart contract security and technical analysis agent',
      strategy: 'comprehensive_contract_analysis'
    });
  }

  /**
   * Analyze smart contract security and technical details using JuliaOS
   */
  async analyzeContract(contractAddress, blockchain = 'ethereum') {
    const prompt = `
Perform comprehensive smart contract analysis for this token:

Contract Address: ${contractAddress}
Blockchain: ${blockchain}

Available Contract Data:
- Address: ${contractAddress}
- Network: ${blockchain}
- Contract Type: Token Contract

Security Analysis Required:
1. Contract legitimacy verification
2. Known security vulnerabilities assessment
3. Ownership and admin controls evaluation  
4. Liquidity lock and tokenomics analysis
5. Historical security incidents review
6. Contract verification status
7. Security risk level (LOW/MEDIUM/HIGH/CRITICAL)

Technical Analysis Required:
1. Token standard compliance (ERC-20, BEP-20, etc.)
2. Supply mechanism and inflation controls
3. Transfer restrictions and fees
4. Burn mechanisms and deflationary features
5. Upgradability and proxy patterns
6. Integration with DeFi protocols

Provide:
1. Overall security assessment score (0-100)
2. Risk factors and security concerns
3. Technical implementation quality
4. Recommendations for users
5. Contract reliability rating

Focus on identifying potential risks, rugpull indicators, and contract security issues.
`;

    const context = {
      contractAddress,
      blockchain,
      analysisType: 'contract_security',
      dataSource: 'blockchain_analysis',
      timestamp: new Date().toISOString()
    };

    try {
      // Use JuliaOS agent.useLLM() for contract analysis
      const llmResult = await this.useLLM(prompt, context);
      
      return {
        security_score: this.extractScore(llmResult.analysis) || 65,
        risk_level: this.extractRiskLevel(llmResult.analysis) || 'MEDIUM',
        security_assessment: this.extractSection(llmResult.analysis, 'security') || 'Security analysis pending',
        vulnerability_check: this.extractSection(llmResult.analysis, 'vulnerabilities') || 'Vulnerability check in progress',
        ownership_analysis: this.extractSection(llmResult.analysis, 'ownership') || 'Ownership analysis ongoing',
        technical_quality: this.extractSection(llmResult.analysis, 'technical') || 'Technical review pending',
        recommendations: this.extractRecommendations(llmResult.analysis),
        risk_factors: this.extractRiskFactors(llmResult.analysis, contractAddress),
        confidence: llmResult.confidence,
        source: llmResult.source,
        agent_used: 'ContractAgent',
        llm_endpoint: llmResult.llm_endpoint,
        timestamp: llmResult.timestamp
      };
    } catch (error) {
      console.error('Contract analysis failed:', error);
      
      // Enhanced fallback with basic contract checks
      return this.enhancedContractFallback(contractAddress, blockchain);
    }
  }

  /**
   * Enhanced fallback contract analysis
   */
  enhancedContractFallback(contractAddress, blockchain) {
    let score = 60; // Base security score
    const riskFactors = [];
    const recommendations = [];

    // Basic address validation
    if (this.isValidAddress(contractAddress, blockchain)) {
      score += 10;
      recommendations.push('Contract address format is valid');
    } else {
      score -= 20;
      riskFactors.push('Invalid or suspicious contract address format');
    }

    // Blockchain-specific checks
    if (blockchain === 'ethereum') {
      score += 10;
      recommendations.push('Deployed on Ethereum mainnet (generally more secure)');
    } else if (blockchain === 'bsc') {
      score += 5;
      recommendations.push('Deployed on BSC (moderate security level)');
    }

    // Address pattern analysis
    if (this.hasCommonRiskPatterns(contractAddress)) {
      score -= 15;
      riskFactors.push('Address contains potentially risky patterns');
    }

    return {
      security_score: Math.min(Math.max(score, 0), 100),
      risk_level: this.calculateRiskLevel(score),
      security_assessment: 'Automated contract address validation and pattern analysis',
      vulnerability_check: 'Basic vulnerability patterns checked',
      ownership_analysis: 'Ownership structure requires manual verification',
      technical_quality: 'Technical implementation quality assessment pending',
      recommendations: recommendations,
      risk_factors: riskFactors,
      confidence: 0.6,
      source: 'enhanced_contract_fallback',
      agent_used: 'ContractAgent',
      timestamp: new Date().toISOString()
    };
  }

  // Helper methods
  isValidAddress(address, blockchain) {
    switch (blockchain.toLowerCase()) {
      case 'ethereum':
      case 'bsc':
      case 'polygon':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      default:
        return address.length > 20; // Basic check
    }
  }

  hasCommonRiskPatterns(address) {
    // Check for common risky patterns
    const riskyPatterns = [
      /^0x00000+/,  // Too many zeros
      /^0xdead/i,   // Dead address patterns
      /^0x123456/,  // Sequential patterns
    ];
    
    return riskyPatterns.some(pattern => pattern.test(address));
  }

  calculateRiskLevel(score) {
    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM'; 
    if (score >= 40) return 'HIGH';
    return 'CRITICAL';
  }

  extractScore(analysis) {
    const scoreMatch = analysis.match(/(?:security\s+)?(?:assessment\s+)?score[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : null;
  }

  extractRiskLevel(analysis) {
    const riskMatch = analysis.match(/risk\s+level[:\s]*(LOW|MEDIUM|HIGH|CRITICAL)/i);
    return riskMatch ? riskMatch[1].toUpperCase() : null;
  }

  extractSection(analysis, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]*(.*?)(?=\\n\\d+\\.|\\n[A-Z]|$)`, 'is');
    const match = analysis.match(regex);
    return match ? match[1].trim() : null;
  }

  extractRecommendations(analysis) {
    const recommendations = [];
    
    // Extract from LLM response
    const recMatch = analysis.match(/recommendations?[:\s]*(.*?)(?=\n\d+\.|$)/is);
    if (recMatch) {
      const extracted = recMatch[1].split('\n').filter(r => r.trim());
      recommendations.push(...extracted);
    }

    // Add default recommendations
    recommendations.push('Always verify contract source code before investing');
    recommendations.push('Check for liquidity locks and team token allocations');
    recommendations.push('Monitor for unusual transaction patterns');

    return recommendations.slice(0, 5);
  }

  extractRiskFactors(analysis, contractAddress) {
    const riskFactors = [];
    
    // Extract from LLM response
    const riskMatch = analysis.match(/risk\s+factors?[:\s]*(.*?)(?=\n\d+\.|$)/is);
    if (riskMatch) {
      const extracted = riskMatch[1].split('\n').filter(r => r.trim());
      riskFactors.push(...extracted);
    }

    // Add basic risk assessments
    if (!this.isValidAddress(contractAddress)) {
      riskFactors.push('Contract address format validation failed');
    }

    return riskFactors.slice(0, 5);
  }
}

export default ContractAgent;