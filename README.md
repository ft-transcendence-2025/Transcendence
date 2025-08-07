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

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <project_root_folder>/Docker
   ```

2. **Add your Avalanche private key:**
   - Create the file: `Docker/secrets/avalanche_private_key.txt`
   - Paste your private key (no quotes, one line).

3. **(Optional) Configure environment variables:**
   - Edit `.env` if needed.

## Usage

### Build and Start the Avalanche Service

```bash
docker-compose up --build
```

- The service will:
  - Check for the secret file.
  - Connect to the Avalanche Fuji Testnet.
  - Deploy the `PongGameLedger` contract if not already deployed.
  - Save the contract address in the volume at `/app/avalanche-data/contract_address`.

### Stopping the Service

Press `Ctrl+C` in the terminal or run:

```bash
docker-compose down
```

## Notes

- **Secrets:** The `secrets/` folder is ignored by git. Never commit your private key.
- **Contract Address:** The deployed contract address is saved in the container volume and printed in the logs.
- **Customization:** You can modify the contract or deployment script in `avalanche/conf/contracts/` and `avalanche/conf/scripts/`.

## Troubleshooting

- If you see an error about missing secrets, ensure `secrets/avalanche_private_key.txt` exists and contains your key.
- If connection to Fuji Testnet fails, check your internet connection and the `NODE_IP` variable.

## License

MIT
