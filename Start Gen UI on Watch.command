#!/bin/zsh

cd "$(dirname "$0")" || exit 1

node_bin="$(command -v node 2>/dev/null)"
if [[ -z "$node_bin" && -x "/Users/peiqitang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node" ]]; then
  node_bin="/Users/peiqitang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi

if [[ -z "$node_bin" ]]; then
  osascript -e 'display alert "Node.js is needed" message "Install Node.js, then try starting Gen UI on Watch again."'
  exit 1
fi

if ! lsof -nP -iTCP:8787 -sTCP:LISTEN >/dev/null 2>&1; then
  "$node_bin" scripts/server.mjs &
  server_pid=$!
  trap 'kill "$server_pid" 2>/dev/null' EXIT INT TERM

  until curl -fsS http://127.0.0.1:8787/ >/dev/null 2>&1; do
    sleep 0.2
  done
fi

open http://127.0.0.1:8787/
echo "Gen UI on Watch is running. Leave this Terminal window open while you use it."
wait "$server_pid" 2>/dev/null
