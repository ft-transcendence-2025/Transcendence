const hre = require("hardhat"); //package Hardhat R Environment

async function main() {
    const counterTest = await hre.ethers.deployContract("CounterTest");
    console.log("Deploying CounterTest...");
    await counterTest.waitForDeployment();
    console.log(`CounterTest deployed to: ${counterTest.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});