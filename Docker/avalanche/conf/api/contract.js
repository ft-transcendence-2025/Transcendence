const fs = require('fs');
const ethers = require('ethers');
const path = require('path');
require('dotenv').config();

const RPC_URL = process.env.NODE_IP || 'https://api.avax-test.network/ext/bc/C/rpc';
const CONTRACT_FOLDER = process.env.CONTRACT_FOLDER || '../avalanche-data/contract_address';
const ABI_PATH = path.join(__dirname, '../blockchain-management/artifacts/contracts/PongGameLedger.sol/PongGameLedger.json');

let provider, contractAddress, contractABI, contract;

function init() {
    const files = fs.readdirSync(CONTRACT_FOLDER);
    if (files.length === 0) throw new Error('No contract address found');
    const latestFile = files.sort().pop();
    contractAddress = fs.readFileSync(path.join(CONTRACT_FOLDER, latestFile), 'utf8').trim();

    const abiJson = JSON.parse(fs.readFileSync(ABI_PATH, 'utf8'));
    contractABI = abiJson.abi; 
    
    provider = new ethers.JsonRpcProvider(RPC_URL);

    contract = new ethers.Contract(contractAddress, contractABI, provider);
    console.log(`✅ Blockchain API [SUCCESS]: Initialized contract at ${contractAddress}`);
}

module.exports = { init, getContract: () => contract, getAddress: () => contractAddress };


