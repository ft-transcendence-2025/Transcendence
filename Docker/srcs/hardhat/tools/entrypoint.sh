#!/bin/bash
set -euo pipefail

# Variables
NODE_IP="${NODE_IP:-https://api.avax-test.network/ext/bc/C/rpc}"
HARDHAT_NETWORK="${HARDHAT_NETWORK:-fuji}"
MAX_ATTEMPTS=10

echo "ℹ️ℹ️ℹ️ℹ️ℹ️  Hardhat Service [DEBUG]: PRIVATE_KEY is: $PRIVATE_KEY"

# Check connection and retry in failure case
echo "ℹ️  Hardhat Service [INFO]: Trying to connect with the Avalanche Fuji Testnet network..."
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    --max-time 15 \
    "$NODE_IP")
  if [[ $? -eq 0 ]] && echo "$response" | grep -q '"result"'; then
      echo "✅ Hardhat Service [SUCCESS]: Connection successful."
      break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "ℹ️  Hardhat Service [INFO]: Attempt $ATTEMPT / $MAX_ATTEMPTS..."
  sleep 5
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌  Hardhat Service [ERROR]: Could not connect to the Avalanche Fuji Testnet network after $MAX_ATTEMPTS attempts."
  exit 1
fi

# Deploy the contract assuring the correct log message was received
echo "ℹ️  Hardhat Service [INFO]: Trying to deploy the contract..."
deploy_output=$(npx hardhat run scripts/deploy.js --network "$HARDHAT_NETWORK" 2>&1)

if [[ $? -ne 0 ]]; then
    echo "❌  Hardhat Service [ERROR]: Contract was not deployed correctly."
    echo "$deploy_output"
    exit 1
else
    echo "✅ Hardhat Service [SUCCESS]: Contract perfectly deployed into the blockchain."
    contract_address=$(echo "$deploy_output" | grep "PongGameLedger deployed to:" | awk -F 'deployed to: ' '{print $2}')
    echo "       📍 Contract Address: $contract_address"

    #Saving the contract address in a .txt file
    # mkdir -p contract_address
    # timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
    # echo "$contract_address" > "contract_address/contract_address_${timestamp}.txt"
    # echo "       📄 Contract Address saved to: contract_address/contract_address_${timestamp}.txt"
fi

# Keep the container running.
tail -f /dev/null