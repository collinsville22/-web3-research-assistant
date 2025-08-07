import BaseAgent from './BaseAgent.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import ExternalAPIManager from '../integrations/ExternalAPIs.js';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super('research');
    this.externalAPIs = ExternalAPIManager;
  }

  async analyzeProject(projectData) {
    await this.log('Starting comprehensive project analysis with external data sources');

    // Gather external market and blockchain data
    const externalData = await this.gatherExternalData(projectData);
    
    // Enhanced analysis with real data
    const analysis = await this.useLLM(
      `Analyze this Web3 project with comprehensive external data:
      
      Project Info: ${JSON.stringify(projectData)}
      
      External Market Data: ${JSON.stringify(externalData.market)}
      Blockchain Data: ${JSON.stringify(externalData.blockchain)}
      Community Metrics: ${JSON.stringify(externalData.community)}
      
      Provide detailed analysis covering technology, team, tokenomics, risks, and opportunities.`,
      {
        task: 'enhanced_project_analysis',
        external_data: externalData,
        focus_areas: ['technology', 'team', 'tokenomics', 'market_fit', 'community', 'risks'],
        analysis_depth: 'comprehensive'
      }
    );

    const websiteAnalysis = await this.analyzeWebsite(projectData.website);
    const documentAnalysis = await this.analyzeDocumentation(projectData.whitepaper);

    return {
      overall_score: this.calculateOverallScore(analysis, websiteAnalysis, documentAnalysis, externalData),
      technology_assessment: analysis.technology || 'Not available',
      team_analysis: analysis.team || 'Not available',
      tokenomics_review: analysis.tokenomics || 'Not available',
      community_analysis: this.analyzeCommunityMetrics(externalData.community),
      market_position: this.analyzeMarketPosition(externalData.market),
      blockchain_metrics: this.analyzeBlockchainData(externalData.blockchain),
      website_analysis: websiteAnalysis,
      documentation_quality: documentAnalysis,
      external_data_summary: {
        sources_used: externalData.successful_sources || [],
        data_quality: externalData.confidence_score || 0,
        last_updated: new Date().toISOString()
      },
      risk_factors: analysis.risks || [],
      opportunities: analysis.opportunities || [],
      recommendation: analysis.recommendation || 'Further research required',
      confidence: this.calculateEnhancedConfidence(analysis.confidence, externalData),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Gather comprehensive external data from all APIs
   */
  async gatherExternalData(projectData) {
    await this.log('🔍 Gathering external data from multiple sources...');
    
    const externalData = {
      market: {},
      blockchain: {},
      community: {},
      successful_sources: [],
      confidence_score: 0
    };

    try {
      // If we have contract addresses, analyze them
      if (projectData.contracts && projectData.contracts.length > 0) {
        for (const contract of projectData.contracts) {
          await this.log(`Analyzing contract: ${contract.address} on ${contract.blockchain}`);
          
          const contractAnalysis = await this.externalAPIs.analyzeToken(
            contract.address, 
            contract.blockchain
          );
          
          if (!contractAnalysis.error) {
            externalData.blockchain[contract.address] = contractAnalysis;
            externalData.successful_sources.push(...contractAnalysis.data_sources || []);
          }
        }
      }

      // Try to find token data by symbol or name
      if (projectData.token_symbol) {
        await this.log(`Searching for token: ${projectData.token_symbol}`);
        
        try {
          const searchResults = await this.externalAPIs.dexscreener.searchTokens(projectData.token_symbol);
          if (searchResults.pairs && searchResults.pairs.length > 0) {
            externalData.market.dex_data = searchResults;
            externalData.successful_sources.push('dexscreener');
          }
        } catch (error) {
          await this.log(`Token search failed: ${error.message}`, 'warn');
        }
      }

      // Try CoinGecko search by name
      if (projectData.name) {
        try {
          const coinId = projectData.name.toLowerCase().replace(/\s+/g, '-');
          const coinData = await this.externalAPIs.coingecko.getCoinData(coinId);
          
          if (!coinData.error) {
            externalData.community = coinData.community_data || {};
            externalData.market.coingecko = coinData.market_data || {};
            externalData.successful_sources.push('coingecko');
          }
        } catch (error) {
          await this.log(`CoinGecko search failed: ${error.message}`, 'warn');
        }
      }

      // Calculate confidence score
      externalData.confidence_score = Math.min(100, externalData.successful_sources.length * 25);
      externalData.successful_sources = [...new Set(externalData.successful_sources)]; // Remove duplicates

      await this.log(`✅ External data gathered from ${externalData.successful_sources.length} sources`);
      
      return externalData;

    } catch (error) {
      await this.log(`External data gathering failed: ${error.message}`, 'error');
      return externalData;
    }
  }

  /**
   * Analyze community metrics from external data
   */
  analyzeCommunityMetrics(communityData) {
    if (!communityData || Object.keys(communityData).length === 0) {
      return { score: 30, status: 'insufficient_data' };
    }

    let score = 50;
    const metrics = {};
    
    // Social media presence
    if (communityData.twitter_followers) {
      metrics.twitter_followers = communityData.twitter_followers;
      score += Math.min(20, communityData.twitter_followers / 5000);
    }
    
    if (communityData.reddit_subscribers) {
      metrics.reddit_subscribers = communityData.reddit_subscribers;
      score += Math.min(15, communityData.reddit_subscribers / 1000);
    }
    
    if (communityData.telegram_channel_user_count) {
      metrics.telegram_members = communityData.telegram_channel_user_count;
      score += Math.min(15, communityData.telegram_channel_user_count / 2000);
    }

    return {
      score: Math.min(100, Math.round(score)),
      metrics: metrics,
      status: score > 70 ? 'strong' : score > 50 ? 'moderate' : 'weak'
    };
  }

  /**
   * Analyze market position from external data
   */
  analyzeMarketPosition(marketData) {
    if (!marketData || Object.keys(marketData).length === 0) {
      return { score: 30, status: 'insufficient_data' };
    }

    let score = 50;
    const analysis = {};

    // CoinGecko data
    if (marketData.coingecko) {
      const cg = marketData.coingecko;
      
      if (cg.market_cap_rank) {
        analysis.market_cap_rank = cg.market_cap_rank;
        score += cg.market_cap_rank <= 100 ? 30 : cg.market_cap_rank <= 500 ? 20 : 10;
      }
      
      if (cg.total_volume) {
        analysis.daily_volume = cg.total_volume.usd;
        score += cg.total_volume.usd > 1000000 ? 15 : cg.total_volume.usd > 100000 ? 10 : 5;
      }
    }

    // DEX data
    if (marketData.dex_data) {
      const dex = marketData.dex_data;
      if (dex.pairs && dex.pairs.length > 0) {
        analysis.trading_pairs = dex.pairs.length;
        analysis.main_pair = dex.pairs[0];
        score += dex.pairs.length > 5 ? 10 : 5;
      }
    }

    return {
      score: Math.min(100, Math.round(score)),
      analysis: analysis,
      status: score > 70 ? 'strong' : score > 50 ? 'moderate' : 'weak'
    };
  }

  /**
   * Analyze blockchain-specific data
   */
  analyzeBlockchainData(blockchainData) {
    if (!blockchainData || Object.keys(blockchainData).length === 0) {
      return { score: 30, status: 'no_contracts_analyzed' };
    }

    let totalScore = 0;
    let contractCount = 0;
    const contractAnalyses = {};

    Object.entries(blockchainData).forEach(([contractAddress, data]) => {
      contractCount++;
      let contractScore = 50;

      // Contract verification
      if (data.blockchain_data?.verified) {
        contractScore += 20;
      }

      // Security assessment
      if (data.risk_assessment) {
        const risk = data.risk_assessment;
        contractScore += risk.risk_score > 70 ? 15 : risk.risk_score > 50 ? 10 : 0;
        contractScore -= risk.identified_risks?.length * 5 || 0;
      }

      contractAnalyses[contractAddress] = {
        score: Math.max(0, Math.min(100, contractScore)),
        risk_level: data.risk_assessment?.overall_risk || 'unknown',
        verified: data.blockchain_data?.verified || false
      };

      totalScore += contractScore;
    });

    const avgScore = contractCount > 0 ? totalScore / contractCount : 30;

    return {
      score: Math.round(avgScore),
      contracts_analyzed: contractCount,
      contract_details: contractAnalyses,
      status: avgScore > 70 ? 'secure' : avgScore > 50 ? 'moderate' : 'risky'
    };
  }

  /**
   * Calculate enhanced confidence with external data
   */
  calculateEnhancedConfidence(baseConfidence, externalData) {
    const dataQuality = (externalData.confidence_score || 0) / 100;
    const sourceCount = (externalData.successful_sources?.length || 0) / 5; // Max 5 sources
    
    return Math.min(0.95, (baseConfidence || 0.5) * 0.6 + dataQuality * 0.3 + sourceCount * 0.1);
  }

  async analyzeWebsite(url) {
    if (!url) return { quality: 'low', reason: 'No website provided' };

    try {
      const response = await axios.get(url, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      const metrics = {
        has_whitepaper: $('a[href*="whitepaper"], a[href*="paper"]').length > 0,
        has_roadmap: $('*:contains("roadmap"), *:contains("timeline")').length > 0,
        has_team_info: $('*:contains("team"), *:contains("founder")').length > 0,
        has_tokenomics: $('*:contains("tokenomics"), *:contains("token")').length > 0,
        social_links: $('a[href*="twitter"], a[href*="discord"], a[href*="telegram"]').length,
        github_links: $('a[href*="github"]').length > 0
      };

      const websiteAnalysis = await this.useLLM(
        `Analyze this website content for a Web3 project: ${response.data.substring(0, 2000)}`,
        {
          task: 'website_analysis',
          metrics: metrics
        }
      );

      return {
        quality: this.assessWebsiteQuality(metrics),
        metrics: metrics,
        analysis: websiteAnalysis.analysis,
        professionalism_score: websiteAnalysis.professionalism || 0.5
      };
    } catch (error) {
      await this.log(`Website analysis failed: ${error.message}`, 'warn');
      return {
        quality: 'unknown',
        reason: 'Website inaccessible',
        error: error.message
      };
    }
  }

  async analyzeDocumentation(whitepaperUrl) {
    if (!whitepaperUrl) return { quality: 'low', reason: 'No documentation provided' };

    try {
      const response = await axios.get(whitepaperUrl, { timeout: 15000 });
      
      const docAnalysis = await this.useLLM(
        `Analyze this Web3 project whitepaper/documentation: ${response.data.substring(0, 5000)}`,
        {
          task: 'documentation_analysis',
          criteria: ['technical_depth', 'clarity', 'completeness', 'feasibility']
        }
      );

      return {
        quality: docAnalysis.quality || 'medium',
        technical_depth: docAnalysis.technical_depth || 'unknown',
        clarity_score: docAnalysis.clarity || 0.5,
        completeness_score: docAnalysis.completeness || 0.5,
        key_insights: docAnalysis.insights || [],
        concerns: docAnalysis.concerns || []
      };
    } catch (error) {
      await this.log(`Documentation analysis failed: ${error.message}`, 'warn');
      return {
        quality: 'unknown',
        reason: 'Documentation inaccessible',
        error: error.message
      };
    }
  }

  assessWebsiteQuality(metrics) {
    let score = 0;
    if (metrics.has_whitepaper) score += 2;
    if (metrics.has_roadmap) score += 2;
    if (metrics.has_team_info) score += 2;
    if (metrics.has_tokenomics) score += 1;
    if (metrics.social_links > 2) score += 1;
    if (metrics.github_links) score += 2;

    if (score >= 8) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  calculateOverallScore(analysis, websiteAnalysis, documentAnalysis, externalData) {
    const weights = {
      technology: 0.25,
      team: 0.15,
      website: 0.15,
      documentation: 0.15,
      community: 0.1,
      market_position: 0.1,
      blockchain_security: 0.1
    };

    let score = 0;
    
    // Traditional analysis factors
    score += (analysis.technology_score || 0.5) * weights.technology;
    score += (analysis.team_score || 0.5) * weights.team;
    score += this.getWebsiteScore(websiteAnalysis.quality) * weights.website;
    score += this.getDocScore(documentAnalysis.quality) * weights.documentation;
    
    // External data factors
    const communityScore = (this.analyzeCommunityMetrics(externalData?.community || {}).score || 30) / 100;
    const marketScore = (this.analyzeMarketPosition(externalData?.market || {}).score || 30) / 100;
    const blockchainScore = (this.analyzeBlockchainData(externalData?.blockchain || {}).score || 30) / 100;
    
    score += communityScore * weights.community;
    score += marketScore * weights.market_position;
    score += blockchainScore * weights.blockchain_security;

    return Math.round(score * 100);
  }

  getWebsiteScore(quality) {
    switch (quality) {
      case 'high': return 0.9;
      case 'medium': return 0.6;
      case 'low': return 0.3;
      default: return 0.4;
    }
  }

  getDocScore(quality) {
    switch (quality) {
      case 'high': return 0.9;
      case 'medium': return 0.6;
      case 'low': return 0.3;
      default: return 0.4;
    }
  }
}

export default ResearchAgent;