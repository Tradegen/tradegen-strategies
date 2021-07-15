const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const LatestPrice = require('../build/contracts/LatestPrice.json');

var contractAddress = "0x0C96133A9acc4e8b9132F757960e64DB353ceb19";
var ownerAddress = "0xb10199414D158A264e25A5ec06b463c0cD8457Bb";

function initContract()
{ 
    let instance = new web3.eth.Contract(
        LatestPrice.abi, contractAddress);

    it('Price and developer are initialized correctly', async () => {
        let data = await instance.methods.getPriceAndDeveloper().call();
        console.log(data);

        assert(
            BigNumber('1e+19').isEqualTo(data['0'].toString()),
            'Price should be 10 TGEN'
        );

        assert(
            data['1'] == ownerAddress,
            'Developer does not match'
        );
    });

    it('Edit price from developer', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let txObject = await instance.methods.editPrice(30);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });

        let receipt = await tx.waitReceipt()
        console.log(receipt);

        let data = await instance.methods.getPriceAndDeveloper().call();
        console.log(data);

        assert(
            BigNumber(data['0']).isEqualTo(BigNumber(30)),
            'Price should be 30 TGEN'
        );
    });

    it('Edit price from non-developer', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let txObject = await instance.methods.editPrice(40);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address });

            let receipt = await tx.waitReceipt()
            console.log(receipt);

            let data = await instance.methods.getPriceAndDeveloper().call();
            console.log(data);

            assert(
                BigNumber(data['0']).isEqualTo(BigNumber(30)),
                'Price should be 30 TGEN'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });

    it('First trading bot state is updated correctly', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add first trading bot
        let txObject = await instance.methods.addTradingBot(1);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });

        let receipt = await tx.waitReceipt()

        //Update first trading bot indicator state with first value
        let txObject2 = await instance.methods.update(0, 100);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });

        let receipt2 = await tx2.waitReceipt()

        //Get first trading bot current value
        let currentValue = await instance.methods.getValue(account.address, 0).call();
        console.log(currentValue);

        assert(
            currentValue[0] == 100,
            'Current value should be 100'
        );

        //Update first trading bot indicator state with second value
        let txObject3 = await instance.methods.update(0, 150);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });

        let receipt3 = await tx3.waitReceipt()

        //Get first trading bot current value
        let currentValue2 = await instance.methods.getValue(account.address, 0).call();
        console.log(currentValue2);

        assert(
            currentValue2[0] == 150,
            'Current value should be 150'
        );

        //Get first trading bot trading bot state history
        let history = await instance.methods.getHistory(account.address, 0).call();
        console.log(history);

        assert(
            history.length == 2,
            'Indicator history should have two elements'
        );

        assert(
            history[0] == 100,
            'First element in history should be 100'
        );

        assert(
            history[1] == 150,
            'Second element in history should be 150'
        );
    });

    it('Second trading bot state is updated correctly', async () => {
        let account = await getAccount3();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot
        let txObject = await instance.methods.addTradingBot(1);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });

        let receipt = await tx.waitReceipt()

        //Update trading bot indicator state with first value
        let txObject2 = await instance.methods.update(0, 1000);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });

        let receipt2 = await tx2.waitReceipt()

        //Get trading bot current value
        let currentValue = await instance.methods.getValue(account.address, 0).call();
        console.log(currentValue);

        assert(
            currentValue[0] == 1000,
            'Current value should be 1000'
        );

        //Update trading bot indicator state with second value
        let txObject3 = await instance.methods.update(0, 1500);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });

        let receipt3 = await tx3.waitReceipt()

        //Get trading bot current value
        let currentValue2 = await instance.methods.getValue(account.address, 0).call();
        console.log(currentValue2);

        assert(
            currentValue2[0] == 1500,
            'Current value should be 1500'
        );

        //Get trading bot trading bot state history
        let history = await instance.methods.getHistory(account.address, 0).call();
        console.log(history);

        assert(
            history.length == 2,
            'Indicator history should have two elements'
        );

        assert(
            history[0] == 1000,
            'First element in history should be 1000'
        );

        assert(
            history[1] == 1500,
            'Second element in history should be 1500'
        );
    });
}

initContract();