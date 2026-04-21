#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC2046
  export $(grep -v '^\s*#' .env | xargs)
  set +a
fi

trap 'kill 0' EXIT INT TERM

node --watch server.js &
npm run dev &

wait
