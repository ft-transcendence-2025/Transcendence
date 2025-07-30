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
  const PongGameLedger = await ethers.getContractFactory("PongGameLedger");
  const pongGameLedger = await PongGameLedger.deploy();
  await pongGameLedger.waitForDeployment();
  console.log("PongGameLedger deployed to:", await pongGameLedger.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});