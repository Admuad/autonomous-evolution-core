/**
 * Community Sharing
 * 
 * Enables agents to:
 * - Share learned patterns with the community
 * - Request capabilities from the community
 * - Provide feedback on patterns
 * - Vote on capability requests
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class CommunityShare {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.sharedPatterns = [];
    this.requestedCapabilities = [];
    this.votes = {};
    this.feedback = [];
    
    // Community API endpoint (would be real in production)
    this.apiEndpoint = process.env.EVOLUTION_API_URL || 'https://api.evolution-core.dev/v1';
    
    this.loadCommunityData();
  }

  loadCommunityData() {
    const sharedPath = path.join(this.dataDir, 'shared-patterns.json');
    const requestedPath = path.join(this.dataDir, 'requested-capabilities.json');
    const votesPath = path.join(this.dataDir, 'votes.json');
    const feedbackPath = path.join(this.dataDir, 'feedback.json');

    try {
      if (fs.existsSync(sharedPath)) {
        const data = fs.readFileSync(sharedPath, 'utf8');
        this.sharedPatterns = JSON.parse(data);
      }

      if (fs.existsSync(requestedPath)) {
        const data = fs.readFileSync(requestedPath, 'utf8');
        this.requestedCapabilities = JSON.parse(data);
      }

      if (fs.existsSync(votesPath)) {
        const data = fs.readFileSync(votesPath, 'utf8');
        this.votes = JSON.parse(data);
      }

      if (fs.existsSync(feedbackPath)) {
        const data = fs.readFileSync(feedbackPath, 'utf8');
        this.feedback = JSON.parse(data);
      }

      console.log(`✓ Community data loaded: ${this.sharedPatterns.length} shared, ${this.requestedCapabilities.length} requests`);
    } catch (error) {
      console.log('No community data found yet');
    }
  }

  saveCommunityData() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(this.dataDir, 'shared-patterns.json'),
      JSON.stringify(this.sharedPatterns, null, 2)
    );

    fs.writeFileSync(
      path.join(this.dataDir, 'requested-capabilities.json'),
      JSON.stringify(this.requestedCapabilities, null, 2)
    );

    fs.writeFileSync(
      path.join(this.dataDir, 'votes.json'),
      JSON.stringify(this.votes, null, 2)
    );

    fs.writeFileSync(
      path.join(this.dataDir, 'feedback.json'),
      JSON.stringify(this.feedback, null, 2)
    );
  }

  /**
   * Share a learned pattern with the community
   */
  async sharePattern(pattern, options = {}) {
    const { 
      anonymous = false,
      includeExamples = true,
      dryRun = false 
    } = options;

    const sharedPattern = {
      id: this._generateId(),
      patternId: pattern.id,
      name: pattern.name || pattern.type,
      description: pattern.description || '',
      type: pattern.type || 'unknown',
      category: pattern.category || 'general',
      successRate: pattern.successRate || 1.0,
      useCases: pattern.useCases || [],
      author: anonymous ? 'anonymous' : 'autonomous-evolution-core',
      createdAt: new Date().toISOString(),
      examples: includeExamples ? (pattern.examples || []).slice(0, 3) : [],
      metadata: {
        toolsUsed: pattern.toolsUsed || [],
        capabilities: pattern.capabilities || [],
        estimatedDuration: pattern.estimatedDuration
      }
    };

    if (dryRun) {
      return { success: true, dryRun: true, pattern: sharedPattern };
    }

    try {
      // In production, this would POST to the community API
      // const response = await axios.post(`${this.apiEndpoint}/patterns`, sharedPattern);
      
      // For now, store locally
      this.sharedPatterns.push(sharedPattern);
      this.saveCommunityData();

      return {
        success: true,
        patternId: sharedPattern.id,
        message: `Pattern "${sharedPattern.name}" shared with community`,
        url: `https://evolution-core.dev/patterns/${sharedPattern.id}`
      };

    } catch (error) {
      console.error('Failed to share pattern:', error.message);
      return {
        success: false,
        message: 'Failed to share pattern: ' + error.message
      };
    }
  }

  /**
   * Request a capability from the community
   */
  async requestCapability(request, options = {}) {
    const { 
      dryRun = false,
      priority = 'normal' 
    } = options;

    const capabilityRequest = {
      id: this._generateId(),
      name: request.name,
      description: request.description,
      category: request.category || 'general',
      urgency: priority,
      proposedImplementation: request.proposedImplementation || '',
      useCases: request.useCases || [],
      author: 'autonomous-evolution-core',
      status: 'open',
      createdAt: new Date().toISOString(),
      votes: 0,
      comments: []
    };

    if (dryRun) {
      return { success: true, dryRun: true, request: capabilityRequest };
    }

    try {
      this.requestedCapabilities.push(capabilityRequest);
      this.saveCommunityData();

      return {
        success: true,
        requestId: capabilityRequest.id,
        message: `Capability "${request.name}" requested from community`,
        url: `https://evolution-core.dev/requests/${capabilityRequest.id}`
      };

    } catch (error) {
      console.error('Failed to request capability:', error.message);
      return {
        success: false,
        message: 'Failed to request capability: ' + error.message
      };
    }
  }

  /**
   * Vote on a shared pattern or capability request
   */
  async vote(type, id, vote, options = {}) {
    const { dryRun = false } = options;

    if (vote !== 'up' && vote !== 'down') {
      return {
        success: false,
        message: 'Vote must be "up" or "down"'
      };
    }

    const voteRecord = {
      id: this._generateId(),
      type, // 'pattern' or 'request'
      targetId: id,
      vote,
      timestamp: new Date().toISOString(),
      voter: 'autonomous-evolution-core'
    };

    if (dryRun) {
      return { success: true, dryRun: true, vote: voteRecord };
    }

    try {
      // Update vote counts
      const voteKey = `${type}:${id}`;
      this.votes[voteKey] = (this.votes[voteKey] || { up: 0, down: 0 });
      this.votes[voteKey][vote]++;
      
      this.saveCommunityData();

      return {
        success: true,
        voteId: voteRecord.id,
        message: `Vote recorded for ${type} ${id}`
      };

    } catch (error) {
      console.error('Failed to record vote:', error.message);
      return {
        success: false,
        message: 'Failed to record vote: ' + error.message
      };
    }
  }

  /**
   * Provide feedback on a shared pattern
   */
  async provideFeedback(patternId, feedback, options = {}) {
    const { 
      anonymous = false,
      dryRun = false 
    } = options;

    const feedbackRecord = {
      id: this._generateId(),
      patternId,
      rating: feedback.rating || 0, // 1-5 scale
      comment: feedback.comment || '',
      tags: feedback.tags || [],
      author: anonymous ? 'anonymous' : 'autonomous-evolution-core',
      createdAt: new Date().toISOString()
    };

    if (dryRun) {
      return { success: true, dryRun: true, feedback: feedbackRecord };
    }

    try {
      this.feedback.push(feedbackRecord);
      this.saveCommunityData();

      return {
        success: true,
        feedbackId: feedbackRecord.id,
        message: `Feedback provided for pattern ${patternId}`
      };

    } catch (error) {
      console.error('Failed to provide feedback:', error.message);
      return {
        success: false,
        message: 'Failed to provide feedback: ' + error.message
      };
    }
  }

  /**
   * Search community patterns
   */
  async searchCommunityPatterns(query, options = {}) {
    const { 
      category = null,
      minSuccessRate = 0.5,
      limit = 10 
    } = options;

    const queryLower = query.toLowerCase();
    
    // In production, this would query the API
    // const response = await axios.get(`${this.apiEndpoint}/patterns/search`, {
    //   params: { q: query, category, minSuccessRate, limit }
    // });
    // return response.data.patterns;

    // For now, search locally shared patterns
    const results = this.sharedPatterns.filter(pattern => {
      // Filter by category
      if (category && pattern.category !== category) {
        return false;
      }

      // Filter by success rate
      if (pattern.successRate < minSuccessRate) {
        return false;
      }

      // Match query
      const searchText = `${pattern.name} ${pattern.description} ${pattern.useCases.join(' ')}`.toLowerCase();
      return searchText.includes(queryLower);
    });

    // Sort by success rate and votes
    results.sort((a, b) => {
      const voteKeyA = `pattern:${a.id}`;
      const voteKeyB = `pattern:${b.id}`;
      const votesA = (this.votes[voteKeyA]?.up || 0) - (this.votes[voteKeyA]?.down || 0);
      const votesB = (this.votes[voteKeyB]?.up || 0) - (this.votes[voteKeyB]?.down || 0);
      
      const scoreA = a.successRate * 100 + votesA;
      const scoreB = b.successRate * 100 + votesB;
      
      return scoreB - scoreA;
    });

    return results.slice(0, limit);
  }

  /**
   * Get trending community patterns
   */
  getTrendingPatterns(limit = 10) {
    const scored = this.sharedPatterns.map(pattern => {
      const voteKey = `pattern:${pattern.id}`;
      const votes = (this.votes[voteKey]?.up || 0) - (this.votes[voteKey]?.down || 0);
      
      // Score = success rate * 100 + votes - age penalty
      const age = Date.now() - new Date(pattern.createdAt).getTime();
      const agePenalty = Math.floor(age / (7 * 24 * 60 * 60 * 1000)); // Weekly decay
      
      return {
        ...pattern,
        score: pattern.successRate * 100 + votes - agePenalty,
        votes
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Get top capability requests
   */
  getTopRequests(limit = 10) {
    const scored = this.requestedCapabilities.map(request => {
      const voteKey = `request:${request.id}`;
      const votes = this.votes[voteKey]?.up || 0;
      
      return {
        ...request,
        votes,
        score: votes * 10 + (request.urgency === 'high' ? 50 : 0)
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  /**
   * Sync with community API
   */
  async sync(options = {}) {
    const { 
      dryRun = false,
      pushPatterns = true,
      pullPatterns = true,
      pullRequests = true 
    } = options;

    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        message: 'Would sync with community API'
      };
    }

    try {
      const results = {
        pushedPatterns: 0,
        pulledPatterns: 0,
        pulledRequests: 0
      };

      // Push shared patterns
      if (pushPatterns) {
        // In production: await axios.post(...)
        results.pushedPatterns = this.sharedPatterns.length;
      }

      // Pull new patterns
      if (pullPatterns) {
        // In production: await axios.get(...)
        // results.pulledPatterns = response.data.count;
      }

      // Pull capability requests
      if (pullRequests) {
        // In production: await axios.get(...)
        // results.pulledRequests = response.data.count;
      }

      return {
        success: true,
        ...results,
        message: 'Synced with community'
      };

    } catch (error) {
      console.error('Sync failed:', error.message);
      return {
        success: false,
        message: 'Sync failed: ' + error.message
      };
    }
  }

  /**
   * Get community statistics
   */
  getStatistics() {
    const totalVotes = Object.values(this.votes).reduce((sum, v) => 
      sum + (v?.up || 0) + (v?.down || 0), 0
    );

    const avgRating = this.feedback.length > 0
      ? (this.feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / this.feedback.length).toFixed(2)
      : 0;

    return {
      sharedPatterns: this.sharedPatterns.length,
      requestedCapabilities: this.requestedCapabilities.length,
      totalVotes,
      totalFeedback: this.feedback.length,
      averageRating: parseFloat(avgRating),
      topCategories: this._getTopCategories()
    };
  }

  // Helper methods

  _generateId() {
    return `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _getTopCategories() {
    const categoryCount = {};
    
    this.sharedPatterns.forEach(pattern => {
      categoryCount[pattern.category] = (categoryCount[pattern.category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => ({ category: cat, count }));
  }
}

module.exports = CommunityShare;
