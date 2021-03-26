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
        uint256 filled;
    }
    uint256 public nextOrderId = 0;

    //[ticker] => ([orderType] => [Order Struct])
    mapping(bytes32 => mapping(uint256 => Order[])) public orderBook;

    function getOrderBook(bytes32  _ticker, Side _orderType) public view returns(Order[] memory){
        return orderBook[_ticker][uint256(_orderType)];
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
            Order(nextOrderId, msg.sender, _orderType, _ticker, _amount, _price, 0)
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
        if(_orderType == Side.SELL){
            require(balances[msg.sender][_ticker] >= _amount, "createMarketOrder: Not enough Token Balance deposited");
        }

        uint256 orderBookSide;

        if(_orderType == Side.BUY){
            orderBookSide = 1;
        }
        else if(_orderType == Side.SELL){
            orderBookSide = 0;
        }
        Order[] storage orders = orderBook[_ticker][orderBookSide];

        uint256 _totalFilled = 0;

        for (uint256 _i = 0; _i < orders.length && _totalFilled < _amount; _i++) {
            // How much we can fill from order[i]
            uint256 _leftToFill = _amount.sub(_totalFilled);    
            uint256 _availableToFill = orders[_i].amount.sub(orders[_i].filled);
            uint256 _filled = 0;
            if(_availableToFill > _leftToFill){
                _filled = _leftToFill; // fill the entire market order
            }
            else{
                _filled = _availableToFill; // fill as much as available in order[_i]
            }
            // Update _totalFilled
            _totalFilled = _totalFilled.add(_filled);     
            // Update orders.filled + amount  
            orders[_i].filled = orders[_i].filled.add(_filled); 
            uint256 _cost = _filled.mul(orders[_i].price);

            if(_orderType == Side.BUY){
                // Verify that the trader(buyer) has enough ETH to cover the purchase
                require(balances[msg.sender][bytes32("ETH")] >= _cost, "createMarketOrder: _cost: Not enough ETH Balance deposited");
                // Execute the trade, msg.sender is buyer
                // buyer receive tokens, transfer eth to seller
                balances[msg.sender][_ticker] = balances[msg.sender][_ticker].add(_filled);
                balances[msg.sender][bytes32("ETH")] = balances[msg.sender][bytes32("ETH")].sub(_cost);  
                // transfer tokens from seller to buyer, receive eth from buyer
                balances[orders[_i].trader][_ticker] = balances[orders[_i].trader][_ticker].sub(_filled);
                balances[orders[_i].trader][bytes32("ETH")] = balances[orders[_i].trader][bytes32("ETH")].add(_cost);             
            }
            else if(_orderType == Side.SELL){
                // Execute the trade, msg.sender is seller  
                // transfer tokens from seller to buyer, receive eth from buyer
                balances[msg.sender][_ticker] = balances[msg.sender][_ticker].sub(_filled);
                balances[msg.sender][bytes32("ETH")] = balances[msg.sender][bytes32("ETH")].add(_cost);
                // seller receive tokens, transfer eth to buyer
                balances[orders[_i].trader][_ticker] = balances[orders[_i].trader][_ticker].add(_filled);
                balances[orders[_i].trader][bytes32("ETH")] = balances[orders[_i].trader][bytes32("ETH")].sub(_cost);               
            }
        }
            // loop through the orderbook and remove 100% filled orders
        while(orders.length > 0 && orders[0].filled == orders[0].amount){
            // remove the top elem,ent in the orders array by orverwriting every element
            // whit the next element in the order list
            for (uint256 _i = 0; _i < orders.length; _i++) {
                orders[_i] = orders[_i + 1];
            }
            orders.pop();
        }
    }
}