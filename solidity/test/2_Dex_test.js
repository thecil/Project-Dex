//Contracts
const ERC20 = {
    link: artifacts.require("Link"),
    dai: artifacts.require("Dai")
}

const Dex = artifacts.require("Dex");

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

    // Main function that is executed during the test
    contract("DEX", ([owner, alfa, beta, charlie]) => {
            // Global variable declarations
    let linkInstance;
    let daiInstance;
    let dexInstance;
    let _ticker;

    //set contracts instances
    before(async function() {
        // Deploy tokens to testnet
        linkInstance = await ERC20.link.new();
        daiInstance = await ERC20.dai.new();
        dexInstance = await Dex.new();
    });

    describe("DEX", () => {

        it("1. addToken(link) to wallet", async function (){
            _ticker = await linkInstance.symbol();
            await dexInstance.addToken( web3.utils.fromUtf8( _ticker), linkInstance.address);

        });

        it("2. REVERT: onlyOwner should be able to add token, owner addToken(dai)", async function (){
            _ticker = await daiInstance.symbol();
            
            await expectRevert(
                dexInstance.addToken(web3.utils.fromUtf8(_ticker ), daiInstance.address, {from: alfa}),
                "Ownable: caller is not the owner"
            );

            await dexInstance.addToken( web3.utils.fromUtf8(_ticker ), daiInstance.address);
        });

        it("3. DEPOSITS: approve, deposit tokens correctly, emit Approval event", async function (){
            _ticker = await linkInstance.symbol();
            const _linkApprove = await linkInstance.approve( dexInstance.address , 1000 ,{from: owner}) ;
            await dexInstance.deposit( 100 , web3.utils.fromUtf8(_ticker) ,{from: owner});

            expectEvent(_linkApprove, 'Approval', {
                owner: owner,
                spender: dexInstance.address,
                value: new BN(1000),
            });

        });

        it("4. WITHDRAW correctly", async function (){
            _ticker = await linkInstance.symbol();
            await dexInstance.withdraw( 100 , web3.utils.fromUtf8(_ticker) ,{from: owner});

            await expectRevert(
                dexInstance.withdraw( 100 , web3.utils.fromUtf8(_ticker) ,{from: alfa}),
                "Balance not sufficient"
            );

        });

        // Sorting BUY(low to high) and SELL(high to low)
        // createLimitOrder(Side _orderType, bytes32 _ticker, uint256 _amount, uint256 _price)
        it("The BUY order book should be ordered on price from highest to lowest starting at index 0", async function (){
            _ticker = await linkInstance.symbol();
            dexInstance.depositEth({value: web3.utils.toWei("10", "ether")});
        });

        it("The SELL order book should be ordered on price from lowest to highest starting at index 0", async function (){
            _ticker = await linkInstance.symbol();
        });

    }); //end describe
}); // end contract