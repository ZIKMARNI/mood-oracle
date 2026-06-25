# Contributing to Mood Oracle

First off, thank you for considering contributing to Mood Oracle! It's people like you that make it a fantastic tool for the web3 and AI communities.

---

## 📋 Code of Conduct

We request that all contributors follow these basic guidelines:
* Maintain a respectful and inclusive environment.
* Limit discussions to project implementation, features, and debugging.
* Adhere to clean coding practices and maintain unit tests for new logic.

---

## 🛠 How Can I Contribute?

### 1. Reporting Bugs
* Check the existing issues/discussions to see if the bug has already been reported.
* Open a new issue detailing:
  * Clear steps to reproduce the issue.
  * Expected behavior vs. actual outcome.
  * System setup details (Node version, network RPC, active executor).

### 2. Suggesting Enhancements
* Check the current roadmap and discussions.
* Open an issue explaining:
  * The goal or benefit of the enhancement.
  * A brief design proposal or integration flow on the Ritual Chain.

### 3. Pull Requests
* Fork the repository and create your branch from `main`.
* Follow the existing folder structures (split between `packages/contracts` and `packages/frontend`).
* Ensure all Solidity smart contracts compile and pass local tests.
* Ensure TypeScript/React files do not throw build-time errors.
* Submit a PR describing what was changed, referencing any related open issues.

---

## 🧑‍💻 Technical Code Style

* **Solidity:** Use standard formatting (`prettier-plugin-solidity`), keep compiler versions pinned to `^0.8.20`, and document custom callback arguments clearly.
* **TypeScript:** Maintain strict typing (`tsconfig` configuration), use Ethers v6 standard methods, and handle raw inputs securely (no hardcoded credentials).
