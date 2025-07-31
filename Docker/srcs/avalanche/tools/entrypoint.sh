#!/bin/bash
set -e

# Start the ANR server in the background
echo "ℹ️  Avalache Network Runner [INFO]: Starting the blockchain manager..."
avalanche-network-runner server --log-level debug --port=":8080" --grpc-gateway-port=":8081" &

# Wait for the server to start (5 seconds should be sufficient for most cases)
sleep 5
echo "✅  Avalache Network Runner [SUCCESS]: Service ready!"

# Run the control start command with the correct path inside the container
echo "ℹ️  AvalacheGo Blockchain Nodes [INFO]: Starting the blockchain..."
avalanche-network-runner control start --log-level debug --endpoint "localhost:8080" --number-of-nodes 5 --avalanchego-path "/usr/local/bin/avalanchego"
echo "✅  AvalacheGo Blockchain Nodes [INFO]: Blockchain ready!"

# Keep the container running by waiting for the background server process
wait