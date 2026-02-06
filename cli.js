#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const SelfDiagnosisEngine = require('./modules/self-diagnosis');
const EvolutionEngineV2 = require('./evolution-engine-v2');
const LearningSystem = require('./modules/learning-system');
const PatternExtractor = require('./modules/pattern-extractor');
const CommunityShare = require('./modules/community-share');

const program = new Command();
const selfDiagnosis = new SelfDiagnosisEngine();
const evolution = new EvolutionEngineV2();
const learning = new LearningSystem();
const patternExtractor = new PatternExtractor(learning);
const community = new CommunityShare();

// Display welcome message
console.log(chalk.bold.green('\n───────────────────────────────────────────────────'));
console.log(chalk.bold.green('  Autonomous Evolution Core v2.0'));
console.log(chalk.cyan('  Self-evolving, self-repairing AI agent skill'));
console.log(chalk.bold.green('───────────────────────────────────────────────────\n'));

program
  .name('evolution')
  .description('CLI for Autonomous Evolution Core v2')
  .version('2.0.0');

program.command('enable')
  .description('Enable autonomous evolution features')
  .action(() => {
    console.log(chalk.green('🦾 Autonomous Evolution Core v2 enabled!'));
    console.log('Components active:');
    console.log('  ✓ Self-Diagnosis Engine');
    console.log('  ✓ Evolution Engine v2');
    console.log('  ✓ Learning System');
    console.log('  ✓ Pattern Extractor');
    console.log('  ✓ Community Sharing');
    console.log('\nYour agent is now evolving continuously!');
  });

program.command('status')
  .description('Get overall status of the evolution system')
  .action(async () => {
    console.log(chalk.bold('\n📊 Autonomous Evolution Status:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    // Evolution Engine status
    const evoStatus = evolution.getStatus();
    console.log(chalk.cyan('\n🧬 Evolution Engine:'));
    console.log(`  Total Capabilities: ${evoStatus.totalCapabilities}`);
    console.log(`  Installed: ${evoStatus.installedCapabilities}`);
    console.log(`  Pending: ${evoStatus.pendingCapabilities}`);
    console.log(`  Failed: ${evoStatus.failedInstallations}`);
    console.log(`  Progress: ${chalk.bold(evoStatus.evolutionProgress + '%')}`);

    // Learning System status
    const learnReport = learning.generateReport();
    console.log(chalk.cyan('\n📚 Learning System:'));
    console.log(`  Total Attempts: ${learnReport.totalAttempts}`);
    console.log(`  Success Rate: ${chalk.bold.green(learnReport.successRate)}`);
    console.log(`  Learned Patterns: ${learnReport.learnedPatterns}`);
    console.log(`  Recent Learning: ${learnReport.recentLearning} (7 days)`);

    // Pattern Extractor status
    const patternStats = patternExtractor.getStatistics();
    console.log(chalk.cyan('\n🔧 Pattern Extractor:'));
    console.log(`  Skill Templates: ${patternStats.totalTemplates}`);
    console.log(`  Avg Success Count: ${patternStats.averageSuccessCount}`);

    // Community status
    const commStats = community.getStatistics();
    console.log(chalk.cyan('\n🌐 Community:'));
    console.log(`  Shared Patterns: ${commStats.sharedPatterns}`);
    console.log(`  Capability Requests: ${commStats.requestedCapabilities}`);
    console.log(`  Total Votes: ${commStats.totalVotes}`);

    console.log(chalk.gray('\n' + '─'.repeat(50)));
  });

program.command('diagnose <tool>')
  .description('Diagnose a specific tool for issues')
  .action(async (tool) => {
    const diagnosis = await selfDiagnosis.diagnoseTool(tool);
    console.log(chalk.bold(`\n🔬 Diagnosis Report for ${chalk.cyan(tool)}:`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  ${chalk.yellow('Status')}: ${diagnosis.status}`);
    if (diagnosis.problems.length > 0) {
      console.log(chalk.red('  Problems:'));
      diagnosis.problems.forEach(p => console.log(chalk.red(`    • ${p}`)));
    }
    if (diagnosis.fixAvailable) {
      console.log(chalk.green('  Fix Available'));
      console.log(chalk.blue('  Proposed Steps:'));
      diagnosis.fixSteps.forEach((s, i) => console.log(chalk.blue(`    ${i + 1}. ${s}`)));
    }
    console.log(chalk.gray('─'.repeat(50)));
  });

program.command('autofix <tool>')
  .description('Automatically diagnose and apply fixes for a tool')
  .action(async (tool) => {
    const result = await selfDiagnosis.autoFixTool(tool);
    if (result.fixed) {
      console.log(chalk.green(`\n✨ Successfully applied fixes for ${tool}.`));
      console.log(chalk.green('Please verify the tool is now working.'));
    } else if (result.message) {
      console.log(chalk.yellow(`\n${result.message}`));
    } else {
      console.log(chalk.red(`\n❌ Failed to apply fixes for ${tool}.`));
      if (result.results && result.results.errors.length > 0) {
        console.log(chalk.red('  Errors encountered during fixing:'));
        result.results.errors.forEach(e => console.log(chalk.red(`    • ${e}`)));
      }
    }
  });

program.command('detect <query>')
  .description('Detect missing capabilities from a user query')
  .action((query) => {
    const missing = evolution.detectCapabilities(query);
    if (missing.length === 0) {
      console.log(chalk.green('\n✓ All required capabilities are installed'));
    } else {
      console.log(chalk.yellow(`\n🔍 Detected ${missing.length} missing capability(ies):`));
      missing.forEach((item, i) => {
        console.log(`\n  ${chalk.bold(i + 1)}. ${item.capability.name}`);
        console.log(`     Category: ${item.category}`);
        console.log(`     ID: ${item.capability.id}`);
        console.log(`     Matched: ${item.matchedPattern}`);
        console.log(`     Install: ${chalk.blue(item.capability.implementation.installCommand)}`);
      });
    }
  });

program.command('install <capability-id>')
  .description('Auto-install a capability')
  .action(async (capabilityId) => {
    // Find capability
    let capability;
    Object.values(evolution.registry.categories || {}).forEach(category => {
      (category.capabilities || []).forEach(cap => {
        if (cap.id === capabilityId) capability = cap;
      });
    });

    if (!capability) {
      console.log(chalk.red(`\n❌ Capability not found: ${capabilityId}`));
      process.exit(1);
    }

    const result = await evolution.installCapability(capability);
    if (result.success) {
      console.log(chalk.green(`\n✓ ${result.message}`));
      console.log(chalk.blue('\n💡 Try using the capability now!'));
    } else {
      console.log(chalk.red(`\n❌ ${result.message}`));
      process.exit(1);
    }
  });

program.command('suggest <context>')
  .description('Get capability suggestions based on context')
  .action((context) => {
    const suggestions = evolution.suggestCapabilities(context);
    if (suggestions.length === 0) {
      console.log(chalk.gray('\nNo capability suggestions based on context'));
    } else {
      console.log(chalk.cyan(`\n💡 ${suggestions.length} suggested capability(ies):`));
      suggestions.forEach((item, i) => {
        console.log(`\n  ${chalk.bold(i + 1)}. ${item.name}`);
        console.log(`     Category: ${item.category}`);
        console.log(`     Priority: ${item.priority}`);
        console.log(`     Score: ${item.score}`);
        console.log(`     Reason: ${item.reason}`);
        console.log(`     Install: ${chalk.blue(item.implementation.installCommand)}`);
      });
    }
  });

program.command('learn-success')
  .description('Record a successful workflow for learning')
  .option('-c, --context <json>', 'Workflow context as JSON string')
  .option('-t, --tools <list>', 'Tools used (comma-separated)')
  .option('-s, --steps <json>', 'Steps as JSON array')
  .option('-d, --duration <ms>', 'Duration in milliseconds')
  .action((options) => {
    const workflow = {
      context: options.context ? JSON.parse(options.context) : {},
      toolsUsed: options.tools ? options.tools.split(',') : [],
      steps: options.steps ? JSON.parse(options.steps) : [],
      duration: parseInt(options.duration) || null,
      outcome: 'success'
    };

    const id = learning.recordSuccess(workflow);
    console.log(chalk.green(`\n✓ Success recorded (ID: ${id})`));
    console.log(chalk.gray('Pattern extracted and added to learning database'));
  });

program.command('learn-failure')
  .description('Record a failed attempt for learning')
  .option('-e, --error <message>', 'Error message')
  .option('-t, --tools <list>', 'Tools used (comma-separated)')
  .option('-c, --context <json>', 'Context as JSON string')
  .option('-s, --suggestion <text>', 'Suggested fix')
  .action((options) => {
    const failure = {
      error: options.error || 'Unknown error',
      toolsUsed: options.tools ? options.tools.split(',') : [],
      context: options.context ? JSON.parse(options.context) : {},
      suggestion: options.suggestion || null
    };

    const id = learning.recordFailure(failure);
    console.log(chalk.green(`\n✓ Failure recorded (ID: ${id})`));
    console.log(chalk.gray('Avoidance pattern added to learning database'));
  });

program.command('get-suggestions <context>')
  .description('Get learning-based suggestions')
  .action((context) => {
    const suggestions = learning.getSuggestions({ goal: context });
    if (suggestions.length === 0) {
      console.log(chalk.gray('\nNo learning-based suggestions available'));
    } else {
      console.log(chalk.cyan(`\n🧠 ${suggestions.length} learning suggestion(s):`));
      suggestions.forEach((s, i) => {
        console.log(`\n  ${chalk.bold(i + 1)}. ${s.type}`);
        console.log(`     Relevance: ${Math.round(s.relevance * 100)}%`);
        console.log(`     Reason: ${s.reason}`);
        if (s.successRate) {
          console.log(`     Success Rate: ${chalk.bold.green((s.successRate * 100).toFixed(1) + '%')}`);
        }
      });
    }
  });

program.command('extract-pattern')
  .description('Extract a skill pattern from workflow')
  .option('-c, --context <json>', 'Workflow context as JSON string')
  .option('-t, --tools <list>', 'Tools used (comma-separated)')
  .option('-s, --steps <json>', 'Steps as JSON array')
  .option('--caps <list>', 'Capabilities used (comma-separated)')
  .action((options) => {
    const workflow = {
      context: options.context ? JSON.parse(options.context) : {},
      toolsUsed: options.tools ? options.tools.split(',') : [],
      steps: options.steps ? JSON.parse(options.steps) : [],
      capabilitiesUsed: options.caps ? options.caps.split(',') : []
    };

    const result = patternExtractor.extractFromWorkflow(workflow);
    if (result) {
      console.log(chalk.green(`\n✓ Pattern ${result.merged ? 'merged' : 'created'} (ID: ${result.template.id})`));
      console.log(chalk.bold(`   Name: ${result.template.name}`));
      console.log(chalk.bold(`   Category: ${result.template.category}`));
      console.log(chalk.bold(`   Steps: ${result.template.steps.length}`));
    } else {
      console.log(chalk.yellow('\n⚠ Could not extract pattern from workflow'));
    }
  });

program.command('search-templates <query>')
  .description('Search skill templates')
  .action((query) => {
    const templates = patternExtractor.searchTemplates(query);
    if (templates.length === 0) {
      console.log(chalk.gray('\nNo matching skill templates found'));
    } else {
      console.log(chalk.cyan(`\n🔧 ${templates.length} template(s) found:`));
      templates.forEach((t, i) => {
        console.log(`\n  ${chalk.bold(i + 1)}. ${t.name}`);
        console.log(`     Category: ${t.category}`);
        console.log(`     Success Count: ${chalk.bold.green(t.successCount)}`);
        console.log(`     Match Score: ${t.matchScore}`);
        console.log(`     Description: ${t.description}`);
      });
    }
  });

program.command('share-pattern <pattern-id>')
  .description('Share a learned pattern with community')
  .option('-a, --anonymous', 'Share anonymously')
  .option('--dry-run', 'Simulate without actually sharing')
  .action(async (patternId, options) => {
    const pattern = learning.learnedPatterns.find(p => p.id === patternId);
    if (!pattern) {
      console.log(chalk.red(`\n❌ Pattern not found: ${patternId}`));
      process.exit(1);
    }

    const result = await community.sharePattern(pattern, options);
    if (result.success) {
      if (result.dryRun) {
        console.log(chalk.cyan('\n🧪 Dry run - would share:'));
        console.log(`   ${result.pattern.name}`);
      } else {
        console.log(chalk.green(`\n✓ ${result.message}`));
        console.log(chalk.blue(`   URL: ${result.url}`));
      }
    } else {
      console.log(chalk.red(`\n❌ ${result.message}`));
    }
  });

program.command('request-capability <name>')
  .description('Request a new capability from community')
  .option('-d, --description <text>', 'Capability description')
  .option('-c, --category <name>', 'Category')
  .option('-u, --urgency <level>', 'Urgency (low/normal/high)')
  .option('--dry-run', 'Simulate without actually requesting')
  .action(async (name, options) => {
    const request = {
      name,
      description: options.description || '',
      category: options.category || 'general',
      useCases: []
    };

    const result = await community.requestCapability(request, options);
    if (result.success) {
      if (result.dryRun) {
        console.log(chalk.cyan('\n🧪 Dry run - would request:'));
        console.log(`   ${result.request.name}`);
      } else {
        console.log(chalk.green(`\n✓ ${result.message}`));
        console.log(chalk.blue(`   URL: ${result.url}`));
      }
    } else {
      console.log(chalk.red(`\n❌ ${result.message}`));
    }
  });

program.command('trending')
  .description('Get trending community patterns')
  .action(() => {
    const trending = community.getTrendingPatterns(10);
    if (trending.length === 0) {
      console.log(chalk.gray('\nNo trending patterns available'));
    } else {
      console.log(chalk.cyan('\n🔥 Trending Patterns:'));
      trending.forEach((t, i) => {
        console.log(`\n  ${chalk.bold(i + 1)}. ${t.name}`);
        console.log(`     Category: ${t.category}`);
        console.log(`     Success Rate: ${chalk.bold.green((t.successRate * 100).toFixed(1) + '%')}`);
        console.log(`     Votes: ${chalk.bold(t.votes)}`);
        console.log(`     Score: ${chalk.bold(t.score.toFixed(1))}`);
      });
    }
  });

program.command('top-requests')
  .description('Get top capability requests')
  .action(() => {
    const top = community.getTopRequests(10);
    if (top.length === 0) {
      console.log(chalk.gray('\nNo capability requests available'));
    } else {
      console.log(chalk.cyan('\n📋 Top Requests:'));
      top.forEach((r, i) => {
        console.log(`\n  ${chalk.bold(i + 1)}. ${r.name}`);
        console.log(`     Category: ${r.category}`);
        console.log(`     Urgency: ${r.urgency}`);
        console.log(`     Votes: ${chalk.bold(r.votes)}`);
        console.log(`     Score: ${chalk.bold(r.score)}`);
      });
    }
  });

program.command('search-community <query>')
  .description('Search community patterns')
  .option('-c, --category <name>', 'Filter by category')
  .action(async (query, options) => {
    const results = await community.searchCommunityPatterns(query, options);
    if (results.length === 0) {
      console.log(chalk.gray('\nNo matching community patterns found'));
    } else {
      console.log(chalk.cyan(`\n🔍 ${results.length} community pattern(s) found:`));
      results.forEach((p, i) => {
        console.log(`\n  ${chalk.bold(i + 1)}. ${p.name}`);
        console.log(`     Category: ${p.category}`);
        console.log(`     Success Rate: ${chalk.bold.green((p.successRate * 100).toFixed(1) + '%')}`);
        console.log(`     Description: ${p.description}`);
      });
    }
  });

// Help command
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
