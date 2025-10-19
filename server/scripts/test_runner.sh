#!/bin/bash

# Test runner script that runs each test file individually
# This ensures proper isolation between tests and prevents mock leakage
# Usage: ./scripts/test_runner.sh [keyword]
# Example: ./scripts/test_runner.sh church

set -e  # Exit on any error

# Define colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get keyword filter from command line argument
KEYWORD="$1"

echo "🧪 Running tests individually for better isolation..."

# Find test files based on keyword filter
if [ -n "$KEYWORD" ]; then
    echo -e "${CYAN}🔍 Filtering tests by keyword: '$KEYWORD'${NC}"
    TEST_FILES=$(find src -name "*.test.ts" | grep -i "$KEYWORD" | sort)
else
    TEST_FILES=$(find src -name "*.test.ts" | sort)
fi

if [ -z "$TEST_FILES" ]; then
    if [ -n "$KEYWORD" ]; then
        echo -e "${RED}❌ No test files found matching keyword: '$KEYWORD'${NC}"
    else
        echo -e "${RED}❌ No test files found${NC}"
    fi
    exit 1
fi

# Track results
PASSED=0
FAILED=0
TOTAL=0
FAILED_FILES=()
PASSED_FILES=()

# Run each test file individually
for test_file in $TEST_FILES; do
    TOTAL=$((TOTAL + 1))
    echo ""
    echo -e "${BLUE}📁 Running: $test_file${NC}"
    echo "----------------------------------------"
    
    if bun test "$test_file"; then
        echo -e "${GREEN}✅ PASSED: $test_file${NC}"
        PASSED=$((PASSED + 1))
        PASSED_FILES+=("$test_file")
    else
        echo -e "${RED}❌ FAILED: $test_file${NC}"
        FAILED=$((FAILED + 1))
        FAILED_FILES+=("$test_file")
    fi
done

echo ""
echo -e "${PURPLE}========================================${NC}"
echo -e "${YELLOW}📊 Test Results Summary:${NC}"
echo -e "   Total: ${BLUE}$TOTAL${NC}"
echo -e "   Passed: ${GREEN}$PASSED${NC}"
echo -e "   Failed: ${RED}$FAILED${NC}"
echo -e "${PURPLE}========================================${NC}"

if [ ${#PASSED_FILES[@]} -gt 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Passed Files:${NC}"
    for passed_file in "${PASSED_FILES[@]}"; do
        echo -e "   ${GREEN}✓ $passed_file${NC}"
    done
    echo ""
fi

if [ ${#FAILED_FILES[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}💥 Failed Files:${NC}"
    for failed_file in "${FAILED_FILES[@]}"; do
        echo -e "   ${RED}❌ $failed_file${NC}"
    done
    echo ""
fi

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}💥 $FAILED test file(s) failed!${NC}"
    exit 1
fi
