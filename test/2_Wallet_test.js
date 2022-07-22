//Contracts
const ERC20 = {
    link: artifacts.require("Link"),
    dai: artifacts.require("Dai")
}

const Dex = artifacts.require("Dex");
const truffleAssert = require('truffle-assertions');

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
contract.skip("WALLET", ([owner, alfa, beta, charlie]) => {
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
        // Deploy contracts to testnet
        linkInstance = await ERC20.link.new(_qtyEth(1000));
        daiInstance = await ERC20.dai.new(_qtyEth(1000));
        dexInstance = await Dex.new();
    });

    describe("Wallet contract testing", () => {

        it("1. addToken(link) to wallet token list", async function (){
            _ticker = await _symbol(linkInstance);
            await dexInstance.addToken( _ticker, linkInstance.address);

        });

        it("2. REVERT: onlyOwner should be able to add token, owner addToken(dai)", async function (){
            _ticker = await _symbol(daiInstance);
            await expectRevert(
                dexInstance.addToken(_ticker, daiInstance.address, {from: alfa}),
                "Ownable: caller is not the owner"
            );

            await dexInstance.addToken(_ticker, daiInstance.address);
        });

        it("3. DEPOSIT TOKEN: approve, deposit tokens correctly, emit Approval event", async function (){
            _ticker = await _symbol(linkInstance);
            const _linkApprove = await linkInstance.approve( dexInstance.address , _qtyEth(100) ,{from: owner}) ;
            await dexInstance.depositToken( _qtyEth(1) , _ticker ,{from: owner});

            expectEvent(_linkApprove, 'Approval', {
                owner: owner,
                spender: dexInstance.address,
                value: _qtyEth(100)
            });

        });

        it("4. WITHDRAW TOKEN correctly", async function (){

            await dexInstance.withdrawToken( _qtyEth(1), _ticker, {from: owner});

            await expectRevert(
                dexInstance.withdrawToken( _qtyEth(1), _ticker, {from: alfa}),
                "Balance not sufficient"
            );

        });

    }); //end describe
}); // end contract