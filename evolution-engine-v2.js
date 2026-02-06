#!/usr/bin/env node

/**
 * Evolution Engine v2
 * 
 * The core evolution system that:
 * - Detects missing capabilities from user queries
 * - Auto-installs skills on-demand
 * - Hooks into OpenClaw's skill installation
 * - Learns from successful installations
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class EvolutionEngineV2 {
  constructor() {
    this.registryPath = path.join(__dirname, 'capabilities', 'registry.json');
    this.installedCapabilities = [];
    this.learnedPatterns = [];
    
    this.loadRegistry();
    this.loadInstalledCapabilities();
  }

  loadRegistry() {
    try {
      const data = fs.readFileSync(this.registryPath, 'utf8');
      this.registry = JSON.parse(data);
      console.log(`✓ Loaded capability registry with ${this._countCapabilities()} capabilities`);
    } catch (error) {
      console.error('Failed to load capability registry:', error.message);
      this.registry = { categories: {}, installedCapabilities: [] };
    }
  }

  loadInstalledCapabilities() {
    const dataPath = path.join(__dirname, 'data', 'installed-capabilities.json');
    try {
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, 'utf8');
        const saved = JSON.parse(data);
        this.installedCapabilities = saved.installed || [];
      }
    } catch (error) {
      console.log('No installed capabilities found yet');
    }
  }

  saveInstalledCapabilities() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dataPath = path.join(dataDir, 'installed-capabilities.json');
    fs.writeFileSync(dataPath, JSON.stringify({
      installed: this.installedCapabilities,
      lastUpdated: new Date().toISOString()
    }, null, 2);
  }

  _countCapabilities() {
    let count = 0;
    Object.values(this.registry.categories || {}).forEach(category => {
      count += (category.capabilities || []).length;
    });
    return count;
  }

  /**
   * Detect missing capabilities from a user query
   */
  detectCapabilities(query) {
    const missing = [];
    const queryLower = query.toLowerCase();

    Object.entries(this.registry.categories || {}).forEach(([categoryName, category]) => {
      (category.capabilities || []).forEach(capability => {
        // Check if capability is already installed
        if (this.installedCapabilities.includes(capability.id)) {
          return; // Already have it
        }

        // Check detection patterns
        const patterns = capability.detectPatterns || [];
        for (const pattern of patterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(queryLower)) {
            missing.push({
              capability,
              matchedPattern: pattern,
              category: categoryName
            });
            break; // Only match once per capability
          }
        }
      });
    });

    return missing;
  }

  /**
   * Auto-install a capability
   */
  async installCapability(capability, options = {}) {
    const { dryRun = false, force = false } = options;

    if (this.installedCapabilities.includes(capability.id) && !force) {
      return {
        success: false,
        message: `Capability ${capability.id} is already installed`
      };
    }

    const implementation = capability.implementation;
    
    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        capability: capability.id,
        installCommand: implementation.installCommand,
        implementation: implementation.type
      };
    }

    console.log(`\n🔧 Installing capability: ${capability.name} (${capability.id})`);
    console.log(`   Type: ${implementation.type}`);
    console.log(`   Command: ${implementation.installCommand}`);

    try {
      let result;

      switch (implementation.type) {
        case 'npm':
          result = await this._installNpmPackage(implementation.package);
          break;
        case 'clawhub':
          result = await this._installClawHubSkill(implementation.package);
          break;
        case 'git':
          result = await this._cloneGitRepo(implementation.repo, capability.id);
          break;
        case 'builtin':
          result = await this._enableBuiltinModule(implementation.codeTemplate);
          break;
        default:
          throw new Error(`Unknown implementation type: ${implementation.type}`);
      }

      if (result.success) {
        this.installedCapabilities.push(capability.id);
        this.saveInstalledCapabilities();
        
        // Update registry
        if (!this.registry.installedCapabilities) {
          this.registry.installedCapabilities = [];
        }
        this.registry.installedCapabilities.push({
          id: capability.id,
          installedAt: new Date().toISOString()
        });
        
        return {
          success: true,
          capability: capability.id,
          message: `Successfully installed ${capability.name}`
        };
      } else {
        throw new Error(result.message || 'Installation failed');
      }

    } catch (error) {
      console.error(`✗ Failed to install ${capability.id}:`, error.message);
      
      // Track failure
      if (!this.registry.failedInstallations) {
        this.registry.failedInstallations = [];
      }
      this.registry.failedInstallations.push({
        id: capability.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        capability: capability.id,
        message: error.message
      };
    }
  }

  /**
   * Install npm package
   */
  async _installNpmPackage(packageName) {
    return new Promise((resolve, reject) => {
      const proc = spawn('npm', ['install', packageName], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          reject(new Error(`npm install exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Install skill via ClawHub
   */
  async _installClawHubSkill(packageName) {
    return new Promise((resolve, reject) => {
      const proc = spawn('clawhub', ['install', packageName], {
        cwd: path.join(__dirname, '..', '..'),
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          reject(new Error(`clawhub install exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Clone git repository for skill
   */
  async _cloneGitRepo(repoUrl, capabilityId) {
    const skillsDir = path.join(__dirname, '..', '..', '.openclaw', 'skills');
    
    // Create skills directory if needed
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir, { recursive: true });
    }

    const repoName = repoUrl.split('/').pop().replace('.git', '');
    const targetPath = path.join(skillsDir, repoName);

    return new Promise((resolve, reject) => {
      const proc = spawn('git', ['clone', repoUrl, targetPath], {
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          // Install npm dependencies if package.json exists
          const pkgPath = path.join(targetPath, 'package.json');
          if (fs.existsSync(pkgPath)) {
            console.log('Installing dependencies...');
            const npmProc = spawn('npm', ['install'], { 
              cwd: targetPath,
              stdio: 'inherit'
            });
            
            npmProc.on('close', (npmCode) => {
              if (npmCode === 0) {
                resolve({ success: true });
              } else {
                resolve({ success: true, warning: 'Dependencies installation may have issues' });
              }
            });
          } else {
            resolve({ success: true });
          }
        } else {
          reject(new Error(`git clone exited with code ${code}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * Enable builtin module
   */
  async _enableBuiltinModule(modulePath) {
    // For builtin modules, we just need to ensure they exist
    const fullPath = path.join(__dirname, modulePath);
    if (fs.existsSync(fullPath)) {
      return { success: true };
    } else {
      throw new Error(`Builtin module not found: ${modulePath}`);
    }
  }

  /**
   * Get evolution status
   */
  getStatus() {
    const total = this._countCapabilities();
    const installed = this.installedCapabilities.length;
    const failed = (this.registry.failedInstallations || []).length;

    return {
      totalCapabilities: total,
      installedCapabilities: installed,
      pendingCapabilities: total - installed,
      failedInstallations: failed,
      evolutionProgress: Math.round((installed / total) * 100)
    };
  }

  /**
   * Suggest capabilities based on context
   */
  suggestCapabilities(context) {
    const suggestions = [];
    const contextLower = context.toLowerCase();

    Object.entries(this.registry.categories || {}).forEach(([categoryName, category]) => {
      (category.capabilities || []).forEach(capability => {
        if (this.installedCapabilities.includes(capability.id)) {
          return;
        }

        // Score capability relevance
        let score = 0;
        const patterns = capability.detectPatterns || [];
        
        for (const pattern of patterns) {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(contextLower)) {
            score += 1;
          }
        }

        if (score > 0) {
          suggestions.push({
            ...capability,
            category: categoryName,
            score,
            reason: `Detected ${score} matching patterns in context`
          });
        }
      });
    });

    // Sort by score and priority
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.score - a.score;
    });

    return suggestions.slice(0, 5); // Top 5 suggestions
  }
}

module.exports = EvolutionEngineV2;

// CLI interface
if (require.main === module) {
  const engine = new EvolutionEngineV2();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const status = engine.getStatus();
    console.log('\n🧬 Evolution Engine Status:');
    console.log('─'.repeat(40));
    console.log(`  Total Capabilities: ${status.totalCapabilities}`);
    console.log(`  Installed: ${status.installedCapabilities}`);
    console.log(`  Pending: ${status.pendingCapabilities}`);
    console.log(`  Failed: ${status.failedInstallations}`);
    console.log(`  Evolution Progress: ${status.evolutionProgress}%`);
    console.log('─'.repeat(40));
    process.exit(0);
  }

  const command = args[0];

  if (command === 'detect') {
    const query = args.slice(1).join(' ');
    if (!query) {
      console.error('Usage: node evolution-engine-v2.js detect "<query>"');
      process.exit(1);
    }

    const missing = engine.detectCapabilities(query);
    if (missing.length === 0) {
      console.log('\n✓ All required capabilities are installed');
    } else {
      console.log('\n🔍 Detected missing capabilities:');
      missing.forEach((item, i) => {
        console.log(`\n  ${i + 1}. ${item.capability.name}`);
        console.log(`     Category: ${item.category}`);
        console.log(`     ID: ${item.capability.id}`);
        console.log(`     Matched: ${item.matchedPattern}`);
        console.log(`     Install: ${item.capability.implementation.installCommand}`);
      });
    }
    process.exit(0);
  }

  if (command === 'install') {
    const capabilityId = args[1];
    if (!capabilityId) {
      console.error('Usage: node evolution-engine-v2.js install <capability-id>');
      process.exit(1);
    }

    // Find capability by ID
    let capability;
    Object.values(engine.registry.categories || {}).forEach(category => {
      (category.capabilities || []).forEach(cap => {
        if (cap.id === capabilityId) {
          capability = cap;
        }
      });
    });

    if (!capability) {
      console.error(`Capability not found: ${capabilityId}`);
      process.exit(1);
    }

    engine.installCapability(capability)
      .then(result => {
        if (result.success) {
          console.log(`\n✓ ${result.message}`);
        } else {
          console.error(`\n✗ ${result.message}`);
          process.exit(1);
        }
      })
      .catch(error => {
        console.error('\n✗ Installation failed:', error.message);
        process.exit(1);
      });
  }

  if (command === 'suggest') {
    const context = args.slice(1).join(' ');
    if (!context) {
      console.error('Usage: node evolution-engine-v2.js suggest "<context>"');
      process.exit(1);
    }

    const suggestions = engine.suggestCapabilities(context);
    if (suggestions.length === 0) {
      console.log('\nNo capability suggestions based on context');
    } else {
      console.log('\n💡 Suggested capabilities:');
      suggestions.forEach((item, i) => {
        console.log(`\n  ${i + 1}. ${item.name}`);
        console.log(`     Category: ${item.category}`);
        console.log(`     Priority: ${item.priority}`);
        console.log(`     Score: ${item.score}`);
        console.log(`     Install: ${item.implementation.installCommand}`);
      });
    }
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  console.error('Usage: node evolution-engine-v2.js <detect|install|suggest> [args]');
  process.exit(1);
}
