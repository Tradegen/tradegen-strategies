const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const PoolProxy = require('../build/contracts/PoolProxy.json');
const AddressResolver = require('../build/contracts/AddressResolver.json');
const Settings = require('../build/contracts/Settings.json');

var contractAddress = "0x583f9AA2f0B799aE9Cb08AAA1D6e8606E62c4bED";
var addressResolverAddress = "0x9452D986e6A206AcC93122B81598d9D97E0bAaa3";
var settingsAddress = "0xC67DCC69EFDa1a60610366B74b5B10c7E695b374";
var ubeswapRouterAddress = "0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121";

var cUSD = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
var CELO = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9";
var UBE = "0x643Cf59C35C68ECb93BBe4125639F86D1C2109Ae";
var cMCO2 = "0xe1Aef5200e6A38Ea69aD544c479bD1a176C8a510";

function initContract()
{ 
    let instance = new web3.eth.Contract(PoolProxy.abi, contractAddress);
    let addressResolverInstance = new web3.eth.Contract(AddressResolver.abi, addressResolverAddress);
    let settingsInstance = new web3.eth.Contract(Settings.abi, settingsAddress);
    
    it('Initialize', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);
        
        //Add UbeswapRouter contract address to AddressResolver if needed
        let txObject1 = await addressResolverInstance.methods.setContractAddress("UbeswapRouter", ubeswapRouterAddress);
        let tx1 = await kit.sendTransactionObject(txObject1, { from: account.address }); 
        let receipt1 = await tx1.waitReceipt();

        let data1 = await addressResolverInstance.methods.getContractAddress("UbeswapRouter").call();
        console.log(data1);

        //Add PoolManager contract address to AddressResolver if needed
        //Use account.address as PoolManager address so I can call addressResolver.addPoolAddress()
        let txObject2 = await addressResolverInstance.methods.setContractAddress("PoolManager", account.address);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address }); 
        let receipt2 = await tx2.waitReceipt();

        let data2 = await addressResolverInstance.methods.getContractAddress("PoolManager").call();
        console.log(data2);

        //Add Settings contract address to AddressResolver if needed
        let txObject3 = await addressResolverInstance.methods.setContractAddress("Settings", settingsAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address }); 
        let receipt3 = await tx3.waitReceipt();

        let data3 = await addressResolverInstance.methods.getContractAddress("Settings").call();
        console.log(data3);

        //Set stable coin address
        let txObject4 = await settingsInstance.methods.setStableCoinAddress(cUSD);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address }); 
        let receipt4 = await tx4.waitReceipt();
        
        let data4 = await settingsInstance.methods.getStableCoinAddress().call();
        console.log(data4);

        //Add CELO as available currency
        let txObject5 = await settingsInstance.methods.addCurrencyKey("CELO", CELO);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address }); 
        let receipt5 = await tx5.waitReceipt();

        //Add UBE as available currency
        let txObject6 = await settingsInstance.methods.updateCurrencyKey("UBE", UBE);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address }); 
        let receipt6 = await tx6.waitReceipt();

        let data5 = await settingsInstance.methods.getAvailableCurrencies().call();
        console.log(data5);
        
        //Add pool address
        //Use account.address for testing
        let txObject7 = await addressResolverInstance.methods.addPoolAddress(account.address);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address }); 
        let receipt7 = await tx7.waitReceipt();
    });
    
    it('Get price of available currency', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let CELOprice = await instance.methods.getPrice(CELO).call();
        console.log(CELOprice);
    });
    
    it('Get price of unavailable currency', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        try
        {
            let cMCO2price = await instance.methods.getPrice(cMCO2).call();
            console.log(cMCO2price);

            assert(
                cMCO2price == 0,
                'cMCO2 should not have price'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });
    
    it('Get amounts out with available currency', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let CELOforUSD = await instance.methods.getAmountsOut(1000, CELO, cUSD).call();
        console.log(CELOforUSD);

        let CELOforUSD2 = await instance.methods.getAmountsOut(100000, CELO, cUSD).call();
        console.log(CELOforUSD2);
    });
    
    it('Get amounts out with unavailable currency', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        try
        {
            let cMCO2forUSD = await instance.methods.getAmountsOut(10000, cMCO2, cUSD).call();
            console.log(cMCO2forUSD);

            assert(
                cMCO2forUSD == 0,
                'cMCO2 should not have amounts out'
            );
        }
        catch(err)
        {
            console.log(err);
        }
        
    });
    
    it('Swap from pool', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let balance = await kit.getTotalBalance(account.address);
        console.log(balance);
        
        let goldToken = kit.contracts.wrapperCache.GoldToken.contract;

        //Send CELO from pool to BaseUbeswapAdapter before calling swapFromPool()
        let txObject = await goldToken.methods.transfer(contractAddress, 100000);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();

        let contractBalance = await kit.getTotalBalance(contractAddress);
        console.log(contractBalance);

        let txObject2 = await instance.methods.swapFromPool(CELO, cUSD, 100000, 500000);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address }); 
        let receipt2 = await tx2.waitReceipt();
        let result = receipt2.events.Swapped.returnValues;
        console.log(result);

        let newBalance = await kit.getTotalBalance(account.address);
        console.log(newBalance);

        let newContractBalance = await kit.getTotalBalance(contractAddress);
        console.log(newContractBalance);
    });
}

initContract();