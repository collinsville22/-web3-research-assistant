'use client';

import { useState } from 'react';

// TypeScript interfaces for type safety
interface TokenInfo {
  name: string;
  symbol: string;
  address: string;
  description: string;
}

interface KeyMetrics {
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
}

interface Analysis {
  overallScore: number;
  recommendation: string;
  riskLevel: string;
  keyMetrics: KeyMetrics;
  findings: string[];
  risks: string[];
}

interface AnalysisData {
  tokenInfo: TokenInfo;
  analysis: Analysis;
  marketData?: object;
  dexData?: object;
}

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (tokenInput: string) => {
    setIsAnalyzing(true);
    setError('');
    try {
      const response = await fetch('/.netlify/functions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenInput })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAnalysisData(result.data);
      } else {
        setError(result.error || 'Analysis failed');
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
              <h1 className="text-3xl font-bold mb-6">
                {analysisData.tokenInfo.name} ({analysisData.tokenInfo.symbol})
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Overall Score</h3>
                  <div className="text-4xl font-bold mb-2">{analysisData.analysis.overallScore}/100</div>
                  <div className="text-xl">{analysisData.analysis.recommendation}</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Risk Level: {analysisData.analysis.riskLevel}
                  </div>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div>Market Cap: ${(analysisData.analysis.keyMetrics.marketCap || 0).toLocaleString()}</div>
                    <div>24h Volume: ${(analysisData.analysis.keyMetrics.volume24h || 0).toLocaleString()}</div>
                    <div>24h Change: {(analysisData.analysis.keyMetrics.priceChange24h || 0).toFixed(2)}%</div>
                    <div>Liquidity: ${(analysisData.analysis.keyMetrics.liquidity || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
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

              {/* JuliaOS Agent Information */}
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <span className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></span>
                  🤖 JuliaOS Multi-Agent Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">3</div>
                    <div className="text-xs text-gray-400">AI Agents Deployed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">Real-time</div>
                    <div className="text-xs text-gray-400">LLM Processing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">Consensus</div>
                    <div className="text-xs text-gray-400">Swarm Intelligence</div>
                  </div>
                </div>
                <div className="text-sm text-gray-400 text-center">
                  Analysis powered by ResearchAgent, MarketAgent, and ContractAgent using JuliaOS framework
                </div>
              </div>
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
              <div className="text-3xl font-bold mb-2">3</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">API Sources</div>
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
