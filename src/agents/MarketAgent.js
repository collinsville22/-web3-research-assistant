import BaseAgent from './BaseAgent.js';
import axios from 'axios';

export class MarketAgent extends BaseAgent {
  constructor() {
    super('market');
  }

  async analyzeMarket(projectData) {
    await this.log('Starting market intelligence analysis');

    const priceAnalysis = await this.analyzePriceData(projectData.token_symbol);
    const socialAnalysis = await this.analyzeSocialSentiment(projectData.name);
    const competitorAnalysis = await this.analyzeCompetitors(projectData.category);

    const marketIntelligence = await this.useLLM(
      `Analyze market conditions for this Web3 project: ${JSON.stringify({
        project: projectData,
        price_data: priceAnalysis,
        social_data: socialAnalysis,
        competitors: competitorAnalysis
      })}`,
      {
        task: 'market_intelligence',
        focus: ['price_trends', 'market_sentiment', 'competitive_position']
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
      market_score: this.calculateMarketScore(priceAnalysis, socialAnalysis, competitorAnalysis),
      timestamp: new Date().toISOString()
    };
  }

  async analyzePriceData(tokenSymbol) {
    if (!tokenSymbol) return { trend: 'unknown', reason: 'No token symbol provided' };

    try {
      // Simulate CoinGecko API call
      const mockPriceData = {
        current_price: Math.random() * 100,
        market_cap: Math.random() * 1000000000,
        market_cap_rank: Math.floor(Math.random() * 1000) + 1,
        price_change_24h: (Math.random() - 0.5) * 20,
        price_change_7d: (Math.random() - 0.5) * 50,
        volume_24h: Math.random() * 10000000,
        circulating_supply: Math.random() * 1000000000
      };

      const priceAnalysis = await this.useLLM(
        `Analyze this token's price data: ${JSON.stringify(mockPriceData)}`,
        {
          task: 'price_analysis',
          token_symbol: tokenSymbol
        }
      );

      return {
        current_price: mockPriceData.current_price,
        market_cap: mockPriceData.market_cap,
        market_cap_rank: mockPriceData.market_cap_rank,
        price_trend: this.determinePriceTrend(mockPriceData),
        volume_analysis: {
          daily_volume: mockPriceData.volume_24h,
          volume_trend: priceAnalysis.volume_trend || 'stable'
        },
        volatility: priceAnalysis.volatility || 'medium',
        liquidity_score: priceAnalysis.liquidity_score || 0.6
      };
    } catch (error) {
      await this.log(`Price analysis failed: ${error.message}`, 'warn');
      return {
        trend: 'unknown',
        error: error.message
      };
    }
  }

  async analyzeSocialSentiment(projectName) {
    try {
      // Simulate social media data
      const mockSocialData = {
        twitter_followers: Math.floor(Math.random() * 100000) + 1000,
        discord_members: Math.floor(Math.random() * 50000) + 500,
        telegram_members: Math.floor(Math.random() * 30000) + 300,
        reddit_subscribers: Math.floor(Math.random() * 20000) + 200,
        recent_mentions: Math.floor(Math.random() * 1000) + 10
      };

      const sentimentAnalysis = await this.useLLM(
        `Analyze social sentiment for project "${projectName}" with this data: ${JSON.stringify(mockSocialData)}`,
        {
          task: 'sentiment_analysis',
          project_name: projectName
        }
      );

      return {
        overall_sentiment: sentimentAnalysis.sentiment || 'neutral',
        sentiment_score: sentimentAnalysis.score || 0.5,
        community_metrics: mockSocialData,
        community_growth: sentimentAnalysis.growth_trend || 'stable',
        engagement_level: sentimentAnalysis.engagement || 'medium',
        influencer_mentions: sentimentAnalysis.influencer_count || 0
      };
    } catch (error) {
      await this.log(`Social analysis failed: ${error.message}`, 'warn');
      return {
        overall_sentiment: 'unknown',
        error: error.message
      };
    }
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

  calculateMarketScore(priceAnalysis, socialAnalysis, competitorAnalysis) {
    let score = 50; // Base score

    // Price trend factors
    if (priceAnalysis.price_trend === 'bullish') score += 15;
    else if (priceAnalysis.price_trend === 'bearish') score -= 10;

    // Market cap ranking
    if (priceAnalysis.market_cap_rank && priceAnalysis.market_cap_rank < 100) score += 20;
    else if (priceAnalysis.market_cap_rank && priceAnalysis.market_cap_rank < 500) score += 10;

    // Social sentiment
    if (socialAnalysis.overall_sentiment === 'positive') score += 15;
    else if (socialAnalysis.overall_sentiment === 'negative') score -= 10;

    // Community size (bonus for large communities)
    const totalCommunity = (socialAnalysis.community_metrics?.twitter_followers || 0) +
                          (socialAnalysis.community_metrics?.discord_members || 0);
    if (totalCommunity > 50000) score += 10;
    else if (totalCommunity > 10000) score += 5;

    // Competitive position
    if (competitorAnalysis.position === 'leader') score += 15;
    else if (competitorAnalysis.position === 'challenger') score += 5;

    return Math.max(0, Math.min(100, score));
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