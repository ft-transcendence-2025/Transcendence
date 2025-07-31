const hre = require("hardhat"); //package Hardhat R Environment

/*async function main() {
    const counterTest = await hre.ethers.deployContract("CounterTest");
    console.log("Deploying counterTest...");
    await counterTest.waitForDeployment();
    console.log(`counterTest deployed to: ${counterTest.target}`);
}*/

/*async function main() {
    const pongGameLedger = await hre.ethers.deployContract("PongGameLedger");
    console.log("Deploying PongGameLedger...");
    await pongGameLedger.waitForDeployment();
    console.log(`PongGameLedger deployed to: ${pongGameLedger.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});*/

async function main() {
  console.log("🚀  Starting contract deployment to Avalanche local network...");
  //WHAT is the contractFactory?
  const PongGameLedger = await ethers.getContractFactory("PongGameLedger");

  console.log("📦  Deploying contract...");
  const pongGameLedger = await PongGameLedger.deploy();
  await pongGameLedger.waitForDeployment();

  console.log(`✅  Contract deployed to: ${pongGameLedger.address}`);
  console.log(`🔗  Transaction hash: ${pongGameLedger.deployTransaction.hash}`);
  //console.log("PongGameLedger deployed to:", await pongGameLedger.getAddress());

  //Verify deployment
  console.log("🔍  Verifying deployment...");
  const deployedCode = await hre.ethers.provider.getCode(pongGameLedger.address);
  if (deployedCode !== "0x") {
    console.log("✅  Contract successfully deployed and verified!");
  } else {
    console.log("❌  Contract deployment verification failed");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });