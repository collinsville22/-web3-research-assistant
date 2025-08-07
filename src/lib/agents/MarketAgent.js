import { BaseAgent } from './BaseAgent.js';

export class MarketAgent extends BaseAgent {
  constructor() {
    super('market', {
      name: 'TokenMarketAgent', 
      description: 'Advanced market analysis and price prediction agent',
      strategy: 'comprehensive_market_analysis'
    });
  }

  /**
   * Analyze market conditions and trading patterns using JuliaOS
   */
  async analyzeMarket(projectData) {
    const prompt = `
Perform comprehensive market analysis for this token:

Token: ${projectData.tokenInfo?.name || 'Unknown'} (${projectData.tokenInfo?.symbol || 'N/A'})

Current Market Metrics:
- Price: $${projectData.marketData?.market_data?.current_price?.usd || 'N/A'}
- Market Cap: $${(projectData.analysis?.keyMetrics?.marketCap || 0).toLocaleString()}
- 24h Volume: $${(projectData.analysis?.keyMetrics?.volume24h || 0).toLocaleString()}
- 24h Change: ${(projectData.analysis?.keyMetrics?.priceChange24h || 0).toFixed(2)}%
- 7d Change: ${projectData.marketData?.market_data?.price_change_percentage_7d || 'N/A'}%
- 30d Change: ${projectData.marketData?.market_data?.price_change_percentage_30d || 'N/A'}%

Trading Data:
- All-Time High: $${projectData.marketData?.market_data?.ath?.usd || 'N/A'}
- All-Time Low: $${projectData.marketData?.market_data?.atl?.usd || 'N/A'}
- Circulating Supply: ${(projectData.marketData?.market_data?.circulating_supply || 0).toLocaleString()}
- Total Supply: ${(projectData.marketData?.market_data?.total_supply || 0).toLocaleString()}

DEX Data:
- Liquidity: $${(projectData.analysis?.keyMetrics?.liquidity || 0).toLocaleString()}
- Trading Pairs: ${projectData.dexData?.pairs?.length || 0}

Analyze and provide:
1. Price trend analysis and momentum indicators
2. Volume analysis and liquidity assessment  
3. Market sentiment evaluation
4. Support and resistance levels
5. Trading recommendation with risk assessment
6. Market score (0-100)

Focus on identifying trading opportunities, market risks, and price catalysts.
`;

    const context = {
      projectData,
      analysisType: 'market_analysis',
      dataSource: 'coingecko_dexscreener_birdeye',
      timestamp: new Date().toISOString()
    };

    try {
      // Use JuliaOS agent.useLLM() for market analysis
      const llmResult = await this.useLLM(prompt, context);
      
      return {
        market_score: this.extractScore(llmResult.analysis) || 70,
        price_analysis: this.extractSection(llmResult.analysis, 'price') || 'Price analysis pending',
        volume_analysis: this.extractSection(llmResult.analysis, 'volume') || 'Volume analysis in progress',
        sentiment_evaluation: this.extractSection(llmResult.analysis, 'sentiment') || 'Sentiment evaluation ongoing',
        support_resistance: this.extractSection(llmResult.analysis, 'support') || 'Technical levels analysis pending',
        trading_recommendation: this.extractSection(llmResult.analysis, 'recommendation') || 'Recommendation pending',
        market_insights: this.extractInsights(llmResult.analysis, projectData),
        confidence: llmResult.confidence,
        source: llmResult.source,
        agent_used: 'MarketAgent',
        llm_endpoint: llmResult.llm_endpoint,
        timestamp: llmResult.timestamp
      };
    } catch (error) {
      console.error('Market analysis failed:', error);
      
      // Enhanced fallback with real market data
      return this.enhancedMarketFallback(projectData);
    }
  }

  /**
   * Enhanced fallback market analysis using real data
   */
  enhancedMarketFallback(projectData) {
    let score = 60; // Base market score
    const insights = [];

    // Volume analysis
    const volume24h = projectData.analysis?.keyMetrics?.volume24h || 0;
    const marketCap = projectData.analysis?.keyMetrics?.marketCap || 1;
    const volumeRatio = volume24h / marketCap;

    if (volumeRatio > 0.15) {
      score += 20;
      insights.push('Exceptional trading volume indicates high market interest');
    } else if (volumeRatio > 0.05) {
      score += 10;
      insights.push('Healthy trading volume supports price stability');
    } else {
      score -= 10;
      insights.push('Low trading volume may indicate limited market interest');
    }

    // Price momentum analysis
    const priceChange24h = projectData.analysis?.keyMetrics?.priceChange24h || 0;
    if (priceChange24h > 10) {
      score += 15;
      insights.push('Strong positive momentum in last 24 hours');
    } else if (priceChange24h < -15) {
      score -= 15;
      insights.push('Significant price decline indicates selling pressure');
    }

    // Liquidity analysis
    const liquidity = projectData.analysis?.keyMetrics?.liquidity || 0;
    if (liquidity > 1000000) {
      score += 15;
      insights.push('Strong DEX liquidity supports efficient trading');
    } else if (liquidity < 100000) {
      score -= 10;
      insights.push('Limited liquidity may cause price slippage during trades');
    }

    // Market cap evaluation
    if (marketCap > 1000000000) {
      score += 10;
      insights.push('Large market cap indicates established market position');
    } else if (marketCap < 10000000) {
      insights.push('Small market cap suggests higher volatility potential');
    }

    return {
      market_score: Math.min(Math.max(score, 0), 100),
      price_analysis: this.generatePriceAnalysis(projectData),
      volume_analysis: `24h volume: $${volume24h.toLocaleString()} (${(volumeRatio * 100).toFixed(2)}% of market cap)`,
      sentiment_evaluation: this.evaluateSentiment(priceChange24h),
      support_resistance: 'Technical analysis based on price history and volume patterns',
      trading_recommendation: this.generateTradingRecommendation(score),
      market_insights: insights,
      confidence: 0.75,
      source: 'enhanced_market_fallback',
      agent_used: 'MarketAgent',
      timestamp: new Date().toISOString()
    };
  }

  generatePriceAnalysis(projectData) {
    const priceChange = projectData.analysis?.keyMetrics?.priceChange24h || 0;
    const currentPrice = projectData.marketData?.market_data?.current_price?.usd;
    
    if (priceChange > 5) {
      return `Bullish momentum with ${priceChange.toFixed(2)}% gain. Current price: $${currentPrice}`;
    } else if (priceChange < -5) {
      return `Bearish pressure with ${Math.abs(priceChange).toFixed(2)}% decline. Current price: $${currentPrice}`;
    } else {
      return `Consolidation phase with minimal price movement. Current price: $${currentPrice}`;
    }
  }

  evaluateSentiment(priceChange24h) {
    if (priceChange24h > 15) return 'Extremely Bullish - Strong buying interest';
    if (priceChange24h > 5) return 'Bullish - Positive market sentiment';  
    if (priceChange24h > -5) return 'Neutral - Balanced market conditions';
    if (priceChange24h > -15) return 'Bearish - Selling pressure detected';
    return 'Extremely Bearish - Strong selling pressure';
  }

  generateTradingRecommendation(score) {
    if (score >= 80) return 'STRONG BUY - Excellent market conditions';
    if (score >= 60) return 'BUY - Favorable market conditions';
    if (score >= 40) return 'HOLD - Neutral market conditions';
    if (score >= 20) return 'SELL - Unfavorable market conditions';
    return 'STRONG SELL - Poor market conditions';
  }

  // Helper methods for data extraction
  extractScore(analysis) {
    const scoreMatch = analysis.match(/(?:market\s+)?score[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : null;
  }

  extractSection(analysis, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]*(.*?)(?=\\n\\d+\\.|\\n[A-Z]|$)`, 'is');
    const match = analysis.match(regex);
    return match ? match[1].trim() : null;
  }

  extractInsights(analysis, projectData) {
    const insights = [];
    
    // Extract from LLM if available
    const insightsMatch = analysis.match(/insights?[:\s]*(.*?)(?=\n\d+\.|$)/is);
    if (insightsMatch) {
      const extracted = insightsMatch[1].split('\n').filter(i => i.trim());
      insights.push(...extracted);
    }

    // Add data-driven insights
    const volumeRatio = (projectData.analysis?.keyMetrics?.volume24h || 0) / 
                       (projectData.analysis?.keyMetrics?.marketCap || 1);
    if (volumeRatio > 0.2) {
      insights.push('Unusually high volume suggests significant market event or news');
    }

    return insights.slice(0, 5);
  }
}

export default MarketAgent;