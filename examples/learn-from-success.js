#!/usr/bin/env node

/**
 * Learn from Success - Demo
 * 
 * Demonstrates recording a successful workflow for learning
 */

const chalk = require('chalk');
const LearningSystem = require('../modules/learning-system');
const PatternExtractor = require('../modules/pattern-extractor');

async function demo() {
  console.log(chalk.bold.cyan('\n📚 Learn from Success - Demo'));
  console.log(chalk.gray('─'.repeat(60)));

  // Initialize
  const learning = new LearningSystem();
  const extractor = new PatternExtractor(learning);

  // Simulate a successful workflow
  console.log(chalk.yellow('\n[Scenario] Agent successfully completes a web scraping task'));

  const successfulWorkflow = {
    toolsUsed: ['web_search', 'browser', 'read', 'write'],
    steps: [
      {
        tool: 'web_search',
        description: 'Search for e-commerce sites with pricing data',
        parameters: { query: 'ecommerce pricing comparison' },
        duration: 1200
      },
      {
        tool: 'browser',
        description: 'Navigate to top results',
        parameters: { url: 'https://example.com' },
        duration: 800
      },
      {
        tool: 'read',
        description: 'Extract pricing data from pages',
        parameters: { selector: '.price', format: 'json' },
        duration: 1500
      },
      {
        tool: 'write',
        description: 'Save extracted data to CSV file',
        parameters: { filename: 'pricing.csv', format: 'csv' },
        duration: 400
      }
    ],
    duration: 3900,
    outcome: 'success',
    capabilitiesUsed: ['web-search', 'web-browser', 'file-read', 'file-write'],
    context: {
      goal: 'scrape e-commerce pricing data',
      industry: 'retail',
      taskType: 'data-extraction',
      userRequest: 'Get pricing from these 5 websites'
    }
  };

  console.log(chalk.cyan('\n📝 Workflow Details:'));
  console.log('  Goal: ' + successfulWorkflow.context.goal);
  console.log('  Tools: ' + successfulWorkflow.toolsUsed.join(', '));
  console.log('  Steps: ' + successfulWorkflow.steps.length);
  console.log('  Duration: ' + successfulWorkflow.duration + 'ms');
  console.log('  Capabilities: ' + successfulWorkflow.capabilitiesUsed.join(', '));

  // Record the success
  console.log(chalk.yellow('\n[Action] Recording successful workflow...'));
  const workflowId = learning.recordSuccess(successfulWorkflow);
  
  console.log(chalk.green('✓ Workflow recorded (ID: ' + workflowId + ')'));

  // Check what was learned
  console.log(chalk.cyan('\n🧠 Patterns Extracted:'));
  const patterns = learning.learnedPatterns.slice(-3); // Last 3 patterns
  
  if (patterns.length > 0) {
    patterns.forEach((pattern, i) => {
      console.log('\n  ' + (i + 1) + '. ' + pattern.type);
      console.log('     Success Rate: ' + chalk.bold.green((pattern.successRate * 100).toFixed(1) + '%'));
      
      if (pattern.type === 'tool-sequence') {
        console.log('     Sequence: ' + pattern.sequence.join(' → '));
      }
    });
  }

  // Extract a skill template
  console.log(chalk.yellow('\n[Action] Extracting skill template...'));
  const extractionResult = extractor.extractFromWorkflow(successfulWorkflow);
  
  if (extractionResult && extractionResult.template) {
    const template = extractionResult.template;
    console.log(chalk.green('✓ Template extracted (ID: ' + template.id + ')'));
    
    console.log(chalk.cyan('\n📦 Skill Template:'));
    console.log('  Name: ' + chalk.bold(template.name));
    console.log('  Category: ' + template.category);
    console.log('  Use Cases: ' + template.useCases.join(', '));
    console.log('  Tools Required: ' + template.toolsRequired.join(', '));
    console.log('  Success Count: ' + template.successCount);
    
    // Generate skill files
    console.log(chalk.yellow('\n[Action] Generating skill package...'));
    const packageResult = extractor.generateSkillPackage(template, '/tmp/demo-skill');
    
    if (packageResult.success) {
      console.log(chalk.green('✓ Skill package generated'));
      console.log('  Location: ' + packageResult.skillDir);
      console.log('  Files: ' + packageResult.files.join(', '));
    }
  }

  // Get learning report
  console.log(chalk.cyan('\n📊 Learning System Report:'));
  const report = learning.generateReport();  
  console.log('  Total Attempts: ' + report.totalAttempts);
  console.log('  Success Rate: ' + chalk.bold.green(report.successRate));
  console.log('  Learned Patterns: ' + report.learnedPatterns);
  console.log('  Top Tools:');
  report.topTools.forEach((item, i) => {
    console.log('    ' + (i + 1) + '. ' + item.tool + ' (' + item.count + ' uses)');
  });

  console.log(chalk.gray('\n' + '─'.repeat(60)));
  console.log(chalk.bold.green('✨ Learn from Success Demo Complete!'));
  console.log('\nWhat happened:');
  console.log('  ✓ Recorded successful workflow');
  console.log('  ✓ Extracted patterns from workflow');
  console.log('  ✓ Created reusable skill template');
  console.log('  ✓ Generated complete skill package');
  console.log('  ✓ Generated learning report');
  console.log('\nThe agent now:');
  console.log('  - Remembers this successful approach');
  console.log('  - Can reuse the pattern for similar tasks');
  console.log('  - Has a skill template to share with community');
}

// Run demo
demo().catch(error => {
  console.error(chalk.red('\n💥 Demo failed:'), error);
  process.exit(1);
});
