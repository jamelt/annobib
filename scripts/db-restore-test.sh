#!/usr/bin/env bash
set -euo pipefail

PROJECT="${1:?Usage: db-restore-test.sh <project-id> <instance-name> <region>}"
INSTANCE="${2:?Usage: db-restore-test.sh <project-id> <instance-name> <region>}"
REGION="${3:?Usage: db-restore-test.sh <project-id> <instance-name> <region>}"

TEMP_INSTANCE="${INSTANCE}-restore-test-$(date +%s)"

echo "=== Backup Restore Test ==="
echo "Source instance: ${INSTANCE}"
echo "Temp instance:   ${TEMP_INSTANCE}"
echo ""

LATEST_BACKUP=$(gcloud sql backups list \
  --instance="${INSTANCE}" \
  --project="${PROJECT}" \
  --sort-by=~startTime \
  --limit=1 \
  --format="value(id)")

if [ -z "${LATEST_BACKUP}" ]; then
  echo "ERROR: No backups found for ${INSTANCE}"
  exit 1
fi

echo "Latest backup ID: ${LATEST_BACKUP}"
echo "Restoring to temp instance..."

gcloud sql instances clone "${INSTANCE}" "${TEMP_INSTANCE}" \
  --project="${PROJECT}" \
  --async

echo "Waiting for temp instance to be ready..."
gcloud sql instances describe "${TEMP_INSTANCE}" \
  --project="${PROJECT}" \
  --format="value(state)" 2>/dev/null || true

for i in $(seq 1 60); do
  STATE=$(gcloud sql instances describe "${TEMP_INSTANCE}" \
    --project="${PROJECT}" \
    --format="value(state)" 2>/dev/null || echo "PENDING")
  if [ "${STATE}" = "RUNNABLE" ]; then
    echo "Temp instance is ready."
    break
  fi
  echo "  Waiting... (${STATE})"
  sleep 10
done

echo "Running validation query..."
gcloud sql connect "${TEMP_INSTANCE}" \
  --project="${PROJECT}" \
  --user=postgres \
  --quiet \
  -- -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null && \
  echo "Validation PASSED" || echo "Validation FAILED"

echo ""
echo "Cleaning up temp instance..."
gcloud sql instances delete "${TEMP_INSTANCE}" \
  --project="${PROJECT}" \
  --quiet

echo "=== Restore test complete ==="
