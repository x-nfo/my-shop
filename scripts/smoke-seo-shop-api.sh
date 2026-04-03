#!/bin/bash

# Configuration
API_URL="http://localhost:3000/shop-api"
PRODUCT_QUERY_FILE="scripts/graphql/product-seo-check.graphql"
COLLECTION_QUERY_FILE="scripts/graphql/collection-seo-check.graphql"
PRODUCT_SLUG="laptop"
COLLECTION_SLUG="electronics"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Starting SEO Smoke Test for Shop API..."

validate_seo() {
    local TYPE=$1
    local SLUG=$2
    local QUERY_FILE=$3

    echo "Querying $TYPE '$SLUG' at $API_URL..."
    
    # Check if query file exists
    if [ ! -f "$QUERY_FILE" ]; then
        echo -e "${RED}Error: Query file $QUERY_FILE not found.${NC}"
        return 1
    fi

    # Prepare query payload
    QUERY=$(cat "$QUERY_FILE" | sed 's/"/\\"/g' | tr '\n' ' ')
    PAYLOAD="{\"query\": \"$QUERY\", \"variables\": {\"slug\": \"$SLUG\"}}"

    # Perform the request
    RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        "$API_URL")

    # Basic validation
    if echo "$RESPONSE" | grep -q "\"seo\"" && \
       echo "$RESPONSE" | grep -q "\"title\"" && \
       echo "$RESPONSE" | grep -q "\"description\"" && \
       echo "$RESPONSE" | grep -q "\"ogImageUrl\""; then
        echo -e "${GREEN}SUCCESS: SEO metadata fields are present in the $TYPE response.${NC}"
        return 0
    else
        echo -e "${RED}FAILURE: SEO metadata fields missing in $TYPE response.${NC}"
        echo "Response: $RESPONSE"
        return 1
    fi
}

# Run tests
validate_seo "product" "$PRODUCT_SLUG" "$PRODUCT_QUERY_FILE"
PRODUCT_RESULT=$?

validate_seo "collection" "$COLLECTION_SLUG" "$COLLECTION_QUERY_FILE"
COLLECTION_RESULT=$?

if [ $PRODUCT_RESULT -eq 0 ] && [ $COLLECTION_RESULT -eq 0 ]; then
    echo -e "\n${GREEN}ALL SEO SMOKE TESTS PASSED!${NC}"
    exit 0
else
    echo -e "\n${RED}SOME SEO SMOKE TESTS FAILED.${NC}"
    exit 1
fi
