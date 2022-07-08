const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const TradegenERC20 = require('../build/contracts/TradegenERC20.json');

var contractAddress = "0xF1bF96F3C0844b957d49906Ec821658e12E25Da6";
var ownerAddress = "0x675044ab8a1dc4220E12c5bBA2dD79e95Cd2244c";
var secondUserAddress = "0x116F8D1cF5D55748CF148b8f72248b4e6034f081";

async function initContract(){
    
    let instance = new web3.eth.Contract(
        TradegenERC20.abi, contractAddress);

    it('TradegenERC20 is initialized correctly', async () => {
        let ownerBalance = await instance.methods.balanceOf(ownerAddress).call();
        let totalSupply = await instance.methods.totalSupply().call();

        assert(
            BigNumber('1e+27').isEqualTo(ownerBalance.toString()),
            'Contract owner should have 1 billion TGEN'
        );

        assert(
            BigNumber('1e+27').isEqualTo(totalSupply.toString()),
            'Contract should have total supply of 1 billion TGEN'
        );
    });

    it('Transfer TGEN to another user', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let initialOwnerBalance = await instance.methods.balanceOf(ownerAddress).call();
        let initialSecondUserBalance = await instance.methods.balanceOf(secondUserAddress).call();

        let txObject = await instance.methods.transfer(secondUserAddress, 1000);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });

        let receipt = await tx.waitReceipt()
        console.log(receipt);

        let newOwnerBalance = await instance.methods.balanceOf(ownerAddress).call();
        let newSecondUserBalance = await instance.methods.balanceOf(secondUserAddress).call();

        assert(
            BigNumber(newSecondUserBalance).isEqualTo(BigNumber(initialSecondUserBalance).plus(BigNumber(1000))),
            'Second user should receive 1000 TGEN'
        );

        assert(
            BigNumber(newOwnerBalance).isEqualTo(BigNumber(initialOwnerBalance).minus(BigNumber(1000))),
            'Owner should have 1000 TGEN deducted'
        );
    });
}

initContract()