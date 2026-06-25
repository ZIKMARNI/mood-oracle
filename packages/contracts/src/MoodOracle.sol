// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IScheduler} from "./interfaces/IScheduler.sol";
import {IRitualWallet} from "./interfaces/IRitualWallet.sol";

/**
 * @title MoodOracle
 * @notice Periodic autonomous mood and prediction oracle executing on the Ritual Chain (EVM ID 1979).
 * @dev Interacts with the native Scheduler contract for triggering execution,
 * and calls the native TEE LLM Precompile (0x0802) for generating state.
 */
contract MoodOracle {
    // Ritual Native Precompiles & System Contracts
    address public constant LLM_PRECOMPILE = 0x0000000000000000000000000000000000000802;
    address public constant SCHEDULER = 0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B;
    address public constant RITUAL_WALLET = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;

    struct StorageRef {
        string platform;
        string path;
        string keyRef;
    }

    struct MoodPrediction {
        string rawResponse;     // Generated response containing mood & prediction JSON
        uint256 timestamp;      // Timestamp of execution block
        uint256 executionIndex; // Execution index tracked by Scheduler
    }

    address public owner;
    address public executor;     // Target TEE executor registered in TEEServiceRegistry
    uint256 public activeJobId;  // Job ID returned by Scheduler
    MoodPrediction[] public moodHistory;

    event MoodUpdated(string rawResponse, uint256 timestamp, uint256 executionIndex);
    event JobScheduled(uint256 jobId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _executor) {
        owner = msg.sender;
        executor = _executor;
    }

    function setExecutor(address _executor) external onlyOwner {
        executor = _executor;
    }

    /**
     * @notice Grants permission to the Scheduler contract to call back this contract.
     */
    function approveScheduler() external onlyOwner {
        IScheduler(SCHEDULER).approveScheduler(SCHEDULER);
    }

    /**
     * @notice Schedules recurring updates.
     * @param frequency The block interval at which to run (e.g. 100 blocks).
     * @param numCalls The total number of executions before the job expires.
     */
    function scheduleUpdates(uint32 frequency, uint32 numCalls) external onlyOwner {
        bytes memory callData = abi.encodeWithSelector(
            this.executeMoodUpdate.selector,
            uint256(0) // placeholder: overwritten by scheduler with executionIndex
        );

        // Schedule on the Scheduler contract. Fees will be deducted from this contract's deposit in RitualWallet.
        activeJobId = IScheduler(SCHEDULER).schedule(
            callData,
            2000000,                  // Gas limit per execution (generous for LLM call)
            uint32(block.number + 5), // startBlock (5 blocks from now)
            numCalls,
            frequency,
            100,                      // TTL: max blocks scheduler will wait to execute
            block.basefee + 2 gwei,   // maxFeePerGas
            1 gwei,                   // maxPriorityFeePerGas
            0,                        // value to send
            address(this)             // Payer address (needs pre-funded balance in RitualWallet)
        );

        emit JobScheduled(activeJobId);
    }

    /**
     * @notice Callback triggered by the Scheduler to perform inference.
     * @param executionIndex Current execution run number (0, 1, 2, ...).
     */
    function executeMoodUpdate(uint256 executionIndex) external {
        require(msg.sender == SCHEDULER, "Only scheduler callback");

        // OpenAI chat-completions compatible JSON array for prompt injection
        string memory messagesJson = '[{"role": "user", "content": "You are a Mood Oracle. Generate today\'s mood (e.g. Serene, Joyful, Melancholy, Cryptic) and a short prediction. Respond with a raw JSON object like this: {\\"mood\\": \\"...\\", \\"prediction\\": \\"...\\"} and nothing else."}]';

        // Encode the 30-field ABI parameters for LLM precompile 0x0802
        bytes memory input = abi.encode(
            executor,
            new bytes[](0),                     // encryptedSecrets: none
            uint256(30),                        // ttl (blocks)
            new bytes[](0),                     // secretSignatures: none
            bytes(""),                          // userPublicKey (empty = return plaintext)
            messagesJson,                       // messagesJson
            "zai-org/GLM-4.7-FP8",              // model
            int256(0),                          // frequencyPenalty
            "",                                 // logitBiasJson
            false,                              // logprobs
            int256(-1),                         // maxCompletionTokens
            "",                                 // metadataJson
            "",                                 // modalitiesJson
            uint256(1),                         // n
            false,                              // parallelToolCalls
            int256(0),                          // presencePenalty
            "",                                 // reasoningEffort
            bytes(""),                          // responseFormatData
            int256(-1),                         // seed
            "",                                 // serviceTier
            "",                                 // stopJson
            false,                              // stream: false
            int256(700),                        // temperature = 0.7 * 1000
            bytes(""),                          // toolChoiceData
            bytes(""),                          // toolsData
            int256(-1),                         // topLogprobs
            int256(1000),                       // topP = 1.0 * 1000
            "",                                 // user
            false,                              // piiEnabled
            StorageRef("gcs", "convos/mood-oracle.jsonl", "GCS_CREDS") // convoHistory
        );

        // Call the native LLM precompile
        (bool success, bytes memory output) = LLM_PRECOMPILE.call(input);
        require(success, "LLM precompile call failed");

        // Decode the 5-tuple response format from 0x0802
        (
            bool hasError,
            bytes memory completionData,
            ,
            string memory errorMessage,
            StorageRef memory _updatedConvoHistory
        ) = abi.decode(output, (bool, bytes, bytes, string, StorageRef));

        require(!hasError, errorMessage);

        // Convert the bytes payload to raw response string
        string memory rawResponse = string(completionData);
        
        // Push record to storage
        moodHistory.push(MoodPrediction({
            rawResponse: rawResponse,
            timestamp: block.timestamp,
            executionIndex: executionIndex
        }));

        emit MoodUpdated(rawResponse, block.timestamp, executionIndex);
    }

    function getHistory() external view returns (MoodPrediction[] memory) {
        return moodHistory;
    }

    function getLatestMood() external view returns (MoodPrediction memory) {
        require(moodHistory.length > 0, "No mood history yet");
        return moodHistory[moodHistory.length - 1];
    }
}
