#!/usr/bin/env bash
set -euo pipefail

PROJECT="${1:?Usage: db-backup.sh <project-id> <instance-name>}"
INSTANCE="${2:?Usage: db-backup.sh <project-id> <instance-name>}"

echo "Triggering on-demand backup for ${INSTANCE} in ${PROJECT}..."
gcloud sql backups create \
  --instance="${INSTANCE}" \
  --project="${PROJECT}" \
  --async

echo "Backup triggered. Check status with:"
echo "  gcloud sql backups list --instance=${INSTANCE} --project=${PROJECT}"
