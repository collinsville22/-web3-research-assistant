import BaseAgent from './BaseAgent.js';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

export class ContractAgent extends BaseAgent {
  constructor() {
    super('contract');
    this.solanaConnection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  }

  async analyzeContract(contractAddress, blockchain = 'ethereum') {
    await this.log(`Starting contract analysis for ${contractAddress} on ${blockchain}`);

    try {
      let contractData;
      
      if (blockchain.toLowerCase() === 'solana') {
        contractData = await this.analyzeSolanaProgram(contractAddress);
      } else {
        contractData = await this.analyzeEVMContract(contractAddress, blockchain);
      }

      const securityAnalysis = await this.performSecurityAnalysis(contractData, blockchain);
      const functionalityAnalysis = await this.analyzeFunctionality(contractData, blockchain);

      return {
        contract_address: contractAddress,
        blockchain: blockchain,
        security_score: securityAnalysis.score,
        security_issues: securityAnalysis.issues,
        functionality_assessment: functionalityAnalysis,
        gas_efficiency: contractData.gas_efficiency || 'unknown',
        code_quality: securityAnalysis.code_quality || 'medium',
        audit_recommendations: securityAnalysis.recommendations || [],
        risk_level: this.calculateRiskLevel(securityAnalysis),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      await this.log(`Contract analysis failed: ${error.message}`, 'error');
      return {
        contract_address: contractAddress,
        blockchain: blockchain,
        error: error.message,
        risk_level: 'high',
        reason: 'Analysis failed - treat as high risk'
      };
    }
  }

  async analyzeSolanaProgram(programId) {
    try {
      const publicKey = new PublicKey(programId);
      const accountInfo = await this.solanaConnection.getAccountInfo(publicKey);

      if (!accountInfo) {
        throw new Error('Program not found on Solana');
      }

      const programAnalysis = await this.useLLM(
        `Analyze this Solana program data: ${JSON.stringify({
          owner: accountInfo.owner.toString(),
          executable: accountInfo.executable,
          lamports: accountInfo.lamports,
          dataSize: accountInfo.data.length
        })}`,
        {
          task: 'solana_program_analysis',
          program_id: programId
        }
      );

      return {
        type: 'solana_program',
        executable: accountInfo.executable,
        owner: accountInfo.owner.toString(),
        data_size: accountInfo.data.length,
        balance: accountInfo.lamports,
        analysis: programAnalysis
      };
    } catch (error) {
      throw new Error(`Solana program analysis failed: ${error.message}`);
    }
  }

  async analyzeEVMContract(contractAddress, blockchain) {
    try {
      // For demo purposes, we'll simulate getting contract data
      // In production, you'd use web3.js or ethers.js to get actual contract data
      const mockContractData = {
        bytecode: '0x608060405234801561001057600080fd5b50...',
        abi: [],
        source_code: 'contract available',
        verified: true
      };

      const contractAnalysis = await this.useLLM(
        `Analyze this ${blockchain} smart contract: ${JSON.stringify(mockContractData)}`,
        {
          task: 'evm_contract_analysis',
          blockchain: blockchain,
          contract_address: contractAddress
        }
      );

      return {
        type: 'evm_contract',
        blockchain: blockchain,
        verified: mockContractData.verified,
        has_source: true,
        analysis: contractAnalysis
      };
    } catch (error) {
      throw new Error(`EVM contract analysis failed: ${error.message}`);
    }
  }

  async performSecurityAnalysis(contractData, blockchain) {
    const securityPrompt = `
    Perform a comprehensive security analysis of this smart contract:
    ${JSON.stringify(contractData)}
    
    Focus on:
    1. Common vulnerabilities (reentrancy, overflow, etc.)
    2. Access control issues
    3. Logic flaws
    4. Gas optimization opportunities
    5. Upgradeability concerns
    `;

    const securityAnalysis = await this.useLLM(securityPrompt, {
      task: 'security_audit',
      blockchain: blockchain,
      analysis_depth: 'comprehensive'
    });

    return {
      score: securityAnalysis.security_score || 70,
      issues: securityAnalysis.vulnerabilities || [],
      code_quality: securityAnalysis.code_quality || 'medium',
      recommendations: securityAnalysis.recommendations || [],
      audit_needed: securityAnalysis.requires_audit || false
    };
  }

  async analyzeFunctionality(contractData, blockchain) {
    const functionalityPrompt = `
    Analyze the functionality and purpose of this smart contract:
    ${JSON.stringify(contractData)}
    
    Determine:
    1. Primary purpose and functionality
    2. Token standards compliance
    3. Integration capabilities
    4. User interaction patterns
    5. Business logic assessment
    `;

    const functionality = await this.useLLM(functionalityPrompt, {
      task: 'functionality_analysis',
      blockchain: blockchain
    });

    return {
      primary_purpose: functionality.purpose || 'Unknown',
      token_standard: functionality.token_standard || 'N/A',
      complexity_level: functionality.complexity || 'medium',
      integration_risk: functionality.integration_risk || 'medium',
      business_logic_score: functionality.logic_score || 0.6
    };
  }

  calculateRiskLevel(securityAnalysis) {
    const score = securityAnalysis.score;
    const criticalIssues = securityAnalysis.issues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    ).length;

    if (score < 50 || criticalIssues > 2) return 'high';
    if (score < 70 || criticalIssues > 0) return 'medium';
    return 'low';
  }

  async getContractMetrics(contractAddress, blockchain) {
    // Simulate getting transaction volume, user activity, etc.
    return {
      total_transactions: Math.floor(Math.random() * 10000) + 1000,
      unique_users: Math.floor(Math.random() * 1000) + 100,
      total_value_locked: Math.floor(Math.random() * 1000000) + 50000,
      last_activity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

export default ContractAgent;