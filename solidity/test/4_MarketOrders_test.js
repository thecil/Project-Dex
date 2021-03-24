//Contracts
const ERC20 = {
    link: artifacts.require("Link"),
    dai: artifacts.require("Dai")
}

const Dex = artifacts.require("Dex");
const truffleAssert = require('truffle-assertions');

const orderType ={
    buy: 0,
    sell: 1
}

const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
  } = require('@openzeppelin/test-helpers');
  
//track balance
const balance = require('@openzeppelin/test-helpers/src/balance');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');

// Main function that is executed during the test
contract("DEX Market Orders", ([owner, alfa, beta, charlie]) => {
    // Global variable declarations
    let linkInstance;
    let daiInstance;
    let dexInstance;
    let _ticker;
    var _qtyEth = function(_amount) {
        return (web3.utils.toWei(_amount.toString(), "ether"))
    }
    async function _symbol(_tokenInstance){
        let _res = await _tokenInstance.symbol();
        _res = web3.utils.fromUtf8(_res);
        return _res;
    }

    //set contracts instances
    before(async function() {
        // Deploy tokens to testnet
        linkInstance = await ERC20.link.new(_qtyEth(1000));
        daiInstance = await ERC20.dai.new(_qtyEth(1000));
        dexInstance = await Dex.new();
        _ticker = await _symbol(linkInstance);
    });

    describe("Market Orders", () => {
        it("1. Creating a SELL market order, the seller needs to have enough tokens for the trade", async function (){ 
            let balance = await dexInstance.balances(alfa, web3.utils.fromUtf8("ETH"));
            assert.equal(new BN(balance), 0, "Initial ETH balance is not 0");
            
            await expectRevert(
                dexInstance.createMarketOrder(orderType.sell, _ticker, _qtyEth(1), {from: owner}),
                "createMarketOrder: Not enough Token Balance deposited"
            );
        }); 
        it("2. Creating a BUY market order, the buyer needs to have enough ETH for the trade", async function (){
            await expectRevert(
                dexInstance.createMarketOrder(orderType.buy, _ticker, _qtyEth(1), {from: owner}),
                "createMarketOrder: Not enough ETH Balance deposited"
            );
        });
        // 
        it("3. Market orders can be submitted even if the order book is empty", async function (){
            const buyOrderBook = await dexInstance.getOrderBook(_ticker, orderType.buy);
            const sellOrderBook = await dexInstance.getOrderBook(_ticker, orderType.sell);
            assert(buyOrderBook.length == 0 && sellOrderBook.length == 0, "OrderBooks should be empty at the start");

            await dexInstance.depositEth({value: _qtyEth(1), from: owner});
            await dexInstance.createMarketOrder(orderType.buy, _ticker, _qtyEth(1), {from: owner});
        });
        /*
        it("4. Market orders should be filled until the order books is empty or the market order is 100% filled", async function (){
            const buyOrderBook = await dexInstance.getOrderBook(_ticker, orderType.buy);
            const sellOrderBook = await dexInstance.getOrderBook(_ticker, orderType.sell);
            assert(buyOrderBook.length == 0 && sellOrderBook.length == 0, "OrderBooks should be empty at the start");

            await dexInstance.addToken( _ticker, linkInstance.address);
            //sent link tokens to accounts (from owner)
            await linkInstance.transfer(alfa, _qtyEth(1), {from:owner});
            await linkInstance.transfer(beta, _qtyEth(1), {from:owner});
            await linkInstance.transfer(charlie, _qtyEth(1), {from:owner});
            
            //approve dex to spend link on account behalf
            await linkInstance.approve(dexInstance.address, _qtyEth(5), {from: owner});
            await linkInstance.approve(dexInstance.address, _qtyEth(5), {from: alfa});
            await linkInstance.approve(dexInstance.address, _qtyEth(5), {from: beta});
            await linkInstance.approve(dexInstance.address, _qtyEth(5), {from: charlie});

            //depost Link into dex, all accounts
            await dexInstance.depositToken(_qtyEth(1) , _ticker ,{from: owner});
            await dexInstance.depositToken(_qtyEth(1) , _ticker ,{from: alfa});
            await dexInstance.depositToken(_qtyEth(1) , _ticker ,{from: beta});
            await dexInstance.depositToken(_qtyEth(1) , _ticker ,{from: charlie});
            // Fill up the sell order book
            await dexInstance.createLimitOrder(orderType.buy, _ticker, _qtyEth(1), _qtyEth(0.2), {from: alfa});
            await dexInstance.createLimitOrder(orderType.buy, _ticker, _qtyEth(1), _qtyEth(0.5), {from: beta});
            await dexInstance.createLimitOrder(orderType.buy, _ticker, _qtyEth(1), _qtyEth(1), {from: charlei});
            //depositEth and create market order to buy 2/3 links
            await dexInstance.depositEth({value: _qtyEth(1), from: owner});
            await dexInstance.createMarketOrder(orderType.buy, _ticker, _qtyEth(2), {from: owner});

            const sellOrderBook = await dexInstance.getOrderBook(_ticker, orderType.sell);
            assert(sellOrderBook.length == 0, "OrderBooks should be empty at the start");

        });
        */
        // The eth balance of the buyer should decrease with the filled amount
        // The token balances of the sellers should decrease with the filled amounts
        // Filled limit orders should be removed from the orderbook



    }); //end describe
}); // end contract