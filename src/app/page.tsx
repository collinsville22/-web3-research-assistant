'use client';

import { useState } from 'react';
import Image from 'next/image';

// TypeScript interfaces for type safety
interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  description: string;
}

interface TraderPerformance {
  totalTraders: number;
  profitableTraders: number;
  losingTraders: number;
  averageProfit: number;
  averageLoss: number;
  topProfitAmount: number;
  topLossAmount: number;
  winRate: number;
  totalVolume: number;
}

interface KeyMetrics {
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  liquidity: number;
  fdv: number;
  txns24h: number;
  ath: number;
  atl: number;
  athChangePercentage: number;
  volumeToMarketCapRatio: number;
  priceToAthRatio: number;
  liquidityRatio: number;
  communityScore: number;
  developerScore: number;
  publicInterestScore: number;
  marketCapRank: number;
  traderPerformance: TraderPerformance | null;
  primaryDataSource: string;
  hasSolanaData: boolean;
}

interface Analysis {
  overallScore: number;
  recommendation: string;
  riskLevel: string;
  keyMetrics: KeyMetrics;
  findings: string[];
  risks: string[];
}

interface BlockchainInfo {
  blockchain: string;
  chainId: string;
  isContractAddress: boolean;
  addressFormat: string;
}

interface AnalysisData {
  tokenInfo: TokenInfo & {
    blockchain: string;
    chainId: string;
    image?: string;
    websites?: string[];
    socialLinks?: {
      twitter?: string;
      telegram?: string;
      discord?: string;
    };
  };
  blockchainInfo: BlockchainInfo;
  analysis: Analysis;
  marketData?: object;
  dexData?: object;
}

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  // const [debugMode, setDebugMode] = useState(false); // Removed unused debug mode

  const handleAnalyze = async (tokenInput: string) => {
    setIsAnalyzing(true);
    setError('');
    setAnalysisData(null); // Clear previous results
    setCopied(false); // Reset copy state
    
    // Generate unique request ID to force fresh analysis
    const requestId = `${tokenInput.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Nuclear cache busting approach
      const cacheBuster = `${Date.now()}-${Math.random().toString(36).substr(2, 15)}`;
      const url = `/.netlify/functions/analyze?v=${cacheBuster}&t=${Date.now()}&r=${Math.random()}`;
      
      console.log(`🚀 Making request to: ${url} for token: ${tokenInput}`);
      
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store', // Critical: prevent browser caching
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Cache-Buster': cacheBuster
        },
        body: JSON.stringify({ 
          tokenInput: tokenInput.trim(),
          requestId,
          forceRefresh: true,
          timestamp: new Date().getTime(),
          cacheBuster: cacheBuster,
          userAgent: navigator.userAgent
        })
      });
      
      const result = await response.json();
      
      console.log(`📊 Analysis Response:`, {
        success: result.success,
        requestId: result.requestId,
        timestamp: result.timestamp,
        tokenName: result.data?.tokenInfo?.name,
        overallScore: result.data?.analysis?.overallScore,
        recommendation: result.data?.analysis?.recommendation
      });
      
      if (result.success) {
        try {
          // Comprehensive data sanitization with multiple safety layers
          const safeSanitizeData = (data: any) => {
            try {
              // Ensure all required top-level properties exist
              const safeData = {
                tokenInfo: {
                  name: data?.tokenInfo?.name || 'Unknown Token',
                  symbol: data?.tokenInfo?.symbol || 'UNKNOWN',
                  address: data?.tokenInfo?.address || '',
                  description: data?.tokenInfo?.description || '',
                  blockchain: data?.tokenInfo?.blockchain || 'unknown',
                  chainId: data?.tokenInfo?.chainId || 'unknown',
                  image: data?.tokenInfo?.image || null,
                  websites: Array.isArray(data?.tokenInfo?.websites) ? data.tokenInfo.websites : [],
                  socialLinks: {
                    twitter: data?.tokenInfo?.socialLinks?.twitter || '',
                    telegram: data?.tokenInfo?.socialLinks?.telegram || '',
                    discord: data?.tokenInfo?.socialLinks?.discord || ''
                  }
                },
                blockchainInfo: {
                  blockchain: data?.blockchainInfo?.blockchain || 'unknown',
                  chainId: data?.blockchainInfo?.chainId || 'unknown',
                  isContractAddress: Boolean(data?.blockchainInfo?.isContractAddress),
                  addressFormat: data?.blockchainInfo?.addressFormat || 'unknown'
                },
                analysis: {
                  overallScore: Number(data?.analysis?.overallScore) || 0,
                  recommendation: data?.analysis?.recommendation || 'No recommendation',
                  riskLevel: data?.analysis?.riskLevel || 'Unknown',
                  findings: Array.isArray(data?.analysis?.findings) ? data.analysis.findings : [],
                  risks: Array.isArray(data?.analysis?.risks) ? data.analysis.risks : [],
                  keyMetrics: {
                    currentPrice: Number(data?.analysis?.keyMetrics?.currentPrice) || 0,
                    marketCap: Number(data?.analysis?.keyMetrics?.marketCap) || 0,
                    volume24h: Number(data?.analysis?.keyMetrics?.volume24h) || 0,
                    priceChange24h: Number(data?.analysis?.keyMetrics?.priceChange24h) || 0,
                    circulatingSupply: Number(data?.analysis?.keyMetrics?.circulatingSupply) || 0,
                    totalSupply: Number(data?.analysis?.keyMetrics?.totalSupply) || 0,
                    maxSupply: Number(data?.analysis?.keyMetrics?.maxSupply) || 0,
                    liquidity: Number(data?.analysis?.keyMetrics?.liquidity) || 0,
                    fdv: Number(data?.analysis?.keyMetrics?.fdv) || 0,
                    txns24h: Number(data?.analysis?.keyMetrics?.txns24h) || 0,
                    ath: Number(data?.analysis?.keyMetrics?.ath) || 0,
                    atl: Number(data?.analysis?.keyMetrics?.atl) || 0,
                    athChangePercentage: Number(data?.analysis?.keyMetrics?.athChangePercentage) || 0,
                    volumeToMarketCapRatio: Number(data?.analysis?.keyMetrics?.volumeToMarketCapRatio) || 0,
                    priceToAthRatio: Number(data?.analysis?.keyMetrics?.priceToAthRatio) || 0,
                    liquidityRatio: Number(data?.analysis?.keyMetrics?.liquidityRatio) || 0,
                    communityScore: Number(data?.analysis?.keyMetrics?.communityScore) || 0,
                    developerScore: Number(data?.analysis?.keyMetrics?.developerScore) || 0,
                    publicInterestScore: Number(data?.analysis?.keyMetrics?.publicInterestScore) || 0,
                    marketCapRank: Number(data?.analysis?.keyMetrics?.marketCapRank) || 0,
                    primaryDataSource: data?.analysis?.keyMetrics?.primaryDataSource || 'Unknown',
                    hasSolanaData: Boolean(data?.analysis?.keyMetrics?.hasSolanaData),
                    // Enhanced trader performance sanitization
                    traderPerformance: (() => {
                      const tp = data?.analysis?.keyMetrics?.traderPerformance;
                      if (!tp || typeof tp !== 'object' || tp === null) {
                        return null;
                      }
                      
                      // Return sanitized trader performance data
                      return {
                        totalTraders: Math.max(0, Number(tp.totalTraders) || 0),
                        profitableTraders: Math.max(0, Number(tp.profitableTraders) || 0),
                        losingTraders: Math.max(0, Number(tp.losingTraders) || 0),
                        averageProfit: Math.max(0, Number(tp.averageProfit) || 0),
                        averageLoss: Math.max(0, Number(tp.averageLoss) || 0),
                        topProfitAmount: Math.max(0, Number(tp.topProfitAmount) || 0),
                        topLossAmount: Math.max(0, Number(tp.topLossAmount) || 0),
                        winRate: Math.min(100, Math.max(0, Number(tp.winRate) || 0)),
                        totalVolume: Math.max(0, Number(tp.totalVolume) || 0)
                      };
                    })()
                  }
                },
                marketData: data?.marketData || null,
                dexData: data?.dexData || null
              };
              
              console.log('🔒 Data sanitization complete:', {
                tokenName: safeData.tokenInfo.name,
                hasTraderPerformance: !!safeData.analysis.keyMetrics.traderPerformance,
                blockchain: safeData.tokenInfo.blockchain
              });
              
              return safeData;
            } catch (sanitizationError) {
              console.error('❌ Critical sanitization error:', sanitizationError);
              throw new Error('Data sanitization failed');
            }
          };

          // Force a complete state refresh with enhanced error handling
          setTimeout(() => {
            try {
              const sanitizedData = safeSanitizeData(result.data);
              setAnalysisData(sanitizedData);
              console.log(`✅ Analysis data set safely for: ${sanitizedData.tokenInfo.name}`);
            } catch (renderError) {
              console.error('❌ Render preparation error:', renderError);
              setError('Data processing completed but display preparation failed. Please try again.');
            }
          }, 100);
        } catch (dataProcessingError) {
          console.error('❌ Frontend data processing error:', dataProcessingError);
          setError('Analysis completed but failed to display results. Please try again.');
        }
      } else {
        setError(result.error || 'Analysis failed');
        console.error('❌ Analysis failed:', result.error);
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <main className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(64,64,64,0.1)_0%,transparent_100%)]" />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 md:p-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-sm" />
          <span className="text-xl font-bold tracking-tight">TokenAI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm">
          <a href="#" className="hover:text-gray-300 transition-colors">Features</a>
          <a href="#" className="hover:text-gray-300 transition-colors">API</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Docs</a>
        </div>
      </nav>

      {/* Loading Screen */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
            <div className="text-lg">Analyzing token...</div>
            <div className="text-gray-400 text-sm mt-2">Fetching data from multiple sources</div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {analysisData && (
        <div className="fixed inset-0 z-40 bg-black p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => setAnalysisData(null)}
              className="mb-6 px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            >
              ← New Analysis
            </button>
            
            <div className="bg-gray-900 rounded-xl p-8">
              {/* Safe Rendering Wrapper */}
              {(() => {
                try {
                  return (
                    <>
              {/* Token Header */}
              <div className="flex items-center mb-6">
                {analysisData?.tokenInfo?.image && (
                  <Image 
                    src={analysisData.tokenInfo.image} 
                    alt={analysisData.tokenInfo.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full mr-4"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold">
                    {analysisData.tokenInfo.name} ({analysisData.tokenInfo.symbol})
                  </h1>
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-400">
                    <span className="bg-blue-600 px-2 py-1 rounded text-white capitalize">
                      {analysisData.tokenInfo.blockchain}
                    </span>
                    {analysisData.analysis.keyMetrics.marketCapRank > 0 && (
                      <span>Rank #{analysisData.analysis.keyMetrics.marketCapRank}</span>
                    )}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(analysisData.tokenInfo.address);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        }}
                        className={`font-mono text-xs px-2 py-1 rounded transition-colors cursor-pointer flex items-center space-x-1 ${
                          copied ? 'bg-green-700 text-green-100' : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                        title="Click to copy full address"
                      >
                        <span>{copied ? '✓ Copied!' : `${analysisData.tokenInfo.address.slice(0, 8)}...${analysisData.tokenInfo.address.slice(-6)}`}</span>
                        {!copied && (
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price and Core Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Price</h3>
                  <div className="text-3xl font-bold mb-2">
                    ${analysisData.analysis.keyMetrics.currentPrice.toFixed(6)}
                  </div>
                  <div className={`text-lg ${
                    analysisData.analysis.keyMetrics.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {analysisData.analysis.keyMetrics.priceChange24h >= 0 ? '+' : ''}
                    {analysisData.analysis.keyMetrics.priceChange24h.toFixed(2)}%
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Overall Score</h3>
                  <div className="text-4xl font-bold mb-2">{analysisData.analysis.overallScore}/100</div>
                  <div className="text-xl">{analysisData.analysis.recommendation}</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Risk Level: {analysisData.analysis.riskLevel}
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Market Cap</h3>
                  <div className="text-2xl font-bold mb-2">
                    ${(analysisData.analysis.keyMetrics.marketCap || 0).toLocaleString()}
                  </div>
                  {analysisData.analysis.keyMetrics.fdv > 0 && (
                    <div className="text-sm text-gray-400">
                      FDV: ${analysisData.analysis.keyMetrics.fdv.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">24h Volume</h4>
                  <div className="text-xl font-bold">
                    ${(analysisData.analysis.keyMetrics.volume24h || 0).toLocaleString()}
                  </div>
                  {analysisData.analysis.keyMetrics.volumeToMarketCapRatio > 0 && (
                    <div className="text-xs text-gray-400">
                      {(analysisData.analysis.keyMetrics.volumeToMarketCapRatio * 100).toFixed(2)}% of MCap
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Liquidity</h4>
                  <div className="text-xl font-bold">
                    ${(analysisData.analysis.keyMetrics.liquidity || 0).toLocaleString()}
                  </div>
                  {analysisData.analysis.keyMetrics.liquidityRatio > 0 && (
                    <div className="text-xs text-gray-400">
                      {(analysisData.analysis.keyMetrics.liquidityRatio * 100).toFixed(2)}% of MCap
                    </div>
                  )}
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">24h Transactions</h4>
                  <div className="text-xl font-bold">
                    {(analysisData.analysis.keyMetrics.txns24h || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">Supply</h4>
                  {analysisData.analysis.keyMetrics.circulatingSupply > 0 ? (
                    <div>
                      <div className="text-lg font-bold">
                        {analysisData.analysis.keyMetrics.circulatingSupply.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">Circulating</div>
                      {analysisData.analysis.keyMetrics.totalSupply > 0 && (
                        <div className="text-sm text-gray-400 mt-1">
                          Total: {analysisData.analysis.keyMetrics.totalSupply.toLocaleString()}
                        </div>
                      )}
                      {analysisData.analysis.keyMetrics.maxSupply > 0 && (
                        <div className="text-sm text-gray-400">
                          Max: {analysisData.analysis.keyMetrics.maxSupply.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Supply data not available</div>
                  )}
                </div>
              </div>

              {/* ATH/ATL Section */}
              {analysisData.analysis.keyMetrics.ath > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-green-400">📈 All-Time High</h3>
                    <div className="text-2xl font-bold mb-2">${analysisData.analysis.keyMetrics.ath.toFixed(6)}</div>
                    <div className="text-sm text-gray-400">
                      Current: {(analysisData.analysis.keyMetrics.priceToAthRatio * 100).toFixed(1)}% of ATH
                    </div>
                    <div className="text-sm text-red-400">
                      {analysisData.analysis.keyMetrics.athChangePercentage.toFixed(2)}% from ATH
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 text-red-400">📉 All-Time Low</h3>
                    <div className="text-2xl font-bold mb-2">${analysisData.analysis.keyMetrics.atl.toFixed(6)}</div>
                    {analysisData.analysis.keyMetrics.atl > 0 && (
                      <div className="text-sm text-green-400">
                        {((analysisData.analysis.keyMetrics.currentPrice / analysisData.analysis.keyMetrics.atl - 1) * 100).toFixed(0)}x from ATL
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Community Scores */}
              {(analysisData.analysis.keyMetrics.communityScore > 0 || 
                analysisData.analysis.keyMetrics.developerScore > 0) && (
                <div className="bg-gray-800 p-6 rounded-lg mb-8">
                  <h3 className="text-lg font-semibold mb-4">📊 Community & Development Scores</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysisData.analysis.keyMetrics.communityScore > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                          {analysisData.analysis.keyMetrics.communityScore}/100
                        </div>
                        <div className="text-sm text-gray-400">Community Score</div>
                      </div>
                    )}
                    {analysisData.analysis.keyMetrics.developerScore > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">
                          {analysisData.analysis.keyMetrics.developerScore}/100
                        </div>
                        <div className="text-sm text-gray-400">Developer Score</div>
                      </div>
                    )}
                    {analysisData.analysis.keyMetrics.publicInterestScore > 0 && (
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {analysisData.analysis.keyMetrics.publicInterestScore}/100
                        </div>
                        <div className="text-sm text-gray-400">Public Interest</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Solana Trader Performance Analysis */}
              {analysisData?.analysis?.keyMetrics?.traderPerformance && 
               analysisData?.tokenInfo?.blockchain === 'solana' && 
               analysisData.analysis.keyMetrics.traderPerformance.totalTraders > 0 && (
                <div className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-500/30 rounded-lg p-6 mb-8">
                  <h3 className="text-xl font-semibold mb-6 flex items-center">
                    <span className="w-3 h-3 bg-orange-400 rounded-full mr-3 animate-pulse"></span>
                    🔥 Solana Trader Performance Analysis
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {analysisData.analysis.keyMetrics.traderPerformance.totalTraders || 0}
                      </div>
                      <div className="text-xs text-gray-400">Total Traders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {(analysisData.analysis.keyMetrics.traderPerformance.winRate || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {analysisData.analysis.keyMetrics.traderPerformance.profitableTraders || 0}
                      </div>
                      <div className="text-xs text-gray-400">Profitable Traders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {analysisData.analysis.keyMetrics.traderPerformance.losingTraders || 0}
                      </div>
                      <div className="text-xs text-gray-400">Losing Traders</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-green-400 mb-3">💰 Top Performers</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Highest Profit:</span>
                          <span className="text-sm font-bold text-green-400">
                            ${(analysisData.analysis.keyMetrics.traderPerformance.topProfitAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Average Profit:</span>
                          <span className="text-sm font-bold text-green-400">
                            ${(analysisData.analysis.keyMetrics.traderPerformance.averageProfit || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-red-400 mb-3">📉 Risk Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Biggest Loss:</span>
                          <span className="text-sm font-bold text-red-400">
                            -${(analysisData.analysis.keyMetrics.traderPerformance.topLossAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-300">Average Loss:</span>
                          <span className="text-sm font-bold text-red-400">
                            -${(analysisData.analysis.keyMetrics.traderPerformance.averageLoss || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Trading Volume:</span>
                      <span className="text-lg font-bold text-blue-400">
                        ${(analysisData.analysis.keyMetrics.traderPerformance.totalVolume || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-center text-xs text-gray-500">
                    Data powered by Solana Tracker - Real trader performance metrics
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-green-400">🔬 Key Findings</h3>
                  <ul className="space-y-2">
                    {analysisData.analysis.findings.map((finding: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300">• {finding}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-400">⚠️ Risk Factors</h3>
                  <ul className="space-y-2">
                    {analysisData.analysis.risks.map((risk: string, i: number) => (
                      <li key={i} className="text-sm text-gray-300">• {risk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Data Source & JuliaOS Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">📊 Data Sources</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Primary Data:</span>
                      <span className="font-semibold text-blue-400">
                        {analysisData.analysis.keyMetrics.primaryDataSource}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>DEX Data:</span>
                      <span className="text-green-400">DexScreener</span>
                    </div>
                    {analysisData.analysis.keyMetrics.hasSolanaData && (
                      <div className="flex justify-between">
                        <span>Trader Data:</span>
                        <span className="text-orange-400">Solana Tracker</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></span>
                    🤖 JuliaOS Analysis
                  </h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-400">3</div>
                      <div className="text-xs text-gray-400">AI Agents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-400">Real-time</div>
                      <div className="text-xs text-gray-400">Processing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">Consensus</div>
                      <div className="text-xs text-gray-400">Intelligence</div>
                    </div>
                  </div>
                </div>
              </div>
                    </>
                  );
                } catch (renderError) {
                  console.error('❌ Critical rendering error:', renderError);
                  return (
                    <div className="text-center py-8">
                      <div className="text-red-400 text-lg mb-4">⚠️ Display Error</div>
                      <div className="text-gray-400 text-sm mb-4">
                        Analysis completed but results cannot be displayed properly.
                      </div>
                      <button 
                        onClick={() => setAnalysisData(null)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 pt-20 md:pt-32">
        <div className="text-center">
          {/* Progress indicator */}
          <div className="inline-flex items-center space-x-2 mb-8">
            <div className="w-2 h-2 bg-white rounded-full" />
            <div className="w-16 h-px bg-gradient-to-r from-white to-transparent" />
            <span className="text-xs text-gray-400 tracking-wider uppercase">AI-POWERED</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8">
            Advanced Token
            <br />
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Analysis Engine
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Real-time intelligence from CoinGecko, Birdeye, and DexScreener. 
            Get comprehensive risk assessment and market insights in seconds.
          </p>

          {/* Token Input */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const tokenInput = formData.get('tokenInput') as string;
              if (tokenInput.trim()) {
                handleAnalyze(tokenInput.trim());
              }
            }} className="relative">
              <input
                name="tokenInput"
                type="text"
                placeholder="Enter token address or symbol (e.g., BTC, ETH, or contract address)"
                className="w-full px-6 py-4 text-lg bg-gray-900/50 border border-gray-700 rounded-lg focus:border-white focus:outline-none transition-colors placeholder-gray-500"
                autoComplete="off"
                disabled={isAnalyzing}
              />
              <button
                type="submit"
                disabled={isAnalyzing}
                className="absolute right-2 top-2 px-6 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50"
              >
                Analyze
              </button>
            </form>
            
            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">4</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">API Sources</div>
              <div className="text-xs text-gray-500 mt-1">+ Solana Tracker for SOL tokens</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">Real-time</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">Data Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">AI-Powered</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">Risk Assessment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 bg-gray-900/30 rounded-xl border border-gray-800">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-white rounded-sm" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Multi-Source Intelligence</h3>
            <p className="text-gray-400 leading-relaxed">
              Aggregates data from CoinGecko, Birdeye, and DexScreener for comprehensive market analysis and risk assessment.
            </p>
          </div>

          <div className="p-8 bg-gray-900/30 rounded-xl border border-gray-800">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 bg-white rounded-sm" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-Time Analysis</h3>
            <p className="text-gray-400 leading-relaxed">
              Get instant insights on market cap, liquidity, trading volume, and community metrics with AI-powered scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 mt-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              Powered by advanced AI and real-time blockchain data
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">Live</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
