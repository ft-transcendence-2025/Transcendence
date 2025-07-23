const hre = require("hardhat"); //package Hardhat R Environment

async function main() {
    const simpleStorage = await hre.ethers.deployContract("SimpleStorage");
    console.log("Deploying SimpleStorage...");
    await simpleStorage.waitForDeployment();
    console.log(`SimpleStorage deployed to: ${simpleStorage.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});