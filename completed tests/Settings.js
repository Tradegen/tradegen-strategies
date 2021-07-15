const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const Settings = require('../build/contracts/Settings.json');

var contractAddress = "0x79F1f525E6b3c2949F83DDB5D685237e3B352D55";

function initContract()
{ 
    let instance = new web3.eth.Contract(Settings.abi, contractAddress);
    
    it('set parameters from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let txObject = await instance.methods.setParameterValue("StakingYield", 50);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt()

        let data = await instance.methods.getParameterValue("StakingYield").call();
        console.log(data);

        assert(
            BigNumber(data).isEqualTo(BigNumber(50)),
            'Staking yield should be 50 TGEN'
        );

        let txObject2 = await instance.methods.setParameterValue("TransactionFee", 3);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address }); 
        let receipt2 = await tx2.waitReceipt()

        let data2 = await instance.methods.getParameterValue("TransactionFee").call();
        console.log(data2);

        assert(
            BigNumber(data2).isEqualTo(BigNumber(3)),
            'Transaction fee should be 0.3%'
        );

        let txObject3 = await instance.methods.setParameterValue("VoteLimit", 10);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address }); 
        let receipt3 = await tx3.waitReceipt()

        let data3 = await instance.methods.getParameterValue("VoteLimit").call();
        console.log(data3);

        assert(
            BigNumber(data3).isEqualTo(BigNumber(10)),
            'Vote limit should be 10'
        );

        let txObject4 = await instance.methods.setParameterValue("VotingReward", 3);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address }); 
        let receipt4 = await tx4.waitReceipt()

        let data4 = await instance.methods.getParameterValue("VotingReward").call();
        console.log(data4);

        assert(
            BigNumber(data4).isEqualTo(BigNumber(3)),
            'Voting reward should be 3 TGEN'
        );

        let txObject5 = await instance.methods.setParameterValue("VotingPenalty", 15);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address }); 
        let receipt5 = await tx5.waitReceipt()

        let data5 = await instance.methods.getParameterValue("VotingPenalty").call();
        console.log(data5);

        assert(
            BigNumber(data5).isEqualTo(BigNumber(15)),
            'Voting penalty should be 15 TGEN'
        );

        let txObject6 = await instance.methods.setParameterValue("MinimumStakeToVote", 50);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address }); 
        let receipt6 = await tx6.waitReceipt()

        let data6 = await instance.methods.getParameterValue("MinimumStakeToVote").call();
        console.log(data6);

        assert(
            BigNumber(data6).isEqualTo(BigNumber(50)),
            'Minimum stake to vote should be 50 TGEN'
        );

        let txObject7 = await instance.methods.setParameterValue("StrategyApprovalThreshold", 80);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address }); 
        let receipt7 = await tx7.waitReceipt()

        let data7 = await instance.methods.getParameterValue("StrategyApprovalThreshold").call();
        console.log(data7);

        assert(
            BigNumber(data7).isEqualTo(BigNumber(80)),
            'Strategy approval threshold should be 80%'
        );

        let txObject8 = await instance.methods.setParameterValue("MaximumNumberOfEntryRules", 7);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address }); 
        let receipt8 = await tx8.waitReceipt()

        let data8 = await instance.methods.getParameterValue("MaximumNumberOfEntryRules").call();
        console.log(data8);

        assert(
            BigNumber(data8).isEqualTo(BigNumber(7)),
            'Maximum number of entry rules should be 7'
        );

        let txObject9 = await instance.methods.setParameterValue("MaximumNumberOfExitRules", 7);
        let tx9 = await kit.sendTransactionObject(txObject9, { from: account.address }); 
        let receipt9 = await tx9.waitReceipt()

        let data9 = await instance.methods.getParameterValue("MaximumNumberOfExitRules").call();
        console.log(data9);

        assert(
            BigNumber(data9).isEqualTo(BigNumber(7)),
            'Maximum number of exit rules should be 7'
        );

        let txObject10 = await instance.methods.setParameterValue("MaximumNumberOfPoolsPerUser", 1);
        let tx10 = await kit.sendTransactionObject(txObject10, { from: account.address }); 
        let receipt10 = await tx10.waitReceipt()

        let data10 = await instance.methods.getParameterValue("MaximumNumberOfPoolsPerUser").call();
        console.log(data10);

        assert(
            BigNumber(data10).isEqualTo(BigNumber(1)),
            'Maximum number of pools per user should be 1'
        );

        let txObject11 = await instance.methods.setParameterValue("MaximumPerformanceFee", 30);
        let tx11 = await kit.sendTransactionObject(txObject11, { from: account.address }); 
        let receipt11 = await tx11.waitReceipt()

        let data11 = await instance.methods.getParameterValue("MaximumPerformanceFee").call();
        console.log(data11);

        assert(
            BigNumber(data11).isEqualTo(BigNumber(30)),
            'Maximum performance fee should be 30%'
        );
    });
    
    it('Set parameter from different account', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let txObject = await instance.methods.setParameterValue("MaximumPerformanceFee", 40);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address });

            let receipt = await tx.waitReceipt()

            let data = await instance.methods.getParameterValue("MaximumPerformanceFee").call();
            console.log(data);

            assert(
                BigNumber(data).isEqualTo(BigNumber(30)),
                'Maximum performance fee should be 30%'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });
    
    it('Set stable coin address from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let stableCoinAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; //CUSD Alfajores address

        console.log(stableCoinAddress);

        let txObject = await instance.methods.setStableCoinAddress(stableCoinAddress);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt()

        let data = await instance.methods.getStableCoinAddress().call();
        console.log(data);

        assert(
            data == stableCoinAddress,
            'Stable coin address does not match'
        );
    });
    
    it('Set stable coin address from different account', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let celoAddress = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; //CELO Alfajores address
            let txObject = await instance.methods.setStableCoinAddress(celoAddress);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address });

            let receipt = await tx.waitReceipt()

            let data = await instance.methods.getStableCoinAddress().call();
            console.log(data);

            assert(
                data != celoAddress,
                'Stable coin address should not match CELO address'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });

    it('Add currency keys from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let celoAddress = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9"; //CELO Alfajores address
        let UBE = "0xe952fe9608a20f80f009a43AEB6F422750285638"; //UBE Alfajores address
        let cBTC = "0x73B16C87d01dd9C70f9451E96a97ab5A41196F66"; //cBTC Alfajores address
        let moss = "0xe1Aef5200e6A38Ea69aD544c479bD1a176C8a510"; //cMCO2 Alfajores address

        let txObject = await instance.methods.addCurrencyKey("CELO", celoAddress);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address });
        let receipt = await tx.waitReceipt();

        let txObject2 = await instance.methods.addCurrencyKey("UBE", UBE);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address });
        let receipt2 = await tx2.waitReceipt();

        let txObject3 = await instance.methods.addCurrencyKey("cBTC", cBTC);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address });
        let receipt3 = await tx3.waitReceipt();

        let txObject4 = await instance.methods.addCurrencyKey("MCO2", moss);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address });
        let receipt4 = await tx4.waitReceipt();

        let data = await instance.methods.getAvailableCurrencies().call();
        console.log(data);

        assert(
            data[0] == celoAddress,
            'First element should be CELO'
        );

        assert(
            data[1] == UBE,
            'Second element should be UBE'
        );

        assert(
            data[2] == cBTC,
            'Third element should be cBTC'
        );

        assert(
            data[3] == moss,
            'Fourth element should be MCO2'
        );
    });

    it('Add currency key from different account', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let celoAddress = "0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C8"; //CELO Alfajores address, off by 1
            let txObject = await instance.methods.addCurrencyKey("CELO2", celoAddress);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address });

            let receipt = await tx.waitReceipt()

            let data = await instance.methods.getAvailableCurrencies().call();
            console.log(data);

            assert(
                data.length == 4,
                'There should be 4 available currencies'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });

    it('Get currency keys', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        let CELOkey = await instance.methods.getCurrencyKeyFromIndex(1).call();
        console.log(CELOkey);

        let UBEkey = await instance.methods.getCurrencyKeyFromIndex(2).call();
        console.log(UBEkey);

        let cBTCkey = await instance.methods.getCurrencyKeyFromIndex(3).call();
        console.log(cBTCkey);

        let MCO2key = await instance.methods.getCurrencyKeyFromIndex(4).call();
        console.log(MCO2key);

        let CELOsymbol = await instance.methods.getCurrencySymbol(CELOkey).call();
        console.log(CELOsymbol);

        assert(
            CELOsymbol == "CELO",
            'Wrong symbol for CELO'
        );

        let UBEsymbol = await instance.methods.getCurrencySymbol(UBEkey).call();
        console.log(UBEsymbol);

        assert(
            UBEsymbol == "UBE",
            'Wrong symbol for UBE'
        );

        let cBTCsymbol = await instance.methods.getCurrencySymbol(cBTCkey).call();
        console.log(cBTCsymbol);

        assert(
            cBTCsymbol == "cBTC",
            'Wrong symbol for cBTC'
        );

        let MCO2symbol = await instance.methods.getCurrencySymbol(MCO2key).call();
        console.log(MCO2symbol);

        assert(
            MCO2symbol == "MCO2",
            'Wrong symbol for MCO2'
        );

        let CELOresult = await instance.methods.checkIfCurrencyIsAvailable(CELOkey).call();
        console.log(CELOresult);

        assert(
            CELOresult,
            'CELO should be available'
        );

        let UBEresult = await instance.methods.checkIfCurrencyIsAvailable(UBEkey).call();
        console.log(UBEresult);

        assert(
            UBEresult,
            'UBE should be available'
        );

        let cBTCresult = await instance.methods.checkIfCurrencyIsAvailable(cBTCkey).call();
        console.log(cBTCresult);

        assert(
            cBTCresult,
            'cBTC should be available'
        );

        let MCO2result = await instance.methods.checkIfCurrencyIsAvailable(MCO2key).call();
        console.log(MCO2result);

        assert(
            MCO2result,
            'MCO2 should be available'
        );
    });
}

initContract();