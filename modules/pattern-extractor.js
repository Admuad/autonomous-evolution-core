/**
 * Pattern Extractor
 * 
 * Analyzes successful multi-step workflows and converts them into
 * reusable skill templates with use case tags
 */

const fs = require('fs');
const path = require('path');

class PatternExtractor {
  constructor(learningSystem) {
    this.learningSystem = learningSystem;
    this.dataDir = path.join(__dirname, '..', 'data');
    this.skillTemplates = [];
    
    this.loadSkillTemplates();
  }

  loadSkillTemplates() {
    const templatesPath = path.join(this.dataDir, 'skill-templates.json');
    try {
      if (fs.existsSync(templatesPath)) {
        const data = fs.readFileSync(templatesPath, 'utf8');
        this.skillTemplates = JSON.parse(data);
        console.log(`✓ Loaded ${this.skillTemplates.length} skill templates`);
      }
    } catch (error) {
      console.log('No skill templates found yet');
    }
  }

  saveSkillTemplates() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(this.dataDir, 'skill-templates.json'),
      JSON.stringify(this.skillTemplates, null, 2)
    );
  }

  /**
   * Extract a skill template from a successful workflow
   */
  extractFromWorkflow(workflow) {
    if (!workflow.steps || workflow.steps.length < 2) {
      return null; // Need at least 2 steps for a pattern
    }

    const template = {
      id: this._generateId(),
      name: this._generateTemplateName(workflow),
      description: this._generateDescription(workflow),
      category: this._classifyCategory(workflow),
      useCases: this._extractUseCases(workflow),
      steps: this._normalizeSteps(workflow.steps),
      toolsRequired: this._extractTools(workflow.steps),
      capabilitiesRequired: workflow.capabilitiesUsed || [],
      parameters: this._extractParameters(workflow),
      estimatedDuration: workflow.duration,
      successCount: 1,
      lastUsed: new Date().toISOString(),
      examples: [workflow.context]
    };

    // Check if similar template exists
    const existing = this._findSimilarTemplate(template);
    
    if (existing) {
      // Merge with existing
      existing.successCount++;
      existing.examples.push(workflow.context);
      existing.lastUsed = new Date().toISOString();
      
      if (!template.estimatedDuration) {
        // Update duration estimate
        existing.estimatedDuration = template.estimatedDuration;
      }

      return { merged: true, template: existing };
    } else {
      // Add new template
      this.skillTemplates.push(template);
      this.saveSkillTemplates();
      
      return { merged: false, template };
    }
  }

  /**
   * Batch extract patterns from multiple workflows
   */
  extractFromWorkflows(workflows) {
    const results = {
      newTemplates: 0,
      mergedTemplates: 0,
      templates: []
    };

    workflows.forEach(workflow => {
      const result = this.extractFromWorkflow(workflow);
      if (result) {
        results.templates.push(result.template);
        if (result.merged) {
          results.mergedTemplates++;
        } else {
          results.newTemplates++;
        }
      }
    });

    return results;
  }

  /**
   * Find skill templates matching a query
   */
  searchTemplates(query) {
    const queryLower = query.toLowerCase();
    const matches = [];

    this.skillTemplates.forEach(template => {
      let score = 0;

      // Match against name
      if (template.name.toLowerCase().includes(queryLower)) {
        score += 3;
      }

      // Match against description
      if (template.description.toLowerCase().includes(queryLower)) {
        score += 2;
      }

      // Match against use cases
      template.useCases.forEach(useCase => {
        if (useCase.toLowerCase().includes(queryLower)) {
          score += 2;
        }
      });

      // Match against tools
      template.toolsRequired.forEach(tool => {
        if (tool.toLowerCase().includes(queryLower)) {
          score += 1;
        }
      });

      if (score > 0) {
        matches.push({
          ...template,
          matchScore: score,
          matchReasons: this._getMatchReasons(template, queryLower)
        });
      }
    });

    // Sort by score and success count
    matches.sort((a, b) => {
      const scoreDiff = b.matchScore - a.matchScore;
      if (scoreDiff !== 0) return scoreDiff;
      return b.successCount - a.successCount;
    });

    return matches.slice(0, 10); // Top 10 matches
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category) {
    return this.skillTemplates.filter(t => t.category === category);
  }

  /**
   * Get top templates by success count
   */
  getTopTemplates(limit = 10) {
    return [...this.skillTemplates]
      .sort((a, b) => b.successCount - a.successCount)
      .slice(0, limit);
  }

  /**
   * Generate SKILL.md for a template
   */
  generateSkillFile(template, targetPath) {
    const skillContent = `---
name: ${template.name.toLowerCase().replace(/\s+/g, '-')}
description: ${template.description}
version: 1.0.0
author: Autonomous Evolution Core
tags: ${template.useCases.join(', ')}
---

# ${template.name}

Auto-generated skill template extracted from successful workflows.

## Description

${template.description}

## Use Cases

${template.useCases.map(uc => `- ${uc}`).join('\n')}

## Required Tools

${template.toolsRequired.map(t => `- \`${t}\``).join('\n')}

## Required Capabilities

${template.capabilitiesRequired.map(c => `- ${c}`).join('\n')}

## Parameters

${Object.entries(template.parameters || {}).map(([key, val]) => 
  `**${key}**: ${val.description || 'No description'} (type: ${val.type || 'string'})`
).join('\n')}

## Implementation Steps

${template.steps.map((step, i) => `
### Step ${i + 1}: ${step.description}

\`\`\`javascript
// ${step.tool}
${step.code || '// Implementation needed'}
\`\`\`
`).join('\n')}

## Usage Example

\`\`\`javascript
// Example usage based on extracted patterns
${this._generateUsageExample(template)}
\`\`\`

## Notes

- **Success Rate**: Based on ${template.successCount} successful executions
- **Estimated Duration**: ${template.estimatedDuration ? `${template.estimatedDuration}ms` : 'Unknown'}
- **Generated**: Automatically by Pattern Extractor

## Examples

${template.examples.slice(0, 3).map(ex => `
### Example ${ex.goal || 'Task'}:
- **Context**: \`${ex.goal || JSON.stringify(ex)}\`
`).join('\n')}
`;

    if (targetPath) {
      fs.writeFileSync(targetPath, skillContent);
      return { success: true, path: targetPath };
    }

    return { success: true, content: skillContent };
  }

  /**
   * Generate a complete skill package structure
   */
  generateSkillPackage(template, outputDir) {
    const skillDir = path.join(outputDir, template.name.toLowerCase().replace(/\s+/g, '-'));
    
    if (!fs.existsSync(skillDir)) {
      fs.mkdirSync(skillDir, { recursive: true });
    }

    // Generate SKILL.md
    this.generateSkillFile(template, path.join(skillDir, 'SKILL.md'));

    // Generate package.json
    const packageJson = {
      name: template.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: template.description,
      main: 'index.js',
      keywords: template.useCases,
      author: 'Autonomous Evolution Core'
    };

    fs.writeFileSync(
      path.join(skillDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Generate stub index.js
    const indexJs = `/**
 * ${template.name}
 * 
 * Auto-generated skill from workflow pattern extraction
 */

module.exports = {
  name: '${template.name}',
  execute: async function(params, tools) {
    // Implementation based on extracted pattern
    // Steps: ${template.steps.map(s => s.description).join(' -> ')}
    
    throw new Error('Implementation required - this is a template');
  }
};
`;

    fs.writeFileSync(path.join(skillDir, 'index.js'), indexJs);

    // Generate README.md
    const readme = `# ${template.name}

${template.description}

## Use Cases

${template.useCases.map(uc => `- ${uc}`).join('\n')}

## Installation

\`\`\`bash
npm install ${template.name.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

## Usage

\`\`\`javascript
const ${template.name.replace(/\s+/g, '')} = require('${template.name.toLowerCase().replace(/\s+/g, '-')}');

// Execute with parameters
${template.name.replace(/\s+/g, '')}.execute(params);
\`\`\`

## Development Status

This is a **template skill** generated by the Autonomous Evolution Core's Pattern Extractor.

**To make this functional:**
1. Implement the steps in \`index.js\`
2. Add required dependencies to \`package.json\`
3. Test with various inputs
4. Add documentation

## Source Pattern

Extracted from successful workflows with:
- **Success Count**: ${template.successCount}
- **Last Used**: ${new Date(template.lastUsed).toLocaleDateString()}
`;

    fs.writeFileSync(path.join(skillDir, 'README.md'), readme);

    return {
      success: true,
      skillDir,
      files: ['SKILL.md', 'package.json', 'index.js', 'README.md']
    };
  }

  /**
   * Get pattern extraction statistics
   */
  getStatistics() {
    const categories = {};
    this.skillTemplates.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + 1;
    });

    const avgSuccessCount = this.skillTemplates.length > 0
      ? this.skillTemplates.reduce((sum, t) => sum + t.successCount, 0) / this.skillTemplates.length
      : 0;

    return {
      totalTemplates: this.skillTemplates.length,
      categories,
      averageSuccessCount: Math.round(avgSuccessCount),
      mostSuccessful: this.skillTemplates
        .sort((a, b) => b.successCount - a.successCount)
        .slice(0, 5),
      recentlyUsed: this.skillTemplates
        .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
        .slice(0, 5)
    };
  }

  // Helper methods

  _generateId() {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _generateTemplateName(workflow) {
    if (workflow.context && workflow.context.goal) {
      return workflow.context.goal.charAt(0).toUpperCase() + 
             workflow.context.goal.slice(1).toLowerCase();
    }
    return 'Workflow Pattern';
  }

  _generateDescription(workflow) {
    const tools = workflow.toolsUsed || [];
    const steps = workflow.steps || [];
    
    return `A ${steps.length}-step workflow using ${tools.join(', ')} ` +
           `that accomplishes ${workflow.context?.goal || 'a common task'}`;
  }

  _classifyCategory(workflow) {
    const tools = workflow.toolsUsed || [];
    const context = workflow.context || {};

    if (tools.some(t => t.includes('browser') || t.includes('web'))) {
      return 'browser-automation';
    }
    if (tools.some(t => t.includes('database') || t.includes('db'))) {
      return 'database-operations';
    }
    if (tools.some(t => t.includes('file') || t.includes('fs'))) {
      return 'file-operations';
    }
    if (tools.some(t => t.includes('test'))) {
      return 'testing';
    }
    if (tools.some(t => t.includes('api'))) {
      return 'api-integration';
    }
    if (tools.some(t => t.includes('image') || t.includes('video'))) {
      return 'media-processing';
    }

    return 'general-automation';
  }

  _extractUseCases(workflow) {
    const useCases = [];

    if (workflow.context) {
      if (workflow.context.goal) {
        useCases.push(workflow.context.goal);
      }
      if (workflow.context.industry) {
        useCases.push(`${workflow.context.industry} automation`);
      }
    }

    const tools = workflow.toolsUsed || [];
    if (tools.includes('web_search')) {
      useCases.push('research', 'information gathering');
    }
    if (tools.includes('browser')) {
      useCases.push('web automation', 'scraping');
    }
    if (tools.includes('message')) {
      useCases.push('communication', 'notifications');
    }

    return [...new Set(useCases)]; // Remove duplicates
  }

  _normalizeSteps(steps) {
    return steps.map(step => ({
      tool: step.tool || 'unknown',
      description: step.description || 'Execute step',
      parameters: step.parameters || {},
      code: step.code || null,
      duration: step.duration || null
    }));
  }

  _extractTools(steps) {
    const tools = [];
    (steps || []).forEach(step => {
      if (step.tool && !tools.includes(step.tool)) {
        tools.push(step.tool);
      }
    });
    return tools;
  }

  _extractParameters(workflow) {
    const params = {};
    
    (workflow.steps || []).forEach(step => {
      if (step.parameters) {
        Object.entries(step.parameters).forEach(([key, val]) => {
          if (!params[key]) {
            params[key] = {
              type: typeof val,
              description: `Parameter from step: ${step.description}`
            };
          }
        });
      }
    });

    return params;
  }

  _findSimilarTemplate(template) {
    return this.skillTemplates.find(t => 
      t.category === template.category &&
      t.toolsRequired.length === template.toolsRequired.length &&
      t.toolsRequired.every(tool => template.toolsRequired.includes(tool))
    );
  }

  _getMatchReasons(template, query) {
    const reasons = [];

    if (template.name.toLowerCase().includes(query)) {
      reasons.push('Name match');
    }
    if (template.description.toLowerCase().includes(query)) {
      reasons.push('Description match');
    }
    template.useCases.forEach(uc => {
      if (uc.toLowerCase().includes(query)) {
        reasons.push(`Use case: ${uc}`);
      }
    });

    return reasons;
  }

  _generateUsageExample(template) {
    const examples = template.examples[0];
    if (!examples) return '// No example available';

    return `// Based on: ${examples.goal || 'similar workflow'}
const result = await executeWorkflow({
  // Configure parameters here
});
`;
  }
}

module.exports = PatternExtractor;
