#!/bin/bash

# Configuration
ADMIN_API_URL="http://localhost:3000/admin-api"
SUPERADMIN_USER="${SUPERADMIN_USERNAME:-superadmin}"
SUPERADMIN_PASS="${SUPERADMIN_PASSWORD:-superadmin}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "Starting Abandoned Cart Recovery Smoke Test..."

COOKIE_JAR="$(mktemp)"
cleanup() {
    rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

# Check if server is running
if ! curl -s --connect-timeout 2 $ADMIN_API_URL > /dev/null; then
    echo -e "${RED}Error: Admin API is not reachable at $ADMIN_API_URL.${NC}"
    echo "Make sure to run 'npm run dev' before running this script."
    exit 1
fi

# Login and get cookie
echo "Logging in to Admin API..."
LOGIN_RES=$(curl -s -c "$COOKIE_JAR" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"mutation { login(username: \\\"$SUPERADMIN_USER\\\", password: \\\"$SUPERADMIN_PASS\\\") { ... on AuthenticatedSession { token } } }\"}" \
    "$ADMIN_API_URL")

if [ "x$LOGIN_RES" == "x" ] || ! echo "$LOGIN_RES" | grep -q "AuthenticatedSession"; then
    echo -e "${RED}Error: Login failed.${NC}"
    echo "Response: $LOGIN_RES"
    exit 1
fi

# Check for custom fields on Order via introspection or a sample query
echo "Checking Order custom fields..."
QUERY="query { __type(name: \\\"OrderCustomFields\\\") { fields { name } } }"
RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$QUERY\"}" \
    "$ADMIN_API_URL")

if echo "$RESPONSE" | grep -q "abandonedCartRecoveryToken" && \
   echo "$RESPONSE" | grep -q "abandonedCartRecoveryLastSentAt" && \
   echo "$RESPONSE" | grep -q "abandonedCartRecoveryEmailCount"; then
    echo -e "${GREEN}SUCCESS: Abandoned Cart Recovery custom fields are present on the Order entity.${NC}"
else
    echo -e "${RED}FAILURE: Custom fields not found on Order entity.${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi

echo -e "\n${GREEN}ABANDONED CART RECOVERY SMOKE TEST PASSED!${NC}"
echo "--------------------------------------------------------"
echo "To verify the recovery flow:"
echo "1. Ensure 'npm run dev:server' and 'npm run dev:worker' are running."
echo "2. Check the worker logs for 'Found X eligible abandoned orders'."
echo "3. Check 'static/email/test-emails' for generated recovery emails."
echo "--------------------------------------------------------"

exit 0
