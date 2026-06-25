// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITEERegistry {
    function getExecutorPublicKey(address executor) external view returns (bytes memory);
}
