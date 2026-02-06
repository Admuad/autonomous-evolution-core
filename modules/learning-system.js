/**
 * Learning System
 * 
 * Observes user workflows, extracts patterns, learns from success/failure
 * Builds a knowledge base of effective approaches
 */

const fs = require('fs');
const path = require('path');

class LearningSystem {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.learnedPatterns = [];
    this.successfulWorkflows = [];
    this.failedAttempts = [];
    
    this.loadLearningData();
  }

  loadLearningData() {
    const patternsPath = path.join(this.dataDir, 'learned-patterns.json');
    const workflowsPath = path.join(this.dataDir, 'successful-workflows.json');
    const failuresPath = path.join(this.dataDir, 'failed-attempts.json');

    try {
      if (fs.existsSync(patternsPath)) {
        const data = fs.readFileSync(patternsPath, 'utf8');
        this.learnedPatterns = JSON.parse(data);
      }
      
      if (fs.existsSync(workflowsPath)) {
        const data = fs.readFileSync(workflowsPath, 'utf8');
        this.successfulWorkflows = JSON.parse(data);
      }

      if (fs.existsSync(failuresPath)) {
        const data = fs.readFileSync(failuresPath, 'utf8');
        this.failedAttempts = JSON.parse(data);
      }

      console.log(`✓ Learning system loaded with ${this.learnedPatterns.length} patterns, ${this.successfulWorkflows.length} successful workflows`);
    } catch (error) {
      console.log('No previous learning data found. Starting fresh.');
    }
  }

  saveLearningData() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(this.dataDir, 'learned-patterns.json'),
      JSON.stringify(this.learnedPatterns, null, 2)
    );

    fs.writeFileSync(
      path.join(this.dataDir, 'successful-workflows.json'),
      JSON.stringify(this.successfulWorkflows, null, 2)
    );

    fs.writeFileSync(
      path.join(this.dataDir, 'failed-attempts.json'),
      JSON.stringify(this.failedAttempts, null, 2)
    );
  }

  /**
   * Record a successful workflow
   */
  recordSuccess(workflow) {
    const record = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      toolsUsed: workflow.toolsUsed || [],
      steps: workflow.steps || [],
      duration: workflow.duration,
      outcome: workflow.outcome,
      capabilitiesUsed: workflow.capabilities || [],
      context: workflow.context || {}
    };

    this.successfulWorkflows.push(record);
    this.saveLearningData();

    // Extract patterns from this success
    this._extractPatternsFromWorkflow(record);

    return record.id;
  }

  /**
   * Record a failed attempt
   */
  recordFailure(failure) {
    const record = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      toolsUsed: failure.toolsUsed || [],
      error: failure.error,
      step: failure.step,
      context: failure.context || {},
      suggestion: failure.suggestion
    };

    this.failedAttempts.push(record);
    this.saveLearningData();

    // Learn from failure
    this._learnFromFailure(record);

    return record.id;
  }

  /**
   * Extract patterns from a successful workflow
   */
  _extractPatternsFromWorkflow(workflow) {
    const patterns = [];

    // Pattern 1: Sequential tool usage
    if (workflow.steps.length > 1) {
      const toolSequence = workflow.steps.map(s => s.tool).filter(Boolean);
      if (toolSequence.length > 1) {
        patterns.push({
          type: 'tool-sequence',
          sequence: toolSequence,
          useCase: workflow.context.goal || 'Unknown',
          successRate: 1.0,
          count: 1
        });
      }
    }

    // Pattern 2: Capability combinations
    if (workflow.capabilitiesUsed.length > 1) {
      patterns.push({
        type: 'capability-combination',
        capabilities: workflow.capabilitiesUsed,
        useCase: workflow.context.goal,
        successRate: 1.0,
        count: 1
      });
    }

    // Pattern 3: Duration-based optimization
    if (workflow.duration) {
      patterns.push({
        type: 'duration-estimate',
        context: workflow.context.goal,
        estimatedDuration: workflow.duration,
        confidence: 1.0
      });
    }

    // Merge with existing patterns
    patterns.forEach(newPattern => {
      const existing = this.learnedPatterns.find(p => 
        this._patternsMatch(p, newPattern)
      );

      if (existing) {
        // Update existing pattern
        existing.count++;
        existing.successRate = (existing.successRate * (existing.count - 1) + 1.0) / existing.count;
        if (newPattern.type === 'duration-estimate') {
          existing.estimatedDuration = (existing.estimatedDuration * (existing.count - 1) + newPattern.estimatedDuration) / existing.count;
        }
      } else {
        // Add new pattern
        newPattern.id = this._generateId();
        newPattern.createdAt = new Date().toISOString();
        this.learnedPatterns.push(newPattern);
      }
    });

    this.saveLearningData();
  }

  /**
   * Learn from a failed attempt
   */
  _learnFromFailure(failure) {
    // Identify common failure patterns
    const errorType = this._classifyError(failure.error);

    const failurePattern = {
      type: 'error-avoidance',
      errorType,
      toolsUsed: failure.toolsUsed,
      context: failure.context,
      suggestion: failure.suggestion,
      occurrenceCount: 1,
      lastSeen: new Date().toISOString()
    };

    // Check if similar failure pattern exists
    const existing = this.failedAttempts.find(f => 
      this._classifyError(f.error) === errorType &&
      f.toolsUsed.join(',') === failure.toolsUsed.join(',')
    );

    if (existing) {
      failurePattern.occurrenceCount = (existing.occurrenceCount || 1) + 1;
    }

    // Save as a learned pattern to avoid similar errors
    const avoidancePattern = {
      id: this._generateId(),
      type: 'avoidance-rule',
      errorType,
      avoidCombination: failure.toolsUsed,
      recommendedAlternative: failure.suggestion,
      occurrenceCount: failurePattern.occurrenceCount,
      createdAt: new Date().toISOString()
    };

    this.learnedPatterns.push(avoidancePattern);
    this.saveLearningData();
  }

  /**
   * Get suggestions based on context
   */
  getSuggestions(context) {
    const suggestions = [];

    // Find matching successful patterns
    this.learnedPatterns.forEach(pattern => {
      let relevance = 0;

      switch (pattern.type) {
        case 'tool-sequence':
          // Relevance based on context similarity
          if (pattern.useCase && context.goal) {
            relevance = this._calculateSimilarity(pattern.useCase, context.goal);
          }
          break;

        case 'capability-combination':
          // Check if capabilities match requirements
          if (context.requiredCapabilities) {
            const overlap = pattern.capabilities.filter(c => 
              context.requiredCapabilities.includes(c)
            ).length;
            relevance = overlap / pattern.capabilities.length;
          }
          break;

        case 'duration-estimate':
          if (context.goal) {
            relevance = this._calculateSimilarity(pattern.context, context.goal);
          }
          break;

        case 'avoidance-rule':
          // High relevance if we're about to repeat a mistake
          if (context.toolsToUse) {
            const toolsMatch = pattern.avoidCombination.every(t => 
              context.toolsToUse.includes(t)
            );
            relevance = toolsMatch ? 1.0 : 0;
          }
          break;
      }

      if (relevance > 0.3) {
        suggestions.push({
          ...pattern,
          relevance,
          reason: this._getSuggestionReason(pattern)
        });
      }
    });

    // Sort by relevance and success rate
    suggestions.sort((a, b) => {
      const successDiff = (b.successRate || 0) - (a.successRate || 0);
      if (Math.abs(successDiff) > 0.1) return successDiff;
      return b.relevance - a.relevance;
    });

    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  /**
   * Estimate workflow duration based on learned patterns
   */
  estimateDuration(context) {
    const matches = this.learnedPatterns.filter(p => 
      p.type === 'duration-estimate' &&
      this._calculateSimilarity(p.context, context.goal) > 0.5
    );

    if (matches.length === 0) {
      return null;
    }

    // Weighted average based on confidence
    const totalWeight = matches.reduce((sum, m) => sum + m.confidence, 0);
    const weightedDuration = matches.reduce((sum, m) => 
      sum + (m.estimatedDuration * m.confidence), 0
    );

    return Math.round(weightedDuration / totalWeight);
  }

  /**
   * Get successful workflows similar to context
   */
  getSimilarWorkflows(context, limit = 3) {
    const similar = this.successfulWorkflows.filter(wf => {
      if (!wf.context || !wf.context.goal) return false;
      return this._calculateSimilarity(wf.context.goal, context.goal) > 0.4;
    });

    // Sort by similarity and recency
    similar.sort((a, b) => {
      const simA = this._calculateSimilarity(a.context.goal, context.goal);
      const simB = this._calculateSimilarity(b.context.goal, context.goal);
      if (Math.abs(simA - simB) > 0.1) return simB - simA;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return similar.slice(0, limit);
  }

  /**
   * Generate learning report
   */
  generateReport() {
    const totalAttempts = this.successfulWorkflows.length + this.failedAttempts.length;
    const successRate = totalAttempts > 0 
      ? (this.successfulWorkflows.length / totalAttempts * 100).toFixed(1)
      : 0;

    // Most used tools
    const toolUsage = {};
    this.successfulWorkflows.forEach(wf => {
      wf.toolsUsed.forEach(tool => {
        toolUsage[tool] = (toolUsage[tool] || 0) + 1;
      });
    });

    const topTools = Object.entries(toolUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalAttempts,
      successfulWorkflows: this.successfulWorkflows.length,
      failedAttempts: this.failedAttempts.length,
      successRate: `${successRate}%`,
      learnedPatterns: this.learnedPatterns.length,
      topTools: topTools.map(([tool, count]) => ({ tool, count })),
      recentLearning: this.learnedPatterns
        .filter(p => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .length
    };
  }

  /**
   * Clear old learning data (memory management)
   */
  cleanupOldEntries(daysOld = 30) {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    this.successfulWorkflows = this.successfulWorkflows.filter(wf => 
      new Date(wf.timestamp) > cutoff
    );

    this.failedAttempts = this.failedAttempts.filter(f => 
      new Date(f.timestamp) > cutoff
    );

    this.saveLearningData();
    
    return {
      removedWorkflows: this.successfulWorkflows.length,
      removedFailures: this.failedAttempts.length
    };
  }

  // Helper methods

  _generateId() {
    return `learn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _patternsMatch(p1, p2) {
    if (p1.type !== p2.type) return false;

    switch (p1.type) {
      case 'tool-sequence':
        return JSON.stringify(p1.sequence) === JSON.stringify(p2.sequence);
      
      case 'capability-combination':
        return JSON.stringify(p1.capabilities.sort()) === JSON.stringify(p2.capabilities.sort());
      
      case 'duration-estimate':
        return p1.context === p2.context;
      
      default:
        return false;
    }
  }

  _classifyError(error) {
    const errorLower = error.toLowerCase();

    if (errorLower.includes('permission') || errorLower.includes('access denied')) {
      return 'permission-error';
    }
    if (errorLower.includes('not found') || errorLower.includes('missing')) {
      return 'missing-dependency';
    }
    if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
      return 'timeout';
    }
    if (errorLower.includes('api') && (errorLower.includes('key') || errorLower.includes('auth'))) {
      return 'authentication-error';
    }
    if (errorLower.includes('syntax') || errorLower.includes('parse')) {
      return 'syntax-error';
    }

    return 'unknown-error';
  }

  _calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    // Simple word overlap
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    
    const intersection = words1.filter(w => words2.includes(w));
    const union = [...new Set([...words1, ...words2])];

    return union.length > 0 ? intersection.length / union.length : 0;
  }

  _getSuggestionReason(pattern) {
    switch (pattern.type) {
      case 'tool-sequence':
        return `Similar successful workflow used this sequence`;
      case 'capability-combination':
        return `These capabilities worked well together`;
      case 'duration-estimate':
        return `Estimated duration based on similar tasks`;
      case 'avoidance-rule':
        return `Avoiding known error pattern`;
      default:
        return 'Pattern matched from learning history';
    }
  }
}

module.exports = LearningSystem;
