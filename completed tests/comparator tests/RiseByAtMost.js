const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const RiseByAtMost = require('../build/contracts/RiseByAtMost.json');
const PreviousNPriceUpdates = require('../build/contracts/PreviousNPriceUpdates.json');
const NPercent = require('../build/contracts/NPercent.json');

var contractAddress = "0x22733D222aEf0b160E334c34b404f2eb88513731";
var ownerAddress = "0xb10199414D158A264e25A5ec06b463c0cD8457Bb";

var PreviousNPriceUpdatesAddress = "0xbef4b42Bd8c7B209F85E13CD4478999Ce6D9AE8A";
var NPercentAddress = "0x32E9636d372C57f10660776d85DcD1982af5A449";

function initContract()
{ 
    let instance = new web3.eth.Contract(RiseByAtMost.abi, contractAddress);
    let previousNPriceUpdatesInstance = new web3.eth.Contract(PreviousNPriceUpdates.abi, PreviousNPriceUpdatesAddress);
    let NPercentInstance = new web3.eth.Contract(NPercent.abi, NPercentAddress);

    it('Price and developer are initialized correctly', async () => {
        let data = await instance.methods.getPriceAndDeveloper().call();
        console.log(data);

        assert(
            BigNumber('10').isEqualTo(data['0'].toString()),
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
    
    it('Previous N price updates rise by at most N percent, first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(2);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await NPercentInstance.methods.addTradingBot(10);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, NPercentAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(0, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

        //Update second indicator state with first value
        let txObject5 = await NPercentInstance.methods.update(0, 1000);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

        //Get comparator status
        let status = await instance.methods.checkConditions(0, 0, 0);
        let txStatus = await kit.sendTransactionObject(status, { from: account.address });
        let receiptStatus = await txStatus.waitReceipt();
        let result = receiptStatus.events.ConditionStatus.returnValues.status;
        console.log(result);

        assert(
            !result,
            'Status should be false'
        );

        //Update first indicator state with second value; close up
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(0, 1050);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt();

        //Update second indicator state with second value
        let txObject7 = await NPercentInstance.methods.update(0, 1050);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt();

        //Get comparator status
        let status2 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus2 = await kit.sendTransactionObject(status2, { from: account.address });
        let receiptStatus2 = await txStatus2.waitReceipt();
        let result2 = receiptStatus2.events.ConditionStatus.returnValues.status;
        console.log(result2);

        assert(
            !result2,
            'Status should be false'
        );

        //Update first indicator state with third value; close up
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(0, 1150);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt();

        //Update second indicator state with third value
        let txObject9 = await NPercentInstance.methods.update(0, 1150);
        let tx9 = await kit.sendTransactionObject(txObject9, { from: account.address });
        let receipt9 = await tx9.waitReceipt();

        //Get first trading bot trading bot state history
        let history3 = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 0).call();
        console.log(history3);

        //Get comparator status
        let status3 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus3 = await kit.sendTransactionObject(status3, { from: account.address });
        let receiptStatus3 = await txStatus3.waitReceipt();
        let result3 = receiptStatus3.events.ConditionStatus.returnValues.status;
        console.log(result3);

        assert(
            !result3,
            'Status should be false'
        );

        //Update first indicator state with fourth value; close down
        let txObject10 = await previousNPriceUpdatesInstance.methods.update(0, 1140);
        let tx10 = await kit.sendTransactionObject(txObject10, { from: account.address });
        let receipt10 = await tx10.waitReceipt();

        //Update second indicator state with fourth value
        let txObject11 = await NPercentInstance.methods.update(0, 1140);
        let tx11 = await kit.sendTransactionObject(txObject11, { from: account.address });
        let receipt11 = await tx11.waitReceipt();

        //Get first trading bot trading bot state history
        let history = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 0).call();
        console.log(history);

        //Get first trading bot trading bot state history
        let history2 = await NPercentInstance.methods.getHistory(account.address, 0).call();
        console.log(history2);

        //Get comparator status
        let status4 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            result4,
            'Status should be true'
        );

        //Update first indicator state with fifth value; close down
        let txObject12 = await previousNPriceUpdatesInstance.methods.update(0, 1040);
        let tx12 = await kit.sendTransactionObject(txObject12, { from: account.address });
        let receipt12 = await tx12.waitReceipt();

        //Update second indicator state with fifth value
        let txObject13 = await NPercentInstance.methods.update(0, 1040);
        let tx13 = await kit.sendTransactionObject(txObject13, { from: account.address });
        let receipt13 = await tx13.waitReceipt();

        //Get first trading bot trading bot state history
        let history5 = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 0).call();
        console.log(history5);

        //Get comparator status
        let status5 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            !result5,
            'Status should be false'
        );
    });
    
    it('Previous N price updates rise by at most N percent, second instance of first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(2);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await NPercentInstance.methods.addTradingBot(10);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, NPercentAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(1, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

        //Update second indicator state with first value
        let txObject5 = await NPercentInstance.methods.update(1, 1000);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

        //Get comparator status
        let status = await instance.methods.checkConditions(1, 1, 1);
        let txStatus = await kit.sendTransactionObject(status, { from: account.address });
        let receiptStatus = await txStatus.waitReceipt();
        let result = receiptStatus.events.ConditionStatus.returnValues.status;
        console.log(result);

        assert(
            !result,
            'Status should be false'
        );

        //Update first indicator state with second value; close up
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(1, 1050);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt();

        //Update second indicator state with second value
        let txObject7 = await NPercentInstance.methods.update(1, 1050);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt();

        //Get comparator status
        let status2 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus2 = await kit.sendTransactionObject(status2, { from: account.address });
        let receiptStatus2 = await txStatus2.waitReceipt();
        let result2 = receiptStatus2.events.ConditionStatus.returnValues.status;
        console.log(result2);

        assert(
            !result2,
            'Status should be false'
        );

        //Update first indicator state with third value; close up
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(1, 1150);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt();

        //Update second indicator state with third value
        let txObject9 = await NPercentInstance.methods.update(1, 1150);
        let tx9 = await kit.sendTransactionObject(txObject9, { from: account.address });
        let receipt9 = await tx9.waitReceipt();

        //Get first trading bot trading bot state history
        let history3 = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 1).call();
        console.log(history3);

        //Get comparator status
        let status3 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus3 = await kit.sendTransactionObject(status3, { from: account.address });
        let receiptStatus3 = await txStatus3.waitReceipt();
        let result3 = receiptStatus3.events.ConditionStatus.returnValues.status;
        console.log(result3);

        assert(
            !result3,
            'Status should be false'
        );

        //Update first indicator state with fourth value; close down
        let txObject10 = await previousNPriceUpdatesInstance.methods.update(1, 1140);
        let tx10 = await kit.sendTransactionObject(txObject10, { from: account.address });
        let receipt10 = await tx10.waitReceipt();

        //Update second indicator state with fourth value
        let txObject11 = await NPercentInstance.methods.update(1, 1140);
        let tx11 = await kit.sendTransactionObject(txObject11, { from: account.address });
        let receipt11 = await tx11.waitReceipt();

        //Get first trading bot trading bot state history
        let history = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 1).call();
        console.log(history);

        //Get first trading bot trading bot state history
        let history2 = await NPercentInstance.methods.getHistory(account.address, 1).call();
        console.log(history2);

        //Get comparator status
        let status4 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            result4,
            'Status should be true'
        );

        //Update first indicator state with fifth value; close down
        let txObject12 = await previousNPriceUpdatesInstance.methods.update(1, 1040);
        let tx12 = await kit.sendTransactionObject(txObject12, { from: account.address });
        let receipt12 = await tx12.waitReceipt();

        //Update second indicator state with fifth value
        let txObject13 = await NPercentInstance.methods.update(1, 1040);
        let tx13 = await kit.sendTransactionObject(txObject13, { from: account.address });
        let receipt13 = await tx13.waitReceipt();

        //Get first trading bot trading bot state history
        let history5 = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 1).call();
        console.log(history5);

        //Get comparator status
        let status5 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            !result5,
            'Status should be false'
        );
    });
    
    it('Previous N price updates rise by at most N percent, second trading bot', async () => {
        let account = await getAccount3();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(2);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await NPercentInstance.methods.addTradingBot(10);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, NPercentAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(0, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

        //Update second indicator state with first value
        let txObject5 = await NPercentInstance.methods.update(0, 1000);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

        //Get comparator status
        let status = await instance.methods.checkConditions(0, 0, 0);
        let txStatus = await kit.sendTransactionObject(status, { from: account.address });
        let receiptStatus = await txStatus.waitReceipt();
        let result = receiptStatus.events.ConditionStatus.returnValues.status;
        console.log(result);

        assert(
            !result,
            'Status should be false'
        );

        //Update first indicator state with second value; close up
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(0, 1050);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt();

        //Update second indicator state with second value
        let txObject7 = await NPercentInstance.methods.update(0, 1050);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt();

        //Get comparator status
        let status2 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus2 = await kit.sendTransactionObject(status2, { from: account.address });
        let receiptStatus2 = await txStatus2.waitReceipt();
        let result2 = receiptStatus2.events.ConditionStatus.returnValues.status;
        console.log(result2);

        assert(
            !result2,
            'Status should be false'
        );

        //Update first indicator state with third value; close up
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(0, 1150);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt();

        //Update second indicator state with third value
        let txObject9 = await NPercentInstance.methods.update(0, 1150);
        let tx9 = await kit.sendTransactionObject(txObject9, { from: account.address });
        let receipt9 = await tx9.waitReceipt();

        //Get first trading bot trading bot state history
        let history3 = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 0).call();
        console.log(history3);

        //Get comparator status
        let status3 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus3 = await kit.sendTransactionObject(status3, { from: account.address });
        let receiptStatus3 = await txStatus3.waitReceipt();
        let result3 = receiptStatus3.events.ConditionStatus.returnValues.status;
        console.log(result3);

        assert(
            !result3,
            'Status should be false'
        );

        //Update first indicator state with fourth value; close down
        let txObject10 = await previousNPriceUpdatesInstance.methods.update(0, 1140);
        let tx10 = await kit.sendTransactionObject(txObject10, { from: account.address });
        let receipt10 = await tx10.waitReceipt();

        //Update second indicator state with fourth value
        let txObject11 = await NPercentInstance.methods.update(0, 1140);
        let tx11 = await kit.sendTransactionObject(txObject11, { from: account.address });
        let receipt11 = await tx11.waitReceipt();

        //Get first trading bot trading bot state history
        let history = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 0).call();
        console.log(history);

        //Get first trading bot trading bot state history
        let history2 = await NPercentInstance.methods.getHistory(account.address, 0).call();
        console.log(history2);

        //Get comparator status
        let status4 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            result4,
            'Status should be true'
        );

        //Update first indicator state with fifth value; close down
        let txObject12 = await previousNPriceUpdatesInstance.methods.update(0, 1040);
        let tx12 = await kit.sendTransactionObject(txObject12, { from: account.address });
        let receipt12 = await tx12.waitReceipt();

        //Update second indicator state with fifth value
        let txObject13 = await NPercentInstance.methods.update(0, 1040);
        let tx13 = await kit.sendTransactionObject(txObject13, { from: account.address });
        let receipt13 = await tx13.waitReceipt();

        //Get first trading bot trading bot state history
        let history5 = await previousNPriceUpdatesInstance.methods.getHistory(account.address, 0).call();
        console.log(history5);

        //Get comparator status
        let status5 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            !result5,
            'Status should be false'
        );
    });
}

initContract();