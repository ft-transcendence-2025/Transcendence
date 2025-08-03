#!/bin/bash
set -e

# Start the ANR server in the background
echo "ℹ️  Avalanche Network Runner [INFO]: Starting the blockchain manager..."
avalanche-network-runner server --log-level debug --port=":8080" --grpc-gateway-port=":8081" &

# Wait for the server to start (5 seconds should be sufficient for most cases)
echo "ℹ️  Avalanche Network Runner [INFO]: Waiting for the server to be ready..."
#sleep 5
timeout=30
start_time=$(date +%s)
attempt=0
while ! nc -z localhost 8080 2>/dev/null; do
    echo "ℹ️  Avalanche Network Runner [INFO]: Attempt $attempt / 30..."
    attempt=$((attempt + 1))
    if [ $(($(date +%s) - start_time)) -ge $timeout ]; then
        echo "❌  Avalanche Network Runner [ERROR]: Server did not start within $timeout seconds."
        exit 1
    fi
    sleep 1
done
echo "✅  Avalanche Network Runner [SUCCESS]: Service ready!"

# Run the control start command with the correct path inside the container
echo "ℹ️  AvalacheGo Blockchain Nodes [INFO]: Starting the blockchain..."
if ! avalanche-network-runner control start --log-level debug --endpoint "localhost:8080" --number-of-nodes 5 --avalanchego-path "/usr/local/bin/avalanchego"; then
    echo "❌  AvalacheGo Blockchain Nodes [ERROR]: Failed to start the blockchain."
    exit 1
fi
echo "✅  AvalancheGo Blockchain Nodes [INFO]: Blockchain ready!"

# Keep the container running by waiting for the background server process
wait