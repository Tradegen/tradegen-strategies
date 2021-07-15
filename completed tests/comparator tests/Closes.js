const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const Closes = require('../build/contracts/Closes.json');
const LatestPrice = require('../build/contracts/LatestPrice.json');
const PreviousNPriceUpdates = require('../build/contracts/PreviousNPriceUpdates.json');
const Down = require('../build/contracts/Down.json');
const Up = require('../build/contracts/Up.json');

var contractAddress = "0x8EA108b73127ab6D67d5927336D65E218EEdB566";
var ownerAddress = "0xb10199414D158A264e25A5ec06b463c0cD8457Bb";

var LatestPriceAddress = "0x4F509176403105258e5356ea552D911e0C96ADFb";
var PreviousNPriceUpdatesAddress = "0x1dB52F2F5B65d3B3A11A612f1f3E2D9e8986E07A";
var DownAddress = "0xbe3D4777082309984be615bdbe8ef2B5B4022e2A";
var UpAddress = "0xDe8133c62EB17aB12A1c654D72Fd5b13220985A6";

function initContract()
{ 
    let instance = new web3.eth.Contract(Closes.abi, contractAddress);
    let latestPriceInstance = new web3.eth.Contract(LatestPrice.abi, LatestPriceAddress);
    let previousNPriceUpdatesInstance = new web3.eth.Contract(PreviousNPriceUpdates.abi, PreviousNPriceUpdatesAddress);
    let downInstance = new web3.eth.Contract(Down.abi, DownAddress);
    let upInstance = new web3.eth.Contract(Up.abi, UpAddress);

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
    
    it('Latest price closes down, first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await latestPriceInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(LatestPriceAddress, DownAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await latestPriceInstance.methods.update(0, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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
        let txObject5 = await latestPriceInstance.methods.update(0, 2000);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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

        //Update first indicator state with third value; close down
        let txObject6 = await latestPriceInstance.methods.update(0, 1500);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

        //Get comparator status
        let status3 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus3 = await kit.sendTransactionObject(status3, { from: account.address });
        let receiptStatus3 = await txStatus3.waitReceipt();
        let result3 = receiptStatus3.events.ConditionStatus.returnValues.status;
        console.log(result3);

        assert(
            result3,
            'Status should be true'
        );

        //Update first indicator state with fourth value; close down
        let txObject7 = await latestPriceInstance.methods.update(0, 1000);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

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
        
        //Update first indicator state with fifth value; close up
        let txObject8 = await latestPriceInstance.methods.update(0, 1500);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

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
    
    it('Latest price closes down, second instance of first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await latestPriceInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(LatestPriceAddress, DownAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await latestPriceInstance.methods.update(1, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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

        //Update first indicator state with second value; close down
        let txObject5 = await latestPriceInstance.methods.update(1, 500);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

        //Get comparator status
        let status2 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus2 = await kit.sendTransactionObject(status2, { from: account.address });
        let receiptStatus2 = await txStatus2.waitReceipt();
        let result2 = receiptStatus2.events.ConditionStatus.returnValues.status;
        console.log(result2);

        assert(
            result2,
            'Status should be true'
        );

        //Update first indicator state with third value; close up
        let txObject6 = await latestPriceInstance.methods.update(1, 1000);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

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

        //Update first indicator state with fourth value; close up
        let txObject7 = await latestPriceInstance.methods.update(1, 1500);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

        //Get comparator status
        let status4 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            !result4,
            'Status should be false'
        );
        
        //Update first indicator state with fifth value; close down
        let txObject8 = await latestPriceInstance.methods.update(1, 1000);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

        //Get comparator status
        let status5 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            result5,
            'Status should be true'
        );
    });
    
    it('Latest price closes down, second trading bot', async () => {
        let account = await getAccount3();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await latestPriceInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(LatestPriceAddress, DownAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await latestPriceInstance.methods.update(0, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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

        //Update first indicator state with second value; close down
        let txObject5 = await latestPriceInstance.methods.update(0, 500);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

        //Get comparator status
        let status2 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus2 = await kit.sendTransactionObject(status2, { from: account.address });
        let receiptStatus2 = await txStatus2.waitReceipt();
        let result2 = receiptStatus2.events.ConditionStatus.returnValues.status;
        console.log(result2);

        assert(
            result2,
            'Status should be true'
        );

        //Update first indicator state with third value; close up
        let txObject6 = await latestPriceInstance.methods.update(0, 1000);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

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

        //Update first indicator state with fourth value; close up
        let txObject7 = await latestPriceInstance.methods.update(0, 1500);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

        //Get comparator status
        let status4 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            !result4,
            'Status should be false'
        );
        
        //Update first indicator state with fifth value; close down
        let txObject8 = await latestPriceInstance.methods.update(0, 1000);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

        //Get comparator status
        let status5 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            result5,
            'Status should be true'
        );
    });
    
    it('Latest price closes up, first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await latestPriceInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await upInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(LatestPriceAddress, UpAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await latestPriceInstance.methods.update(0, 1500);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

        //Get comparator status
        let status = await instance.methods.checkConditions(0, 0, 0);
        let txStatus = await kit.sendTransactionObject(status, { from: account.address });
        let receiptStatus = await txStatus.waitReceipt();
        let result = receiptStatus.events.ConditionStatus.returnValues.status;
        console.log(result);

        assert(
            result,
            'Status should be true'
        );

        //Update first indicator state with second value; close up
        let txObject5 = await latestPriceInstance.methods.update(0, 2000);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

        //Get comparator status
        let status2 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus2 = await kit.sendTransactionObject(status2, { from: account.address });
        let receiptStatus2 = await txStatus2.waitReceipt();
        let result2 = receiptStatus2.events.ConditionStatus.returnValues.status;
        console.log(result2);

        assert(
            result2,
            'Status should be true'
        );

        //Update first indicator state with third value; close down
        let txObject6 = await latestPriceInstance.methods.update(0, 1500);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

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

        //Update first indicator state with fourth value; close up
        let txObject7 = await latestPriceInstance.methods.update(0, 1600);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

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
        
        //Update first indicator state with fifth value; close up
        let txObject8 = await latestPriceInstance.methods.update(0, 1800);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

        //Get comparator status
        let status5 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            result5,
            'Status should be true'
        );
    });
    
    it('Latest price closes up, second instance of first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await latestPriceInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await upInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(LatestPriceAddress, UpAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await latestPriceInstance.methods.update(1, 1500);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

        //Get comparator status
        let status = await instance.methods.checkConditions(1, 1, 1);
        let txStatus = await kit.sendTransactionObject(status, { from: account.address });
        let receiptStatus = await txStatus.waitReceipt();
        let result = receiptStatus.events.ConditionStatus.returnValues.status;
        console.log(result);

        assert(
            result,
            'Status should be true'
        );

        //Update first indicator state with second value; close down
        let txObject5 = await latestPriceInstance.methods.update(1, 1000);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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
        let txObject6 = await latestPriceInstance.methods.update(1, 1500);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

        //Get comparator status
        let status3 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus3 = await kit.sendTransactionObject(status3, { from: account.address });
        let receiptStatus3 = await txStatus3.waitReceipt();
        let result3 = receiptStatus3.events.ConditionStatus.returnValues.status;
        console.log(result3);

        assert(
            result3,
            'Status should be true'
        );

        //Update first indicator state with fourth value; close up
        let txObject7 = await latestPriceInstance.methods.update(1, 1600);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

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
        let txObject8 = await latestPriceInstance.methods.update(1, 800);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

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
    
    it('Latest price closes up, second trading bot', async () => {
        let account = await getAccount3();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await latestPriceInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await upInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(LatestPriceAddress, UpAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await latestPriceInstance.methods.update(0, 1500);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

        //Get comparator status
        let status = await instance.methods.checkConditions(0, 0, 0);
        let txStatus = await kit.sendTransactionObject(status, { from: account.address });
        let receiptStatus = await txStatus.waitReceipt();
        let result = receiptStatus.events.ConditionStatus.returnValues.status;
        console.log(result);

        assert(
            result,
            'Status should be true'
        );

        //Update first indicator state with second value; close down
        let txObject5 = await latestPriceInstance.methods.update(0, 1000);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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
        let txObject6 = await latestPriceInstance.methods.update(0, 1500);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

        //Get comparator status
        let status3 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus3 = await kit.sendTransactionObject(status3, { from: account.address });
        let receiptStatus3 = await txStatus3.waitReceipt();
        let result3 = receiptStatus3.events.ConditionStatus.returnValues.status;
        console.log(result3);

        assert(
            result3,
            'Status should be true'
        );

        //Update first indicator state with fourth value; close up
        let txObject7 = await latestPriceInstance.methods.update(0, 1600);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

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
        let txObject8 = await latestPriceInstance.methods.update(0, 800);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

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
    
    it('Previous N price updates close down, first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, DownAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(0, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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

        //Update first indicator state with second value; close down
        let txObject5 = await previousNPriceUpdatesInstance.methods.update(0, 900);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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

        //Update first indicator state with third value; close down
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(0, 800);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

        //Get comparator status
        let status3 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus3 = await kit.sendTransactionObject(status3, { from: account.address });
        let receiptStatus3 = await txStatus3.waitReceipt();
        let result3 = receiptStatus3.events.ConditionStatus.returnValues.status;
        console.log(result3);

        assert(
            result3,
            'Status should be true'
        );

        //Update first indicator state with fourth value; close up
        let txObject7 = await previousNPriceUpdatesInstance.methods.update(0, 1000);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

        //Get comparator status
        let status4 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            !result4,
            'Status should be false'
        );
        
        //Update first indicator state with fifth value; close down
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(0, 500);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

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
    
    it('Previous N price updates close down, second instance of first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, DownAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(1, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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
        let txObject5 = await previousNPriceUpdatesInstance.methods.update(1, 1100);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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

        //Update first indicator state with third value; close down
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(1, 800);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

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
        let txObject7 = await previousNPriceUpdatesInstance.methods.update(1, 700);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

        //Get comparator status
        let status4 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            !result4,
            'Status should be false'
        );
        
        //Update first indicator state with fifth value; close down
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(1, 500);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

        //Get comparator status
        let status5 = await instance.methods.checkConditions(1, 1, 1);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            result5,
            'Status should be true'
        );
    });
    
    it('Previous N price updates close down, second trading bot', async () => {
        let account = await getAccount3();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, DownAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(0, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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
        let txObject5 = await previousNPriceUpdatesInstance.methods.update(0, 1100);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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

        //Update first indicator state with third value; close down
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(0, 800);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

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
        let txObject7 = await previousNPriceUpdatesInstance.methods.update(0, 700);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

        //Get comparator status
        let status4 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            !result4,
            'Status should be false'
        );
        
        //Update first indicator state with fifth value; close down
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(0, 500);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

        //Get comparator status
        let status5 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            result5,
            'Status should be true'
        );
    });
    
    it('Previous N price updates close up, first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, UpAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(0, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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

        //Update first indicator state with second value; close down
        let txObject5 = await previousNPriceUpdatesInstance.methods.update(0, 900);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(0, 1100);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

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

        //Update first indicator state with fourth value; close up
        let txObject7 = await previousNPriceUpdatesInstance.methods.update(0, 1500);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

        //Get comparator status
        let status4 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus4 = await kit.sendTransactionObject(status4, { from: account.address });
        let receiptStatus4 = await txStatus4.waitReceipt();
        let result4 = receiptStatus4.events.ConditionStatus.returnValues.status;
        console.log(result4);

        assert(
            !result4,
            'Status should be false'
        );
        
        //Update first indicator state with fifth value; close up
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(0, 2000);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

        //Get comparator status
        let status5 = await instance.methods.checkConditions(0, 0, 0);
        let txStatus5 = await kit.sendTransactionObject(status5, { from: account.address });
        let receiptStatus5 = await txStatus5.waitReceipt();
        let result5 = receiptStatus5.events.ConditionStatus.returnValues.status;
        console.log(result5);

        assert(
            result5,
            'Status should be true'
        );
    });
    
    it('Previous N price updates close up, second instance of first trading bot', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, UpAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(1, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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
        let txObject5 = await previousNPriceUpdatesInstance.methods.update(1, 1100);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(1, 1200);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

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

        //Update first indicator state with fourth value; close up
        let txObject7 = await previousNPriceUpdatesInstance.methods.update(1, 1500);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

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
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(1, 200);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

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
    
    it('Previous N price updates close up, second trading bot', async () => {
        let account = await getAccount3();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot to first indicator
        let txObject = await previousNPriceUpdatesInstance.methods.addTradingBot(3);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        //Add trading bot to second indicator
        let txObject2 = await downInstance.methods.addTradingBot(3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        //Add trading bot to comparator
        let txObject3 = await instance.methods.addTradingBot(PreviousNPriceUpdatesAddress, UpAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        //Update first indicator state with first value
        let txObject4 = await previousNPriceUpdatesInstance.methods.update(0, 1000);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

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
        let txObject5 = await previousNPriceUpdatesInstance.methods.update(0, 1100);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address });
        let receipt5 = await tx5.waitReceipt();

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
        let txObject6 = await previousNPriceUpdatesInstance.methods.update(0, 1200);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address });
        let receipt6 = await tx6.waitReceipt()

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

        //Update first indicator state with fourth value; close up
        let txObject7 = await previousNPriceUpdatesInstance.methods.update(0, 1500);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address });
        let receipt7 = await tx7.waitReceipt()

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
        let txObject8 = await previousNPriceUpdatesInstance.methods.update(0, 200);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address });
        let receipt8 = await tx8.waitReceipt()

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