# Evolution Engine v2 - Demo Examples

This directory contains demonstration examples of how to use the Autonomous Evolution Core v2.

## Examples

### 1. Basic Evolution Flow
**File:** `basic-evolution-flow.sh`
Demonstrates the complete evolution cycle:
- Detect missing capabilities
- Install capabilities
- Record success
- Extract patterns
- Share with community

### 2. Learning from Success
**File:** `learn-from-success.js`
Shows how to record successful workflows for learning:
- Capture workflow details
- Record tools used
- Document steps taken
- Save to learning database

### 3. Pattern Extraction
**File:** `extract-pattern.js`
Demonstrates extracting reusable skill patterns:
- Provide workflow data
- Extract skill template
- Generate skill files
- Preview template

### 4. Community Interaction
**File:** `community-demo.js`
Shows community features:
- Share learned patterns
- Request new capabilities
- Vote on patterns
- Search community patterns

### 5. End-to-End Scenario
**File:** `full-scenario.sh`
Complete realistic scenario:
- Agent receives user request
- Detects missing capability
- Installs capability
- Completes task
- Records success
- Extracts pattern
- Shares with community

## Running Examples

```bash
# Basic evolution flow
bash examples/basic-evolution-flow.sh

# Learn from success
node examples/learn-from-success.js

# Extract pattern
node examples/extract-pattern.js

# Community demo
node examples/community-demo.js

# Full scenario
bash examples/full-scenario.sh
```

## Expected Output

Each example will display:
- Console output showing the evolution process
- Data files created in `data/` directory
- Templates generated
- Community actions (simulated)
