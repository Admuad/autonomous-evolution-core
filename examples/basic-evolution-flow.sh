#!/bin/bash

# Basic Evolution Flow - Demo
# 
# This script demonstrates the complete autonomous evolution cycle

echo "🧬 Autonomous Evolution Core v2 - Basic Evolution Flow Demo"
echo "────────────────────────────────────────────────────────────"

# Set up
cd "$(dirname "$0")/.."
export NODE_ENV=development

echo ""
echo "📋 STEP 1: Enable Autonomous Evolution"
echo "─────────────────────────────────────────"
./cli.js enable

echo ""
echo "📊 STEP 2: Check Evolution Status"
echo "─────────────────────────────────────────"
./cli.js status

echo ""
echo "🔍 STEP 3: Detect Missing Capabilities"
echo "─────────────────────────────────────────"
./cli.js detect "I need to scrape a website and create a PDF report"

echo ""
echo "💡 STEP 4: Get Context Suggestions"
echo "─────────────────────────────────────────"
./cli.js suggest "building a web scraping tool for e-commerce"

echo ""
echo "✓ STEP 5: Record a Successful Workflow"
echo "─────────────────────────────────────────"
./cli.js learn-success \
  --context '{"goal":"web scraping demo","industry":"testing"}' \
  --tools "web_search,browser,write" \
  --steps '[{"tool":"web_search","description":"search"},{"tool":"browser","description":"navigate"},{"tool":"write","description":"save"}]' \
  --duration 5000

echo ""
echo "🔧 STEP 6: Extract Pattern from Workflow"
echo "─────────────────────────────────────────"
./cli.js extract-pattern \
  --context '{"goal":"web scraping demo"}' \
  --tools "web_search,browser,write" \
  --steps '[{"tool":"web_search","description":"search"},{"tool":"browser","description":"navigate"}]' \
  --caps "web-search,web-browser"

echo ""
echo "🔍 STEP 7: Search Skill Templates"
echo "─────────────────────────────────────────"
./cli.js search-templates "scraping"

echo ""
echo "🌐 STEP 8: Check Trending Community Patterns"
echo "─────────────────────────────────────────"
./cli.js trending

echo ""
echo "────────────────────────────────────────────────────────────"
echo "✨ Basic Evolution Flow Demo Complete!"
echo ""
echo "What happened:"
echo "  ✓ Enabled evolution components"
echo "  ✓ Checked system status"
echo "  ✓ Detected missing capabilities from query"
echo "  ✓ Got context-aware suggestions"
echo "  ✓ Recorded successful workflow for learning"
echo "  ✓ Extracted skill pattern from workflow"
echo "  ✓ Searched for matching templates"
echo "  ✓ Viewed trending community patterns"
echo ""
echo "Next steps:"
echo "  - Run: ./cli.js install <capability-id>  to install detected capabilities"
echo "  - Run: ./cli.js share-pattern <id>         to share with community"
echo "  - Run: node test-v2.js                     to run full test suite"
