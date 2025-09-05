// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        // Mint 1000 tokens to the deployer (msg.sender)
        // ERC20 uses 18 decimals by default, so 1000 tokens = 1000 * 10^18
        _mint(msg.sender, 1000 * 10**decimals());
    }
}
