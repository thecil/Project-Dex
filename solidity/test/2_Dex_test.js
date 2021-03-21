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
    contract("DEX", ([owner, alfa, beta, charlie]) => {
            // Global variable declarations
    let linkInstance;
    let daiInstance;
    let dexInstance;
    let _ticker;
    var quantity = function(_amount) {
        return (web3.utils.toWei(new BN (_amount), "ether"))
    }

    //set contracts instances
    before(async function() {
        // Deploy tokens to testnet
        linkInstance = await ERC20.link.new(quantity(1000));
        daiInstance = await ERC20.dai.new(quantity(1000));
        dexInstance = await Dex.new();
    });

    describe("DEX", () => {

        it("1. addToken(link) to wallet token list", async function (){
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker);
            await dexInstance.addToken( _ticker, linkInstance.address);

        });

        it("2. REVERT: onlyOwner should be able to add token, owner addToken(dai)", async function (){
            _ticker = await daiInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker)
            await expectRevert(
                dexInstance.addToken(_ticker, daiInstance.address, {from: alfa}),
                "Ownable: caller is not the owner"
            );

            await dexInstance.addToken(_ticker, daiInstance.address);
        });

        it("3. DEPOSIT TOKEN: approve, deposit tokens correctly, emit Approval event", async function (){
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker)
            const _linkApprove = await linkInstance.approve( dexInstance.address , quantity(100) ,{from: owner}) ;
            await dexInstance.depositToken( quantity(1) , _ticker ,{from: owner});

            expectEvent(_linkApprove, 'Approval', {
                owner: owner,
                spender: dexInstance.address,
                value: quantity(100)
            });

        });

        it("4. WITHDRAW TOKEN correctly", async function (){
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker)

            await dexInstance.withdrawToken( quantity(1), _ticker, {from: owner});

            await expectRevert(
                dexInstance.withdrawToken( quantity(1), _ticker, {from: alfa}),
                "Balance not sufficient"
            );

        });

        //The user must have ETH deposited such that deposited eth >= buy order value
        it("5. REVERT: createLimitOrder(BUY), not enough ETH Balance", async () => {
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker)

            await expectRevert(
            dexInstance.createLimitOrder(orderType.buy, _ticker, quantity(1), quantity(1), {from: owner}),
            "createLimitOrder: Not enough ETH Balance deposited"
            );

            await dexInstance.depositEth({value: quantity(5), from: owner});
        })
        it("6. REVERT: createLimitOrder(SELL), not enough Token Balance", async () => {
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker)

            await expectRevert(
            dexInstance.createLimitOrder(orderType.sell, _ticker, quantity(1), quantity(1), {from: owner}),
            "createLimitOrder: Not enough Token Balance deposited"
            );
            await dexInstance.depositToken( quantity(10), _ticker, {from: owner});
        })

        // Sorting BUY(low to high) and SELL(high to low)
        it("7. The BUY order book should be ordered on price from highest to lowest starting at index 0", async function (){
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker);
            await dexInstance.createLimitOrder(orderType.buy, _ticker, quantity(1), quantity(0.3), {from: owner});
            await dexInstance.createLimitOrder(orderType.buy, _ticker, quantity(1), quantity(0.1), {from: owner});
            await dexInstance.createLimitOrder(orderType.buy, _ticker, quantity(1), quantity(0.2), {from: owner});
        
            const buyOrderBook = await dexInstance.getOrderBook(_ticker, orderType.buy);
            assert(buyOrderBook.length > 0);
            for(let _i = 0; _i < buyOrderBook.length -1; _i++){
                assert(buyOrderBook[_i].price >= buyOrderBook[_i+1].price, "BUY shorting inccorect");
            }
        });

        it("8. The SELL order book should be ordered on price from lowest to highest starting at index 0", async function (){
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker)
            await dexInstance.createLimitOrder(orderType.sell, _ticker, quantity(1), quantity(3), {from: owner});
            await dexInstance.createLimitOrder(orderType.sell, _ticker, quantity(1), quantity(1), {from: owner});
            await dexInstance.createLimitOrder(orderType.sell, _ticker, quantity(1), quantity(2), {from: owner});
        
            const sellOrderBook = await dexInstance.getOrderBook(_ticker, orderType.sell);
            assert(sellOrderBook.length > 0);
            for(let _i = 0; _i < sellOrderBook.length -1; _i++){
                assert(sellOrderBook[_i].price <= sellOrderBook[_i+1].price, "SELL shorting inccorect");
            }
        });

        it("9. Creating a SELL market order, the seller needs to have enough tokens for the trade", async function (){
            let balance = await dexInstance.balances(owner, web3.utils.fromUtf8("ETH"));
            assert.equal(new BN(balance), new BN(0), "Initial ETH balance is not 0");
            
            await expectRevert(
                dexInstance.createMarketOrder(orderType.sell, _ticker, quantity(1), {from: alfa}),
                "createMarketOrder: Not enough Token Balance deposited"
            );
        });
        // When 
        it("10. Creating a BUY market order, the buyer needs to have enough ETH for the trade", async function (){
            await expectRevert(
                dexInstance.createMarketOrder(orderType.buy, _ticker, quantity(1), {from: alfa}),
                "createMarketOrder: Not enough ETH Balance deposited"
            );
        });
        // Market orders can be submitted even if the order book is empty
        // Market orders should be filled until the order books in empty or the market order is 100% filled
        // The eth balance of the buyer should decrease with the filled amount
        // The token balances of the sellers should decrease with the filled amounts
        // Filled limit orders should be removed from the orderbook



    }); //end describe
}); // end contract