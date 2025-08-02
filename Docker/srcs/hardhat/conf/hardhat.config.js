require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337 //entender isso aqiu
    },
    avalanche_local: {
      url: "http://avalanche-container:9650/ext/bc/C/rpc", // C-Chain RPC endpoint
      chainId: 43112, // Local network chain ID
      accounts: [
        // Use the pre-funded account from local network
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027",
        "0x7b4198529994b0dc604278c99d153cfd888db9cd0d6c46aca6d6b5a3e2b4e44e",
        "0x15614556be13730e9e8d6eacc1603143e7b96987429df8726384c2ec4502ef6e"
      ],
      gasPrice: 25000000000, // 25 gwei
      gas: 8000000
    },
    avalanche_local_ip: {
      url: "http://172.18.0.2:9650/ext/bc/C/rpc", // Replace with actual container IP
      chainId: 43112,
      accounts: [
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
      ]
    }
    
    /*localAvalanche:  {
      url: "http://localhost:9650/ext/bc/C/rpc",
      chainId: 43112,
      accounts: [
        "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
      ],
      timeout: 60000
    }*/
  },
};
