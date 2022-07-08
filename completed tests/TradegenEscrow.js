const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const TradegenEscrow = require('../build/contracts/TradegenEscrow.json');
const TradegenERC20 = require('../build/contracts/TradegenERC20.json');
const AddressResolver = require('../build/contracts/AddressResolver.json');

var contractAddress = "0x8Ae9314744F8690217Bbf46360B0e834da81B681";
var baseTradegenAddress = "0xb79d64d9Acc251b04A3Ca9f811EFf49Bde52BbbC";
var addressResolverAddress = "0x9452D986e6A206AcC93122B81598d9D97E0bAaa3";

function initContract()
{ 
    let instance = new web3.eth.Contract(TradegenEscrow.abi, contractAddress);
    let tradegenInstance = new web3.eth.Contract(TradegenERC20.abi, baseTradegenAddress);
    let addressResolverInstance = new web3.eth.Contract(AddressResolver.abi, addressResolverAddress);
    /*
    it('Initialize', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        //Add BaseTradegen contract address to AddressResolver if needed
        //let txObject = await addressResolverInstance.methods.setContractAddress("BaseTradegen", baseTradegenAddress);
        //let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        //let receipt = await tx.waitReceipt();

        //let data1 = await addressResolverInstance.methods.getContractAddress("BaseTradegen").call();
        //console.log(data1);

        //Transfer 1,000,000 TGEN to TradegenEscrow contract for testing
        let txObject1 = await tradegenInstance.methods.transfer(contractAddress, 1000000);
        let tx1 = await kit.sendTransactionObject(txObject1, { from: account.address }); 
        let receipt1 = await tx1.waitReceipt();

        let data1 = await tradegenInstance.methods.balanceOf(contractAddress).call();
        console.log(data1);
    });*/
    
    it('Add uniform monthly vesting schedule from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let account2 = await getAccount2();
        kit.connection.addAccount(account2.privateKey);

        let txObject1 = await instance.methods.addUniformMonthlyVestingSchedule(account2.address, 360000, 36);
        let tx1 = await kit.sendTransactionObject(txObject1, { from: account.address }); 
        let receipt1 = await tx1.waitReceipt();
        let timestamp = receipt1.events.AddedVestingSchedule.returnValues.timestamp;
        console.log(timestamp);

        let vestedBalance = await instance.methods.balanceOf(account2.address).call();
        console.log(vestedBalance);
        
        assert(
            vestedBalance == 360000,
            'Balance should be 360000 TGEN'
        );

        let numberOfVestingEntries = await instance.methods.numVestingEntries(account2.address).call();
        console.log(numberOfVestingEntries);

        assert(
            numberOfVestingEntries == 36,
            'The number of vesting entries should be 36'
        );

        let contractVestedBalance = await instance.methods.totalVestedBalance().call();
        console.log(contractVestedBalance);

        assert(
            contractVestedBalance == 360000,
            'The contract vested balance should be 360000 TGEN'
        );

        let nextVestingIndex = await instance.methods.getNextVestingIndex(account2.address).call();
        console.log(nextVestingIndex);

        assert(
            nextVestingIndex == 0,
            'The next vesting index should be 0'
        );

        let nextVestingQuantity = await instance.methods.getNextVestingQuantity(account2.address).call();
        console.log(nextVestingQuantity);

        assert(
            nextVestingQuantity == 10000,
            'The next vesting quantity should be 10000 TGEN'
        );

        let nextVestingTime = await instance.methods.getNextVestingTime(account2.address).call();
        console.log(nextVestingTime);

        assert(
            nextVestingTime == timestamp + (30 * 86400),
            'The next vesting time should be 30 days from now'
        );
    });
    
    it('Add uniform monthly vesting schedule from different address', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let account2 = await getAccount2();
        kit.connection.addAccount(account2.privateKey);

        try 
        {
            let txObject1 = await instance.methods.addUniformMonthlyVestingSchedule(account.address, 360000, 36);
            let tx1 = await kit.sendTransactionObject(txObject1, { from: account2.address }); 
            let receipt1 = await tx1.waitReceipt();
        }
        catch(err)
        {
            console.log(err);
        }

        //Make sure account wasn't added

        let vestedBalance = await instance.methods.balanceOf(account.address).call();
        console.log(vestedBalance);
        
        assert(
            vestedBalance == 0,
            'Balance should be 0 TGEN'
        );

        let numberOfVestingEntries = await instance.methods.numVestingEntries(account.address).call();
        console.log(numberOfVestingEntries);

        assert(
            numberOfVestingEntries == 0,
            'The number of vesting entries should be 0'
        );

        let contractVestedBalance = await instance.methods.totalVestedBalance().call();
        console.log(contractVestedBalance);

        assert(
            contractVestedBalance == 360000,
            'The contract vested balance should be 360000 TGEN'
        );

        //Make sure first account state was not changed

        let vestedBalance2 = await instance.methods.balanceOf(account2.address).call();
        console.log(vestedBalance2);
        
        assert(
            vestedBalance2 == 360000,
            'Balance should be 360000 TGEN'
        );

        let numberOfVestingEntries2 = await instance.methods.numVestingEntries(account2.address).call();
        console.log(numberOfVestingEntries2);

        assert(
            numberOfVestingEntries2 == 36,
            'The number of vesting entries should be 36'
        );
    });

    it('Vest when no TGEN has vested yet', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let account2 = await getAccount2();
        kit.connection.addAccount(account2.privateKey);

        let originalBalance = await tradegenInstance.methods.balanceOf(account2.address).call();
        console.log(originalBalance);

        let txObject1 = await instance.methods.vest();
        let tx1 = await kit.sendTransactionObject(txObject1, { from: account.address }); 
        let receipt1 = await tx1.waitReceipt();

        let newBalance = await tradegenInstance.methods.balanceOf(account2.address).call();
        console.log(newBalance);
        
        assert(
            originalBalance == newBalance,
            'TGEN balance should not change'
        );

        let nextVestingIndex = await instance.methods.getNextVestingIndex(account2.address).call();
        console.log(nextVestingIndex);

        assert(
            nextVestingIndex == 0,
            'The next vesting index should be 0'
        );
    });
    
    it('Add custom vesting schedule from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let account3 = await getAccount3();
        kit.connection.addAccount(account3.privateKey);

        let times = [];
        let firstVestingTimestamp = Math.floor(Date.now() / 1000) + 20; //20 seconds from now
        let secondVestingTimestamp = firstVestingTimestamp + 30000;
        times.push(firstVestingTimestamp);
        times.push(secondVestingTimestamp);

        let amounts = [];
        let firstAmount = 100000;
        let secondAmount = 200000;
        amounts.push(firstAmount);
        amounts.push(secondAmount);

        let txObject1 = await instance.methods.addCustomVestingSchedule(account3.address, times, amounts);
        let tx1 = await kit.sendTransactionObject(txObject1, { from: account.address }); 
        let receipt1 = await tx1.waitReceipt();

        let vestedBalance = await instance.methods.balanceOf(account3.address).call();
        console.log(vestedBalance);
        
        assert(
            vestedBalance == 300000,
            'Balance should be 300000 TGEN'
        );

        let numberOfVestingEntries = await instance.methods.numVestingEntries(account3.address).call();
        console.log(numberOfVestingEntries);

        assert(
            numberOfVestingEntries == 2,
            'The number of vesting entries should be 2'
        );

        let contractVestedBalance = await instance.methods.totalVestedBalance().call();
        console.log(contractVestedBalance);

        assert(
            contractVestedBalance == 660000,
            'The contract vested balance should be 660000 TGEN'
        );

        let nextVestingIndex = await instance.methods.getNextVestingIndex(account3.address).call();
        console.log(nextVestingIndex);

        assert(
            nextVestingIndex == 0,
            'The next vesting index should be 0'
        );

        let nextVestingQuantity = await instance.methods.getNextVestingQuantity(account3.address).call();
        console.log(nextVestingQuantity);

        assert(
            nextVestingQuantity == 100000,
            'The next vesting quantity should be 100000 TGEN'
        );

        let nextVestingTime = await instance.methods.getNextVestingTime(account3.address).call();
        console.log(nextVestingTime);

        assert(
            nextVestingTime == firstVestingTimestamp,
            'The next vesting time should be 20 seconds from now'
        );
    });

    it('Add custom vesting schedule from different address', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let account2 = await getAccount2();
        kit.connection.addAccount(account2.privateKey);

        let account3 = await getAccount3();
        kit.connection.addAccount(account3.privateKey);

        let times = [];
        let firstVestingTimestamp = Math.floor(Date.now() / 1000) + 20; //20 seconds from now
        let secondVestingTimestamp = firstVestingTimestamp + 30000;
        times.push(firstVestingTimestamp);
        times.push(secondVestingTimestamp);

        let amounts = [];
        let firstAmount = 999;
        let secondAmount = 8888;
        amounts.push(firstAmount);
        amounts.push(secondAmount);

        try
        {
            let txObject1 = await instance.methods.addCustomVestingSchedule(account.address, times, amounts);
            let tx1 = await kit.sendTransactionObject(txObject1, { from: account3.address }); 
            let receipt1 = await tx1.waitReceipt();
        }
        catch(err)
        {
            console.log(err);
        }

        //Make sure account wasn't added

        let vestedBalance = await instance.methods.balanceOf(account.address).call();
        console.log(vestedBalance);
        
        assert(
            vestedBalance == 0,
            'Balance should be 0 TGEN'
        );

        let numberOfVestingEntries = await instance.methods.numVestingEntries(account.address).call();
        console.log(numberOfVestingEntries);

        assert(
            numberOfVestingEntries == 0,
            'The number of vesting entries should be 0'
        );

        let contractVestedBalance = await instance.methods.totalVestedBalance().call();
        console.log(contractVestedBalance);

        assert(
            contractVestedBalance == 660000,
            'The contract vested balance should be 660000 TGEN'
        );

        //Make sure first recipient's state did not change

        let vestedBalance2 = await instance.methods.balanceOf(account2.address).call();
        console.log(vestedBalance2);
        
        assert(
            vestedBalance2 == 360000,
            'Balance should be 360000 TGEN'
        );

        let numberOfVestingEntries2 = await instance.methods.numVestingEntries(account2.address).call();
        console.log(numberOfVestingEntries2);

        assert(
            numberOfVestingEntries2 == 36,
            'The number of vesting entries should be 36'
        );

        //Make sure second recipient's state did not change

        let vestedBalance3 = await instance.methods.balanceOf(account3.address).call();
        console.log(vestedBalance3);
        
        assert(
            vestedBalance3 == 300000,
            'Balance should be 300000 TGEN'
        );

        let numberOfVestingEntries3 = await instance.methods.numVestingEntries(account3.address).call();
        console.log(numberOfVestingEntries3);

        assert(
            numberOfVestingEntries3 == 2,
            'The number of vesting entries should be 2'
        );
    });

    it('Vest with TGEN available', async () => {
        let account3 = await getAccount3();
        kit.connection.addAccount(account3.privateKey);

        let originalBalance = await tradegenInstance.methods.balanceOf(account3.address).call();
        console.log(originalBalance);

        let txObject1 = await instance.methods.vest();
        let tx1 = await kit.sendTransactionObject(txObject1, { from: account3.address }); 
        let receipt1 = await tx1.waitReceipt();

        let newBalance = await tradegenInstance.methods.balanceOf(account3.address).call();
        console.log(newBalance);
        
        assert(
            newBalance == originalBalance + 100000,
            'TGEN balance should rise by 100000'
        );

        let nextVestingIndex = await instance.methods.getNextVestingIndex(account3.address).call();
        console.log(nextVestingIndex);

        assert(
            nextVestingIndex == 1,
            'The next vesting index should be 1'
        );

        let nextVestingQuantity = await instance.methods.getNextVestingQuantity(account3.address).call();
        console.log(nextVestingQuantity);

        assert(
            nextVestingQuantity == 200000,
            'The next vesting quantity should be 200000 TGEN'
        );

        let vestedBalance = await instance.methods.balanceOf(account3.address).call();
        console.log(vestedBalance);
        
        assert(
            vestedBalance == 200000,
            'Vested balance should be 200000 TGEN'
        );

        let contractVestedBalance = await instance.methods.totalVestedBalance().call();
        console.log(contractVestedBalance);

        assert(
            contractVestedBalance == 560000,
            'The contract vested balance should be 560000 TGEN'
        );
    });
}

initContract();