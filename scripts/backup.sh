#!/bin/bash
# Database backup script — run daily via cron
# Usage: ./scripts/backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/retentio_backup_${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"

echo "Starting database backup..."

# If running in Docker
if docker ps | grep -q retentio-db; then
  docker exec retentio-db pg_dump -U retentio retentio_db > "${BACKUP_FILE}"
else
  # Direct connection
  pg_dump "${DATABASE_URL}" > "${BACKUP_FILE}"
fi

# Compress
gzip "${BACKUP_FILE}"

# Delete backups older than 7 days
find "${BACKUP_DIR}" -name "*.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
