import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("====================================================");
  console.log("Deploying MoodOracle contract...");
  console.log(`Deployer address: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} RITUAL`);
  console.log("====================================================");

  // Retrieve executor address from env
  const executorAddress = process.env.EXECUTOR_ADDRESS;
  if (!executorAddress || executorAddress === "0x0000000000000000000000000000000000000000" || !executorAddress.startsWith("0x")) {
    throw new Error("Please specify a valid EXECUTOR_ADDRESS in your .env file!");
  }
  console.log(`Configured TEE Executor: ${executorAddress}`);

  // 1. Deploy MoodOracle
  const MoodOracle = await ethers.getContractFactory("MoodOracle");
  const oracle = await MoodOracle.deploy(executorAddress);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log(`✔ MoodOracle deployed successfully to: ${oracleAddress}`);

  // 2. Fund the MoodOracle contract's balance in RitualWallet
  const ritualWalletAddress = await oracle.RITUAL_WALLET();
  console.log(`RitualWallet address: ${ritualWalletAddress}`);
  
  const depositAmount = ethers.parseEther("5.0"); // 5 RITUAL tokens for inference fees
  console.log(`Funding MoodOracle inside RitualWallet with ${ethers.formatEther(depositAmount)} RITUAL...`);
  
  // Create contract instance for RitualWallet
  const ritualWallet = await ethers.getContractAt(
    ["function depositFor(address user, uint256 lockDuration) payable"],
    ritualWalletAddress
  );
  
  // Deposit and lock for 10000 blocks
  const depositTx = await ritualWallet.depositFor(oracleAddress, 10000, {
    value: depositAmount
  });
  await depositTx.wait();
  console.log("✔ RitualWallet funded successfully.");

  // 3. Approve the Scheduler
  console.log("Approving the Scheduler contract...");
  const approveTx = await oracle.approveScheduler();
  await approveTx.wait();
  console.log("✔ Scheduler approved successfully.");

  // 4. Schedule updates (frequency = 100 blocks, number of calls = 1000)
  const frequency = 100;
  const numCalls = 1000;
  console.log(`Scheduling recurring jobs: every ${frequency} blocks, for ${numCalls} total runs...`);
  const scheduleTx = await oracle.scheduleUpdates(frequency, numCalls);
  await scheduleTx.wait();
  
  // Parse jobId from state
  const jobId = await oracle.activeJobId();
  console.log(`✔ Recurring job successfully scheduled! Active Job ID: ${jobId}`);
  console.log("====================================================");
  console.log("Deployment and initialization completed successfully!");
  console.log("====================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
