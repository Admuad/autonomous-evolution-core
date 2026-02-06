#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const SelfDiagnosisEngine = require('./modules/self-diagnosis');

const program = new Command();
const selfDiagnosis = new SelfDiagnosisEngine();

// Display welcome message
console.log(chalk.bold.green('\n───────────────────────────────────────────────────'));
console.log(chalk.bold.green('  Autonomous Evolution Core'));
console.log(chalk.cyan('  Self-evolving, self-repairing AI agent skill'));
console.log(chalk.bold.green('───────────────────────────────────────────────────\n'));

program
  .name('evolution')
  .description('CLI for Autonomous Evolution Core skill')
  .version('1.0.0');

program.command('enable')
  .description('Enable autonomous evolution features')
  .action(() => {
    console.log(chalk.green('🦾 Autonomous Evolution Core enabled!'));
    console.log('Starting background monitoring...');
    // TODO: Implement actual enable logic (e.g., start 24/7 monitor)
  });

program.command('status')
  .description('Get overall health status of the agent')
  .action(async () => {
    const report = selfDiagnosis.getHealthReport();
    console.log(chalk.yellow('\n📊 Agent Health Report:'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(`  ${chalk.cyan('Total Diagnosed Tools')}: ${report.totalDiagnosed}`);
    console.log(`  ${chalk.green('Healthy Tools')}: ${report.healthy}`);
    console.log(`  ${chalk.red('Tools Needing Fix')}: ${report.needsFix}`);
    console.log(`  ${chalk.magenta('Fixes Applied')}: ${report.fixesApplied}`);
    console.log(`  ${chalk.gray('Last Diagnosis')}: ${report.lastDiagnosis}`);
    console.log(chalk.gray('─'.repeat(30)));
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

program.command('learn --from <session>')
  .description('Learn from a past session's successes and failures')
  .action((options) => {
    console.log(chalk.yellow(`Learning from session ${options.from}...`));
    // TODO: Implement learning logic
  });

program.command('optimize --tool <toolname>')
  .description('Optimize performance of a specific tool')
  .action((options) => {
    console.log(chalk.yellow(`Optimizing ${options.tool}...`));
    // TODO: Implement optimization logic (code rewriting, config tuning)
  });

// Ensure a command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
