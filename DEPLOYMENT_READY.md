# Mood Oracle: Deployment Guide

Welcome to the **Mood Oracle** deployment guide! This guide will walk you through setting up, compiling, testing, and deploying your autonomous AI agent oracle on the Ritual Chain (EVM Chain ID `1979`).

---

## 1. Project Folder Structure

This project is set up as an npm workspaces monorepo:

```text
Mood Oracle/
├── DEPLOYMENT_READY.md          <- This guide
├── package.json                 <- Root monorepo configuration
├── packages/
│   ├── contracts/               <- Smart contract development package
│   │   ├── contracts/           <- Duplicate directory for legacy paths
│   │   ├── src/                 <- Standard Solidity source directory
│   │   │   ├── MoodOracle.sol   <- Core oracle contract
│   │   │   └── interfaces/
│   │   │       ├── IRitualWallet.sol
│   │   │       ├── IScheduler.sol
│   │   │       └── ITEERegistry.sol
│   │   ├── scripts/
│   │   │   └── deploy.ts        <- Ethers v6 deployment script
│   │   ├── test/
│   │   │   ├── MoodOracle.t.sol   <- Foundry tests
│   │   │   └── MoodOracle.test.ts <- Hardhat mocha tests
│   │   ├── .env                 <- Configuration file (ignored by Git)
│   │   ├── .env.example
│   │   ├── foundry.toml
│   │   ├── hardhat.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/                <- Web application UI
│       ├── index.html
│       ├── package.json
│       ├── src/
│       │   ├── App.tsx          <- UI dashboard and simulation console
│       │   ├── index.css        <- Theme styling
│       │   └── main.tsx
│       ├── tsconfig.json
│       └── vite.config.ts
└── README.md
```

---

## 2. Configuration & Environment Variables

Before compiling or deploying, configure the environment parameters in `packages/contracts/.env`. 

1. Create a copy of the template if it does not already exist:
   ```bash
   cp packages/contracts/.env.example packages/contracts/.env
   ```
2. Open `packages/contracts/.env` in your editor and configure the variables:

| Variable Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `PRIVATE_KEY` | Hex private key of the EOA wallet deploying the contracts. Needs to be funded with `RITUAL` tokens. | `0xYourPrivateKeyHex...` |
| `RITUAL_RPC_URL` | The JSON-RPC endpoint for connecting to the Ritual network. | `https://rpc.ritualfoundation.org` |
| `EXECUTOR_ADDRESS` | The address of the active TEE executor registered in the TEEServiceRegistry. | `0x9cE8E3473D1E4E76dBd45D1426462728C9dF58Fd` |

---

## 3. Installation & Preparation

### Prerequisite: Node.js
Ensure you have **Node.js (version 18 or above)** installed on your machine. You can verify this by running:
```bash
node -v
```

### Step 1: Install Dependencies
Run this command in the **root directory** of the project to install all monorepo dependencies (both smart contracts and frontend) in one step:
```bash
npm install
```

---

## 4. Compiling the Project

To compile all Solidity smart contracts and generate typings:

```bash
# Navigate to the contracts package
cd packages/contracts

# Compile using Hardhat
npx hardhat compile
```

---

## 5. Running the Tests

To verify that the contracts, mock environments, and callbacks work correctly:

### Hardhat Tests (TypeScript)
```bash
# From packages/contracts
npx hardhat test
```

### Foundry Tests (Solidity)
If you have Foundry installed on your machine and want to run the Forge tests:
```bash
# Install the forge-std library if missing
forge install foundry-rs/forge-std --no-commit

# Run tests
forge test
```

---

## 6. Deploying to Ritual Testnet

To deploy the `MoodOracle` contract to the live Ritual Network:

```bash
# Ensure you are inside the packages/contracts folder
# Run the deployment script targeting the Ritual Network configuration
npx hardhat run scripts/deploy.ts --network ritual
```

### Expected Output after Successful Deployment:
```text
====================================================
Deploying MoodOracle contract...
Deployer address: 0x71C7...65a9
Deployer balance: 25.50 RITUAL
====================================================
Configured TEE Executor: 0x9cE8E3473D1E4E76dBd45D1426462728C9dF58Fd
✔ MoodOracle deployed successfully to: 0x4A6b5E385D4E677F67023dd8C3DD8cc134e872e8
RitualWallet address: 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948
Funding MoodOracle inside RitualWallet with 5.00 RITUAL...
✔ RitualWallet funded successfully.
Approving the Scheduler contract...
✔ Scheduler approved successfully.
Scheduling recurring jobs: every 100 blocks, for 1000 total runs...
✔ Recurring job successfully scheduled! Active Job ID: 40283
====================================================
Deployment and initialization completed successfully!
====================================================
```

---

## 7. System Contract Addresses

These system contract addresses exist natively on the Ritual Chain (EVM ID `1979`) and are hardcoded into the project:

* **Scheduler:** `0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B`
* **RitualWallet:** `0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948`
* **LLM Precompile (`0x0802`):** `0x0000000000000000000000000000000000000802`

---

## 8. Starting the Frontend App

Once deployment is complete:

1. Copy the deployed `MoodOracle` address from your console output.
2. Open `packages/frontend/src/App.tsx`.
3. Update the `oracleAddress` state variable at line 67 with your new contract address:
   ```typescript
   const [oracleAddress, setOracleAddress] = useState("YOUR_DEPLOYED_CONTRACT_ADDRESS");
   ```
4. Start the frontend application from the root directory:
   ```bash
   # From project root
   npm run dev --workspace=@mood-oracle/frontend
   ```
5. Open your browser and navigate to `http://localhost:3000`.

---

## 9. Verification & Query Guide

### A. How to verify the scheduler is running
1. Go to the frontend dashboard. The **Scheduler Automation** panel will show the active **Job ID** returned during deployment.
2. View the block target progression. The timeline shows when the next execution block will be reached (`Block # <last_execution_block> + 100`).
3. You can also query the active Job ID directly from the contract console:
   ```bash
   npx hardhat console --network ritual
   > const MoodOracle = await ethers.getContractFactory("MoodOracle");
   > const oracle = await MoodOracle.attach("YOUR_DEPLOYED_ADDRESS");
   > await oracle.activeJobId();
   // Returns the scheduled Job ID (e.g. 40283)
   ```

### B. How to verify the LLM inference executed successfully
1. Monitor the **TEE Execution Logs** panel on the frontend dashboard. When a scheduler callback triggers:
   * It will transition through: `Callback` -> `LLM Encode` -> `TEE Enclave` -> `On-chain Settlement`.
   * It will output logs verifying that the TEE attestation has been successfully validated.
2. In the contract console, check if new records are being written:
   ```bash
   npx hardhat console --network ritual
   > const oracle = await (await ethers.getContractFactory("MoodOracle")).attach("YOUR_DEPLOYED_ADDRESS");
   > await oracle.getHistory();
   // Will return an array of MoodPrediction structs containing completed LLM completions.
   ```

### C. How to query the latest mood prediction
* **From the Frontend UI:** The latest mood will be visually updated in the center orb (changing its glowing color code based on sentiment), and the decrypted raw JSON prediction text will be displayed in the **Daily Prediction** card.
* **Directly from the Contract:**
  ```bash
  npx hardhat console --network ritual
  > const oracle = await (await ethers.getContractFactory("MoodOracle")).attach("YOUR_DEPLOYED_ADDRESS");
  > await oracle.getLatestMood();
  // Returns the latest MoodPrediction struct:
  // {
  //   rawResponse: '{"mood": "Serene", "prediction": "..."}',
  //   timestamp: 1719286820n,
  //   executionIndex: 1n
  // }
  ```
