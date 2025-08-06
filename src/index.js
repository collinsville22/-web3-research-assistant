#!/usr/bin/env node

import { program } from 'commander';
import SwarmCoordinator from './agents/SwarmCoordinator.js';
import fs from 'fs/promises';
import path from 'path';

const swarmCoordinator = new SwarmCoordinator();

program
  .name('web3-research-assistant')
  .description('AI-powered Web3 project research and due diligence assistant')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze a Web3 project')
  .option('-f, --file <path>', 'JSON file containing project data')
  .option('-n, --name <name>', 'Project name')
  .option('-w, --website <url>', 'Project website URL')
  .option('-wp, --whitepaper <url>', 'Whitepaper URL')
  .option('-c, --category <category>', 'Project category (DeFi, NFT, GameFi, etc.)')
  .option('-s, --symbol <symbol>', 'Token symbol')
  .option('-o, --output <path>', 'Output file for results')
  .action(async (options) => {
    try {
      let projectData;

      if (options.file) {
        console.log(`📄 Loading project data from: ${options.file}`);
        const fileContent = await fs.readFile(options.file, 'utf8');
        projectData = JSON.parse(fileContent);
      } else {
        if (!options.name) {
          console.error('❌ Error: Project name is required. Use -n or --name');
          process.exit(1);
        }

        projectData = {
          name: options.name,
          website: options.website,
          whitepaper: options.whitepaper,
          category: options.category || 'Unknown',
          token_symbol: options.symbol,
          contracts: []
        };
      }

      console.log(`🔬 Starting analysis for: ${projectData.name}`);
      console.log(`📊 Category: ${projectData.category}`);
      
      // Execute the research
      const startTime = Date.now();
      const report = await swarmCoordinator.coordinateResearch(projectData);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✅ Analysis completed in ${duration}s`);
      console.log(`📋 Overall Recommendation: ${report.overall_recommendation}`);
      console.log(`🎯 Consensus Score: ${report.consensus_score}/100`);
      console.log(`📈 Confidence Level: ${(report.confidence_level * 100).toFixed(1)}%`);

      // Output results
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(report, null, 2));
        console.log(`💾 Report saved to: ${options.output}`);
      } else {
        console.log('\n📊 EXECUTIVE SUMMARY:');
        console.log(report.executive_summary);
        
        if (report.key_findings && report.key_findings.length > 0) {
          console.log('\n🔍 KEY FINDINGS:');
          report.key_findings.forEach((finding, index) => {
            console.log(`${index + 1}. ${finding}`);
          });
        }

        if (report.conflicts_identified && report.conflicts_identified.length > 0) {
          console.log('\n⚠️  CONFLICTING ASSESSMENTS:');
          report.conflicts_identified.forEach((conflict, index) => {
            console.log(`${index + 1}. ${conflict.type}: ${JSON.stringify(conflict)}`);
          });
        }
      }

    } catch (error) {
      console.error(`❌ Analysis failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('server')
  .description('Start the Web3 Research Assistant API server')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .action(async (options) => {
    process.env.PORT = options.port;
    
    // Import and start the server
    const { default: app } = await import('./api/server.js');
    console.log(`🌐 Starting server on port ${options.port}...`);
  });

program
  .command('example')
  .description('Generate example project data file')
  .option('-o, --output <path>', 'Output file path', 'example-project.json')
  .action(async (options) => {
    const exampleProject = {
      name: "DeFi Innovation Protocol",
      category: "DeFi",
      website: "https://defi-innovation.example.com",
      whitepaper: "https://defi-innovation.example.com/whitepaper.pdf",
      token_symbol: "DEFI",
      contracts: [
        {
          address: "0x1234567890123456789012345678901234567890",
          blockchain: "ethereum",
          purpose: "main_contract"
        },
        {
          address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
          blockchain: "solana", 
          purpose: "token_program"
        }
      ],
      description: "An innovative DeFi protocol combining yield farming with cross-chain liquidity",
      social_links: {
        twitter: "https://twitter.com/defiinnovation",
        discord: "https://discord.gg/defiinnovation",
        telegram: "https://t.me/defiinnovation"
      },
      team: [
        {
          name: "Alice Johnson",
          role: "CEO & Founder",
          background: "Former Goldman Sachs, Stanford CS"
        },
        {
          name: "Bob Smith", 
          role: "CTO",
          background: "Ex-Google, Ethereum Foundation contributor"
        }
      ]
    };

    await fs.writeFile(options.output, JSON.stringify(exampleProject, null, 2));
    console.log(`📄 Example project data saved to: ${options.output}`);
    console.log(`🚀 Run analysis with: web3-research-assistant analyze -f ${options.output}`);
  });

program
  .command('contract')
  .description('Analyze a specific smart contract')
  .requiredOption('-a, --address <address>', 'Contract address')
  .option('-b, --blockchain <blockchain>', 'Blockchain (ethereum, solana, etc.)', 'ethereum')
  .option('-o, --output <path>', 'Output file for results')
  .action(async (options) => {
    try {
      console.log(`🔍 Analyzing contract: ${options.address}`);
      console.log(`⛓️  Blockchain: ${options.blockchain}`);

      const contractAgent = swarmCoordinator.agents.contract;
      const analysis = await contractAgent.analyzeContract(options.address, options.blockchain);

      console.log(`✅ Contract analysis completed`);
      console.log(`🛡️  Security Score: ${analysis.security_score}/100`);
      console.log(`⚠️  Risk Level: ${analysis.risk_level}`);

      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(analysis, null, 2));
        console.log(`💾 Analysis saved to: ${options.output}`);
      } else {
        console.log('\n📊 SECURITY ANALYSIS:');
        if (analysis.security_issues && analysis.security_issues.length > 0) {
          analysis.security_issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.severity}: ${issue.description}`);
          });
        } else {
          console.log('No significant security issues identified.');
        }
      }

    } catch (error) {
      console.error(`❌ Contract analysis failed: ${error.message}`);
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(`❌ Unknown command: ${program.args.join(' ')}`);
  console.log('📋 Available commands:');
  console.log('  analyze    - Analyze a Web3 project');
  console.log('  server     - Start API server');
  console.log('  example    - Generate example project data');
  console.log('  contract   - Analyze a smart contract');
  console.log('  help       - Show help information');
  process.exit(1);
});

if (process.argv.length === 2) {
  console.log('🤖 Web3 Research Assistant - AI-powered due diligence for Web3 projects');
  console.log('');
  console.log('📋 Available commands:');
  console.log('  analyze    - Analyze a Web3 project comprehensively');
  console.log('  server     - Start the API server');
  console.log('  example    - Generate example project data file');
  console.log('  contract   - Analyze a specific smart contract');
  console.log('  help       - Show detailed help information');
  console.log('');
  console.log('🚀 Quick start:');
  console.log('  1. web3-research-assistant example');
  console.log('  2. web3-research-assistant analyze -f example-project.json');
  console.log('');
  console.log('🌐 Start API server:');
  console.log('  web3-research-assistant server');
  process.exit(0);
}

program.parse();