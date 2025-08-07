import BaseAgent from './BaseAgent.js';
import axios from 'axios';
import ExternalAPIManager from '../integrations/ExternalAPIs.js';

export class MarketAgent extends BaseAgent {
  constructor() {
    super('market');
    this.externalAPIs = ExternalAPIManager;
  }

  async analyzeMarket(projectData) {
    await this.log('🚀 Starting enhanced market intelligence analysis with external data');

    // Gather comprehensive external market data
    const externalMarketData = await this.gatherExternalMarketData(projectData);
    
    const priceAnalysis = await this.analyzePriceData(projectData.token_symbol, externalMarketData);
    const socialAnalysis = await this.analyzeSocialSentiment(projectData.name, externalMarketData);
    const competitorAnalysis = await this.analyzeCompetitors(projectData.category);
    const memecoinAnalysis = await this.analyzeMemecoinMetrics(projectData, externalMarketData);

    const marketIntelligence = await this.useLLM(
      `Analyze comprehensive market conditions with external data for this Web3 project: 
      ${JSON.stringify({
        project: projectData,
        price_data: priceAnalysis,
        social_data: socialAnalysis,
        competitors: competitorAnalysis,
        external_data: externalMarketData,
        memecoin_metrics: memecoinAnalysis
      })}`,
      {
        task: 'enhanced_market_intelligence',
        focus: ['real_price_trends', 'community_metrics', 'competitive_position', 'memecoin_analysis'],
        data_sources: externalMarketData.successful_sources || []
      }
    );

    return {
      market_cap_rank: priceAnalysis.market_cap_rank || 'Unknown',
      price_trend: priceAnalysis.price_trend || 'neutral',
      volume_analysis: priceAnalysis.volume_analysis || {},
      social_sentiment: socialAnalysis.overall_sentiment || 'neutral',
      community_size: socialAnalysis.community_metrics || {},
      competitive_position: competitorAnalysis.position || 'unknown',
      market_opportunities: marketIntelligence.opportunities || [],
      market_risks: marketIntelligence.risks || [],
      growth_potential: marketIntelligence.growth_potential || 'medium',
      memecoin_assessment: memecoinAnalysis,
      market_score: this.calculateEnhancedMarketScore(priceAnalysis, socialAnalysis, competitorAnalysis, externalMarketData),
      external_data_summary: {
        sources_used: externalMarketData.successful_sources || [],
        data_quality: externalMarketData.confidence_score || 0,
        last_updated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Gather external market data from all available sources
   */
  async gatherExternalMarketData(projectData) {
    await this.log('📊 Gathering external market data from multiple sources...');
    
    const marketData = {
      coingecko: {},
      dexscreener: {},
      birdeye: {},
      successful_sources: [],
      confidence_score: 0
    };

    try {
      // Try multiple approaches to find token data
      const searchPromises = [];
      
      // Search by token symbol
      if (projectData.token_symbol) {
        searchPromises.push(
          this.externalAPIs.dexscreener.searchTokens(projectData.token_symbol)
            .then(data => ({ source: 'dexscreener', data }))
            .catch(error => ({ source: 'dexscreener', error: error.message }))
        );
      }
      
      // Search by project name on CoinGecko
      if (projectData.name) {
        const coinId = projectData.name.toLowerCase().replace(/\s+/g, '-');
        searchPromises.push(
          this.externalAPIs.coingecko.getCoinData(coinId)
            .then(data => ({ source: 'coingecko', data }))
            .catch(error => ({ source: 'coingecko', error: error.message }))
        );
      }

      // If we have contract addresses, get detailed data
      if (projectData.contracts && projectData.contracts.length > 0) {
        for (const contract of projectData.contracts) {
          if (contract.blockchain === 'solana') {
            searchPromises.push(
              this.externalAPIs.birdeye.getTokenOverview(contract.address)
                .then(data => ({ source: 'birdeye', data, contract: contract.address }))
                .catch(error => ({ source: 'birdeye', error: error.message }))
            );
          }
        }
      }

      const results = await Promise.allSettled(searchPromises);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.data && !result.value.data.error) {
          const { source, data } = result.value;
          marketData[source] = data;
          marketData.successful_sources.push(source);
          
          await this.log(`✅ Successfully retrieved data from ${source}`);
        }
      }

      marketData.confidence_score = Math.min(100, marketData.successful_sources.length * 25);
      marketData.successful_sources = [...new Set(marketData.successful_sources)];
      
      await this.log(`🎯 Market data gathered from ${marketData.successful_sources.length} sources`);
      
      return marketData;

    } catch (error) {
      await this.log(`External market data gathering failed: ${error.message}`, 'error');
      return marketData;
    }
  }

  /**
   * Enhanced memecoin-specific analysis using DexScreener and Birdeye data
   */
  async analyzeMemecoinMetrics(projectData, externalData) {
    const dexData = externalData.dexscreener || {};
    const birdeyeData = externalData.birdeye || {};
    
    if (!dexData.pairs && !birdeyeData.data) {
      return { risk_level: 'unknown', reason: 'no_trading_data' };
    }

    let analysis = {
      risk_level: 'medium',
      age_analysis: {},
      liquidity_analysis: {},
      trading_analysis: {},
      whale_analysis: {}
    };

    // Analyze DexScreener data (memecoin focus)
    if (dexData.pairs && dexData.pairs.length > 0) {
      const mainPair = dexData.pairs[0];
      
      // Age analysis
      const pairAge = new Date() - new Date(mainPair.pairCreatedAt);
      const hoursOld = pairAge / (1000 * 60 * 60);
      
      analysis.age_analysis = {
        hours_old: Math.round(hoursOld),
        age_risk: hoursOld < 24 ? 'very_high' : hoursOld < 168 ? 'high' : 'medium'
      };

      // Liquidity analysis
      const liquidity = parseFloat(mainPair.liquidity?.usd || '0');
      analysis.liquidity_analysis = {
        usd_liquidity: liquidity,
        liquidity_risk: liquidity < 10000 ? 'very_high' : liquidity < 50000 ? 'high' : 'medium'
      };

      // Price volatility
      analysis.trading_analysis = {
        price_change_24h: mainPair.priceChange?.h24 || 0,
        volume_24h: parseFloat(mainPair.volume?.h24 || '0'),
        volatility_risk: Math.abs(mainPair.priceChange?.h24 || 0) > 50 ? 'high' : 'medium'
      };
    }

    // Analyze Birdeye data (whale activity)
    if (birdeyeData.data) {
      analysis.whale_analysis = birdeyeData.whale_analysis || {};
      analysis.trading_analysis.birdeye_metrics = birdeyeData.trading_analysis || {};
    }

    // Calculate overall memecoin risk
    const riskFactors = [];
    if (analysis.age_analysis.age_risk === 'very_high') riskFactors.push('very_new');
    if (analysis.liquidity_analysis.liquidity_risk === 'very_high') riskFactors.push('low_liquidity');
    if (analysis.trading_analysis.volatility_risk === 'high') riskFactors.push('high_volatility');
    
    if (riskFactors.length >= 2) analysis.risk_level = 'very_high';
    else if (riskFactors.length === 1) analysis.risk_level = 'high';
    else analysis.risk_level = 'medium';

    analysis.risk_factors = riskFactors;
    
    return analysis;
  }

  async analyzePriceData(tokenSymbol, externalData = {}) {
    if (!tokenSymbol) return { trend: 'unknown', reason: 'No token symbol provided' };

    try {
      // Use real external data when available
      const coinGeckoData = externalData.coingecko || {};
      const dexData = externalData.dexscreener || {};
      
      let priceData = {};
      
      // Prioritize CoinGecko data for established tokens
      if (coinGeckoData.market_data) {
        const marketData = coinGeckoData.market_data;
        priceData = {
          current_price: marketData.current_price?.usd || 0,
          market_cap: marketData.market_cap?.usd || 0,
          market_cap_rank: coinGeckoData.market_cap_rank || 999999,
          price_change_24h: marketData.price_change_percentage_24h || 0,
          price_change_7d: marketData.price_change_percentage_7d || 0,
          volume_24h: marketData.total_volume?.usd || 0,
          circulating_supply: marketData.circulating_supply || 0,
          data_source: 'coingecko'
        };
      } 
      // Use DexScreener data for newer/memecoin tokens
      else if (dexData.pairs && dexData.pairs.length > 0) {
        const mainPair = dexData.pairs[0];
        priceData = {
          current_price: parseFloat(mainPair.priceUsd || '0'),
          market_cap: parseFloat(mainPair.fdv || '0'),
          market_cap_rank: 999999, // DexScreener doesn't provide ranking
          price_change_24h: parseFloat(mainPair.priceChange?.h24 || '0'),
          price_change_7d: parseFloat(mainPair.priceChange?.h7d || '0'),
          volume_24h: parseFloat(mainPair.volume?.h24 || '0'),
          liquidity: parseFloat(mainPair.liquidity?.usd || '0'),
          data_source: 'dexscreener'
        };
      }
      // Fallback to simulated data
      else {
        priceData = {
          current_price: Math.random() * 100,
          market_cap: Math.random() * 1000000000,
          market_cap_rank: Math.floor(Math.random() * 1000) + 1,
          price_change_24h: (Math.random() - 0.5) * 20,
          price_change_7d: (Math.random() - 0.5) * 50,
          volume_24h: Math.random() * 10000000,
          circulating_supply: Math.random() * 1000000000,
          data_source: 'simulated'
        };
      }

      const priceAnalysis = await this.useLLM(
        `Analyze this token's comprehensive price data with real market information:
        ${JSON.stringify(priceData)}
        
        Data source: ${priceData.data_source}
        Include analysis of market positioning, liquidity, and trading patterns.`,
        {
          task: 'enhanced_price_analysis',
          token_symbol: tokenSymbol,
          data_source: priceData.data_source
        }
      );

      return {
        current_price: priceData.current_price,
        market_cap: priceData.market_cap,
        market_cap_rank: priceData.market_cap_rank,
        price_trend: this.determinePriceTrend(priceData),
        volume_analysis: {
          daily_volume: priceData.volume_24h,
          volume_trend: priceAnalysis.volume_trend || 'stable',
          liquidity: priceData.liquidity || null
        },
        volatility: priceAnalysis.volatility || this.calculateVolatility(priceData),
        liquidity_score: priceAnalysis.liquidity_score || this.calculateLiquidityScore(priceData),
        data_source: priceData.data_source,
        confidence: priceData.data_source === 'coingecko' ? 0.9 : 
                   priceData.data_source === 'dexscreener' ? 0.7 : 0.3
      };
    } catch (error) {
      await this.log(`Price analysis failed: ${error.message}`, 'warn');
      return {
        trend: 'unknown',
        error: error.message
      };
    }
  }

  calculateVolatility(priceData) {
    const change24h = Math.abs(priceData.price_change_24h || 0);
    if (change24h > 20) return 'high';
    if (change24h > 5) return 'medium';
    return 'low';
  }

  calculateLiquidityScore(priceData) {
    if (priceData.liquidity) {
      if (priceData.liquidity > 500000) return 0.9;
      if (priceData.liquidity > 100000) return 0.7;
      if (priceData.liquidity > 10000) return 0.5;
      return 0.2;
    }
    
    // Estimate based on volume for established tokens
    const volumeRatio = (priceData.volume_24h || 0) / (priceData.market_cap || 1);
    return Math.min(0.9, volumeRatio * 10);
  }

  async analyzeSocialSentiment(projectName, externalData = {}) {
    try {
      // Use real CoinGecko community data when available
      const coinGeckoData = externalData.coingecko || {};
      const communityData = coinGeckoData.community_data || {};
      
      let socialData = {};
      
      if (Object.keys(communityData).length > 0) {
        // Use real community data from CoinGecko
        socialData = {
          twitter_followers: communityData.twitter_followers || 0,
          discord_members: communityData.discord_members || 0,
          telegram_members: communityData.telegram_channel_user_count || 0,
          reddit_subscribers: communityData.reddit_subscribers || 0,
          github_stars: coinGeckoData.developer_data?.stars || 0,
          github_forks: coinGeckoData.developer_data?.forks || 0,
          data_source: 'coingecko'
        };
      } else {
        // Fallback to simulated data
        socialData = {
          twitter_followers: Math.floor(Math.random() * 100000) + 1000,
          discord_members: Math.floor(Math.random() * 50000) + 500,
          telegram_members: Math.floor(Math.random() * 30000) + 300,
          reddit_subscribers: Math.floor(Math.random() * 20000) + 200,
          recent_mentions: Math.floor(Math.random() * 1000) + 10,
          data_source: 'simulated'
        };
      }

      const sentimentAnalysis = await this.useLLM(
        `Analyze social sentiment and community strength for project "${projectName}" with real community data:
        ${JSON.stringify(socialData)}
        
        Data source: ${socialData.data_source}
        
        Focus on:
        - Community size and engagement patterns
        - Growth indicators and sustainability
        - Developer activity (if GitHub data available)
        - Cross-platform presence analysis`,
        {
          task: 'enhanced_sentiment_analysis',
          project_name: projectName,
          data_source: socialData.data_source
        }
      );

      return {
        overall_sentiment: sentimentAnalysis.sentiment || this.calculateSentimentFromMetrics(socialData),
        sentiment_score: sentimentAnalysis.score || this.calculateCommunityScore(socialData),
        community_metrics: socialData,
        community_growth: sentimentAnalysis.growth_trend || 'stable',
        engagement_level: sentimentAnalysis.engagement || this.assessEngagementLevel(socialData),
        developer_activity: {
          github_stars: socialData.github_stars || 0,
          github_forks: socialData.github_forks || 0,
          activity_level: socialData.github_stars > 100 ? 'high' : socialData.github_stars > 20 ? 'medium' : 'low'
        },
        data_source: socialData.data_source,
        confidence: socialData.data_source === 'coingecko' ? 0.8 : 0.3
      };
    } catch (error) {
      await this.log(`Social analysis failed: ${error.message}`, 'warn');
      return {
        overall_sentiment: 'unknown',
        error: error.message
      };
    }
  }

  calculateSentimentFromMetrics(socialData) {
    const totalFollowers = (socialData.twitter_followers || 0) + 
                          (socialData.discord_members || 0) + 
                          (socialData.telegram_members || 0);
    
    if (totalFollowers > 50000) return 'positive';
    if (totalFollowers > 10000) return 'neutral';
    return 'negative';
  }

  calculateCommunityScore(socialData) {
    let score = 0.3; // Base score
    
    score += Math.min(0.3, (socialData.twitter_followers || 0) / 100000);
    score += Math.min(0.2, (socialData.discord_members || 0) / 50000);
    score += Math.min(0.1, (socialData.telegram_members || 0) / 30000);
    score += Math.min(0.1, (socialData.reddit_subscribers || 0) / 20000);
    
    return Math.min(1, score);
  }

  assessEngagementLevel(socialData) {
    const totalCommunity = (socialData.twitter_followers || 0) + 
                          (socialData.discord_members || 0) + 
                          (socialData.telegram_members || 0);
                          
    if (totalCommunity > 100000) return 'high';
    if (totalCommunity > 20000) return 'medium';
    return 'low';
  }

  async analyzeCompetitors(category) {
    try {
      const competitorAnalysis = await this.useLLM(
        `Analyze the competitive landscape for a Web3 project in the "${category}" category`,
        {
          task: 'competitive_analysis',
          category: category
        }
      );

      return {
        position: competitorAnalysis.market_position || 'unknown',
        main_competitors: competitorAnalysis.competitors || [],
        competitive_advantages: competitorAnalysis.advantages || [],
        market_share_estimate: competitorAnalysis.market_share || 'unknown',
        differentiation_score: competitorAnalysis.differentiation || 0.5
      };
    } catch (error) {
      await this.log(`Competitor analysis failed: ${error.message}`, 'warn');
      return {
        position: 'unknown',
        error: error.message
      };
    }
  }

  determinePriceTrend(priceData) {
    const change7d = priceData.price_change_7d;
    if (change7d > 10) return 'bullish';
    if (change7d < -10) return 'bearish';
    return 'neutral';
  }

  calculateEnhancedMarketScore(priceAnalysis, socialAnalysis, competitorAnalysis, externalData) {
    let score = 50; // Base score

    // Price trend factors (enhanced with real data confidence)
    const priceConfidence = priceAnalysis.confidence || 0.5;
    if (priceAnalysis.price_trend === 'bullish') score += Math.round(15 * priceConfidence);
    else if (priceAnalysis.price_trend === 'bearish') score -= Math.round(10 * priceConfidence);

    // Market cap ranking (real data bonus)
    if (priceAnalysis.market_cap_rank && priceAnalysis.market_cap_rank < 100) score += 25;
    else if (priceAnalysis.market_cap_rank && priceAnalysis.market_cap_rank < 500) score += 15;
    else if (priceAnalysis.market_cap_rank && priceAnalysis.market_cap_rank < 1000) score += 5;

    // Social sentiment (enhanced with real data confidence)
    const socialConfidence = socialAnalysis.confidence || 0.5;
    if (socialAnalysis.overall_sentiment === 'positive') score += Math.round(15 * socialConfidence);
    else if (socialAnalysis.overall_sentiment === 'negative') score -= Math.round(10 * socialConfidence);

    // Community size (enhanced scoring with real data)
    const totalCommunity = (socialAnalysis.community_metrics?.twitter_followers || 0) +
                          (socialAnalysis.community_metrics?.discord_members || 0) +
                          (socialAnalysis.community_metrics?.telegram_members || 0);
    if (totalCommunity > 200000) score += 15;
    else if (totalCommunity > 50000) score += 10;
    else if (totalCommunity > 10000) score += 5;

    // Liquidity assessment (new factor)
    if (priceAnalysis.liquidity_score) {
      score += Math.round(priceAnalysis.liquidity_score * 10);
    }

    // Developer activity bonus
    if (socialAnalysis.developer_activity?.activity_level === 'high') score += 10;
    else if (socialAnalysis.developer_activity?.activity_level === 'medium') score += 5;

    // External data quality bonus
    const dataQuality = externalData.confidence_score || 0;
    if (dataQuality > 75) score += 5; // Bonus for high-quality data sources

    // Competitive position
    if (competitorAnalysis.position === 'leader') score += 15;
    else if (competitorAnalysis.position === 'challenger') score += 5;

    return Math.max(0, Math.min(100, score));
  }

  calculateMarketScore(priceAnalysis, socialAnalysis, competitorAnalysis) {
    // Legacy method for backwards compatibility
    return this.calculateEnhancedMarketScore(priceAnalysis, socialAnalysis, competitorAnalysis, { confidence_score: 0 });
  }

  async getMarketTrends(category) {
    const trendsAnalysis = await this.useLLM(
      `Analyze current market trends in the "${category}" Web3 sector`,
      {
        task: 'market_trends',
        category: category,
        timeframe: '30_days'
      }
    );

    return {
      sector_performance: trendsAnalysis.performance || 'neutral',
      emerging_trends: trendsAnalysis.trends || [],
      investment_sentiment: trendsAnalysis.sentiment || 'neutral',
      key_metrics: trendsAnalysis.metrics || {}
    };
  }
}

export default MarketAgent;