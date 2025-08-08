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
    
    // Detect blockchain and resolve token info
    const blockchainInfo = detectBlockchain(tokenInput, coinGeckoData, birdeyeData, dexData);
    const tokenInfo = resolveTokenInfo(tokenInput, coinGeckoData, birdeyeData, dexData, blockchainInfo);
    
    // Fetch Solana Tracker data if it's a Solana token
    let solanaTrackerData = null;
    if (blockchainInfo.blockchain === 'solana' && blockchainInfo.isContractAddress) {
      console.log('🔥 Detected Solana token, fetching trader performance data...');
      solanaTrackerData = await fetchSolanaTrackerData(tokenInput);
    }
    
    // Prepare comprehensive project data for JuliaOS agents
    const projectData = {
      tokenInfo: tokenInfo,
      blockchainInfo: blockchainInfo,
      marketData: coinGeckoData,
      birdeyeData: birdeyeData,
      dexData: dexData,
      solanaTrackerData: solanaTrackerData,
      analysis: {
        keyMetrics: extractComprehensiveMetrics(coinGeckoData, birdeyeData, dexData, solanaTrackerData)
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
const SOLANA_TRACKER_BASE = 'https://data.solanatracker.io';
const SOLANA_TRACKER_API_KEY = '4a522555-848e-4877-ae22-6cea2c89d8b8';

// Blockchain detection and comprehensive data extraction functions
function detectBlockchain(tokenInput, coinGeckoData, birdeyeData, dexData) {
  // Detect blockchain from various sources
  let blockchain = 'unknown';
  let chainId = null;
  
  // Check DexScreener data first (most reliable for chain detection)
  if (dexData?.pairs && dexData.pairs.length > 0) {
    blockchain = dexData.pairs[0].chainId || 'unknown';
    chainId = dexData.pairs[0].chainId;
  }
  
  // Check CoinGecko platform data
  if (coinGeckoData?.asset_platform_id) {
    const platformMap = {
      'ethereum': 'ethereum',
      'binance-smart-chain': 'bsc', 
      'polygon-pos': 'polygon',
      'solana': 'solana',
      'avalanche': 'avalanche',
      'arbitrum-one': 'arbitrum',
      'optimistic-ethereum': 'optimism'
    };
    blockchain = platformMap[coinGeckoData.asset_platform_id] || blockchain;
  }
  
  // Address format detection as fallback
  if (blockchain === 'unknown') {
    if (tokenInput.length === 42 && tokenInput.startsWith('0x')) {
      blockchain = 'ethereum'; // Could be ETH, BSC, Polygon, etc.
    } else if (tokenInput.length >= 32 && tokenInput.length <= 44 && !tokenInput.startsWith('0x')) {
      blockchain = 'solana';
    }
  }
  
  return {
    blockchain,
    chainId,
    isContractAddress: tokenInput.length > 10, // Likely a contract address vs symbol
    addressFormat: tokenInput.startsWith('0x') ? 'evm' : 'solana'
  };
}

function resolveTokenInfo(tokenInput, coinGeckoData, birdeyeData, dexData, blockchainInfo) {
  return {
    name: coinGeckoData?.name || 
          birdeyeData?.overview?.name || 
          dexData?.pairs?.[0]?.baseToken?.name || 
          'Unknown Token',
    symbol: coinGeckoData?.symbol?.toUpperCase() || 
            birdeyeData?.overview?.symbol || 
            dexData?.pairs?.[0]?.baseToken?.symbol || 
            'UNKNOWN',
    address: blockchainInfo.isContractAddress ? tokenInput : 
             (coinGeckoData?.contract_address || tokenInput),
    description: coinGeckoData?.description?.en || 'No description available',
    blockchain: blockchainInfo.blockchain,
    chainId: blockchainInfo.chainId,
    image: coinGeckoData?.image?.large || 
           coinGeckoData?.image?.small || 
           dexData?.pairs?.[0]?.info?.imageUrl,
    websites: coinGeckoData?.links?.homepage?.filter(url => url) || [],
    socialLinks: {
      twitter: coinGeckoData?.links?.twitter_screen_name || '',
      telegram: coinGeckoData?.links?.telegram_channel_identifier || '',
      discord: coinGeckoData?.links?.discord || ''
    }
  };
}

function extractComprehensiveMetrics(coinGeckoData, birdeyeData, dexData, solanaTrackerData) {
  console.log('🔍 Data extraction debug:', {
    coinGeckoExists: !!coinGeckoData,
    coinGeckoPrice: coinGeckoData?.market_data?.current_price?.usd,
    coinGeckoMarketCap: coinGeckoData?.market_data?.market_cap?.usd,
    dexExists: !!dexData?.pairs?.[0],
    dexPrice: dexData?.pairs?.[0]?.priceUsd,
    dexMarketCap: dexData?.pairs?.[0]?.marketCap,
    birdeyeExists: !!birdeyeData
  });

  // Data source priority algorithm - avoid double counting
  const hasCoinGecko = coinGeckoData?.market_data?.current_price?.usd && coinGeckoData.market_data.current_price.usd > 0;
  const hasDexData = dexData?.pairs?.[0]?.priceUsd && parseFloat(dexData.pairs[0].priceUsd) > 0;
  const hasBirdeyeData = birdeyeData?.price?.value && birdeyeData.price.value > 0;
  
  // PRIMARY DATA SOURCE SELECTION (strict validation)
  let currentPrice, marketCap, volume24h, priceChange24h, circulatingSupply, totalSupply, maxSupply, dataSource;
  
  if (hasCoinGecko) {
    // Use CoinGecko as primary for established tokens
    dataSource = 'CoinGecko';
    currentPrice = coinGeckoData.market_data.current_price.usd;
    marketCap = coinGeckoData.market_data.market_cap?.usd || 0;
    volume24h = coinGeckoData.market_data.total_volume?.usd || 0;
    priceChange24h = coinGeckoData.market_data.price_change_percentage_24h || 0;
    circulatingSupply = coinGeckoData.market_data.circulating_supply || 0;
    totalSupply = coinGeckoData.market_data.total_supply || 0;
    maxSupply = coinGeckoData.market_data.max_supply || 0;
    
    console.log('✅ Using CoinGecko data:', { currentPrice, marketCap, volume24h });
  } else if (hasDexData) {
    // Use DexScreener as primary for new/unlisted tokens
    dataSource = 'DexScreener';
    currentPrice = parseFloat(dexData.pairs[0].priceUsd);
    marketCap = dexData.pairs[0].marketCap || 0;
    volume24h = dexData.pairs[0].volume?.h24 || 0;
    priceChange24h = dexData.pairs[0].priceChange?.h24 || 0;
    
    // Try to calculate supply from market cap and price
    if (marketCap > 0 && currentPrice > 0) {
      circulatingSupply = marketCap / currentPrice;
      totalSupply = dexData.pairs[0].fdv && dexData.pairs[0].fdv > marketCap ? 
                   (dexData.pairs[0].fdv / currentPrice) : circulatingSupply;
      maxSupply = totalSupply;
      console.log('💡 Calculated supply from market cap:', { circulatingSupply, totalSupply });
    } else {
      circulatingSupply = 0;
      totalSupply = 0;
      maxSupply = 0;
    }
    
    console.log('✅ Using DexScreener data:', { currentPrice, marketCap, volume24h });
  } else if (hasBirdeyeData) {
    // Fallback to Birdeye
    dataSource = 'Birdeye';
    currentPrice = birdeyeData.price.value;
    marketCap = 0; // Birdeye doesn't provide market cap in basic response
    volume24h = 0;
    priceChange24h = 0;
    circulatingSupply = 0;
    totalSupply = 0;
    maxSupply = 0;
    
    console.log('✅ Using Birdeye data:', { currentPrice });
  } else {
    // No valid data sources
    dataSource = 'None';
    currentPrice = 0;
    marketCap = 0;
    volume24h = 0;
    priceChange24h = 0;
    circulatingSupply = 0;
    totalSupply = 0;
    maxSupply = 0;
    
    console.log('❌ No valid data sources found');
  }
  
  // Sanity checks - reject obviously wrong data
  if (marketCap < 0 || marketCap > 10000000000000) { // >$10T is suspicious
    console.log('⚠️ Suspicious market cap detected, resetting:', marketCap);
    marketCap = 0;
  }
  
  if (volume24h < 0 || volume24h > marketCap * 10) { // Volume >10x market cap is suspicious
    console.log('⚠️ Suspicious volume detected, resetting:', volume24h);
    volume24h = 0;
  }
  
  // DEX-only metrics (no conflicts)
  const liquidity = dexData?.pairs?.[0]?.liquidity?.usd || 0;
  const fdv = dexData?.pairs?.[0]?.fdv || 0;
  
  // Transaction count (DEX-specific, single source)
  const txns24h = dexData?.pairs?.[0]?.txns?.h24 ? 
                 (dexData.pairs[0].txns.h24.buys + dexData.pairs[0].txns.h24.sells) : 0;
  
  // All-time high/low (CoinGecko only)
  const ath = coinGeckoData?.market_data?.ath?.usd || 0;
  const atl = coinGeckoData?.market_data?.atl?.usd || 0;
  const athChangePercentage = coinGeckoData?.market_data?.ath_change_percentage?.usd || 0;
  
  return {
    // Price metrics
    currentPrice,
    marketCap,
    volume24h,
    priceChange24h,
    
    // Supply metrics  
    circulatingSupply,
    totalSupply,
    maxSupply,
    
    // DEX metrics
    liquidity,
    fdv,
    txns24h,
    
    // Historical metrics
    ath,
    atl,
    athChangePercentage,
    
    // Ratios and derived metrics
    volumeToMarketCapRatio: marketCap > 0 ? (volume24h / marketCap) : 0,
    priceToAthRatio: ath > 0 ? (currentPrice / ath) : 0,
    liquidityRatio: marketCap > 0 ? (liquidity / marketCap) : 0,
    
    // Community/Social metrics from CoinGecko
    communityScore: coinGeckoData?.community_score || 0,
    developerScore: coinGeckoData?.developer_score || 0,
    publicInterestScore: coinGeckoData?.public_interest_score || 0,
    
    // Market rank
    marketCapRank: coinGeckoData?.market_cap_rank || 0,
    
    // Solana Tracker Performance (for Solana tokens only)
    traderPerformance: solanaTrackerData?.performance || null,
    
    // Data source indicator
    primaryDataSource: dataSource,
    hasSolanaData: !!solanaTrackerData
  };
}

async function fetchCoinGeckoData(tokenId) {
  try {
    console.log(`🦎 Fetching CoinGecko data for: ${tokenId}`);
    
    // Try direct coin lookup first if it looks like a symbol
    if (tokenId.length <= 5 && !tokenId.startsWith('0x')) {
      try {
        const directResponse = await fetch(`${COINGECKO_BASE}/coins/${tokenId.toLowerCase()}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`);
        if (directResponse.ok) {
          const directData = await directResponse.json();
          console.log(`✅ Found direct CoinGecko match for ${tokenId}`);
          return directData;
        }
      } catch (err) {
        console.log(`⚠️ Direct lookup failed for ${tokenId}, trying search...`);
      }
    }
    
    // Search for token
    const searchResponse = await fetch(`${COINGECKO_BASE}/search?query=${encodeURIComponent(tokenId)}`);
    
    if (!searchResponse.ok) {
      console.log(`❌ CoinGecko search failed: ${searchResponse.status}`);
      return null;
    }
    
    const searchData = await searchResponse.json();
    console.log(`🔍 CoinGecko search results: ${searchData.coins?.length || 0} matches`);
    
    if (searchData.coins && searchData.coins.length > 0) {
      // Find best match (prefer exact symbol match)
      let bestMatch = searchData.coins[0];
      for (const coin of searchData.coins) {
        if (coin.symbol?.toLowerCase() === tokenId.toLowerCase()) {
          bestMatch = coin;
          break;
        }
      }
      
      console.log(`🎯 Using CoinGecko match: ${bestMatch.id} (${bestMatch.symbol})`);
      
      // Get detailed coin data
      const coinResponse = await fetch(`${COINGECKO_BASE}/coins/${bestMatch.id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`);
      
      if (!coinResponse.ok) {
        console.log(`❌ CoinGecko details failed: ${coinResponse.status}`);
        return null;
      }
      
      return await coinResponse.json();
    }
    
    console.log(`❌ No CoinGecko matches found for: ${tokenId}`);
    return null;
  } catch (error) {
    console.error('❌ CoinGecko API error:', error.message);
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
    console.log(`🔍 Fetching DexScreener data for: ${tokenAddress}`);
    
    const response = await fetch(`${DEXSCREENER_BASE}/tokens/${tokenAddress}`);
    
    if (!response.ok) {
      console.log(`❌ DexScreener failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`📊 DexScreener pairs found: ${data.pairs?.length || 0}`);
    
    if (data.pairs && data.pairs.length > 0) {
      // Sort by liquidity (highest first) to get the most reliable pair
      data.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      console.log(`💰 Top pair liquidity: $${data.pairs[0].liquidity?.usd?.toLocaleString() || 0}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ DexScreener API error:', error.message);
    return null;
  }
}

async function fetchSolanaTrackerData(tokenAddress) {
  try {
    console.log(`🔥 Fetching Solana Tracker data for: ${tokenAddress}`);
    
    const headers = {
      'x-api-key': SOLANA_TRACKER_API_KEY,
      'Content-Type': 'application/json'
    };
    
    // Fetch multiple endpoints in parallel for comprehensive analysis
    const [tokenData, holdersData, topTradersData, firstBuyersData] = await Promise.allSettled([
      fetch(`${SOLANA_TRACKER_BASE}/tokens/${tokenAddress}`, { headers }),
      fetch(`${SOLANA_TRACKER_BASE}/tokens/${tokenAddress}/holders`, { headers }),
      fetch(`${SOLANA_TRACKER_BASE}/top-traders/${tokenAddress}`, { headers }),
      fetch(`${SOLANA_TRACKER_BASE}/first-buyers/${tokenAddress}`, { headers })
    ]);
    
    // Parse successful responses
    const results = {
      tokenInfo: null,
      holders: null,
      topTraders: null,
      firstBuyers: null
    };
    
    if (tokenData.status === 'fulfilled' && tokenData.value.ok) {
      results.tokenInfo = await tokenData.value.json();
      console.log('✅ Got Solana Tracker token info');
    }
    
    if (holdersData.status === 'fulfilled' && holdersData.value.ok) {
      results.holders = await holdersData.value.json();
      console.log(`✅ Got ${results.holders?.length || 0} holders data`);
    }
    
    if (topTradersData.status === 'fulfilled' && topTradersData.value.ok) {
      results.topTraders = await topTradersData.value.json();
      console.log(`✅ Got ${results.topTraders?.length || 0} top traders`);
    }
    
    if (firstBuyersData.status === 'fulfilled' && firstBuyersData.value.ok) {
      results.firstBuyers = await firstBuyersData.value.json();
      console.log(`✅ Got ${results.firstBuyers?.length || 0} first buyers`);
    }
    
    // Calculate trader performance metrics
    const performance = calculateTraderPerformance(results);
    
    return {
      ...results,
      performance,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Solana Tracker API error:', error.message);
    return null;
  }
}

function calculateTraderPerformance(solanaData) {
  const performance = {
    totalTraders: 0,
    profitableTraders: 0,
    losingTraders: 0,
    averageProfit: 0,
    averageLoss: 0,
    topProfitAmount: 0,
    topLossAmount: 0,
    winRate: 0,
    totalVolume: 0
  };
  
  try {
    // Analyze first buyers for early performance metrics
    if (solanaData.firstBuyers && Array.isArray(solanaData.firstBuyers)) {
      const traders = solanaData.firstBuyers;
      performance.totalTraders = traders.length;
      
      let totalProfit = 0;
      let totalLoss = 0;
      let profitableCount = 0;
      let losingCount = 0;
      
      traders.forEach(trader => {
        const pnl = trader.pnl || trader.total_pnl || 0;
        const volume = trader.volume || 0;
        
        performance.totalVolume += volume;
        
        if (pnl > 0) {
          totalProfit += pnl;
          profitableCount++;
          if (pnl > performance.topProfitAmount) {
            performance.topProfitAmount = pnl;
          }
        } else if (pnl < 0) {
          totalLoss += Math.abs(pnl);
          losingCount++;
          if (Math.abs(pnl) > performance.topLossAmount) {
            performance.topLossAmount = Math.abs(pnl);
          }
        }
      });
      
      performance.profitableTraders = profitableCount;
      performance.losingTraders = losingCount;
      performance.averageProfit = profitableCount > 0 ? totalProfit / profitableCount : 0;
      performance.averageLoss = losingCount > 0 ? totalLoss / losingCount : 0;
      performance.winRate = performance.totalTraders > 0 ? (profitableCount / performance.totalTraders) * 100 : 0;
    }
    
    // Enhance with top traders data if available
    if (solanaData.topTraders && Array.isArray(solanaData.topTraders)) {
      // Update top profit if we have better data
      solanaData.topTraders.forEach(trader => {
        const pnl = trader.pnl || trader.total_pnl || 0;
        if (pnl > performance.topProfitAmount) {
          performance.topProfitAmount = pnl;
        }
      });
    }
    
    console.log('📊 Calculated trader performance:', performance);
    return performance;
    
  } catch (error) {
    console.error('❌ Error calculating trader performance:', error);
    return performance;
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