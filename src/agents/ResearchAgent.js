import BaseAgent from './BaseAgent.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class ResearchAgent extends BaseAgent {
  constructor() {
    super('research');
  }

  async analyzeProject(projectData) {
    await this.log('Starting comprehensive project analysis');

    const analysis = await this.useLLM(
      `Analyze this Web3 project for investment potential and risks: ${JSON.stringify(projectData)}`,
      {
        task: 'project_analysis',
        focus_areas: ['technology', 'team', 'tokenomics', 'market_fit', 'competition'],
        analysis_depth: 'comprehensive'
      }
    );

    const websiteAnalysis = await this.analyzeWebsite(projectData.website);
    const documentAnalysis = await this.analyzeDocumentation(projectData.whitepaper);

    return {
      overall_score: this.calculateOverallScore(analysis, websiteAnalysis, documentAnalysis),
      technology_assessment: analysis.technology || 'Not available',
      team_analysis: analysis.team || 'Not available',
      tokenomics_review: analysis.tokenomics || 'Not available',
      website_analysis: websiteAnalysis,
      documentation_quality: documentAnalysis,
      risk_factors: analysis.risks || [],
      opportunities: analysis.opportunities || [],
      recommendation: analysis.recommendation || 'Further research required',
      confidence: analysis.confidence || 0.5,
      timestamp: new Date().toISOString()
    };
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

  calculateOverallScore(analysis, websiteAnalysis, documentAnalysis) {
    const weights = {
      technology: 0.3,
      team: 0.2,
      website: 0.2,
      documentation: 0.2,
      market_fit: 0.1
    };

    let score = 0;
    score += (analysis.technology_score || 0.5) * weights.technology;
    score += (analysis.team_score || 0.5) * weights.team;
    score += this.getWebsiteScore(websiteAnalysis.quality) * weights.website;
    score += this.getDocScore(documentAnalysis.quality) * weights.documentation;
    score += (analysis.market_score || 0.5) * weights.market_fit;

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