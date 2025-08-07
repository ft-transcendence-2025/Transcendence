# Avalanche Smart Contract Deployment

This project provides a Dockerized environment for deploying and managing smart contracts on the Avalanche Fuji Testnet using Hardhat.

## Project Structure

```
Docker/
├── .env
├── docker-compose.yml
├── avalanche/
│   ├── Dockerfile
│   ├── conf/
│   │   ├── hardhat.config.js
│   │   ├── package.json
│   │   ├── contracts/
│   │   │   └── PongGameLedger.sol
│   │   └── scripts/
│   │       └── deploy.js
│   └── tools/
│       └── entrypoint.sh
└── secrets/
    └── avalanche_private_key.txt
```


# ft_transcendence Blockchain Module

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub stars](https://img.shields.io/github/stars/ft-transcendence-2025/Blockchain.svg)
![GitHub issues](https://img.shields.io/github/issues/ft-transcendence-2025/Blockchain.svg)

## Description

The `Blockchain` module of the `ft_transcendence` project integrates a Solidity smart contract, `PongGameLedger`, with the Avalanche blockchain's Fuji testnet to manage tournament match data for a Pong game. This module leverages Docker for containerized deployment and Hardhat for smart contract development and deployment.

### Key Features
- **Smart Contract**: `PongGameLedger` manages match creation and retrieval, storing data like player IDs, scores, and timestamps.
- **Blockchain Network**: Deploys to Avalanche Fuji testnet for decentralized, secure data storage.
- **Containerization**: Uses Docker and Docker Compose for consistent setup and deployment.
- **Automation**: Includes an entrypoint script to verify network connectivity and deploy the contract.

## Prerequisites

To set up and run this module, you’ll need:
- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Node.js** (version 18.x or higher, for local development)
- **Git** (to clone the repository)
- **Avalanche Wallet**: A funded wallet on the Fuji testnet with AVAX for deployment (private key required)

## Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ft-transcendence-2025/Blockchain.git
cd Blockchain/Docker
```

### 2. Configure Secrets
- Create a `secrets` directory and add your Fuji testnet private key:
  ```bash
  mkdir -p secrets
  echo "your_private_key_here" > secrets/avalanche_private_key.txt
  ```
- Ensure the private key file is mounted as a secret in `docker-compose.yml`.

### 3. Build and Run the Container
```bash
docker-compose up --build
```
This builds the Docker image, starts the `avalanche` service, and executes the `entrypoint.sh` script to deploy the contract.

## Deployment

The `entrypoint.sh` script automates deployment:
- **Connection Check**: Verifies connectivity to the Fuji testnet (up to 10 attempts).
- **Contract Deployment**: Deploys `PongGameLedger` if no contract address exists in `avalanche-data/contract_address`.
- **Output**: Saves the contract address to a timestamped file (e.g., `contract_address_2023-10-15_12-00-00.txt`).

To manually deploy:
1. Access the container:
   ```bash
   docker exec -it avalanche /bin/bash
   ```
2. Run the deployment:
   ```bash
   npx hardhat run scripts/deploy.js --network fuji
   ```

## Usage

### Interacting with the Contract
Use Hardhat or a Web3 tool to interact with `PongGameLedger`. Examples:

#### Create a Match (Owner Only)
```javascript
const PongGameLedger = await ethers.getContractAt("PongGameLedger", "contract_address_here");
await PongGameLedger.newMatch(1, 1001, 1002, 10, 5, 1001, 1630000000, 1630003600);
```
- Parameters: `tournamentId`, `player1`, `player2`, `score1`, `score2`, `winner`, `startTime`, `endTime`.

#### Retrieve Match Data
- **By Tournament and Match ID**:
  ```javascript
  const match = await PongGameLedger.getMatch(1, 0);
  console.log(match);
  ```
- **All Matches in a Tournament**:
  ```javascript
  const matches = await PongGameLedger.getMatchesByTournament(1);
  ```
- **All Matches by Player**:
  ```javascript
  const playerMatches = await PongGameLedger.getMatchesByPlayer(1001);
  ```

### Monitoring
- Check service status:
  ```bash
  docker-compose ps
  ```
- View logs:
  ```bash
  docker-compose logs -f avalanche
  ```

## Configuration

### Environment Variables
Set these in the `entrypoint.sh` or Docker environment:
- `NODE_IP`: Avalanche node URL (default: `https://api.avax-test.network/ext/bc/C/rpc`)
- `AVALANCHE_NETWORK`: Network name (default: `fuji`)
- `CONTRACT_FOLDER`: Directory for contract address (default: `avalanche-data/contract_address`)

### Hardhat Configuration
Edit `hardhat.config.js` to adjust:
- **Networks**: `hardhat`, `avalanche_local_ip`, `fuji`
- **Solidity Version**: `0.8.28`

## Contributing

1. Fork the repository.
2. Create a branch (`git checkout -b feature-branch`).
3. Commit changes (`git commit -m 'Add feature'`).
4. Push (`git push origin feature-branch`).
5. Open a pull request.

## Troubleshooting

- **Connection Failed**: Verify `NODE_IP` and network availability.
- **Deployment Error**: Ensure the wallet has AVAX and the private key is correct in `secrets/avalanche_private_key.txt`.
- **Secrets:** The `secrets/` folder is ignored by git. Never commit your private key.
- **Contract Address:** The deployed contract address is saved in the container volume and printed in the logs.
- **Customization:** You can modify the contract or deployment script in `avalanche/conf/contracts/` and `avalanche/conf/scripts/`.
- **Contract Skipped**: Delete the address file in `avalanche-data/contract_address` to redeploy.

## Troubleshooting

- If you see an error about missing secrets, ensure `secrets/avalanche_private_key.txt` exists and contains your key.
- If connection to Fuji Testnet fails, check your internet connection and the `NODE_IP` variable.

## License

Licensed under the [MIT License](LICENSE).
