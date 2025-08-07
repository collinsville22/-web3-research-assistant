/**
 * Secure External API Integrations for Web3 Research Assistant
 * 
 * Features:
 * - Solscan API (Solana blockchain data)
 * - Etherscan API (Ethereum blockchain data) 
 * - CoinGecko API (Market & fundamental data)
 * - Birdeye API (Real-time trading intelligence) - Public API
 * - DexScreener API (Memecoin analysis) - Public API
 * 
 * Security: API keys loaded from environment variables only
 * Never expose keys in client-side code or logs
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Solscan API - Solana Blockchain Intelligence
 */
export class SolscanAPI {
  constructor() {
    this.apiKey = process.env.SOLSCAN_API_KEY;
    this.baseURL = 'https://pro-api.solscan.io/v1.0';
    
    if (!this.apiKey) {
      console.warn('[SOLSCAN] ⚠️ API key not found. Some features may be limited.');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'token': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    // Security: Remove API key from logs
    this.client.interceptors.request.use(
      (config) => {
        const safeConfig = { ...config };
        if (safeConfig.headers.token) {
          safeConfig.headers.token = '***PROTECTED***';
        }
        console.log('[SOLSCAN] 🔍 Request:', safeConfig.method?.toUpperCase(), safeConfig.url);
        return config;
      },
      (error) => {
        console.error('[SOLSCAN] ❌ Request failed:', error.message);
        return Promise.reject(error);
      }
    );
  }

  async getTokenInfo(tokenAddress) {
    try {
      const response = await this.client.get(`/token/meta?tokenAddress=${tokenAddress}`);
      return {
        ...response.data,
        data_source: 'solscan',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('[SOLSCAN] Token info failed:', error.response?.status, error.message);
      return { error: error.message, data_source: 'solscan' };
    }
  }

  async getTokenHolders(tokenAddress, limit = 20) {
    try {
      const response = await this.client.get(`/token/holders?tokenAddress=${tokenAddress}&offset=0&limit=${limit}`);
      return {
        ...response.data,
        holder_analysis: this.analyzeHolderDistribution(response.data),
        data_source: 'solscan'
      };
    } catch (error) {
      console.error('[SOLSCAN] Token holders failed:', error.message);
      return { error: error.message, data_source: 'solscan' };
    }
  }

  async getTokenTransfers(tokenAddress, limit = 10) {
    try {
      const response = await this.client.get(`/token/transfer?tokenAddress=${tokenAddress}&offset=0&limit=${limit}`);
      return {
        ...response.data,
        activity_analysis: this.analyzeTransferActivity(response.data),
        data_source: 'solscan'
      };
    } catch (error) {
      console.error('[SOLSCAN] Token transfers failed:', error.message);
      return { error: error.message, data_source: 'solscan' };
    }
  }

  analyzeHolderDistribution(holdersData) {
    if (!holdersData?.data) return { risk_level: 'unknown' };
    
    const holders = holdersData.data;
    const totalHolders = holders.length;
    
    // Analyze concentration
    const topHolderPercent = holders[0]?.amount_percentage || 0;
    const top5Percent = holders.slice(0, 5).reduce((sum, h) => sum + (h.amount_percentage || 0), 0);
    
    let riskLevel = 'low';
    const risks = [];
    
    if (topHolderPercent > 50) {
      riskLevel = 'high';
      risks.push('single_whale_dominance');
    } else if (top5Percent > 80) {
      riskLevel = 'medium';
      risks.push('concentrated_ownership');
    }
    
    return {
      risk_level: riskLevel,
      total_holders: totalHolders,
      top_holder_percent: topHolderPercent,
      top_5_percent: top5Percent,
      risks: risks
    };
  }

  analyzeTransferActivity(transfersData) {
    if (!transfersData?.data) return { activity_level: 'unknown' };
    
    const transfers = transfersData.data;
    const recentTransfers = transfers.filter(t => 
      new Date() - new Date(t.block_time * 1000) < 24 * 60 * 60 * 1000
    );
    
    return {
      activity_level: recentTransfers.length > 10 ? 'high' : recentTransfers.length > 3 ? 'medium' : 'low',
      total_transfers: transfers.length,
      recent_24h: recentTransfers.length,
      avg_amount: transfers.reduce((sum, t) => sum + (t.change_amount || 0), 0) / transfers.length
    };
  }
}

/**
 * Etherscan API - Ethereum Blockchain Intelligence
 */
export class EtherscanAPI {
  constructor() {
    this.apiKey = process.env.ETHERSCAN_API_KEY;
    this.baseURL = 'https://api.etherscan.io/api';
    
    if (!this.apiKey) {
      console.warn('[ETHERSCAN] ⚠️ API key not found. Some features may be limited.');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      params: {
        apikey: this.apiKey
      }
    });

    // Security: Remove API key from logs
    this.client.interceptors.request.use(
      (config) => {
        console.log('[ETHERSCAN] 🔍 Request:', config.params?.module, config.params?.action);
        return config;
      }
    );
  }

  async getContractInfo(contractAddress) {
    try {
      const [sourceCode, abi] = await Promise.allSettled([
        this.client.get('', {
          params: {
            module: 'contract',
            action: 'getsourcecode',
            address: contractAddress
          }
        }),
        this.client.get('', {
          params: {
            module: 'contract', 
            action: 'getabi',
            address: contractAddress
          }
        })
      ]);

      const sourceResult = sourceCode.status === 'fulfilled' ? sourceCode.value.data : null;
      const abiResult = abi.status === 'fulfilled' ? abi.value.data : null;

      return {
        address: contractAddress,
        verified: sourceResult?.status === '1',
        source_code: sourceResult?.result?.[0] || null,
        abi: abiResult?.result || null,
        contract_name: sourceResult?.result?.[0]?.ContractName || 'Unknown',
        compiler_version: sourceResult?.result?.[0]?.CompilerVersion || 'Unknown',
        security_analysis: this.analyzeContractSecurity(sourceResult?.result?.[0]),
        data_source: 'etherscan'
      };
    } catch (error) {
      console.error('[ETHERSCAN] Contract info failed:', error.message);
      return { error: error.message, data_source: 'etherscan' };
    }
  }

  async getTokenInfo(contractAddress) {
    try {
      const response = await this.client.get('', {
        params: {
          module: 'token',
          action: 'tokeninfo',
          contractaddress: contractAddress
        }
      });
      
      return {
        ...response.data.result,
        data_source: 'etherscan'
      };
    } catch (error) {
      console.error('[ETHERSCAN] Token info failed:', error.message);
      return { error: error.message, data_source: 'etherscan' };
    }
  }

  analyzeContractSecurity(contractData) {
    if (!contractData) return { risk_level: 'unknown', risks: [] };
    
    const risks = [];
    let riskLevel = 'low';
    
    // Check if contract is verified
    if (!contractData.SourceCode) {
      risks.push('unverified_contract');
      riskLevel = 'high';
    }
    
    // Check proxy patterns (basic detection)
    if (contractData.SourceCode?.includes('delegatecall')) {
      risks.push('proxy_contract');
    }
    
    return {
      risk_level: riskLevel,
      risks: risks,
      verified: !!contractData.SourceCode,
      contract_name: contractData.ContractName
    };
  }
}

/**
 * CoinGecko API - Market & Community Intelligence
 */
export class CoinGeckoAPI {
  constructor() {
    this.apiKey = process.env.COINGECKO_API_KEY;
    this.baseURL = this.apiKey ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: this.apiKey ? {
        'X-Cg-Pro-Api-Key': this.apiKey,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use(
      (config) => {
        console.log('[COINGECKO] 🔍 Request:', config.url);
        return config;
      }
    );
  }

  async getCoinData(coinId) {
    try {
      const response = await this.client.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: true,
          developer_data: true
        }
      });
      
      return {
        ...response.data,
        fundamental_analysis: this.analyzeFundamentals(response.data),
        data_source: 'coingecko'
      };
    } catch (error) {
      console.error('[COINGECKO] Coin data failed:', error.message);
      return { error: error.message, data_source: 'coingecko' };
    }
  }

  async getCoinByContract(platform, contractAddress) {
    try {
      const response = await this.client.get(`/coins/${platform}/contract/${contractAddress}`);
      return {
        ...response.data,
        fundamental_analysis: this.analyzeFundamentals(response.data),
        data_source: 'coingecko'
      };
    } catch (error) {
      console.error('[COINGECKO] Contract lookup failed:', error.message);
      return { error: error.message, data_source: 'coingecko' };
    }
  }

  analyzeFundamentals(coinData) {
    const analysis = {
      market_cap_rank: coinData.market_cap_rank || 'unranked',
      community_score: 0,
      developer_score: 0,
      overall_score: 50
    };
    
    // Community metrics
    if (coinData.community_data) {
      const community = coinData.community_data;
      analysis.community_score = Math.min(100, (
        (community.twitter_followers || 0) / 1000 +
        (community.reddit_subscribers || 0) / 100 +
        (community.telegram_channel_user_count || 0) / 100
      ) / 3);
    }
    
    // Developer activity
    if (coinData.developer_data) {
      const dev = coinData.developer_data;
      analysis.developer_score = Math.min(100, (
        (dev.forks || 0) / 10 +
        (dev.stars || 0) / 50 +
        (dev.total_issues || 0) / 10
      ) / 3);
    }
    
    // Overall scoring
    analysis.overall_score = Math.round((
      analysis.community_score * 0.4 +
      analysis.developer_score * 0.4 +
      (coinData.market_cap_rank ? Math.max(0, 100 - coinData.market_cap_rank) : 20) * 0.2
    ));
    
    return analysis;
  }
}

/**
 * Birdeye API - Real-time Trading Intelligence (Public API)
 */
export class BirdeyeAPI {
  constructor() {
    this.baseURL = 'https://public-api.birdeye.so';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getTokenPrice(tokenAddress) {
    try {
      const response = await this.client.get(`/defi/price?address=${tokenAddress}`);
      return {
        ...response.data,
        data_source: 'birdeye'
      };
    } catch (error) {
      console.error('[BIRDEYE] Token price failed:', error.message);
      return { error: error.message, data_source: 'birdeye' };
    }
  }

  async getTokenOverview(tokenAddress) {
    try {
      const response = await this.client.get(`/defi/token_overview?address=${tokenAddress}`);
      return {
        ...response.data,
        trading_analysis: this.analyzeTradingMetrics(response.data),
        data_source: 'birdeye'
      };
    } catch (error) {
      console.error('[BIRDEYE] Token overview failed:', error.message);
      return { error: error.message, data_source: 'birdeye' };
    }
  }

  async getTopTraders(tokenAddress) {
    try {
      const response = await this.client.get(`/trader/top-traders?address=${tokenAddress}`);
      return {
        ...response.data,
        whale_analysis: this.analyzeWhaleActivity(response.data),
        data_source: 'birdeye'
      };
    } catch (error) {
      console.error('[BIRDEYE] Top traders failed:', error.message);
      return { error: error.message, data_source: 'birdeye' };
    }
  }

  analyzeTradingMetrics(overviewData) {
    if (!overviewData?.data) return { liquidity_risk: 'unknown' };
    
    const data = overviewData.data;
    const liquidity = data.liquidity || 0;
    const volume24h = data.volume24h || 0;
    
    let liquidityRisk = 'low';
    if (liquidity < 50000) liquidityRisk = 'high';
    else if (liquidity < 200000) liquidityRisk = 'medium';
    
    return {
      liquidity_risk: liquidityRisk,
      liquidity_usd: liquidity,
      volume_24h: volume24h,
      volume_to_liquidity_ratio: liquidity > 0 ? volume24h / liquidity : 0
    };
  }

  analyzeWhaleActivity(tradersData) {
    if (!tradersData?.data) return { whale_risk: 'unknown' };
    
    const traders = tradersData.data;
    const totalVolume = traders.reduce((sum, t) => sum + (t.volume || 0), 0);
    const topTraderPercent = totalVolume > 0 ? (traders[0]?.volume || 0) / totalVolume : 0;
    
    return {
      whale_risk: topTraderPercent > 0.3 ? 'high' : topTraderPercent > 0.1 ? 'medium' : 'low',
      top_trader_dominance: topTraderPercent,
      total_unique_traders: traders.length
    };
  }
}

/**
 * DexScreener API - Memecoin & DEX Intelligence (Public API)
 */
export class DexScreenerAPI {
  constructor() {
    this.baseURL = 'https://api.dexscreener.com/latest';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async getTokenData(tokenAddress) {
    try {
      const response = await this.client.get(`/dex/tokens/${tokenAddress}`);
      return {
        ...response.data,
        memecoin_analysis: this.analyzeMemecoinMetrics(response.data),
        data_source: 'dexscreener'
      };
    } catch (error) {
      console.error('[DEXSCREENER] Token data failed:', error.message);
      return { error: error.message, data_source: 'dexscreener' };
    }
  }

  async getPairData(chainId, pairAddress) {
    try {
      const response = await this.client.get(`/dex/pairs/${chainId}/${pairAddress}`);
      return {
        ...response.data,
        pair_analysis: this.analyzePairHealth(response.data),
        data_source: 'dexscreener'
      };
    } catch (error) {
      console.error('[DEXSCREENER] Pair data failed:', error.message);
      return { error: error.message, data_source: 'dexscreener' };
    }
  }

  async searchTokens(query) {
    try {
      const response = await this.client.get(`/dex/search?q=${encodeURIComponent(query)}`);
      return {
        ...response.data,
        data_source: 'dexscreener'
      };
    } catch (error) {
      console.error('[DEXSCREENER] Search failed:', error.message);
      return { error: error.message, data_source: 'dexscreener' };
    }
  }

  analyzeMemecoinMetrics(tokenData) {
    if (!tokenData?.pairs) return { memecoin_risk: 'unknown' };
    
    const pairs = tokenData.pairs;
    const mainPair = pairs[0];
    
    if (!mainPair) return { memecoin_risk: 'high', reason: 'no_trading_pairs' };
    
    const risks = [];
    let riskLevel = 'low';
    
    // Age analysis
    const pairAge = new Date() - new Date(mainPair.pairCreatedAt);
    const hoursOld = pairAge / (1000 * 60 * 60);
    
    if (hoursOld < 24) {
      risks.push('very_new_token');
      riskLevel = 'high';
    } else if (hoursOld < 168) { // 1 week
      risks.push('new_token');
      riskLevel = 'medium';
    }
    
    // Liquidity analysis
    const liquidity = parseFloat(mainPair.liquidity?.usd || '0');
    if (liquidity < 10000) {
      risks.push('low_liquidity');
      riskLevel = 'high';
    }
    
    return {
      memecoin_risk: riskLevel,
      risks: risks,
      age_hours: Math.round(hoursOld),
      liquidity_usd: liquidity,
      price_change_24h: mainPair.priceChange?.h24 || 0
    };
  }

  analyzePairHealth(pairData) {
    if (!pairData?.pair) return { health_score: 0 };
    
    const pair = pairData.pair;
    let score = 50;
    
    // Volume analysis
    const volume24h = parseFloat(pair.volume?.h24 || '0');
    if (volume24h > 100000) score += 20;
    else if (volume24h > 10000) score += 10;
    
    // Price stability
    const priceChange = Math.abs(parseFloat(pair.priceChange?.h24 || '0'));
    if (priceChange < 10) score += 15;
    else if (priceChange > 50) score -= 20;
    
    return {
      health_score: Math.max(0, Math.min(100, score)),
      volume_24h: volume24h,
      price_volatility: priceChange
    };
  }
}

/**
 * Unified External API Manager
 * Coordinates all external data sources with enhanced security
 */
export class ExternalAPIManager {
  constructor() {
    this.solscan = new SolscanAPI();
    this.etherscan = new EtherscanAPI();
    this.coingecko = new CoinGeckoAPI();
    this.birdeye = new BirdeyeAPI();
    this.dexscreener = new DexScreenerAPI();
    
    console.log('[EXTERNAL-APIS] 🔐 Initialized with secure API management');
  }

  /**
   * Comprehensive multi-source token analysis
   */
  async analyzeToken(contractAddress, blockchain = 'ethereum') {
    console.log(`[EXTERNAL-APIS] 🔍 Starting comprehensive analysis: ${contractAddress} (${blockchain})`);
    
    try {
      const analysisPromises = [];
      
      // Blockchain-specific analysis
      if (blockchain === 'solana') {
        analysisPromises.push(
          this.solscan.getTokenInfo(contractAddress),
          this.solscan.getTokenHolders(contractAddress),
          this.birdeye.getTokenOverview(contractAddress),
          this.dexscreener.getTokenData(contractAddress)
        );
      } else if (blockchain === 'ethereum') {
        analysisPromises.push(
          this.etherscan.getContractInfo(contractAddress),
          this.coingecko.getCoinByContract('ethereum', contractAddress),
          this.dexscreener.getTokenData(contractAddress),
          this.birdeye.getTokenPrice(contractAddress)
        );
      }

      const results = await Promise.allSettled(analysisPromises);
      
      return {
        contract_address: contractAddress,
        blockchain: blockchain,
        analysis_timestamp: new Date().toISOString(),
        
        // Structured results
        blockchain_data: results[0]?.value || { error: results[0]?.reason?.message },
        market_data: results[1]?.value || { error: results[1]?.reason?.message },
        trading_data: results[2]?.value || { error: results[2]?.reason?.message },
        price_data: results[3]?.value || { error: results[3]?.reason?.message },
        
        // Analysis summary
        risk_assessment: this.generateRiskAssessment(results),
        confidence_score: this.calculateConfidenceScore(results),
        data_sources: this.getSuccessfulSources(results)
      };

    } catch (error) {
      console.error('[EXTERNAL-APIS] ❌ Analysis failed:', error.message);
      return {
        contract_address: contractAddress,
        blockchain: blockchain,
        error: error.message,
        analysis_timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate comprehensive risk assessment
   */
  generateRiskAssessment(results) {
    const risks = [];
    let overallRisk = 'medium';
    let riskScore = 50;
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value && !result.value.error) {
        const data = result.value;
        
        // Contract risks
        if (data.security_analysis?.risks) {
          risks.push(...data.security_analysis.risks);
        }
        
        // Market risks  
        if (data.memecoin_analysis?.risks) {
          risks.push(...data.memecoin_analysis.risks);
        }
        
        // Liquidity risks
        if (data.trading_analysis?.liquidity_risk === 'high') {
          risks.push('high_liquidity_risk');
        }
      }
    });
    
    // Calculate risk score
    riskScore = Math.max(20, 80 - (risks.length * 10));
    
    if (riskScore >= 70) overallRisk = 'low';
    else if (riskScore >= 40) overallRisk = 'medium';
    else overallRisk = 'high';
    
    return {
      overall_risk: overallRisk,
      risk_score: riskScore,
      identified_risks: [...new Set(risks)], // Remove duplicates
      risk_factors_count: risks.length
    };
  }

  /**
   * Calculate data confidence score
   */
  calculateConfidenceScore(results) {
    const successfulResults = results.filter(r => r.status === 'fulfilled' && !r.value?.error).length;
    const totalResults = results.length;
    
    return Math.round((successfulResults / totalResults) * 100);
  }

  /**
   * Get list of successful data sources
   */
  getSuccessfulSources(results) {
    return results
      .filter(r => r.status === 'fulfilled' && !r.value?.error)
      .map(r => r.value?.data_source)
      .filter(Boolean);
  }

  /**
   * Health check for all APIs
   */
  async healthCheck() {
    console.log('[EXTERNAL-APIS] 🏥 Performing health check...');
    
    const checks = await Promise.allSettled([
      this.coingecko.client.get('/ping'),
      this.birdeye.client.get('/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&limit=1'),
      this.dexscreener.client.get('/dex/tokens/ethereum/0xa0b86a33e6441e67e67c45a4d5b0a1c8e53b9dc6')
    ]);

    return {
      solscan: !!process.env.SOLSCAN_API_KEY,
      etherscan: !!process.env.ETHERSCAN_API_KEY,
      coingecko: checks[0].status === 'fulfilled',
      birdeye: checks[1].status === 'fulfilled', 
      dexscreener: checks[2].status === 'fulfilled',
      overall_health: checks.filter(c => c.status === 'fulfilled').length / checks.length,
      timestamp: new Date().toISOString()
    };
  }
}

// Export default instance
export default new ExternalAPIManager();