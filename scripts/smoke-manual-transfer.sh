#!/bin/bash

SHOP_API_URL="${VENDURE_SHOP_API_URL:-http://localhost:3000/shop-api}"
ADMIN_API_URL="${VENDURE_ADMIN_API_URL:-http://localhost:3000/admin-api}"
SUPERADMIN_USER="${SUPERADMIN_USERNAME:-superadmin}"
SUPERADMIN_PASS="${SUPERADMIN_PASSWORD:-superadmin}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo "Starting Manual Bank Transfer Smoke Test..."

COOKIE_JAR="$(mktemp)"
cleanup() {
    rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

if ! curl -s --connect-timeout 2 "$ADMIN_API_URL" >/dev/null; then
    echo -e "${RED}Error: Admin API is not reachable at $ADMIN_API_URL.${NC}"
    echo "Make sure the Vendure server is running before executing this smoke test."
    exit 1
fi

if ! curl -s --connect-timeout 2 "$SHOP_API_URL" >/dev/null; then
    echo -e "${RED}Error: Shop API is not reachable at $SHOP_API_URL.${NC}"
    echo "Make sure the Vendure server is running before executing this smoke test."
    exit 1
fi

echo "Logging in to Admin API..."
LOGIN_QUERY="mutation { login(username: \\\"$SUPERADMIN_USER\\\", password: \\\"$SUPERADMIN_PASS\\\") { __typename ... on CurrentUser { id identifier } } }"
LOGIN_RES=$(curl -s -c "$COOKIE_JAR" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"$LOGIN_QUERY\"}" \
    "$ADMIN_API_URL")

if [ "x$LOGIN_RES" = "x" ] || ! echo "$LOGIN_RES" | grep -q "\"CurrentUser\""; then
    echo -e "${RED}Error: Login failed.${NC}"
    echo "Response: $LOGIN_RES"
    exit 1
fi

echo "Checking Order custom fields..."
ORDER_CUSTOM_FIELDS_QUERY='query { __type(name: \"OrderCustomFields\") { fields { name } } }'
ORDER_CUSTOM_FIELDS_RES=$(curl -s -b "$COOKIE_JAR" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$ORDER_CUSTOM_FIELDS_QUERY\"}" \
    "$ADMIN_API_URL")

if echo "$ORDER_CUSTOM_FIELDS_RES" | grep -q "manualTransferProofAsset" && \
   echo "$ORDER_CUSTOM_FIELDS_RES" | grep -q "manualTransferProofUploadedAt" && \
   echo "$ORDER_CUSTOM_FIELDS_RES" | grep -q "manualTransferVerificationStatus" && \
   echo "$ORDER_CUSTOM_FIELDS_RES" | grep -q "manualTransferVerificationNote" && \
   echo "$ORDER_CUSTOM_FIELDS_RES" | grep -q "manualTransferVerifiedAt"; then
    echo -e "${GREEN}SUCCESS: Manual transfer custom fields are present on Order.${NC}"
else
    echo -e "${RED}FAILURE: Manual transfer custom fields are missing.${NC}"
    echo "Response: $ORDER_CUSTOM_FIELDS_RES"
    exit 1
fi

echo "Checking Shop API mutation..."
SHOP_MUTATION_QUERY='query { __type(name: \"Mutation\") { fields { name } } }'
SHOP_MUTATION_RES=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$SHOP_MUTATION_QUERY\"}" \
    "$SHOP_API_URL")

if echo "$SHOP_MUTATION_RES" | grep -q "submitManualTransferProof"; then
    echo -e "${GREEN}SUCCESS: Shop API exposes submitManualTransferProof.${NC}"
else
    echo -e "${RED}FAILURE: Shop API mutation submitManualTransferProof not found.${NC}"
    echo "Response: $SHOP_MUTATION_RES"
    exit 1
fi

echo "Checking Admin API mutations..."
ADMIN_MUTATION_RES=$(curl -s -b "$COOKIE_JAR" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$SHOP_MUTATION_QUERY\"}" \
    "$ADMIN_API_URL")

if echo "$ADMIN_MUTATION_RES" | grep -q "verifyManualTransferPayment" && \
   echo "$ADMIN_MUTATION_RES" | grep -q "rejectManualTransferProof"; then
    echo -e "${GREEN}SUCCESS: Admin API exposes manual transfer verification mutations.${NC}"
else
    echo -e "${RED}FAILURE: Admin API verification mutations are missing.${NC}"
    echo "Response: $ADMIN_MUTATION_RES"
    exit 1
fi

echo -e "\n${GREEN}MANUAL BANK TRANSFER SMOKE TEST PASSED!${NC}"
echo "--------------------------------------------------------"
echo "To verify the full flow manually:"
echo "1. Run 'npm run dev:server' and 'npm run dev:dashboard'."
echo "2. Create an order, complete checkout with the manual transfer payment method, and upload proof from the Shop API/storefront."
echo "3. Open the order detail page in the Dashboard and confirm the Manual Transfer verification card appears."
echo "4. Click 'Verify & Settle' and confirm the payment moves to Settled."
echo "--------------------------------------------------------"

exit 0
