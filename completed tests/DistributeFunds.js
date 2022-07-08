const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const DistributeFunds = require('../build/contracts/DistributeFunds.json');
const TradegenERC20 = require('../build/contracts/TradegenERC20.json');
const AddressResolver = require('../build/contracts/AddressResolver.json');

var contractAddress = "0x663e4c5b3bD1d5f924555fCd09f5bA85b3020773";
var tradegenEscrowAddress = "0x58F58716Da781F99bdC562D5e54995b6c8F21415"; //first recipient
var userManagerAddress = "0xB83a517c0bDC29f0394663ae679e91C3Fa6Db71d"; //second recipient
var baseTradegenAddress = "0xb79d64d9Acc251b04A3Ca9f811EFf49Bde52BbbC";
var addressResolverAddress = "0x9452D986e6A206AcC93122B81598d9D97E0bAaa3";

function initContract()
{ 
    let instance = new web3.eth.Contract(DistributeFunds.abi, contractAddress);
    let tradegenInstance = new web3.eth.Contract(TradegenERC20.abi, baseTradegenAddress);
    let addressResolverInstance = new web3.eth.Contract(AddressResolver.abi, addressResolverAddress);
    
    it('Add recipient from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        //Add BaseTradegen contract address to AddressResolver if needed
        //let txObject = await addressResolverInstance.methods.setContractAddress("BaseTradegen", baseTradegenAddress);
        //let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        //let receipt = await tx.waitReceipt();

        //let data1 = await addressResolverInstance.methods.getContractAddress("BaseTradegen").call();
        //console.log(data1);

        
        let txObject1 = await instance.methods.addRecipient(tradegenEscrowAddress, 1000000, "TradegenEscrow");
        let tx1 = await kit.sendTransactionObject(txObject1, { from: account.address }); 
        let receipt1 = await tx1.waitReceipt();

        let data1 = await instance.methods.getAddresses().call();
        console.log(data1);
        
        assert(
            data1.length == 1,
            'There should be one element in addresses array'
        );

        assert(
            data1[0] == tradegenEscrowAddress,
            'First element in addresses array should be TradegenEscrow'
        );

        let data2 = await instance.methods.getRecipientByName("TradegenEscrow").call();
        console.log(data2);
        
        let balance = data2['0'];
        let address = data2['1'];

        assert(
            balance == 1000000,
            'The balance should be 1000000'
        );

        assert(
            address == tradegenEscrowAddress,
            'The address should be tradegen escrow address'
        );

        let data3 = await instance.methods.getRecipientByAddress(tradegenEscrowAddress).call();
        console.log(data3);

        let balance2 = data3['0'];
        let name = data3['1'];

        assert(
            balance2 == 1000000,
            'The balance should be 1000000'
        );

        assert(
            name == "TradegenEscrow",
            'The name should be TradegenEscrow'
        );

        let data4 = await tradegenInstance.methods.balanceOf(tradegenEscrowAddress).call();
        console.log(data4);

        assert(
            data4 == 1000000,
            'The balance should be 1000000'
        );
    });

    it('Add recipient from different address', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let txObject1 = await instance.methods.addRecipient(userManagerAddress, 500000, "UserManager");
            let tx1 = await kit.sendTransactionObject(txObject1, { from: account.address }); 
            let receipt1 = await tx1.waitReceipt();
        }
        catch(err)
        {
            console.log(err);
        }
        
        //Make sure state didn't change

        let data1 = await instance.methods.getAddresses().call();
        console.log(data1);

        assert(
            data1.length == 1,
            'There should be one element in addresses array'
        );

        assert(
            data1[0] == tradegenEscrowAddress,
            'First element in addresses array should be TradegenEscrow'
        );

        let data2 = await instance.methods.getRecipientByName("TradegenEscrow").call();
        console.log(data2);
        
        let balance = data2['0'];
        let address = data2['1'];

        assert(
            balance == 1000000,
            'The balance should be 1000000'
        );

        assert(
            address == tradegenEscrowAddress,
            'The address should be tradegen escrow address'
        );

        let data3 = await instance.methods.getRecipientByAddress(tradegenEscrowAddress).call();
        console.log(data3);

        let balance2 = data3['0'];
        let name = data3['1'];

        assert(
            balance2 == 1000000,
            'The balance should be 1000000'
        );

        assert(
            name == "TradegenEscrow",
            'The name should be TradegenEscrow'
        );

        let data4 = await tradegenInstance.methods.balanceOf(tradegenEscrowAddress).call();
        console.log(data4);

        assert(
            data4 == 1000000,
            'The balance should be 1000000'
        );
    });

    it('Add second recipient from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);
 
        let txObject1 = await instance.methods.addRecipient(userManagerAddress, 500000, "UserManager");
        let tx1 = await kit.sendTransactionObject(txObject1, { from: account.address }); 
        let receipt1 = await tx1.waitReceipt();

        let data1 = await instance.methods.getAddresses().call();
        console.log(data1);
        
        assert(
            data1.length == 2,
            'There should be two elements in addresses array'
        );

        assert(
            data1[0] == tradegenEscrowAddress,
            'First element in addresses array should be TradegenEscrow'
        );

        assert(
            data1[1] == userManagerAddress,
            'Second element in addresses array should be UserManager'
        );

        //Make sure TradegenEscrow contract isn't affected

        let data2 = await instance.methods.getRecipientByName("TradegenEscrow").call();
        console.log(data2);
        
        let balance = data2['0'];
        let address = data2['1'];

        assert(
            balance == 1000000,
            'The balance should be 1000000'
        );

        assert(
            address == tradegenEscrowAddress,
            'The address should be tradegen escrow address'
        );

        let data3 = await instance.methods.getRecipientByAddress(tradegenEscrowAddress).call();
        console.log(data3);

        let balance2 = data3['0'];
        let name = data3['1'];

        assert(
            balance2 == 1000000,
            'The balance should be 1000000'
        );

        assert(
            name == "TradegenEscrow",
            'The name should be TradegenEscrow'
        );

        let data4 = await tradegenInstance.methods.balanceOf(tradegenEscrowAddress).call();
        console.log(data4);

        assert(
            data4 == 1000000,
            'The balance should be 1000000'
        );

        //Check if UserManager contract was added correctly

        let data5 = await instance.methods.getRecipientByName("UserManager").call();
        console.log(data5);
        
        let userManagerBalance = data5['0'];
        let userManagerReturnedAddress = data5['1'];

        assert(
            userManagerBalance == 500000,
            'The user manager balance should be 500000'
        );

        assert(
            userManagerReturnedAddress == userManagerAddress,
            'The returned address should be user manager address'
        );

        let data6 = await instance.methods.getRecipientByAddress(userManagerAddress).call();
        console.log(data6);

        let balance3 = data6['0'];
        let name3 = data6['1'];

        assert(
            balance3 == 500000,
            'The balance should be 500000'
        );

        assert(
            name3 == "UserManager",
            'The name should be UserManager'
        );

        let data7 = await tradegenInstance.methods.balanceOf(userManagerAddress).call();
        console.log(data7);

        assert(
            data7 == 500000,
            'The balance should be 500000'
        );
    });
}

initContract();