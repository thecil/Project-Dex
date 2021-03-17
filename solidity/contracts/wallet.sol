//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 < 0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Wallet is Ownable{
using SafeMath for uint256;

//token addresses
struct Token{
    bytes32 ticker;
    address tokenAddress;
}

mapping(bytes32 => Token) public tokenMapping;
bytes32[] public tokenList;

// track multiple balances, address=>(ticker(byte32) => amount)
mapping(address => mapping(bytes32 => uint256)) public balances;

modifier tokenExist(bytes32 _ticker){
    require(tokenMapping[_ticker].tokenAddress != address(0), "No address in tokenMapping");
    _;
}

function addToken(bytes32 _ticker, address _tokenAddress) external onlyOwner{
    tokenMapping[_ticker] = Token(_ticker, _tokenAddress);
    tokenList.push(_ticker);
}

function deposit(uint256 _amount, bytes32 _ticker) external tokenExist(_ticker){
    IERC20(tokenMapping[_ticker].tokenAddress).transferFrom(msg.sender, address(this), _amount);
    balances[msg.sender][_ticker] = balances[msg.sender][_ticker].add(_amount);
}

function withdraw(uint _amount, bytes32 _ticker) external tokenExist(_ticker){
    require(balances[msg.sender][_ticker] >= _amount, "Balance not sufficient");

    balances[msg.sender][_ticker] = balances[msg.sender][_ticker].sub(_amount);
    IERC20(tokenMapping[_ticker].tokenAddress).transfer(msg.sender, _amount);
}

}
