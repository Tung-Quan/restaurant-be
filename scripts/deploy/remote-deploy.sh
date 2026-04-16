#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${1:?APP_DIR is required}"
ARCHIVE_PATH="${2:?ARCHIVE_PATH is required}"
HEALTHCHECK_URL="${3:-}"

TIMESTAMP="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="${APP_DIR}/releases/${TIMESTAMP}"
CURRENT_LINK="${APP_DIR}/current"
SHARED_ENV="${APP_DIR}/shared/.env"

mkdir -p "${APP_DIR}/releases" "${APP_DIR}/shared"
rm -rf "${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}"

tar -xzf "${ARCHIVE_PATH}" -C "${RELEASE_DIR}"

cd "${RELEASE_DIR}"
npm ci --omit=dev

if [[ -f "${SHARED_ENV}" ]]; then
  cp "${SHARED_ENV}" "${RELEASE_DIR}/.env"
fi

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"
cd "${CURRENT_LINK}"
pm2 startOrReload ecosystem.config.cjs --env production
pm2 save

if [[ -n "${HEALTHCHECK_URL}" ]]; then
  bash scripts/deploy/healthcheck.sh "${HEALTHCHECK_URL}"
fi

find "${APP_DIR}/releases" -mindepth 1 -maxdepth 1 -type d | sort | head -n -5 | xargs -r rm -rf
rm -f "${ARCHIVE_PATH}"
