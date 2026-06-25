// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {MoodOracle} from "../src/MoodOracle.sol";

contract MoodOracleTest is Test {
    MoodOracle public oracle;
    address public mockExecutor = address(0xDEAd);

    function setUp() public {
        oracle = new MoodOracle(mockExecutor);
    }

    function testConstructor() public {
        assertEq(oracle.owner(), address(this));
        assertEq(oracle.executor(), mockExecutor);
    }

    function testSetExecutor() public {
        address newExecutor = address(0xBEEF);
        oracle.setExecutor(newExecutor);
        assertEq(oracle.executor(), newExecutor);
    }

    function testSetExecutorNonOwner() public {
        address newExecutor = address(0xBEEF);
        vm.prank(address(0x1));
        vm.expectRevert("Only owner");
        oracle.setExecutor(newExecutor);
    }

    function testApproveScheduler() public {
        // Mock Scheduler.approveScheduler call
        vm.mockCall(
            oracle.SCHEDULER(),
            abi.encodeWithSignature("approveScheduler(address)", oracle.SCHEDULER()),
            abi.encode()
        );

        oracle.approveScheduler();
    }

    function testScheduleUpdates() public {
        // Mock Scheduler.schedule call
        vm.mockCall(
            oracle.SCHEDULER(),
            abi.encodeWithSignature("schedule(bytes,uint32,uint32,uint32,uint32,uint32,uint256,uint256,uint256,address)"),
            abi.encode(uint256(42)) // returns jobId 42
        );

        oracle.scheduleUpdates(100, 10);
        assertEq(oracle.activeJobId(), 42);
    }

    function testExecuteMoodUpdate() public {
        // Mock LLM_PRECOMPILE call
        bytes memory mockLLMResponse = abi.encode(
            false, // hasError = false
            bytes('{"mood": "Serene", "prediction": "A peaceful day ahead."}'), // completionData
            new bytes(0), // modelMetadata
            "", // errorMessage
            MoodOracle.StorageRef("gcs", "convos/mood-oracle.jsonl", "GCS_CREDS") // convoHistory
        );

        vm.mockCall(
            oracle.LLM_PRECOMPILE(),
            mockLLMResponse
        );

        // Expect the MoodUpdated event to be emitted
        vm.expectEmit(false, false, false, true);
        emit MoodOracle.MoodUpdated('{"mood": "Serene", "prediction": "A peaceful day ahead."}', block.timestamp, 1);

        // Execute from the Scheduler address
        vm.prank(oracle.SCHEDULER());
        oracle.executeMoodUpdate(1);

        // Verify state changes
        MoodOracle.MoodPrediction memory latest = oracle.getLatestMood();
        assertEq(latest.rawResponse, '{"mood": "Serene", "prediction": "A peaceful day ahead."}');
        assertEq(latest.timestamp, block.timestamp);
        assertEq(latest.executionIndex, 1);
        
        assertEq(oracle.getHistory().length, 1);
    }

    function testExecuteMoodUpdateUnauthorized() public {
        vm.prank(address(0x1));
        vm.expectRevert("Only scheduler callback");
        oracle.executeMoodUpdate(1);
    }

    function testExecuteMoodUpdateError() public {
        // Mock LLM_PRECOMPILE call showing an error
        bytes memory mockLLMResponse = abi.encode(
            true, // hasError = true
            new bytes(0), // completionData
            new bytes(0), // modelMetadata
            "Inference failed due to timeout", // errorMessage
            MoodOracle.StorageRef("gcs", "convos/mood-oracle.jsonl", "GCS_CREDS") // convoHistory
        );

        vm.mockCall(
            oracle.LLM_PRECOMPILE(),
            mockLLMResponse
        );

        vm.prank(oracle.SCHEDULER());
        vm.expectRevert(bytes("Inference failed due to timeout"));
        oracle.executeMoodUpdate(1);
    }
}
