# ft_transcendence Blockchain Module

![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)

## Description

The `Blockchain` module of the `ft_transcendence` project integrates a Solidity smart contract, `PongGameLedger`, with the Avalanche blockchain's Fuji testnet to manage tournament match data for a Pong game. This module leverages Docker for containerized deployment and Hardhat for smart contract development and deployment.

### Key Features
- **Smart Contract**: `PongGameLedger` manages match creation and retrieval, storing data like player IDs, scores, and timestamps.
- **Blockchain Network**: Deploys to Avalanche Fuji testnet for decentralized, secure data storage.
- **Containerization**: Uses Docker and Docker Compose for consistent setup and deployment.
- **Automation**: Includes an entrypoint script to verify network connectivity and deploy the contract.

## Project Structure

```
Docker/
├── .env
├── docker-compose.yml
├── avalanche/
│   ├── Dockerfile
│   ├── conf/
|   |   ├── api/
│   │   │   ├── server.js
│   │   |   ├── integrations/
│   │   │   |   └── contract.js
│   │   |   ├── routes/
│   │   │   │   ├── matches.js
│   │   │   │   ├── players.js
│   │   │   |   └── tournaments.js
│   │   |   └── schemas/
│   │   │       └── matchSchemas.js
|   |   └── blockchain/
│   │       ├── hardhat.config.js
│   │       ├── package.json
│   │       ├── package-lock.json
│   │       ├── contracts/
│   │       |   └── PongGameLedger.sol
│   │       └── scripts/
│   │           └── deploy.js
│   └── tools/
│       └── entrypoint.sh
└── secrets/
    └── avalanche_private_key.txt
```

## Prerequisites

To set up and run this module, you’ll need:
- **Docker** (version 20.10 or higher) - [Installation Guide](https://docs.docker.com/get-docker/)
- **Docker Compose** (version 2.0 or higher) - [Installation Guide](https://docs.docker.com/compose/install/)
- **Node.js** (version 18.x or higher, for local development) - [Installation Guide](https://nodejs.org/en/download/package-manager)
- **Git** (to clone the repository) - [Installation Guide](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- **Avalanche Wallet**: A funded wallet on the Fuji testnet with AVAX for deployment (private key required) - [Setup Guide](https://support.avax.network/en/articles/4626956-how-do-i-set-up-the-avalanche-wallet)

## Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ft-transcendence-2025/Blockchain.git
cd Blockchain/Docker
```

### 2. Configure Secrets
- Create a `secrets` directory inside the `Docker` directory and add your Fuji testnet private key:
  ```bash
  mkdir -p secrets
  echo "your_private_key_here" > secrets/avalanche_private_key.txt
  ```
- **Important**: Never commit your private key to version control. The `secrets/` folder is ignored by git.
- Ensure the private key file is mounted as a secret in `docker-compose.yml`.

### 3. Build and Run the Container
```bash
docker-compose up --build
```
This builds the Docker image, starts the `avalanche` service, and executes the `entrypoint.sh` script to deploy the contract.


## Match object schema
#### Fields used in API requests and responses
| Field | Type & format | Required | Description |
|-----------|----------------------------|-------------|------------------|
| **tournamentId** | string (numeric) | yes | Tournament identifier the match belongs to. |
| **matchId** | string (numeric, /^\d+$/) | server-assigned | Match identifier or index within the tournament. |
| **player1** | string (numeric, /^\d+$/) | yes | Player 1 ID. |
| **player2** | string (numeric, /^\d+$/) | yes | Player 2 ID. |
| **score1** | string (numeric, /^\d+$/) | yes | Score for player1 (non-negative integer). |
| **score2** | string (numeric, /^\d+$/) | yes | Score for player2 (non-negative integer). |
| **winner** | string (numeric, /^\d+$/) | yes | ID of the winning player (must equal player1 or player2). |
| **startTime** | string (unix seconds, e.g. "1630000000") | yes | Match start time as Unix timestamp (seconds). |
| **endTime** | string (unix seconds, e.g. "1630003600") | yes | Match end time as Unix timestamp (seconds). |
| **remoteMatch** | boolean | yes | True if the match was played remotely, false if in-person. |

- **Validation rules**:
     * All numeric strings must match /^\d+$/ (only digits).
     * Player1 and player2 must be different (player1 !== player2).
     * Winner must equal either player1 or player2.
     * startTime ≤ endTime (startTime must not be greater than endTime).
     * Score1 and score2 must be non-negative integers (as numeric strings).
     * Permissions: creating matches is owner-only (see POST /matches).


## Server API
This service exposes a small Fastify HTTP API that wraps the deployed PongGameLedger contract. All endpoints are served by the avalanche container and listen on port 3000 by default.
Base URL: http://localhost:3000 (when running via docker-compose)

### 1. Endpoints

#### POST /matches
- **Purpose**: Create a new match on-chain (owner-only — the signer in the container must be the contract owner).
- **Method**: POST
     * Content-type: application/json
- **Request body (application/json)**:
    ```json
    {
        "tournamentId": "1",
        "player1": "1001",
        "player2": "1002",
        "score1": "10",
        "score2": "5",
        "winner": "1001",
        "startTime": "1630000000",
        "endTime": "1630003600",
        "remoteMatch": true
    }    
    ```
- **Success response**: 200 OK
    ```json
    {
        "txHash": "0xabcdef...123456",
        "message": "Match created"
    }    
    ```
- **Errors**:
     * 400 Bad Request - validation errors (missing or invalid fields). (body: ``` { "error": "tournamentId must be a numeric string" } ```).
     * 500 Internal Server Error - blockchain/contract access error (body: ``` { "error": "message" } ```).
       
- **Request Example**:
    ```bash
    curl -sS -X POST http://localhost:3000/matches 
    -H "Content-Type: application/json" 
    -d '{ "tournamentId":"1", "player1":"1001", "player2":"1002", "score1":"10", "score2":"5", "winner":"1001", "startTime":"1630000000", "endTime":"1630003600", "remoteMatch":true }'
    ```

#### GET /health
- **Purpose**: Return a message that the API is running correctly.
- **Method**: GET
- **Path params**: none
- **Success response**: 200 OK
    ```json
    {
        "status": "healthy",
        "message": "API is running"
    }    
    ```
- **Errors**:
     * 500 Internal Server Error - file read or filesystem access error (body: ``` { "error": "message" } ```).
       
- **Request Example**:
    ```bash
    curl -sS http://localhost:3000/health
    ```


#### GET /contract/address
- **Purpose**: Return the contract address currently used by the API (reads the latest file in the contract_address folder).
- **Method**: GET
- **Path params**: none
- **Success response**: 200 OK
    ```json
    {
        "address": "0x1234567890abcdef1234567890abcdef12345678"
    }    
    ```
- **Errors**:
     * 500 Internal Server Error - file read or filesystem access error (body: ``` { "error": "message" } ```).
       
- **Request Example**:
    ```bash
    curl -sS http://localhost:3000/contract/address
    ```



#### GET /players/:playerId/matches
- **Purpose**: Fetch all matches involving a player.
- **Method**: GET
- **Path params**:
    * **playerId**: numeric string
- **Success response**: 200 OK
    ```json
    {
      "count": 2,
      "matches": [
        {
          "tournamentId": "87",
          "matchId": "0",
          "player1": "10",
          "player2": "12",
          "score1": "10",
          "score2": "70",
          "winner": "10",
          "startTime": "10",
          "endTime": "600",
          "remoteMatch": true
        },
        {
          "tournamentId": "99",
          "matchId": "0",
          "player1": "10",
          "player2": "21",
          "score1": "10",
          "score2": "70",
          "winner": "10",
          "startTime": "10",
          "endTime": "600",
          "remoteMatch": false
        }
      ]
  } 
    ```
- **Errors**:
     * 400 Bad Request - invalid/non-numeric path parameters.
     * 404 Not Found - no matches found for the given playerId.
     * 500 Internal Server Error - blockchain/contract access error (body: ``` { "error": "message" } ```).
       
- **Request Example**:
    ```bash
    curl -sS http://localhost:3000/players/10/matches
    ```
  

#### GET /tournaments/:tournamentId/matchCount
- **Purpose**: Return the number of matches recorded for a tournament.
- **Method**: GET
- **Path params**:
    * **tournamentId**: numeric string
- **Success response**: 200 OK
    ```json
    {
      "count": "2"
    }    
    ```
- **Errors**:
     * 400 Bad Request - invalid/non-numeric path parameters.
     * 500 Internal Server Error - blockchain/contract access error (body: ``` { "error": "message" } ```).
       
- **Request Example**:
    ```bash
    curl -sS http://localhost:3000/tournaments/1/matchCount
    ```





#### GET /tournaments/:tournamentId/matches
- **Purpose**: Return an array with all matches for a tournament.
- **Method**: GET
- **Path params**:
    * **tournamentId**: numeric string
- **Success response**: 200 OK
    ```json
    {
      "matches": [
            {
                "tournamentId": "1",
                "matchId": "0",
                "player1": "1001",
                "player2": "1002",
                "score1": "10",
                "score2": "5",
                "winner": "1001",
                "startTime": "1630000000",
                "endTime": "1630003600",
                "remoteMatch": true
            },
            {
                "tournamentId": "1",
                "matchId": "1",
                "player1": "1003",
                "player2": "1004",
                "score1": "7",
                "score2": "9",
                "winner": "1004",
                "startTime": "1630007200",
                "endTime": "1630018000",
                "remoteMatch": false
            }
        // ...additional match objects
        ]
    }
    ```
- **Errors**:
     * 400 Bad Request - invalid/non-numeric path parameters.
     * 404 Not Found - no match found for the given tournamentId.
     * 500 Internal Server Error - blockchain/contract access error (body: ``` { "error": "message" } ```).
       
- **Request Example**:
    ```bash
    curl -sS http://localhost:3000/tournaments/1/matches
    ```

#### GET /tournaments/:tournamentId/matches/:matchId
- **Purpose**: Return a single match by tournament ID and match ID.
- **Method**: GET
- **Path params**:
    * **tournamentId**: numeric string
    * **matchId**: numeric string
- **Success response**: 200 OK
    ```json
    {
      "match": {
        "tournamentId": "1",
        "matchId": "0",
        "player1": "1001",
        "player2": "1002",
        "score1": "10",
        "score2": "5",
        "winner": "1001",
        "startTime": "1630000000",
        "endTime": "1630003600",
        "remoteMatch": true
      }
    }
    
    ```
- **Errors**:
     * 400 Bad Request - invalid/non-numeric path parameters.
     * 404 Not Found - no match found for a given tournamentId/matchId.
     * 500 Internal Server Error - blockchain/contract access error (body: ``` { "error": "message" } ```).
       
- **Request Example**:
    ```bash
    curl -sS http://localhost:3000/tournaments/1/matches/0
    ```




## Deployment

The `entrypoint.sh` script automates the deployment process:
- **Connection Check**: Verifies connectivity to the Fuji testnet (up to 10 attempts).
- **Contract Deployment**: Deploys `PongGameLedger` if no contract address exists in `avalanche-data/contract_address`.
- **Output**: Saves the contract address to a timestamped file (e.g., `contract_address_2023-10-15_12-00-00.txt`) and prints it in the logs.

To manually deploy:
1. Access the container:
   ```bash
   docker exec -it avalanche /bin/bash
   ```
2. Run the deployment:
   ```bash
   npx hardhat run scripts/deploy.js --network fuji
   ```
- **Note**: Check the container logs or the `avalanche-data/contract_address` directory for the deployed contract address.

## Usage

### Interacting with the Contract
Use Hardhat or a Web3 tool to interact with `PongGameLedger`. Below are examples of common operations:

#### Create a Match (Owner Only)
- **Function**: `newMatch` - Records a new match's details on the blockchain.
- **Example**:
  ```javascript
  const PongGameLedger = await ethers.getContractAt("PongGameLedger", "contract_address_here");
  await PongGameLedger.newMatch(1, 1001, 1002, 10, 5, 1001, 1630000000, 1630003600, true);
  ```
- **Parameters**: `tournamentId`, `player1`, `player2`, `score1`, `score2`, `winner`, `startTime`, `endTime`, `remoteMatch`.

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
- View logs (look for deployment status and contract address):
  ```bash
  docker-compose logs -f avalanche
  ```

## Configuration

### Environment Variables
Set these in the `entrypoint.sh` script or via Docker environment variables:
- `NODE_IP`: Avalanche node URL (default: `https://api.avax-test.network/ext/bc/C/rpc`)
- `AVALANCHE_NETWORK`: Network name (default: `fuji`)
- `CONTRACT_FOLDER`: Directory for contract address (default: `avalanche-data/contract_address`)

To customize, edit `entrypoint.sh` or pass variables in `docker-compose.yml`.

### Hardhat Configuration
Edit `hardhat.config.js` to adjust:
- **Networks**: `hardhat`, `avalanche_local_ip`, `fuji`
- **Solidity Version**: `0.8.28`
- **Purpose**: Modify this file to change the Solidity version or add new network configurations.

## Contributing

1. Fork the repository.
2. Create a branch (`git checkout -b feature-branch`).
3. Commit changes (`git commit -m 'Add feature'`).
4. Push (`git push origin feature-branch`).
5. Open a pull request.

## Troubleshooting

- **Connection Failed**:
  - Verify `NODE_IP` and ensure the network is available.
  - Try a different node URL if necessary.
- **Deployment Error**:
  - Ensure your wallet has sufficient AVAX for gas fees.
  - Verify the private key in `secrets/avalanche_private_key.txt` is correct.
- **Secret Missing**:
  - Ensure `secrets/avalanche_private_key.txt` exists and contains your key.
  - Check the Docker secret configuration in `docker-compose.yml28/compose.yml`.
- **Contract Skipped**:
  - If a contract address exists in `avalanche-data/contract_address`, deployment is skipped.
  - To redeploy, delete the address file in `avalanche-data/contract_address`.
- **Finding Contract Address**:
  - The deployed contract address is saved in a timestamped file in `avalanche-data/contract_address` and printed in the container logs.
- **Customization**:
  - Modify the contract or deployment script in `avalanche/conf/contracts/` and `avalanche/conf/scripts/`.

## License

Licensed under the [MIT License](LICENSE).
