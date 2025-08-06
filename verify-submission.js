#!/usr/bin/env node

/**
 * Web3 Research Assistant - Bounty Submission Verification
 * Checks that all required components are ready for submission
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Web3 Research Assistant - Bounty Submission Verification\n');

let allChecks = true;

// Required files check
const requiredFiles = [
  'README.md',
  'DEPLOYMENT.md', 
  'CONTRIBUTING.md',
  'LICENSE',
  'package.json',
  '.env.example',
  'src/index.js',
  'src/api/server.js',
  'src/agents/BaseAgent.js',
  'src/agents/ResearchAgent.js',
  'src/agents/ContractAgent.js',
  'src/agents/MarketAgent.js',
  'src/agents/SwarmCoordinator.js',
  'src/public/index.html',
  'src/tests/agents.test.js',
  'Dockerfile',
  'vercel.json',
  'example-project.json'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${file}`);
  if (!exists) allChecks = false;
});

// Package.json validation
console.log('\n📦 Checking package.json...');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  
  const checks = [
    ['Name', pkg.name === 'web3-research-assistant'],
    ['Description mentions JuliaOS', pkg.description && pkg.description.includes('JuliaOS')],
    ['Keywords include web3, blockchain, AI', pkg.keywords && pkg.keywords.includes('web3')],
    ['Has required dependencies', pkg.dependencies && pkg.dependencies.axios && pkg.dependencies['@solana/web3.js']],
    ['Has test script', pkg.scripts && pkg.scripts.test],
    ['Has server script', pkg.scripts && pkg.scripts.server]
  ];
  
  checks.forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${check}`);
    if (!passed) allChecks = false;
  });
} catch (error) {
  console.log('   ❌ Failed to parse package.json');
  allChecks = false;
}

// README validation
console.log('\n📖 Checking README.md...');
try {
  const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
  
  const readmeChecks = [
    ['Contains JuliaOS integration section', readme.includes('JuliaOS Integration')],
    ['Has setup instructions', readme.includes('Quick Start') || readme.includes('Setup')],
    ['Shows agent.useLLM() usage', readme.includes('agent.useLLM()')],
    ['Mentions swarm coordination', readme.includes('swarm')],
    ['Has live demo links section', readme.includes('Live Demo')],
    ['Includes usage examples', readme.includes('Example Analysis')],
    ['Has testing instructions', readme.includes('Testing') || readme.includes('npm test')]
  ];
  
  readmeChecks.forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${check}`);
    if (!passed) allChecks = false;
  });
} catch (error) {
  console.log('   ❌ Failed to read README.md');
  allChecks = false;
}

// JuliaOS integration check
console.log('\n🤖 Checking JuliaOS integration...');
try {
  const baseAgent = fs.readFileSync(path.join(__dirname, 'src/agents/BaseAgent.js'), 'utf8');
  const swarmCoordinator = fs.readFileSync(path.join(__dirname, 'src/agents/SwarmCoordinator.js'), 'utf8');
  
  const juliaChecks = [
    ['BaseAgent uses agent.useLLM()', baseAgent.includes('useLLM')],
    ['API calls to JuliaOS backend', baseAgent.includes('/api/agents/llm')],
    ['Swarm coordination implemented', swarmCoordinator.includes('initializeSwarm')],
    ['Fallback functionality present', baseAgent.includes('fallback')],
    ['Agent strategies configured', baseAgent.includes('strategy')]
  ];
  
  juliaChecks.forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${check}`);
    if (!passed) allChecks = false;
  });
} catch (error) {
  console.log('   ❌ Failed to check JuliaOS integration');
  allChecks = false;
}

// Test functionality
console.log('\n🧪 Checking test coverage...');
try {
  const testFile = fs.readFileSync(path.join(__dirname, 'src/tests/agents.test.js'), 'utf8');
  
  const testChecks = [
    ['Tests for all agent types', testFile.includes('ResearchAgent') && testFile.includes('ContractAgent')],
    ['Swarm coordination tests', testFile.includes('SwarmCoordinator')],
    ['Integration test included', testFile.includes('Integration Test')],
    ['Uses Node.js test runner', testFile.includes('node:test')]
  ];
  
  testChecks.forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`   ${status} ${check}`);
    if (!passed) allChecks = false;
  });
} catch (error) {
  console.log('   ❌ Failed to check test file');
  allChecks = false;
}

// Deployment readiness
console.log('\n🚀 Checking deployment readiness...');
const deploymentChecks = [
  ['Dockerfile present', fs.existsSync(path.join(__dirname, 'Dockerfile'))],
  ['Vercel config present', fs.existsSync(path.join(__dirname, 'vercel.json'))],
  ['Environment template present', fs.existsSync(path.join(__dirname, '.env.example'))],
  ['Deployment guide present', fs.existsSync(path.join(__dirname, 'DEPLOYMENT.md'))]
];

deploymentChecks.forEach(([check, passed]) => {
  const status = passed ? '✅' : '❌';
  console.log(`   ${status} ${check}`);
  if (!passed) allChecks = false;
});

// Final verdict
console.log('\n' + '='.repeat(60));
if (allChecks) {
  console.log('🎉 VERIFICATION PASSED! Your dApp is ready for bounty submission.');
  console.log('\n📋 Next Steps:');
  console.log('   1. Follow instructions in GITHUB_SETUP.md');
  console.log('   2. Create public GitHub repository');
  console.log('   3. Deploy live demo (Vercel/Netlify recommended)');
  console.log('   4. Submit repository URL to bounty platform');
  console.log('\n🚀 Good luck with your submission!');
  process.exit(0);
} else {
  console.log('❌ VERIFICATION FAILED! Please fix the issues above.');
  console.log('\n🔧 Check:');
  console.log('   - All required files are present');
  console.log('   - JuliaOS integration is complete');
  console.log('   - README has all required sections');
  console.log('   - Tests are comprehensive');
  process.exit(1);
}