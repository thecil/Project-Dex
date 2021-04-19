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
  
//test-helper tools
const balances = require('@openzeppelin/test-helpers/src/balance');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');
const ether = require('@openzeppelin/test-helpers/src/ether');

// Main function that is executed during the test
contract("DEX Market Orders", ([owner, alfa, beta, charlie]) => {
    // Global variable declarations
    let linkInstance;
    let daiInstance;
    let dexInstance;
    let _ticker;

    async function _symbol(_tokenInstance){
        let _res = await _tokenInstance.symbol();
        _res = web3.utils.fromUtf8(_res);
        return _res;
    }

    //set contracts instances
    beforeEach(async function() {
        // Deploy tokens to testnet
        linkInstance = await ERC20.link.new(ether("1000"));
        daiInstance = await ERC20.dai.new(ether("1000"));
        dexInstance = await Dex.new();
        _ticker = await _symbol(linkInstance);
    });

    describe("Market Orders", () => {
        it("1. Creating a SELL market order, the seller needs to have enough tokens for the trade", async function (){ 
            let balance = await dexInstance.balances(owner, web3.utils.fromUtf8("ETH"));
            assert.equal(new BN(balance), 0, "Initial ETH balance is not 0");
            
            await expectRevert(
                dexInstance.createMarketOrder(orderType.sell, _ticker, ether("1"), {from: owner}),
                "createMarketOrder: Not enough Token Balance deposited"
            );
        }); 
        it("2. Market orders can be submitted even if the order book is empty", async function (){
            const buyOrderBook = await dexInstance.getOrderBook(_ticker, orderType.buy);
            const sellOrderBook = await dexInstance.getOrderBook(_ticker, orderType.sell);
            assert(buyOrderBook.length == 0 && sellOrderBook.length == 0, "OrderBooks should be empty at the start");

            await dexInstance.depositEth({value: ether("1"), from: owner});
            await dexInstance.createMarketOrder(orderType.buy, _ticker, 1, {from: owner});
        });
        
        it("3. Market orders should not fill more limit orders than the market order amount ", async function (){
            // check orderbooks are empty
            buyOrderBook = await dexInstance.getOrderBook(_ticker, orderType.buy);
            sellOrderBook = await dexInstance.getOrderBook(_ticker, orderType.sell);
            assert(buyOrderBook.length == 0 && sellOrderBook.length == 0, "OrderBooks should be empty at the start");
            // add link token to dex
            await dexInstance.addToken( _ticker, linkInstance.address);
            // sent link tokens to accounts (from owner)
            await linkInstance.transfer(alfa, ether("1"), {from:owner});
            await linkInstance.transfer(beta, ether("1"), {from:owner});
            await linkInstance.transfer(charlie, ether("1"), {from:owner});          
            // approve dex to spend link on account behalf
            await linkInstance.approve(dexInstance.address, ether("2"), {from: owner});
            await linkInstance.approve(dexInstance.address, ether("2"), {from: alfa});
            await linkInstance.approve(dexInstance.address, ether("2"), {from: beta});
            await linkInstance.approve(dexInstance.address, ether("2"), {from: charlie});
            // depost Link into dex, all accounts
            await dexInstance.depositToken(ether("1") , _ticker ,{from: owner});
            await dexInstance.depositToken(ether("1") , _ticker ,{from: alfa});
            await dexInstance.depositToken(ether("1") , _ticker ,{from: beta});
            await dexInstance.depositToken(ether("1") , _ticker ,{from: charlie});
            // Fill up the sell order book
            await dexInstance.createLimitOrder(orderType.sell, _ticker, 1, ether("0.5"), {from: alfa});
            await dexInstance.createLimitOrder(orderType.sell, _ticker, 1, ether("0.25"), {from: beta});
            await dexInstance.createLimitOrder(orderType.sell, _ticker, 1, ether("1"), {from: charlie});
            //depositEth and create market order to buy 2/3 links orders
            const mapBalance = await dexInstance.balances(owner, web3.utils.fromUtf8("ETH"));
            await dexInstance.depositEth({value: ether("1"), from: owner});
            await dexInstance.createMarketOrder(orderType.buy, _ticker, 2);
            // check sell orderbook
            sellOrderBook = await dexInstance.getOrderBook(_ticker, orderType.sell);

            console.log(sellOrderBook.length);
            console.log(sellOrderBook.length);
            console.log(sellOrderBook.length);

            assert(sellOrderBook.length == 1, "Sell side orderbook should only have 1 order left");
            assert(sellOrderBook[0].filled == 0, "Sell side order should have 0 filled");
            

        });
        
        // The eth balance of the buyer should decrease with the filled amount
        // The token balances of the sellers should decrease with the filled amounts
        // Filled limit orders should be removed from the orderbook



    }); //end describe
}); // end contract