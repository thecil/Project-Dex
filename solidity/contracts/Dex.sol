//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.6.0 < 0.8.0;
pragma experimental ABIEncoderV2;

import "./Wallet.sol";

contract Dex is Wallet{

    using SafeMath for uint256;
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
    uint256 public nextOrderId = 0;

    //[ticker] => ([orderType] => [Order Struct])
    mapping(bytes32 => mapping(uint256 => Order[])) public orderBook;

    function getOrderBook(bytes32  _ticker, Side _orderType) public view returns(Order[] memory){
        return orderBook[(_ticker)][uint256(_orderType)];
    }

    function createLimitOrder(Side _orderType, bytes32 _ticker, uint256 _amount, uint256 _price) public{
        if(_orderType == Side.BUY){
            require(balances[msg.sender][bytes32("ETH")] >= _amount.mul(_price), "createLimitOrder: Not enough ETH Balance deposited");
        }

        else if(_orderType == Side.SELL){
            require(balances[msg.sender][_ticker] >= _amount, "createLimitOrder: Not enough Token Balance deposited");
        }

        Order[] storage orders = orderBook[_ticker][uint256(_orderType)];
        orders.push(
            Order(nextOrderId, msg.sender, _orderType, _ticker, _amount, _price)
        );

        //Bubble sort'
        uint _i = orders.length > 0 ? orders.length - 1 : 0;

        if(_orderType == Side.BUY){
            while(_i > 0){
                if(orders[_i - 1].price > orders[_i].price){
                    break;
                }
                Order memory orderToMove = orders[_i -1];
                orders[_i - 1] = orders[_i];
                orders[_i] = orderToMove;
                _i--;
            }
        }
        else if(_orderType == Side.SELL){
            while(_i > 0){
                if(orders[_i - 1].price < orders[_i].price){
                    break;
                }
                Order memory orderToMove = orders[_i -1];
                orders[_i - 1] = orders[_i];
                orders[_i] = orderToMove;
                _i--;
            }
        }
        nextOrderId++;
        
    }

    function createMarketOrder(Side _orderType, bytes32 _ticker, uint256 _amount) public{
        if(_orderType == Side.BUY){
            require(balances[msg.sender][bytes32("ETH")] >= _amount, "createMarketOrder: Not enough ETH Balance deposited");
        }
        else if(_orderType == Side.SELL){
            require(balances[msg.sender][_ticker] >= _amount, "createMarketOrder: Not enough Token Balance deposited");
        }
    }
}