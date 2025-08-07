// JuliaOS-powered token analysis for Netlify with real API integration
const { SwarmCoordinator } = require('./swarm-coordinator.js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tokenInput } = JSON.parse(event.body);
    
    if (!tokenInput) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token address or symbol required' })
      };
    }
    
    console.log(`🤖 Starting JuliaOS swarm analysis for: ${tokenInput}`);
    
    // Fetch data from all APIs in parallel
    const [coinGeckoData, birdeyeData, dexData] = await Promise.all([
      fetchCoinGeckoData(tokenInput),
      fetchBirdeyeData(tokenInput),
      fetchDexScreenerData(tokenInput)
    ]);
    
    // Prepare project data for JuliaOS agents
    const projectData = {
      tokenInfo: {
        name: coinGeckoData?.name || birdeyeData?.overview?.name || 'Unknown Token',
        symbol: coinGeckoData?.symbol || birdeyeData?.overview?.symbol || 'UNKNOWN',
        address: tokenInput,
        description: coinGeckoData?.description?.en || 'No description available'
      },
      marketData: coinGeckoData,
      dexData: dexData,
      analysis: {
        keyMetrics: {
          marketCap: coinGeckoData?.market_data?.market_cap?.usd || 0,
          volume24h: coinGeckoData?.market_data?.total_volume?.usd || 0,
          priceChange24h: coinGeckoData?.market_data?.price_change_percentage_24h || 0,
          liquidity: dexData?.pairs?.[0]?.liquidity?.usd || 0
        }
      }
    };
    
    // Initialize JuliaOS SwarmCoordinator
    const swarmCoordinator = new SwarmCoordinator();
    
    // Execute JuliaOS multi-agent coordination
    const analysisResult = await swarmCoordinator.coordinateResearch(projectData);
    
    console.log(`✅ JuliaOS swarm analysis complete: ${analysisResult.consensus_score}/100`);
    
    // Format result to maintain compatibility with frontend
    const result = {
      tokenInfo: projectData.tokenInfo,
      marketData: projectData.marketData,
      dexData: projectData.dexData,
      analysis: {
        overallScore: analysisResult.consensus_score,
        recommendation: analysisResult.overall_recommendation,
        riskLevel: analysisResult.detailed_analysis?.contract?.risk_level || 'MEDIUM',
        keyMetrics: projectData.analysis.keyMetrics,
        findings: analysisResult.key_findings || [],
        risks: analysisResult.risk_factors || []
      }
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result,
        juliaos_analysis: analysisResult, // Full JuliaOS analysis
        timestamp: new Date().toISOString(),
        sources: ['CoinGecko', 'Birdeye', 'DexScreener', 'JuliaOS Framework']
      })
    };
    
  } catch (error) {
    console.error('JuliaOS token analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'JuliaOS analysis failed',
        details: error.message || 'Unknown error',
        fallback: 'Consider using basic analysis mode'
      })
    };
  }
};

// API URLs (using public endpoints where possible)
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const BIRDEYE_BASE = 'https://public-api.birdeye.so/public';
const DEXSCREENER_BASE = 'https://api.dexscreener.com/latest/dex';

async function fetchCoinGeckoData(tokenId) {
  try {
    // Search for token first
    const searchResponse = await fetch(`${COINGECKO_BASE}/search?query=${tokenId}`);
    const searchData = await searchResponse.json();
    
    if (searchData.coins && searchData.coins.length > 0) {
      const coinId = searchData.coins[0].id;
      
      // Get detailed coin data
      const coinResponse = await fetch(`${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`);
      return await coinResponse.json();
    }
    
    return null;
  } catch (error) {
    console.error('CoinGecko API error:', error);
    return null;
  }
}

async function fetchBirdeyeData(tokenAddress) {
  try {
    // Get token overview
    const overviewResponse = await fetch(`${BIRDEYE_BASE}/token_overview?address=${tokenAddress}`);
    const overviewData = await overviewResponse.json();
    
    // Get price data
    const priceResponse = await fetch(`${BIRDEYE_BASE}/price?address=${tokenAddress}`);
    const priceData = await priceResponse.json();
    
    return {
      overview: overviewData.success ? overviewData.data : null,
      price: priceData.success ? priceData.data : null
    };
  } catch (error) {
    console.error('Birdeye API error:', error);
    return null;
  }
}

async function fetchDexScreenerData(tokenAddress) {
  try {
    const response = await fetch(`${DEXSCREENER_BASE}/tokens/${tokenAddress}`);
    return await response.json();
  } catch (error) {
    console.error('DexScreener API error:', error);
    return null;
  }
}

function analyzeTokenData(coinGeckoData, birdeyeData, dexData) {
  let score = 0;
  const findings = [];
  const risks = [];
  
  // Market Cap Analysis
  if (coinGeckoData?.market_data?.market_cap?.usd) {
    const marketCap = coinGeckoData.market_data.market_cap.usd;
    if (marketCap > 1000000000) { // $1B+
      score += 25;
      findings.push('Large market capitalization indicates established project');
    } else if (marketCap > 100000000) { // $100M+
      score += 15;
      findings.push('Moderate market capitalization shows growth potential');
    } else {
      score += 5;
      risks.push('Small market cap indicates higher volatility risk');
    }
  }
  
  // Volume Analysis
  if (coinGeckoData?.market_data?.total_volume?.usd) {
    const volume = coinGeckoData.market_data.total_volume.usd;
    const marketCap = coinGeckoData.market_data?.market_cap?.usd || 1;
    const volumeRatio = volume / marketCap;
    
    if (volumeRatio > 0.1) {
      score += 20;
      findings.push('High trading volume indicates strong liquidity');
    } else if (volumeRatio > 0.05) {
      score += 10;
      findings.push('Moderate trading volume');
    } else {
      risks.push('Low trading volume may affect liquidity');
    }
  }
  
  // Price Performance
  if (coinGeckoData?.market_data?.price_change_percentage_24h) {
    const change24h = coinGeckoData.market_data.price_change_percentage_24h;
    if (Math.abs(change24h) > 20) {
      risks.push('High price volatility in last 24 hours');
    } else if (change24h > 5) {
      findings.push('Positive price momentum');
      score += 10;
    }
  }
  
  // Community & Development
  if (coinGeckoData?.community_score) {
    if (coinGeckoData.community_score > 50) {
      score += 15;
      findings.push('Strong community engagement');
    }
  }
  
  if (coinGeckoData?.developer_score) {
    if (coinGeckoData.developer_score > 50) {
      score += 15;
      findings.push('Active development activity');
    } else {
      risks.push('Limited development activity detected');
    }
  }
  
  // DexScreener specific metrics
  if (dexData?.pairs && dexData.pairs.length > 0) {
    const pair = dexData.pairs[0];
    if (pair.liquidity?.usd > 1000000) {
      score += 10;
      findings.push('Strong DEX liquidity available');
    } else {
      risks.push('Limited DEX liquidity may affect trading');
    }
  }
  
  // Final scoring and recommendation
  const finalScore = Math.min(score, 100);
  let recommendation = '';
  let riskLevel = '';
  
  if (finalScore >= 80) {
    recommendation = 'STRONG BUY';
    riskLevel = 'LOW';
  } else if (finalScore >= 60) {
    recommendation = 'BUY';
    riskLevel = 'MEDIUM';
  } else if (finalScore >= 40) {
    recommendation = 'HOLD';
    riskLevel = 'MEDIUM';
  } else {
    recommendation = 'AVOID';
    riskLevel = 'HIGH';
  }
  
  return {
    overallScore: finalScore,
    recommendation,
    riskLevel,
    keyMetrics: {
      marketCap: coinGeckoData?.market_data?.market_cap?.usd || 0,
      volume24h: coinGeckoData?.market_data?.total_volume?.usd || 0,
      priceChange24h: coinGeckoData?.market_data?.price_change_percentage_24h || 0,
      liquidity: dexData?.pairs?.[0]?.liquidity?.usd || 0
    },
    findings,
    risks
  };
}