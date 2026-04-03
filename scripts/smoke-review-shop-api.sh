#!/bin/bash

# Simple smoke test for Product Review Shop API
API_URL=${VENDURE_API_URL:-"http://localhost:3000/shop-api"}

echo "--- Testing Product Review Shop API ---"

pretty_print() {
  if command -v json_pp >/dev/null 2>&1; then
    json_pp
  else
    cat
  fi
}

# 1. Fetch products to get a valid ID
echo "1. Fetching products..."
PRODUCT_ID=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"query": "{ products(options: {take: 1}) { items { id name slug } } }"}' \
  $API_URL | grep -oP '"id":"\K[^"]+' | head -1)

if [ -z "$PRODUCT_ID" ]; then
  echo "Error: Could not fetch product ID"
  exit 1
fi
echo "Found Product ID: $PRODUCT_ID"

# 2. Query initial rating
echo "2. Querying initial rating for product $PRODUCT_ID..."
curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"query\": \"{ product(id: \\\"$PRODUCT_ID\\\") { name averageRating reviewCount } }\"}" \
  $API_URL | pretty_print

# 3. Submit a review (Will likely fail without auth, which is expected for smoke test of permissions)
echo "3. Attempting to submit review without auth (Expecting Error)..."
curl -s -X POST -H "Content-Type: application/json" \
  -d "{\"query\": \"mutation { submitProductReview(input: { productId: \\\"$PRODUCT_ID\\\", rating: 5, text: \\\"Great product!\\\" }) { id status } }\"}" \
  $API_URL | pretty_print

echo "--- Smoke test script completed ---"
echo "Note: Full verification requires a logged-in customer and admin approval."
