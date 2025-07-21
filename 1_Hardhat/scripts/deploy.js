const hre = require("hardhat"); //package Hardhat R Environment

async function main() {
    const lockedAmount = hre.ethers.parseEther("0.001"); //eth -> Wei (medida de uso de eth por smartcontracts 1 = 1*10^18)
    const lock = await hre.ethers.deployContract("CounterTest");
    await lock.waitForDeployment();
    console.log("Deploying CounterTest");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});