const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const Up = require('../build/contracts/Up.json');

var contractAddress = "0x1771FfEB2f7A53123Dc9227D8CC281F5B6157363";
var ownerAddress = "0xb10199414D158A264e25A5ec06b463c0cD8457Bb";

async function initContract(){
    
    let instance = new web3.eth.Contract(
        Up.abi, contractAddress);

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

    it('State is updated correctly', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        //Add trading bot
        let txObject = await instance.methods.addTradingBot(1);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });

        let receipt = await tx.waitReceipt()
        console.log(receipt);

        //Update indicator state
        let txObject2 = await instance.methods.update(0, 1);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });

        let receipt2 = await tx2.waitReceipt()
        console.log(receipt2);

        let currentValue = await instance.methods.getValue(account.address, 0).call();
        console.log(currentValue);

        assert(
            currentValue[0] == 1,
            'Current value should be 1'
        );

        let history = await instance.methods.getHistory(account.address, 0).call();
        console.log(history);

        assert(
            history.length == 0,
            'Indicator history should have no elements'
        );

        //Add second instance of trading bot
        let txObject3 = await instance.methods.addTradingBot(1);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });

        let receipt3 = await tx3.waitReceipt()
        console.log(receipt3);

        //Update indicator state of second instance
        let txObject4 = await instance.methods.update(1, 1);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });

        let receipt4 = await tx4.waitReceipt()
        console.log(receipt4);

        let currentValue3 = await instance.methods.getValue(account.address, 1).call();
        console.log(currentValue3);

        assert(
            currentValue3[0] == 1,
            'Current value should be 1'
        );

        let history2 = await instance.methods.getHistory(account.address, 1).call();
        console.log(history2);

        assert(
            history2.length == 0,
            'Indicator history should have no elements'
        );
    });
}

initContract()