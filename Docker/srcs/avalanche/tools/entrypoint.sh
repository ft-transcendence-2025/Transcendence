#!/bin/bash
set -euo pipefail

# Variables
LOG_LEVEL="${LOG_LEVEL:-debug}"
PORT="${PORT:-:8080}"
GRPC_PORT="${GRPC_PORT:-:8081}"
TIMEOUT="${TIMEOUT:-30}"
N_NODES="${N_NODES:-5}"
AVALANCHEGO_PATH="${AVALANCHEGO_PATH:-/usr/local/bin/avalanchego}"
START_TIME=$(date +%s)
ATTEMPT=0

# Cleanup Function: Called on script exit to ensure a gracefull shutdown
cleanup() {
    echo "ℹ️  AvalancheGo Network Runner [INFO]: Shutting down..."
    if [ -n "$SERVER_PID" ]; then
        kill -TERM "$SERVER_PID" 2>/dev/null || true
    fi
    echo "👋  Avalanche Network Runner [INFO]: Shutdown complete."
}
trap cleanup SIGINT SIGTERM

# Start the ANR server in the background
echo "ℹ️  Avalanche Network Runner [INFO]: Starting the blockchain manager..."
avalanche-network-runner server --log-level "$LOG_LEVEL" --port="$PORT" --grpc-gateway-port="$GRPC_PORT" &
SERVER_PID=$!

# Wait for the server to start
echo "ℹ️  Avalanche Network Runner [INFO]: Waiting for the server to be ready..."
while ! nc -z localhost "${PORT#:}" 2>/dev/null; do
    echo "ℹ️  Avalanche Network Runner [INFO]: Attempt $ATTEMPT / 30..."
    ATTEMPT=$((ATTEMPT + 1))
    if [ $(($(date +%s) - START_TIME)) -ge $TIMEOUT ]; then
        echo "❌  Avalanche Network Runner [ERROR]: Server did not start within "$TIMEOUT" seconds."
        exit 1
    fi
    sleep 1
done
echo "✅  Avalanche Network Runner [SUCCESS]: Service ready!"

# Run the control start command with the correct path inside the container
echo "ℹ️  AvalancheGo Blockchain Nodes [INFO]: Starting the blockchain..."
if ! avalanche-network-runner control start --log-level "$LOG_LEVEL" --endpoint "localhost"$PORT"" \
        --number-of-nodes "$N_NODES" --avalanchego-path "$AVALANCHEGO_PATH"; then
    echo "❌  AvalancheGo Blockchain Nodes [ERROR]: Failed to start the blockchain."
    exit 1
fi
echo "✅  AvalancheGo Blockchain Nodes [INFO]: Blockchain ready!"

# Keep the container running by waiting for the background server process
wait "$SERVER_PID"