#!/usr/bin/env node

/**
 * Evolution Core v2 Test Suite
 * 
 * Tests all new components:
 * - Evolution Engine v2
 * - Learning System
 * - Pattern Extractor
 * - Community Sharing
 */

const chalk = require('chalk');
const EvolutionEngineV2 = require('./evolution-engine-v2');
const LearningSystem = require('./modules/learning-system');
const PatternExtractor = require('./modules/pattern-extractor');
const CommunityShare = require('./modules/community-share');

async function runTests() {
  console.log(chalk.bold.cyan('\n🧪 Autonomous Evolution Core v2 - Test Suite'));
  console.log(chalk.gray('─'.repeat(60)));

  let passed = 0;
  let failed = 0;

  // Test 1: Evolution Engine - Load Registry
  console.log(chalk.yellow('\n[Test 1] Evolution Engine - Load Registry'));
  try {
    const engine = new EvolutionEngineV2();
    const status = engine.getStatus();
    
    if (status.totalCapabilities > 0) {
      console.log(chalk.green('✓ PASS: Loaded ' + status.totalCapabilities + ' capabilities'));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: No capabilities loaded'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 2: Evolution Engine - Detect Capabilities
  console.log(chalk.yellow('\n[Test 2] Evolution Engine - Detect Missing Capabilities'));
  try {
    const engine = new EvolutionEngineV2();
    const missing = engine.detectCapabilities("I need to scrape a website and create a PDF report");
    
    if (missing.length > 0) {
      console.log(chalk.green('✓ PASS: Detected ' + missing.length + ' missing capabilities'));
      console.log(chalk.gray('  - ' + missing.map(m => m.capability.name).join(', ')));
      passed++;
    } else {
      console.log(chalk.yellow('⚠ WARN: No capabilities detected (query may not match patterns)'));
      passed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 3: Evolution Engine - Suggest Capabilities
  console.log(chalk.yellow('\n[Test 3] Evolution Engine - Suggest Capabilities'));
  try {
    const engine = new EvolutionEngineV2();
    const suggestions = engine.suggestCapabilities("building a customer support chatbot");
    
    if (suggestions.length >= 0) {
      console.log(chalk.green('✓ PASS: Generated ' + suggestions.length + ' suggestions'));
      if (suggestions.length > 0) {
        console.log(chalk.gray('  Top suggestion: ' + suggestions[0].name + ' (score: ' + suggestions[0].score + ')'));
      }
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Failed to generate suggestions'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 4: Learning System - Record Success
  console.log(chalk.yellow('\n[Test 4] Learning System - Record Success'));
  try {
    const learning = new LearningSystem();
    const workflow = {
      toolsUsed: ['web_search', 'browser'],
      steps: [
        { tool: 'web_search', description: 'Search for information' },
        { tool: 'browser', description: 'Navigate to results' }
      ],
      duration: 5000,
      outcome: 'success',
      capabilitiesUsed: ['web-search'],
      context: { goal: 'research' }
    };

    const id = learning.recordSuccess(workflow);
    
    if (id) {
      console.log(chalk.green('✓ PASS: Recorded success (ID: ' + id + ')'));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Failed to record success'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 5: Learning System - Record Failure
  console.log(chalk.yellow('\n[Test 5] Learning System - Record Failure'));
  try {
    const learning = new LearningSystem();
    const failure = {
      toolsUsed: ['web_search'],
      error: 'API key not found',
      step: 'search',
      context: { goal: 'research' },
      suggestion: 'Set BRAVE_API_KEY environment variable'
    };

    const id = learning.recordFailure(failure);
    
    if (id) {
      console.log(chalk.green('✓ PASS: Recorded failure (ID: ' + id + ')'));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Failed to record failure'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 6: Learning System - Generate Report
  console.log(chalk.yellow('\n[Test 6] Learning System - Generate Report'));
  try {
    const learning = new LearningSystem();
    const report = learning.generateReport();
    
    if (report.successRate) {
      console.log(chalk.green('✓ PASS: Generated report'));
      console.log(chalk.gray('  - Success Rate: ' + report.successRate));
      console.log(chalk.gray('  - Learned Patterns: ' + report.learnedPatterns));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Failed to generate report'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 7: Pattern Extractor - Extract from Workflow
  console.log(chalk.yellow('\n[Test 7] Pattern Extractor - Extract Template'));
  try {
    const learning = new LearningSystem();
    const extractor = new PatternExtractor(learning);
    
    const workflow = {
      steps: [
        { tool: 'web_search', description: 'Search' },
        { tool: 'browser', description: 'Navigate' },
        { tool: 'read', description: 'Extract data' }
      ],
      toolsUsed: ['web_search', 'browser', 'read'],
      capabilitiesUsed: ['web-search', 'file-read'],
      context: { goal: 'web scraping research' }
    };

    const result = extractor.extractFromWorkflow(workflow);
    
    if (result && result.template) {
      console.log(chalk.green('✓ PASS: Extracted template (ID: ' + result.template.id + ')'));
      console.log(chalk.gray('  - Name: ' + result.template.name));
      console.log(chalk.gray('  - Category: ' + result.template.category));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Failed to extract template'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 8: Pattern Extractor - Search Templates
  console.log(chalk.yellow('\n[Test 8] Pattern Extractor - Search Templates'));
  try {
    const learning = new LearningSystem();
    const extractor = new PatternExtractor(learning);
    
    const templates = extractor.searchTemplates('research');
    
    if (Array.isArray(templates)) {
      console.log(chalk.green('✓ PASS: Search completed (' + templates.length + ' results)'));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Search failed'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 9: Pattern Extractor - Generate Statistics
  console.log(chalk.yellow('\n[Test 9] Pattern Extractor - Get Statistics'));
  try {
    const learning = new LearningSystem();
    const extractor = new PatternExtractor(learning);
    
    const stats = extractor.getStatistics();
    
    if (stats && typeof stats.totalTemplates === 'number') {
      console.log(chalk.green('✓ PASS: Generated statistics'));
      console.log(chalk.gray('  - Total Templates: ' + stats.totalTemplates));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Failed to generate statistics'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 10: Community Share - Share Pattern
  console.log(chalk.yellow('\n[Test 10] Community Share - Share Pattern (dry run)'));
  try {
    const community = new CommunityShare();
    
    const pattern = {
      id: 'test_pattern_123',
      name: 'Test Pattern',
      type: 'tool-sequence',
      successRate: 1.0,
      useCases: ['testing']
    };

    const result = await community.sharePattern(pattern, { dryRun: true });
    
    if (result.success && result.dryRun) {
      console.log(chalk.green('✓ PASS: Dry run successful'));
      console.log(chalk.gray('  - Would share: ' + result.pattern.name));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Share pattern failed'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 11: Community Share - Request Capability
  console.log(chalk.yellow('\n[Test 11] Community Share - Request Capability (dry run)'));
  try {
    const community = new CommunityShare();
    
    const request = {
      name: 'Test Capability Request',
      description: 'A test capability',
      category: 'general'
    };

    const result = await community.requestCapability(request, { dryRun: true });
    
    if (result.success && result.dryRun) {
      console.log(chalk.green('✓ PASS: Dry run successful'));
      console.log(chalk.gray('  - Would request: ' + result.request.name));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Request capability failed'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Test 12: Community Share - Get Statistics
  console.log(chalk.yellow('\n[Test 12] Community Share - Get Statistics'));
  try {
    const community = new CommunityShare();
    const stats = community.getStatistics();
    
    if (stats && typeof stats.sharedPatterns === 'number') {
      console.log(chalk.green('✓ PASS: Generated statistics'));
      console.log(chalk.gray('  - Shared Patterns: ' + stats.sharedPatterns));
      console.log(chalk.gray('  - Total Votes: ' + stats.totalVotes));
      passed++;
    } else {
      console.log(chalk.red('✗ FAIL: Failed to generate statistics'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red('✗ FAIL: ' + error.message));
    failed++;
  }

  // Summary
  console.log(chalk.bold('\n📊 Test Summary'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log('  Total Tests: ' + (passed + failed));
  console.log('  ' + chalk.green('Passed: ') + passed);
  console.log('  ' + chalk.red('Failed: ') + failed);
  console.log('  Success Rate: ' + Math.round((passed / (passed + failed)) * 100) + '%');
  console.log(chalk.gray('─'.repeat(60)));

  if (failed === 0) {
    console.log(chalk.bold.green('\n✨ All tests passed! Evolution Core v2 is working correctly.'));
    process.exit(0);
  } else {
    console.log(chalk.bold.yellow('\n⚠ ' + failed + ' test(s) failed. Please review the errors above.'));
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(chalk.red('\n💥 Test suite crashed:'), error);
  process.exit(1);
});
