//Contracts
const ERC20 = {
    link: artifacts.require("Link"),
    dai: artifacts.require("Dai")
}

const Wallet = artifacts.require("Wallet");

const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
  } = require('@openzeppelin/test-helpers');
  
  //track balance
  const balance = require('@openzeppelin/test-helpers/src/balance');
  
  // Main function that is executed during the test
  contract.skip("ERC20", ([owner, alfa, beta, charlie]) => {
    // Global variable declarations
    let linkInstance;
    let daiInstance;
    let walletInstance;
    let _ticker;

    //set contracts instances
    before(async function() {
        // Deploy tokens to testnet
        linkInstance = await ERC20.link.new();
        daiInstance = await ERC20.dai.new();
        walletInstance = await Wallet.new();

        console.log("LINK ",linkInstance.address);
        console.log("DAI ",daiInstance.address);
        console.log("WALLET ",walletInstance.address);
    });

    describe("ERC20", () => {

        it("1. get totalSupply", async function (){
            await linkInstance.totalSupply();
            await daiInstance.totalSupply();
          });
        
        it("2. addTokens to wallet, show link contract address", async function (){
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker);
            await walletInstance.addToken( _ticker, linkInstance.address);

            _ticker = await daiInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker);

            await walletInstance.addToken( _ticker, daiInstance.address);
        });

        it("3. approve token", async function (){
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker);
            await linkInstance.approve( walletInstance.address , 1000 ,{from: owner}) ;
        });

        it("4. deposit tokens to Wallet from owner", async function (){
            _ticker = await linkInstance.symbol();
            _ticker = web3.utils.fromUtf8( _ticker);
            await walletInstance.depositToken( 100 ,_ticker ,{from: owner});
        });
/*
        // Conditions that trigger a require statement can be precisely tested
        it("4. REVERT: contract owner will fail change cap, not capper_role (renounce it in test 2)", async function (){
            const _failCap = (web3.utils.toWei('10000','ether'))
            await expectRevert(
            tokenInstance.newCap(_failCap, {from: owner}),
            "ERC20PresetMinterPauser: must have capper role to change cap"
            );
        })
*/
    })// end describe

  })//end contract