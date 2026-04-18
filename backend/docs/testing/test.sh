#!/bin/bash
set -e

BASE_URL="http://localhost:8080"
DATASET="/Users/admin/dev/projects/best-lviv-2026/dataset"

echo "=== 1. Upload files ==="
RESPONSE=$(curl -s -X POST "$BASE_URL/v1/audits/upload" \
  -F "land_file=@$DATASET/ДРРП земля.xlsx" \
  -F "estate_file=@$DATASET/ДРРП нерухомість.xlsx")
echo "$RESPONSE"

TASK_ID=$(echo "$RESPONSE" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TASK_ID" ]; then
  echo "ERROR: could not extract task_id"
  exit 1
fi
echo "Task ID: $TASK_ID"

echo ""
echo "=== 2. Polling task status ==="
for i in $(seq 1 30); do
  STATUS_RESPONSE=$(curl -s "$BASE_URL/v1/tasks/$TASK_ID")
  STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
  echo "  [$i] status: $STATUS"
  if [ "$STATUS" = "COMPLETED" ] || [ "$STATUS" = "FAILED" ]; then
    echo "$STATUS_RESPONSE"
    break
  fi
  sleep 2
done

echo ""
echo "=== 3. Summary ==="
curl -s "$BASE_URL/v1/tasks/$TASK_ID/results/summary" | python3 -m json.tool

echo ""
echo "=== 4. HIGH severity results (first 5) ==="
curl -s "$BASE_URL/v1/tasks/$TASK_ID/results?severity=HIGH&page=1&page_size=5" | python3 -m json.tool

echo ""
echo "=== 5. Export CSV ==="
curl -s "$BASE_URL/v1/tasks/$TASK_ID/export" -o /tmp/revela-export.csv
echo "Saved to /tmp/revela-export.csv ($(wc -l < /tmp/revela-export.csv) lines)"
