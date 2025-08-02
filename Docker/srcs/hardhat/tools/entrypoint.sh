#!/bin/bash
set -e

# Check if the hardhat container can connect with the avalanche local node service
echo "ℹ️  Hardhat Service [INFO]: Trying to connect with the local network..."
response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  http://172.18.0.2:9650/ext/bc/C/rpc)

if [[ $? -ne 0 ]] || ! echo "$response" | grep -q '"result"'; then
    echo "❌  Hardhat Service [ERROR]: Could not connect to the local network or invalid response."
    exit 1
else
    echo "✅ Hardhat Service [SUCCESS]: Connection successful."
fi


# Deploy the contract assuring the correct log message was received
echo "ℹ️  Hardhat Service [INFO]: Trying to deploy the contract..."

# I MUST KEEP THE NETWORK NAME AS AN ENV
deploy_output=$(npx hardhat run scripts/deploy.js --network avalanche_local_ip 2>&1)

if [[ $? -ne 0 ]]; then
    echo "❌  Hardhat Service [ERROR]: Contract was not deployed correctly."
    echo "$deploy_output"
    exit 1
else
    echo "✅ Hardhat Service [SUCCESS]: Contract perfectly deployed into the blockchain."
    contract_address=$(echo "$deploy_output" | grep "PongGameLedger deployed to:" | awk -F 'deployed to: ' '{print $2}')
    echo "       📍 Contract Address: $contract_address"

    # Saving the contract address as a secret
    # CONTRACT_ADDRESS="$contract_address"
    # echo "$contract_address" > secret_address/contract_address.txt
fi

# Keep the container running.
tail -f /dev/null