//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 < 0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Link is ERC20{
    constructor(uint256 _mintAmount) ERC20("Chainlink", "LINK") public {
        _mint(msg.sender, _mintAmount);
    }
}