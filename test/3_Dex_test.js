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
contract.skip("DEX", ([owner, alfa, beta, charlie]) => {
            // Global variable declarations
    let linkInstance;
    let daiInstance;
    let dexInstance;
    let _ticker;
    let _qtyEth = function(_amount) {
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
    });

    describe("DEX", () => {

        it("1. DEPOSIT TOKEN: addToken, approve, deposit tokens correctly, emit Approval event", async function (){
            _ticker = await _symbol(linkInstance);
            await dexInstance.addToken( _ticker, linkInstance.address);

            const _linkApprove = await linkInstance.approve( dexInstance.address , _qtyEth(100) ,{from: owner}) ;
            await dexInstance.depositToken( _qtyEth(1) , _ticker ,{from: owner});

            expectEvent(_linkApprove, 'Approval', {
                owner: owner,
                spender: dexInstance.address,
                value: _qtyEth(100)
            });

        });

        it("2. WITHDRAW TOKEN correctly", async function (){

            await dexInstance.withdrawToken( _qtyEth(1), _ticker, {from: owner});

            await expectRevert(
                dexInstance.withdrawToken( _qtyEth(1), _ticker, {from: alfa}),
                "Balance not sufficient"
            );

        });

        //The user must have ETH deposited such that deposited eth >= buy order value
        it("3. REVERT: createLimitOrder(BUY), not enough ETH Balance", async () => {

            await expectRevert(
            dexInstance.createLimitOrder(orderType.buy, _ticker, _qtyEth(1), _qtyEth(1), {from: owner}),
            "createLimitOrder: Not enough ETH Balance deposited"
            );

            await dexInstance.depositEth({value: _qtyEth(1), from: owner});
        })
        it("4. REVERT: createLimitOrder(SELL), not enough Token Balance", async () => {

            await expectRevert(
            dexInstance.createLimitOrder(orderType.sell, _ticker, _qtyEth(1), _qtyEth(1), {from: owner}),
            "createLimitOrder: Not enough Token Balance deposited"
            );
            await dexInstance.depositToken( _qtyEth(1), _ticker, {from: owner});
        })

        // Sorting BUY(low to high) and SELL(high to low)
        it("5. The BUY order book should be ordered on price from highest to lowest starting at index 0", async function (){
            await dexInstance.createLimitOrder(orderType.buy, _ticker, _qtyEth(1), _qtyEth(0.3), {from: owner});
            await dexInstance.createLimitOrder(orderType.buy, _ticker, _qtyEth(1), _qtyEth(0.1), {from: owner});
            await dexInstance.createLimitOrder(orderType.buy, _ticker, _qtyEth(1), _qtyEth(0.2), {from: owner});
        
            const buyOrderBook = await dexInstance.getOrderBook(_ticker, orderType.buy);
            assert(buyOrderBook.length > 0);
            for(let _i = 0; _i < buyOrderBook.length -1; _i++){
                assert(buyOrderBook[_i].price >= buyOrderBook[_i+1].price, "BUY shorting inccorect");
            }
        });

        it("6. The SELL order book should be ordered on price from lowest to highest starting at index 0", async function (){
            await dexInstance.createLimitOrder(orderType.sell, _ticker, _qtyEth(1), _qtyEth(3), {from: owner});
            await dexInstance.createLimitOrder(orderType.sell, _ticker, _qtyEth(1), _qtyEth(1), {from: owner});
            await dexInstance.createLimitOrder(orderType.sell, _ticker, _qtyEth(1), _qtyEth(2), {from: owner});
        
            const sellOrderBook = await dexInstance.getOrderBook(_ticker, orderType.sell);
            assert(sellOrderBook.length > 0);
            for(let _i = 0; _i < sellOrderBook.length -1; _i++){
                assert(sellOrderBook[_i].price <= sellOrderBook[_i+1].price, "SELL shorting inccorect");
            }
        });

    }); //end describe
}); // end contract