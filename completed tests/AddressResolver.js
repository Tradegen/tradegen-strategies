const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const AddressResolver = require('../build/contracts/AddressResolver.json');

var contractAddress = "0x13847F0813A10893E3C5003eC9dB9545268B0e6a";
var settingsContractAddress = "0x79F1f525E6b3c2949F83DDB5D685237e3B352D55";
var tempContractAddress = "0x79F1f525E6b3c2949F83DDB5D685237e3B352D54"; //doesn't point to contract

function initContract()
{ 
    let instance = new web3.eth.Contract(AddressResolver.abi, contractAddress);
    
    it('set contract address from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let txObject = await instance.methods.setContractAddress("Settings", settingsContractAddress);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt()

        let data = await instance.methods.getContractAddress("Settings").call();
        console.log(data);

        assert(
            data == settingsContractAddress,
            'Settings contract address does not match'
        );
    });
    
    it('Set contract address from different account', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let txObject = await instance.methods.setContractAddress("Settings", tempContractAddress);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
            let receipt = await tx.waitReceipt()

            let data = await instance.methods.getContractAddress("Settings").call();
            console.log(data);

            assert(
                data == settingsContractAddress,
                'Settings contract address does not match'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });
}

initContract();