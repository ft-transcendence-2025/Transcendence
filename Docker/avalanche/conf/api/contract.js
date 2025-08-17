const fs = require('fs');
const ethers = require('ethers');
const path = require('path');
require('dotenv').config();

const RPC_URL = process.env.NODE_IP || 'https://api.avax-test.network/ext/bc/C/rpc';
const CONTRACT_FOLDER = process.env.CONTRACT_FOLDER || '../avalanche-data/contract_address';





