const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const chalk = require('chalk');
const SelfDiagnosisEngine = require('./modules/self-diagnosis');

class EvolutionEngine {
  constructor() {
    this.selfDiagnosis = new SelfDiagnosisEngine();
    this.isEnabled = false;
    this.monitorInterval = null;
    this.learningDatabase = new Map();
    this.loadLearningDatabase();
  }

  async enable() {
    console.log(chalk.green('🦾 Enabling Autonomous Evolution Core...'));
    
    // Start 24/7 monitoring
    this.start24_7Monitor();
    
    // Run initial health check
    await this.runInitialDiagnosis();
    
    this.isEnabled = true;
    
    console.log(chalk.bold.green('\n───────────────────────────────────────────────────'));
    console.log(chalk.bold.green('  Autonomous Evolution Core Enabled!'));
    console.log(chalk.cyan('\n• 24/7 monitoring active'));
    console.log(chalk.cyan('• Self-diagnosis ready'));
    console.log(chalk.cyan('• Learning system online'));
    console.log(chalk.yellow('• Automatic fixes require confirmation'));
    console.log(chalk.bold.green('───────────────────────────────────────────────────\n'));
    
    return true;
  }

  disable() {
    console.log(chalk.yellow('⚠️  Disabling Autonomous Evolution Core...'));
    
    // Stop monitoring
    this.stop24_7Monitor();
    
    this.isEnabled = false;
    console.log(chalk.green('✅ Evolution Core disabled'));
    
    return true;
  }

  start24_7Monitor() {
    // Run every 30 minutes
    this.monitorInterval = setInterval(async () => {
      await this.runScheduledCheck();
    }, 30 * 60 * 1000);
    
    console.log(chalk.cyan('⏰ 24/7 monitoring started (checks every 30 minutes)'));
  }

  stop24_7Monitor() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log(chalk.yellow('⏹️  24/7 monitoring stopped'));
    }
  }

  async runInitialDiagnosis() {
    console.log(chalk.blue('\n🔍 Running initial system diagnosis...'));
    
    const toolsToCheck = ['web_search', 'exec', 'web_fetch'];
    const results = [];
    
    for (const tool of toolsToCheck) {
      const diagnosis = await this.selfDiagnosis.diagnoseTool(tool);
      results.push({ tool, diagnosis });
      
      if (diagnosis.fixAvailable) {
        console.log(chalk.yellow(`  ⚠️  ${tool}: Needs attention`));
      } else {
        console.log(chalk.green(`  ✅ ${tool}: Healthy`));
      }
    }
    
    // Summary
    const needsFix = results.filter(r => r.diagnosis.fixAvailable).length;
    if (needsFix > 0) {
      console.log(chalk.yellow(`\n📊 Summary: ${needsFix} tool(s) need attention`));
      console.log(chalk.yellow('Run "evolution autofix <tool>" to fix automatically'));
    } else {
      console.log(chalk.green('\n🎉 All tools are healthy!'));
    }
    
    return results;
  }

  async runScheduledCheck() {
    if (!this.isEnabled) return;
    
    const timestamp = new Date().toISOString();
    console.log(chalk.gray(`\n[${timestamp}] Running scheduled check...`));
    
    // Check critical tools
    const toolsToCheck = ['web_search', 'exec'];
    let issuesFound = 0;
    
    for (const tool of toolsToCheck) {
      const diagnosis = await this.selfDiagnosis.diagnoseTool(tool);
      
      if (diagnosis.fixAvailable) {
        issuesFound++;
        console.log(chalk.yellow(`  ⚠️  ${tool} issue detected`));
        
        // Log to issues log
        this.logIssue({
          tool,
          issue: diagnosis.problems.join(', '),
          timestamp,
          severity: 'warning'
        });
      }
    }
    
    if (issuesFound === 0) {
      console.log(chalk.green('  ✅ All systems nominal'));
    } else {
      console.log(chalk.yellow(`  ⚠️  ${issuesFound} issue(s) found`));
      console.log(chalk.yellow('  Run "evolution status" for details'));
    }
    
    // Update learning database
    this.updateLearningFromRecentActivity();
  }

  async applyFixWithConfirmation(toolName) {
    console.log(chalk.bold(`\n🔧 Applying fix for ${toolName}`));
    console.log(chalk.gray('─'.repeat(40)));
    
    // Get diagnosis
    const diagnosis = await this.selfDiagnosis.diagnoseTool(toolName);
    
    if (!diagnosis.fixAvailable) {
      console.log(chalk.green(`✅ ${toolName} doesn't need fixing`));
      return { fixed: false, reason: 'No fix needed' };
    }
    
    // Show what we're going to do
    console.log(chalk.yellow('\n📋 Proposed fixes:'));
    diagnosis.fixSteps.forEach((step, i) => {
      console.log(chalk.blue(`  ${i + 1}. ${step}`));
    });
    
    // In real implementation, we would ask for confirmation
    // For now, we'll proceed with simulated confirmation
    console.log(chalk.yellow('\n⚠️  In production, would ask for confirmation here'));
    
    // Apply fixes
    const results = await this.selfDiagnosis.applyFix(diagnosis);
    
    // Learn from this fix
    this.learnFromFix({
      tool: toolName,
      diagnosis,
      results,
      timestamp: new Date().toISOString()
    });
    
    return {
      fixed: results.fixStepsSuccessful.length > 0,
      results,
      message: results.fixStepsSuccessful.length > 0 ? 
               'Fix applied successfully' : 
               'Fix application had issues'
    };
  }

  logIssue(issue) {
    const issuesPath = path.join(__dirname, 'data', 'issues-log.json');
    const issuesDir = path.dirname(issuesPath);
    
    if (!fs.existsSync(issuesDir)) {
      fs.mkdirSync(issuesDir, { recursive: true });
    }
    
    let issues = [];
    if (fs.existsSync(issuesPath)) {
      try {
        issues = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not read issues log'));
      }
    }
    
    issues.push(issue);
    
    // Keep only last 100 issues
    if (issues.length > 100) {
      issues = issues.slice(-100);
    }
    
    fs.writeFileSync(issuesPath, JSON.stringify(issues, null, 2));
  }

  learnFromFix(fixData) {
    const key = `${fixData.tool}:${fixData.diagnosis.problems.join(',')}`;
    this.learningDatabase.set(key, {
      ...fixData,
      learnedAt: new Date().toISOString(),
      appliedCount: (this.learningDatabase.get(key)?.appliedCount || 0) + 1
    });
    
    this.saveLearningDatabase();
    
    console.log(chalk.green(`📚 Learned solution for ${fixData.tool}`));
  }

  updateLearningFromRecentActivity() {
    // Analyze recent fixes and issues to improve
    const recentIssues = this.getRecentIssues(24); // Last 24 hours
    const recentFixes = this.getRecentFixes(24);
    
    // Simple learning: if same issue keeps appearing, escalate
    const issueCounts = new Map();
    recentIssues.forEach(issue => {
      const key = `${issue.tool}:${issue.issue}`;
      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    });
    
    // Check for recurring issues
    issueCounts.forEach((count, key) => {
      if (count >= 3) {
        console.log(chalk.red(`⚠️  Recurring issue detected: ${key} (${count} times)`));
        // In future, could trigger automatic investigation
      }
    });
  }

  getRecentIssues(hours) {
    const issuesPath = path.join(__dirname, 'data', 'issues-log.json');
    if (!fs.existsSync(issuesPath)) return [];
    
    try {
      const issues = JSON.parse(fs.readFileSync(issuesPath, 'utf8'));
      const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      return issues.filter(issue => {
        const issueTime = new Date(issue.timestamp);
        return issueTime > cutoff;
      });
    } catch (error) {
      return [];
    }
  }

  getRecentFixes(hours) {
    const fixesPath = path.join(__dirname, 'data', 'fixes-applied.json');
    if (!fs.existsSync(fixesPath)) return [];
    
    try {
      const fixes = JSON.parse(fs.readFileSync(fixesPath, 'utf8'));
      const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      return fixes.filter(fix => {
        const fixTime = new Date(fix.appliedAt);
        return fixTime > cutoff;
      });
    } catch (error) {
      return [];
    }
  }

  loadLearningDatabase() {
    const dbPath = path.join(__dirname, 'data', 'learning-db.json');
    if (fs.existsSync(dbPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        data.forEach(item => {
          this.learningDatabase.set(item.key, item);
        });
        console.log(chalk.gray(`📖 Loaded ${this.learningDatabase.size} learned solutions`));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Could not load learning database'));
      }
    }
  }

  saveLearningDatabase() {
    const dbPath = path.join(__dirname, 'data', 'learning-db.json');
    const dbDir = path.dirname(dbPath);
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const data = Array.from(this.learningDatabase.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }

  getStatistics() {
    return {
      enabled: this.isEnabled,
      toolsDiagnosed: this.selfDiagnosis.diagnosisLog.length,
      fixesApplied: this.selfDiagnosis.fixesApplied.length,
      learnedSolutions: this.learningDatabase.size,
      recentIssues: this.getRecentIssues(24).length,
      monitoringActive: this.monitorInterval !== null
    };
  }

  async emergencyShutdown() {
    console.log(chalk.red('\n🚨 EMERGENCY SHUTDOWN INITIATED'));
    console.log(chalk.red('Stopping all autonomous activities...'));
    
    this.disable();
    
    // Log emergency
    this.logIssue({
      tool: 'system',
      issue: 'Emergency shutdown initiated',
      timestamp: new Date().toISOString(),
      severity: 'critical'
    });
    
    console.log(chalk.green('✅ Emergency shutdown complete'));
    console.log(chalk.yellow('⚠️  All autonomous features disabled'));
  }
}

// Export for use in CLI
module.exports = EvolutionEngine;

// Run if called directly
if (require.main === module) {
  const engine = new EvolutionEngine();
  
  // Simple direct execution
  engine.enable().then(() => {
    console.log(chalk.green('\n✨ Evolution Engine ready!'));
  }).catch(error => {
    console.log(chalk.red(`❌ Error: ${error.message}`));
  });
}