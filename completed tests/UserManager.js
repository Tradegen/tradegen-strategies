const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const UserManager = require('../build/contracts/UserManager.json');

var contractAddress = "0x26c807d9fc2b601dc8f48617572337f6C22BD970";

function initContract()
{ 
    let instance = new web3.eth.Contract(UserManager.abi, contractAddress);
    
    it('Register first user', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);
        
        let txObject = await instance.methods.registerUser("FirstUser");
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();
        let resultAddress = receipt.events.RegisteredUser.returnValues.user;
        let resultTimestamp = receipt.events.RegisteredUser.returnValues.timestamp;
        console.log(resultAddress);
        console.log(resultTimestamp);

        let data = await instance.methods.getUser(account.address).call();
        console.log(data);

        let timestamp = data['0'];
        let username = data['1'];
        
        assert(
            timestamp == resultTimestamp,
            'Timestamp does not match'
        );

        assert(
            username == "FirstUser",
            'Username does not match'
        );

        assert(
            resultAddress == account.address,
            'Address does not match'
        );
    });
    
    it('Edit username; unique username', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);
        
        let txObject = await instance.methods.editUsername("Satoshi");
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();
        let resultAddress = receipt.events.UpdatedUsername.returnValues.user;
        let resultTimestamp = receipt.events.UpdatedUsername.returnValues.timestamp;
        let resultUsername = receipt.events.UpdatedUsername.returnValues.newUsername;
        console.log(resultAddress);
        console.log(resultTimestamp);
        console.log(resultUsername);

        let data = await instance.methods.getUser(account.address).call();
        console.log(data);

        let username = data['1'];

        assert(
            username == "Satoshi",
            'Username does not match'
        );

        assert(
            resultAddress == account.address,
            'Address does not match'
        );
    });
    
    it('Register user; existing username', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);
        
        try
        {
            let txObject = await instance.methods.registerUser("Satoshi");
            let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
            let receipt = await tx.waitReceipt();
            let resultAddress = receipt.events.RegisteredUser.returnValues.user;
            let resultTimestamp = receipt.events.RegisteredUser.returnValues.timestamp;
            console.log(resultAddress);
            console.log(resultTimestamp);

            let data = await instance.methods.getUser(account.address).call();
            console.log(data);

            let username = data['1'];

            assert(
                username == "Satoshi",
                'Username does not match'
            );

            assert(
                resultAddress == account.address,
                'Address does not match'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });
    
    it('Edit username; existing username', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);
        
        let txObject = await instance.methods.registerUser("SecondUser");
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();
        let resultAddress = receipt.events.RegisteredUser.returnValues.user;
        let resultTimestamp = receipt.events.RegisteredUser.returnValues.timestamp;
        console.log(resultAddress);
        console.log(resultTimestamp);

        let data = await instance.methods.getUser(account.address).call();
        console.log(data);

        let username = data['1'];

        assert(
            username == "SecondUser",
            'Username does not match'
        );

        assert(
            resultAddress == account.address,
            'Address does not match'
        );
        
        try
        {
            let txObject2 = await instance.methods.editUsername("Satoshi");
            let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address }); 
            let receipt2 = await tx2.waitReceipt();
            let resultAddress2 = receipt2.events.UpdatedUsername.returnValues.user;
            let resultTimestamp2 = receipt2.events.UpdatedUsername.returnValues.timestamp;
            console.log(resultAddress2);
            console.log(resultTimestamp2);

            let data2 = await instance.methods.getUser(account.address).call();
            console.log(data2);

            let username = data['1'];

            assert(
                username == "SecondUser",
                'Username should not change'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });

    it('Edit username; change back to old username', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);
        
        let txObject = await instance.methods.editUsername("FirstUser");
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();
        let resultAddress = receipt.events.UpdatedUsername.returnValues.user;
        let resultTimestamp = receipt.events.UpdatedUsername.returnValues.timestamp;
        let resultUsername = receipt.events.UpdatedUsername.returnValues.newUsername;
        console.log(resultAddress);
        console.log(resultTimestamp);
        console.log(resultUsername);

        let data = await instance.methods.getUser(account.address).call();
        console.log(data);

        let username = data['1'];

        assert(
            username == "FirstUser",
            'Username does not match'
        );

        assert(
            resultAddress == account.address,
            'Address does not match'
        );
    });
}

initContract();