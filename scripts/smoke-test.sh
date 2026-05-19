#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${STAGING_URL:-http://localhost:81}"
MAX_WAIT=120
INTERVAL=10
elapsed=0
passed=0
failed=0

check() {
  local label="$1"
  local url="$2"
  local expected_body="${3:-}"

  local response
  response=$(curl -sf --max-time 10 "$url" 2>/dev/null) || {
    echo "FAIL [$label]: $url unreachable"
    failed=$((failed + 1))
    return
  }

  if [[ -n "$expected_body" ]] && ! echo "$response" | grep -q "$expected_body"; then
    echo "FAIL [$label]: expected '$expected_body' in response"
    echo "       got: $response"
    failed=$((failed + 1))
    return
  fi

  echo "PASS [$label]"
  passed=$((passed + 1))
}

echo "=== Smoke tests: $BASE_URL ==="

# Wait for backend to come up
echo "Waiting for /health..."
until curl -sf --max-time 5 "$BASE_URL/health" > /dev/null 2>&1; do
  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    echo "FAIL: backend not healthy after ${MAX_WAIT}s"
    exit 1
  fi
  echo "  retrying in ${INTERVAL}s (${elapsed}s elapsed)"
  sleep "$INTERVAL"
  elapsed=$((elapsed + INTERVAL))
done

check "backend /health"    "$BASE_URL/health"    '"status":"ok"'
check "backend /health/db" "$BASE_URL/health/db" '"status":"ok"'
check "frontend /"         "$BASE_URL/"

echo ""
echo "Results: $passed passed, $failed failed"
[ "$failed" -eq 0 ] || exit 1
