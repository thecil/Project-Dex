//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 < 0.8.0;
pragma experimental ABIEncoderV2;

import "./Wallet.sol";

contract Dex is Wallet{

    enum Side{
        BUY,
        SELL
    }

    struct Order{
        uint256 id;
        address trader;
        Side orderType;
        bytes32 ticker;
        uint256 amount;
        uint256 price;
    }


    mapping(bytes32 => mapping(uint256 => Order[])) public orderBook;

    function getOrderBook(bytes32  _ticker, Side _orderType) public view returns(Order[] memory){
        return orderBook[(_ticker)][uint256(_orderType)];
    }

    function createLimitOrder(Side _orderType, bytes32 _ticker, uint256 _amount, uint256 _price) public{

    }
}