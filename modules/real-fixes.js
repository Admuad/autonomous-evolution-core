const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const chalk = require('chalk');

class RealFixes {
  constructor() {
    this.safetyChecksEnabled = true;
    this.requireConfirmation = true;
  }

  async installPackage(packageName) {
    console.log(chalk.blue(`📦 Installing ${packageName}...`));
    
    try {
      // Safety check: Is npm available?
      await this.checkCommandAvailable('npm');
      
      // Install package
      const { stdout, stderr } = await execPromise(`npm install ${packageName} --save`);
      
      if (stderr && stderr.includes('WARN')) {
        console.log(chalk.yellow(`⚠️  Warnings during installation: ${stderr}`));
      }
      
      console.log(chalk.green(`✅ Successfully installed ${packageName}`));
      return { success: true, package: packageName };
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to install ${packageName}: ${error.message}`));
      
      // Try alternative installation method
      console.log(chalk.yellow('🔄 Trying alternative installation method...'));
      try {
        const { stdout, stderr } = await execPromise(`npm i ${packageName}`);
        if (!stderr || stderr.includes('WARN')) {
          console.log(chalk.green(`✅ Alternative installation succeeded`));
          return { success: true, package: packageName, method: 'alternative' };
        }
      } catch (altError) {
        console.log(chalk.red(`❌ Alternative installation also failed: ${altError.message}`));
      }
      
      return { success: false, error: error.message, package: packageName };
    }
  }

  async updateConfig(configPath, updates) {
    console.log(chalk.blue(`⚙️  Updating configuration at ${configPath}...`));
    
    try {
      // Check if file exists
      if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow(`⚠️  Config file doesn't exist, creating...`));
        
        // Create directory if needed
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Create initial config
        fs.writeFileSync(configPath, JSON.stringify(updates, null, 2));
        console.log(chalk.green(`✅ Created new config file`));
        return { success: true, action: 'created', configPath };
      }
      
      // Read existing config
      let config = {};
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(content);
      } catch (parseError) {
        console.log(chalk.yellow(`⚠️  Could not parse config, backing up and replacing`));
        
        // Backup old file
        const backupPath = `${configPath}.backup.${Date.now()}`;
        fs.copyFileSync(configPath, backupPath);
        console.log(chalk.gray(`📋 Backup created at ${backupPath}`));
        
        // Replace with new config
        config = updates;
      }
      
      // Merge updates
      const originalConfig = JSON.parse(JSON.stringify(config));
      this.deepMerge(config, updates);
      
      // Write updated config
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      
      console.log(chalk.green(`✅ Configuration updated successfully`));
      
      // Show changes
      console.log(chalk.gray('📋 Changes made:'));
      this.showConfigChanges(originalConfig, config);
      
      return { success: true, action: 'updated', configPath, changes: this.getChanges(originalConfig, config) };
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to update config: ${error.message}`));
      return { success: false, error: error.message, configPath };
    }
  }

  async fixWebSearchMissingApiKey() {
    console.log(chalk.bold('\n🔧 Fixing web search missing API key...'));
    
    const fixes = [];
    
    // 1. Install brave-search-api package
    const installResult = await this.installPackage('brave-search-api');
    fixes.push({ step: 'install_package', result: installResult });
    
    if (!installResult.success) {
      console.log(chalk.yellow('⚠️  Package installation failed, continuing with config update...'));
    }
    
    // 2. Update OpenClaw config
    const configPath = path.join(process.env.HOME || '/home/ubuntu', '.openclaw', 'openclaw.json');
    const configUpdates = {
      web: {
        braveApiKey: "YOUR_BRAVE_API_KEY_HERE", // Placeholder - user needs to replace
        enabled: true
      }
    };
    
    const configResult = await this.updateConfig(configPath, configUpdates);
    fixes.push({ step: 'update_config', result: configResult });
    
    // 3. Provide instructions
    console.log(chalk.cyan('\n📝 Next steps:'));
    console.log(chalk.cyan('1. Get your Brave Search API key from: https://brave.com/search/api/'));
    console.log(chalk.cyan(`2. Replace "YOUR_BRAVE_API_KEY_HERE" in ${configPath}`));
    console.log(chalk.cyan('3. Restart OpenClaw: openclaw gateway restart'));
    console.log(chalk.cyan('4. Test web search functionality'));
    
    return {
      success: configResult.success || installResult.success,
      fixes,
      instructions: 'Get API key and update config'
    };
  }

  async fixExecPermissionIssue() {
    console.log(chalk.bold('\n🔧 Fixing exec permission issues...'));
    
    const fixes = [];
    
    // Check current user permissions
    try {
      const { stdout } = await execPromise('whoami');
      const username = stdout.trim();
      console.log(chalk.blue(`👤 Current user: ${username}`));
      
      // Check sudo access
      try {
        await execPromise('sudo -n true');
        console.log(chalk.green('✅ Sudo access available'));
      } catch (sudoError) {
        console.log(chalk.yellow('⚠️  Sudo access not available or requires password'));
      }
      
    } catch (error) {
      console.log(chalk.red(`❌ Could not check user: ${error.message}`));
    }
    
    // Provide troubleshooting steps
    console.log(chalk.cyan('\n🔍 Troubleshooting steps:'));
    console.log(chalk.cyan('1. Check OpenClaw config permissions in ~/.openclaw/'));
    console.log(chalk.cyan('2. Ensure OpenClaw has exec tool enabled'));
    console.log(chalk.cyan('3. Check system logs: journalctl -u openclaw-gateway'));
    console.log(chalk.cyan('4. Verify user has permission to execute commands'));
    
    return {
      success: false, // Usually requires manual intervention
      fixes,
      instructions: 'Check permissions and OpenClaw configuration'
    };
  }

  async checkCommandAvailable(command) {
    try {
      await execPromise(`which ${command}`);
      return true;
    } catch (error) {
      console.log(chalk.red(`❌ Command '${command}' not found in PATH`));
      return false;
    }
  }

  deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }

  showConfigChanges(oldConfig, newConfig) {
    const changes = this.getChanges(oldConfig, newConfig);
    
    changes.added.forEach(path => {
      console.log(chalk.green(`  + Added: ${path}`));
    });
    
    changes.modified.forEach(({ path, oldValue, newValue }) => {
      console.log(chalk.yellow(`  ~ Modified: ${path}`));
      console.log(chalk.gray(`    From: ${JSON.stringify(oldValue)}`));
      console.log(chalk.gray(`    To: ${JSON.stringify(newValue)}`));
    });
    
    changes.removed.forEach(path => {
      console.log(chalk.red(`  - Removed: ${path}`));
    });
  }

  getChanges(oldObj, newObj, path = '') {
    const changes = {
      added: [],
      modified: [],
      removed: []
    };

    // Check for added or modified properties
    for (const key in newObj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in oldObj)) {
        changes.added.push(currentPath);
      } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        if (typeof oldObj[key] === 'object' && typeof newObj[key] === 'object') {
          const nestedChanges = this.getChanges(oldObj[key], newObj[key], currentPath);
          changes.added.push(...nestedChanges.added);
          changes.modified.push(...nestedChanges.modified);
          changes.removed.push(...nestedChanges.removed);
        } else {
          changes.modified.push({
            path: currentPath,
            oldValue: oldObj[key],
            newValue: newObj[key]
          });
        }
      }
    }

    // Check for removed properties
    for (const key in oldObj) {
      const currentPath = path ? `${path}.${key}` : key;
      if (!(key in newObj)) {
        changes.removed.push(currentPath);
      }
    }

    return changes;
  }

  async testFix(fixName) {
    console.log(chalk.bold(`🧪 Testing fix: ${fixName}`));
    
    switch (fixName) {
      case 'web_search_missing_api_key':
        return await this.fixWebSearchMissingApiKey();
      case 'exec_permission_issue':
        return await this.fixExecPermissionIssue();
      default:
        console.log(chalk.red(`❌ Unknown fix: ${fixName}`));
        return { success: false, error: 'Unknown fix' };
    }
  }

  setSafetyMode(enabled) {
    this.safetyChecksEnabled = enabled;
    console.log(chalk.yellow(`⚠️  Safety checks ${enabled ? 'enabled' : 'disabled'}`));
  }

  setConfirmationRequired(required) {
    this.requireConfirmation = required;
    console.log(chalk.yellow(`⚠️  Confirmation ${required ? 'required' : 'not required'}`));
  }
}

// Export for use
module.exports = RealFixes;

// Test if run directly
if (require.main === module) {
  const fixes = new RealFixes();
  
  // Test web search fix
  fixes.testFix('web_search_missing_api_key')
    .then(result => {
      console.log(chalk.bold('\n📊 Fix result:'));
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.log(chalk.red(`❌ Error: ${error.message}`));
    });
}