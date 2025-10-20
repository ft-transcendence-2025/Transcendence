#!/bin/bash
set -euo pipefail

# Variables
NODE_IP="${NODE_IP:-https://api.avax-test.network/ext/bc/C/rpc}"
AVALANCHE_NETWORK="${AVALANCHE_NETWORK:-fuji}"
MAX_ATTEMPTS=10
CONTRACT_FOLDER="${CONTRACT_FOLDER:-../avalanche-data/contract_address}"

if [ ! -f /run/secrets/avalanche_private_key ]; then
  echo "❌  Avalanche Service [ERROR]: Secret files are missing (Wallet from Fuji Tesnet address with AVAX funds)."
  echo "       ⚠️ Guide: <project_root_folder>/secrets/avalanche_private_key.txt"
  exit 1
fi

# Check connection and retry in failure case
echo "ℹ️  Avalanche Service [INFO]: Trying to connect with the Avalanche Fuji Testnet network..."
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    --max-time 15 \
    "$NODE_IP")
  if [[ $? -eq 0 ]] && echo "$RESPONSE" | grep -q '"result"'; then
      echo "✅ Avalanche Service [SUCCESS]: Connection successful."
      break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "ℹ️  Avalanche Service [INFO]: Attempt $ATTEMPT / $MAX_ATTEMPTS..."
  sleep 5
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌  Avalanche Service [ERROR]: Could not connect to the Avalanche Fuji Testnet network after $MAX_ATTEMPTS attempts."
  exit 1
fi

# Compile the contract (generating the binaries, readable by the blockchain and building the ABI, that list functions and events).
echo "ℹ️  Avalanche Service [INFO]: Compiling the contract..."
npx hardhat compile
echo "✅ Avalanche Service [SUCCESS]: Contract compiled."

# Check if contract address file already exists
if [ -n "$(ls -A "${CONTRACT_FOLDER}" 2>/dev/null)" ]; then
  echo "⚠️  Avalanche Service [INFO]: Contract already exists. Skipping deployment."
    CONTRACT_FILE=$(ls -1 "${CONTRACT_FOLDER}" | head -n 1)
    CONTRACT_FUJI_ADDRESS=$(cat "${CONTRACT_FOLDER}/${CONTRACT_FILE}")
    echo "       📍 Contract Address: $CONTRACT_FUJI_ADDRESS"
    echo "       📄 Contract Address saved to: ${CONTRACT_FOLDER}/${CONTRACT_FILE}"
    
    # Start the API server
    echo "ℹ️  Avalanche Service [INFO]: Starting the Fastify API..."
    node ../api-management/server.js
    exit 0
fi

# Deploy the contract assuring the correct log message was received
echo "ℹ️  Avalanche Service [INFO]: Trying to deploy the contract..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.js --network "$AVALANCHE_NETWORK" 2>&1)

if [[ $? -ne 0 ]]; then
    echo "❌  Avalanche Service [ERROR]: Contract was not deployed correctly."
    echo "$DEPLOY_OUTPUT"
    exit 1
else
    echo "✅ Avalanche Service [SUCCESS]: Contract perfectly deployed into the blockchain."
    CONTRACT_FUJI_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "PongGameLedger deployed to:" | awk -F 'deployed to: ' '{print $2}')
    echo "       📍 Contract Address: $CONTRACT_FUJI_ADDRESS"

    #Saving the contract address in a .txt file
    mkdir -p ${CONTRACT_FOLDER}
    TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
    echo "$CONTRACT_FUJI_ADDRESS" > "${CONTRACT_FOLDER}/contract_address_${TIMESTAMP}.txt"
    echo "       📄 Contract Address saved to: ${CONTRACT_FOLDER}/contract_address_${TIMESTAMP}.txt"
fi

# Keep the container running.
#tail -f /dev/null

# Start the API server
echo "ℹ️  Avalanche Service [INFO]: Starting the Fastify API..."
node ../api-management/server.js