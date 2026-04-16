#!/usr/bin/env bash

set -euo pipefail

HEALTHCHECK_URL="${1:?HEALTHCHECK_URL is required}"
MAX_RETRIES="${2:-10}"
SLEEP_SECONDS="${3:-5}"

for attempt in $(seq 1 "${MAX_RETRIES}"); do
  if curl --fail --silent --show-error "${HEALTHCHECK_URL}" > /dev/null; then
    echo "Healthcheck passed on attempt ${attempt}"
    exit 0
  fi

  echo "Healthcheck attempt ${attempt}/${MAX_RETRIES} failed"
  sleep "${SLEEP_SECONDS}"
done

echo "Healthcheck failed after ${MAX_RETRIES} attempts" >&2
exit 1
