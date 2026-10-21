#!/bin/bash

# Configuration
DB_NAME="${DB_NAME:-beerenberg_db}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-rootpassword}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_DIR="$(dirname "$0")/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/beerenberg_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting MySQL backup for database: ${DB_NAME}..."

# Execute mysqldump
mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASS}" \
  --single-transaction \
  --routines \
  --triggers \
  "${DB_NAME}" > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
  echo "[$(date)] Backup successfully created: ${BACKUP_FILE}"
  
  # Compress backup file
  gzip "${BACKUP_FILE}"
  echo "[$(date)] Backup compressed: ${BACKUP_FILE}.gz"

  # Enforce 7-Year Retention Policy (Delete files older than 2555 days)
  echo "[$(date)] Cleaning up backups older than 7 years (2555 days)..."
  find "${BACKUP_DIR}" -type f -name "beerenberg_backup_*.sql.gz" -mtime +2555 -exec rm -f {} \;
  echo "[$(date)] Retention cleanup completed."
else
  echo "[$(date)] ERROR: Backup failed!" >&2
  exit 1
fi