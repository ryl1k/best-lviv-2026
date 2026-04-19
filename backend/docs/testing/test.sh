#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
EMAIL="${EMAIL:-test@test.com}"
PASSWORD="${PASSWORD:-password123}"
LAND_FILE="${LAND_FILE:-/Users/admin/dev/projects/best-lviv-2026/dataset/ДРРП земля.xlsx}"
ESTATE_FILE="${ESTATE_FILE:-/Users/admin/dev/projects/best-lviv-2026/dataset/ДРРП нерухомість.xlsx}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}→ $1${NC}"; }
jq()  { python3 -c "import sys,json; r=json.load(sys.stdin); $1"; }

# ── 0. Auth ───────────────────────────────────────────────────────────────────
info "Registering user (ignoring conflict)..."
curl -sf -X POST "$BASE_URL/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"username\":\"testuser\"}" > /dev/null 2>&1 || true

info "Logging in..."
LOGIN=$(curl -sf -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data'])")
[[ -n "$TOKEN" ]] && ok "Token obtained" || fail "Login failed: $LOGIN"
AUTH=(-H "Authorization: Bearer $TOKEN")

# ── 1. Upload ─────────────────────────────────────────────────────────────────
info "Uploading files..."
UPLOAD=$(curl -sf -X POST "$BASE_URL/v1/audits/upload" \
  "${AUTH[@]}" \
  -F "land_file=@$LAND_FILE" \
  -F "estate_file=@$ESTATE_FILE")
TASK_ID=$(echo "$UPLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['task_id'])")
[[ -n "$TASK_ID" ]] && ok "Task created: $TASK_ID" || fail "Upload failed: $UPLOAD"

# ── 2. Poll until completed ───────────────────────────────────────────────────
info "Waiting for task to complete..."
STATUS=""
for i in $(seq 1 60); do
  TASK=$(curl -sf "$BASE_URL/v1/tasks/$TASK_ID" "${AUTH[@]}")
  STATUS=$(echo "$TASK" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
  if [[ "$STATUS" == "COMPLETED" ]]; then
    ok "Task completed"
    echo "$TASK" | python3 -c "
import sys, json
s = json.load(sys.stdin)['data'].get('stats', {})
print(f'  land={s.get(\"total_land\",0)}  estate={s.get(\"total_estate\",0)}  matched={s.get(\"matched\",0)}  discrepancies={s.get(\"discrepancies_count\",0)}')
"
    break
  elif [[ "$STATUS" == "FAILED" ]]; then
    fail "Task failed: $TASK"
  fi
  echo "  status=$STATUS (attempt $i/60)..."
  sleep 3
done
[[ "$STATUS" == "COMPLETED" ]] || fail "Task did not complete in time"

# ── 3. Results (page 1) ───────────────────────────────────────────────────────
info "Fetching results (page 1)..."
RESULTS=$(curl -sf "$BASE_URL/v1/tasks/$TASK_ID/results?page=1&page_size=5" "${AUTH[@]}")
TOTAL=$(echo "$RESULTS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['total'])")
ok "Results total=$TOTAL"
echo "$RESULTS" | python3 -c "
import sys, json
for d in json.load(sys.stdin)['data']['items'][:3]:
    print(f'  [{d[\"id\"]}] {d[\"rule_code\"]} | {d[\"severity\"]} | score={d[\"risk_score\"]} | {d[\"owner_name\"]}')
"

# ── 4. HIGH severity filter ───────────────────────────────────────────────────
info "Fetching HIGH severity results..."
HIGH=$(curl -sf "$BASE_URL/v1/tasks/$TASK_ID/results?severity=HIGH&page=1&page_size=5" "${AUTH[@]}")
HIGH_TOTAL=$(echo "$HIGH" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['total'])")
ok "HIGH severity total=$HIGH_TOTAL"

# ── 5. Summary ────────────────────────────────────────────────────────────────
info "Fetching summary..."
SUMMARY=$(curl -sf "$BASE_URL/v1/tasks/$TASK_ID/results/summary" "${AUTH[@]}")
ok "Summary:"
echo "$SUMMARY" | python3 -c "
import sys, json
s = json.load(sys.stdin)['data']
print(f'  total={s[\"total_count\"]}')
print(f'  by_severity={s[\"by_severity\"]}')
print(f'  by_rule={s[\"by_rule\"]}')
"

# ── 6. Single discrepancy ─────────────────────────────────────────────────────
info "Fetching single discrepancy..."
FIRST_ID=$(echo "$RESULTS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['items'][0]['id'])")
DISC=$(curl -sf "$BASE_URL/v1/tasks/$TASK_ID/discrepancies/$FIRST_ID" "${AUTH[@]}")
ok "Discrepancy $FIRST_ID: $(echo "$DISC" | python3 -c "import sys,json; d=json.load(sys.stdin)['data']; print(d['rule_code'], d['severity'])")"

# ── 7. Update resolution status ───────────────────────────────────────────────
info "Updating resolution status to IN_REVIEW..."
PATCH=$(curl -sf -X PATCH "$BASE_URL/v1/tasks/$TASK_ID/discrepancies/$FIRST_ID" \
  "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"resolution_status":"IN_REVIEW"}')
ok "Resolution updated: $(echo "$PATCH" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['resolution_status'])")"

# ── 8. Persons risk list ──────────────────────────────────────────────────────
info "Fetching persons risk list..."
PERSONS=$(curl -sf "$BASE_URL/v1/tasks/$TASK_ID/persons?page=1&page_size=5" "${AUTH[@]}")
PERSONS_TOTAL=$(echo "$PERSONS" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['total'])")
ok "Persons total=$PERSONS_TOTAL"
echo "$PERSONS" | python3 -c "
import sys, json
for p in json.load(sys.stdin)['data']['items'][:3]:
    ml = p.get('ml_risk_score')
    ml_str = f'{ml:.3f}' if ml is not None else 'null'
    print(f'  {p[\"tax_id\"]} | {p[\"owner_name\"]} | score={p[\"total_risk_score\"]} | ml={ml_str}')
"

# ── 9. Export CSV ─────────────────────────────────────────────────────────────
info "Exporting CSV..."
EXPORT_FILE="/tmp/revela-export-$TASK_ID.csv"
curl -sf "$BASE_URL/v1/tasks/$TASK_ID/export" "${AUTH[@]}" -o "$EXPORT_FILE"
ok "CSV exported to $EXPORT_FILE ($(wc -l < "$EXPORT_FILE") lines)"

echo ""
echo -e "${GREEN}All tests passed.${NC}"
