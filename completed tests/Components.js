const BigNumber = require('bignumber.js');
var assert = require('assert');

const Web3 = require("web3");
const ContractKit = require('@celo/contractkit');

const getAccount = require('../get_account').getAccount;
const getAccount2 = require('../get_account').getAccount2;
const getAccount3 = require('../get_account').getAccount3;

const web3 = new Web3('https://alfajores-forno.celo-testnet.org');
const kit = ContractKit.newKitFromWeb3(web3);

const Components = require('../build/contracts/Components.json');
const TradegenERC20 = require('../build/contracts/TradegenERC20.json');

var contractAddress = "0x1bA2768b32e882E439FBAAa8D1C0E1eD55f7C799";
var tradegenContractAddress = "0xb79d64d9Acc251b04A3Ca9f811EFf49Bde52BbbC";
var tempContractAddress = "0x79F1f525E6b3c2949F83DDB5D685237e3B352D54"; //doesn't point to contract
var testIndicatorAddress = "0xd97870cB0a9C8f614a3B74FfD9e3E93BeCca7ac3";
var testComparatorAddress = "0x9a3DDe7C4bC45D773654E24e141036A621eF8BF8";

//Default indicators
const downAddress = "0xbe3D4777082309984be615bdbe8ef2B5B4022e2A";
const EMAAddress = "0x78C6d9d0bc0d516Cdc81d692Ca66bBA6d64F5741";
const highOfLastNPriceUpdatesAddress = "0x965536a316adbe2659E5878De08F0692d247506C";
const intervalAddress = "0x31963f798c9c6Bf272684c6D165dE6fDb489CeDe";
const latestPriceAddress = "0x0C96133A9acc4e8b9132F757960e64DB353ceb19";
const lowOfLastNPriceUpdatesAddress = "0x5640bda9b83f7B0432e13aAa55967740Eb990b53";
const NPercentAddress = "0x0eD511808DBb324EC1569C477bDEe4C5ee7D24C6";
const NthPriceUpdateAddress = "0xD853459F25C43499F03a65B4791ef9eE8bac8a90";
const previousNPriceUpdatesAddress = "0x40Fb58B956A4Ed225dBeD936Db9022e6527BF53b";
const SMAAddress = "0x465a2fa8C73A087Be82c310517dEcFFe13924dD6";
const upAddress = "0x1771FfEB2f7A53123Dc9227D8CC281F5B6157363";

//Default comparators
const closesAddress = "0xCb12bE90908666edAE11049E1df49732f5BdC5E9";
const crossesAboveAddress = "0x9A25ACd584f6cFB37E5351C574ebD17b194eD628";
const crossesBelowAddress = "0xA8f9b2C8EFa19765f0D4bc3B9b714304f5162D2A";
const fallByAtLeastAddress = "0x78ED353B1f21a3843af1cfC265FC9648D89aA11A";
const fallByAtMostAddress = "0x23eb70cd16BBC7a78094dBc3189545fe04C8FdFd";
const fallsToAddress = "0x7917CFd1712F5EffA9C0535831AF9b98B70A25e3";
const isAboveAddress = "0x6eB66dF9d4EF000F2a65d64691A892E9D701e609";
const isBelowAddress = "0x00F07116476C829f488fC3C43d511CD388B4e4C3";
const riseByAtLeastAddress = "0xa10F338DDE3eFBb3D461AdEe7B039000fb54ad10";
const riseByAtMostAddress = "0x22733D222aEf0b160E334c34b404f2eb88513731";
const risesToAddress = "0x12E0a215e7d4b62e9205A3C72C4E55bc27085A07";

function initContract()
{ 
    let instance = new web3.eth.Contract(Components.abi, contractAddress);
    let tradegenInstance = new web3.eth.Contract(TradegenERC20.abi, tradegenContractAddress);
    
    it('Add default indicators from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let txObject = await instance.methods._addNewIndicator(true, downAddress);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();

        let txObject2 = await instance.methods._addNewIndicator(true, EMAAddress);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address }); 
        let receipt2 = await tx2.waitReceipt();

        let txObject3 = await instance.methods._addNewIndicator(true, highOfLastNPriceUpdatesAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address }); 
        let receipt3 = await tx3.waitReceipt();

        let txObject4 = await instance.methods._addNewIndicator(true, intervalAddress);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address }); 
        let receipt4 = await tx4.waitReceipt();

        let txObject5 = await instance.methods._addNewIndicator(true, latestPriceAddress);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address }); 
        let receipt5 = await tx5.waitReceipt();

        let txObject6 = await instance.methods._addNewIndicator(true, lowOfLastNPriceUpdatesAddress);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address }); 
        let receipt6 = await tx6.waitReceipt();

        let txObject7 = await instance.methods._addNewIndicator(true, NPercentAddress);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address }); 
        let receipt7 = await tx7.waitReceipt();

        let txObject8 = await instance.methods._addNewIndicator(true, NthPriceUpdateAddress);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address }); 
        let receipt8 = await tx8.waitReceipt();

        let txObject9 = await instance.methods._addNewIndicator(true, previousNPriceUpdatesAddress);
        let tx9 = await kit.sendTransactionObject(txObject9, { from: account.address }); 
        let receipt9 = await tx9.waitReceipt();

        let txObject10 = await instance.methods._addNewIndicator(true, SMAAddress);
        let tx10 = await kit.sendTransactionObject(txObject10, { from: account.address }); 
        let receipt10 = await tx10.waitReceipt();

        let txObject11 = await instance.methods._addNewIndicator(true, upAddress);
        let tx11 = await kit.sendTransactionObject(txObject11, { from: account.address }); 
        let receipt11 = await tx11.waitReceipt();

        let data = await instance.methods.getDefaultIndicators().call();
        console.log(data);

        assert(
            data.length == 11,
            'There should be 11 elements in default indicators array'
        );

        assert(
            data[0] == downAddress,
            'First element in default indicators should be Down'
        );

        assert(
            data[1] == EMAAddress,
            'Second element in default indicators should be EMA'
        );

        assert(
            data[2] == highOfLastNPriceUpdatesAddress,
            'Third element in default indicators should be HighOfLastNPriceUpdates'
        );

        assert(
            data[3] == intervalAddress,
            'Fourth element in default indicators should be Interval'
        );

        assert(
            data[4] == latestPriceAddress,
            'Fifth element in default indicators should be LatestPrice'
        );

        assert(
            data[5] == lowOfLastNPriceUpdatesAddress,
            'Sixth element in default indicators should be LowOfLastNPriceUpdates'
        );

        assert(
            data[6] == NPercentAddress,
            'Seventh element in default indicators should be NPercent'
        );

        assert(
            data[7] == NthPriceUpdateAddress,
            'Eighth element in default indicators should be NthPriceUpdate'
        );

        assert(
            data[8] == previousNPriceUpdatesAddress,
            'Ninth element in default indicators should be PreviousNPriceUpdates'
        );

        assert(
            data[9] == SMAAddress,
            'Tenth element in default indicators should be SMA'
        );

        assert(
            data[10] == upAddress,
            'Eleventh element in default indicators should be Up'
        );
    });
    
    it('Get default indicators by index', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let firstAddress = await instance.methods.getIndicatorFromIndex(true, 0).call();
        console.log(firstAddress);

        assert(
            firstAddress == downAddress,
            'First address should be Down'
        );

        let secondAddress = await instance.methods.getIndicatorFromIndex(true, 1).call();
        console.log(secondAddress);

        assert(
            secondAddress == EMAAddress,
            'Second address should be EMA'
        );

        let thirdAddress = await instance.methods.getIndicatorFromIndex(true, 2).call();
        console.log(thirdAddress);

        assert(
            thirdAddress == highOfLastNPriceUpdatesAddress,
            'Third address should be HighOfLastNPriceUpdates'
        );

        let fourthAddress = await instance.methods.getIndicatorFromIndex(true, 3).call();
        console.log(fourthAddress);

        assert(
            fourthAddress == intervalAddress,
            'Fourth address should be Interval'
        );

        let fifthAddress = await instance.methods.getIndicatorFromIndex(true, 4).call();
        console.log(fifthAddress);

        assert(
            fifthAddress == latestPriceAddress,
            'Fifth address should be LatestPrice'
        );

        let sixthAddress = await instance.methods.getIndicatorFromIndex(true, 5).call();
        console.log(sixthAddress);

        assert(
            sixthAddress == lowOfLastNPriceUpdatesAddress,
            'Sixth address should be LowOfLastNPriceUpdates'
        );

        let seventhAddress = await instance.methods.getIndicatorFromIndex(true, 6).call();
        console.log(seventhAddress);

        assert(
            seventhAddress == NPercentAddress,
            'Seventh address should be NPercent'
        );

        let eighthAddress = await instance.methods.getIndicatorFromIndex(true, 7).call();
        console.log(eighthAddress);

        assert(
            eighthAddress == NthPriceUpdateAddress,
            'Eighth address should be NthPriceUpdate'
        );

        let ninthAddress = await instance.methods.getIndicatorFromIndex(true, 8).call();
        console.log(ninthAddress);

        assert(
            ninthAddress == previousNPriceUpdatesAddress,
            'Ninth address should be PreviousNPriceUpdates'
        );

        let tenthAddress = await instance.methods.getIndicatorFromIndex(true, 9).call();
        console.log(tenthAddress);

        assert(
            tenthAddress == SMAAddress,
            'Tenth address should be SMA'
        );

        let eleventhAddress = await instance.methods.getIndicatorFromIndex(true, 10).call();
        console.log(eleventhAddress);

        assert(
            eleventhAddress == upAddress,
            'Eleventh address should be Up'
        );
    });
    
    it('Add default comparators from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let txObject = await instance.methods._addNewComparator(true, closesAddress);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();

        let txObject2 = await instance.methods._addNewComparator(true, crossesAboveAddress);
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address }); 
        let receipt2 = await tx2.waitReceipt();

        let txObject3 = await instance.methods._addNewComparator(true, crossesBelowAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account.address }); 
        let receipt3 = await tx3.waitReceipt();

        let txObject4 = await instance.methods._addNewComparator(true, fallByAtLeastAddress);
        let tx4 = await kit.sendTransactionObject(txObject4, { from: account.address }); 
        let receipt4 = await tx4.waitReceipt();

        let txObject5 = await instance.methods._addNewComparator(true, fallByAtMostAddress);
        let tx5 = await kit.sendTransactionObject(txObject5, { from: account.address }); 
        let receipt5 = await tx5.waitReceipt();

        let txObject6 = await instance.methods._addNewComparator(true, fallsToAddress);
        let tx6 = await kit.sendTransactionObject(txObject6, { from: account.address }); 
        let receipt6 = await tx6.waitReceipt();

        let txObject7 = await instance.methods._addNewComparator(true, isAboveAddress);
        let tx7 = await kit.sendTransactionObject(txObject7, { from: account.address }); 
        let receipt7 = await tx7.waitReceipt();

        let txObject8 = await instance.methods._addNewComparator(true, isBelowAddress);
        let tx8 = await kit.sendTransactionObject(txObject8, { from: account.address }); 
        let receipt8 = await tx8.waitReceipt();

        let txObject9 = await instance.methods._addNewComparator(true, riseByAtLeastAddress);
        let tx9 = await kit.sendTransactionObject(txObject9, { from: account.address }); 
        let receipt9 = await tx9.waitReceipt();

        let txObject10 = await instance.methods._addNewComparator(true, riseByAtMostAddress);
        let tx10 = await kit.sendTransactionObject(txObject10, { from: account.address }); 
        let receipt10 = await tx10.waitReceipt();

        let txObject11 = await instance.methods._addNewComparator(true, risesToAddress);
        let tx11 = await kit.sendTransactionObject(txObject11, { from: account.address }); 
        let receipt11 = await tx11.waitReceipt();

        let data = await instance.methods.getDefaultComparators().call();
        console.log(data);

        assert(
            data.length == 11,
            'There should be 11 elements in default comparators array'
        );

        assert(
            data[0] == closesAddress,
            'First element in default comparators should be Closes'
        );

        assert(
            data[1] == crossesAboveAddress,
            'Second element in default comparators should be CrossesAbove'
        );

        assert(
            data[2] == crossesBelowAddress,
            'Third element in default comparators should be CrossesBelow'
        );

        assert(
            data[3] == fallByAtLeastAddress,
            'Fourth element in default comparators should be FallByAtLeast'
        );

        assert(
            data[4] == fallByAtMostAddress,
            'Fifth element in default comparators should be FallByAtMost'
        );

        assert(
            data[5] == fallsToAddress,
            'Sixth element in default comparators should be FallsTo'
        );

        assert(
            data[6] == isAboveAddress,
            'Seventh element in default comparators should be IsAbove'
        );

        assert(
            data[7] == isBelowAddress,
            'Eighth element in default comparators should be IsBelow'
        );

        assert(
            data[8] == riseByAtLeastAddress,
            'Ninth element in default comparators should be RiseByAtLeast'
        );

        assert(
            data[9] == riseByAtMostAddress,
            'Tenth element in default comparators should be RiseByAtMost'
        );

        assert(
            data[10] == risesToAddress,
            'Eleventh element in default comparators should be RisesTo'
        );
    });
    
    it('Get default comparators by index', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let firstAddress = await instance.methods.getComparatorFromIndex(true, 0).call();
        console.log(firstAddress);

        assert(
            firstAddress == closesAddress,
            'First address should be Closes'
        );

        let secondAddress = await instance.methods.getComparatorFromIndex(true, 1).call();
        console.log(secondAddress);

        assert(
            secondAddress == crossesAboveAddress,
            'Second address should be CrossesAbove'
        );

        let thirdAddress = await instance.methods.getComparatorFromIndex(true, 2).call();
        console.log(thirdAddress);

        assert(
            thirdAddress == crossesBelowAddress,
            'Third address should be CrossesBelow'
        );

        let fourthAddress = await instance.methods.getComparatorFromIndex(true, 3).call();
        console.log(fourthAddress);

        assert(
            fourthAddress == fallByAtLeastAddress,
            'Fourth address should be FallByAtLeast'
        );

        let fifthAddress = await instance.methods.getComparatorFromIndex(true, 4).call();
        console.log(fifthAddress);

        assert(
            fifthAddress == fallByAtMostAddress,
            'Fifth address should be FallByAtMost'
        );

        let sixthAddress = await instance.methods.getComparatorFromIndex(true, 5).call();
        console.log(sixthAddress);

        assert(
            sixthAddress == fallsToAddress,
            'Sixth address should be FallsTo'
        );

        let seventhAddress = await instance.methods.getComparatorFromIndex(true, 6).call();
        console.log(seventhAddress);

        assert(
            seventhAddress == isAboveAddress,
            'Seventh address should be IsAbove'
        );

        let eighthAddress = await instance.methods.getComparatorFromIndex(true, 7).call();
        console.log(eighthAddress);

        assert(
            eighthAddress == isBelowAddress,
            'Eighth address should be IsBelow'
        );

        let ninthAddress = await instance.methods.getComparatorFromIndex(true, 8).call();
        console.log(ninthAddress);

        assert(
            ninthAddress == riseByAtLeastAddress,
            'Ninth address should be RiseByAtLeast'
        );

        let tenthAddress = await instance.methods.getComparatorFromIndex(true, 9).call();
        console.log(tenthAddress);

        assert(
            tenthAddress == riseByAtMostAddress,
            'Tenth address should be RiseByAtMost'
        );

        let eleventhAddress = await instance.methods.getComparatorFromIndex(true, 10).call();
        console.log(eleventhAddress);

        assert(
            eleventhAddress == risesToAddress,
            'Eleventh address should be RisesTo'
        );
    });
    
    it('Add default indicator from different account', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let txObject = await instance.methods._addNewIndicator(true, testIndicatorAddress);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
            let receipt = await tx.waitReceipt()

            let data = await instance.methods.getDefaultIndicators().call();
            console.log(data);

            assert(
                data.length == 11,
                'There should be 11 default indicators'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });
    
    it('Add default comparator from different account', async () => {
        let account = await getAccount2();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let txObject = await instance.methods._addNewComparator(true, testComparatorAddress);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
            let receipt = await tx.waitReceipt()

            let data = await instance.methods.getDefaultComparators().call();
            console.log(data);

            assert(
                data.length == 11,
                'There should be 11 default comparators'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });

    it('Add non-default indicator from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let txObject = await instance.methods._addNewIndicator(false, testIndicatorAddress);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();

        let data = await instance.methods.getIndicators().call();
        console.log(data);

        assert(
            data.length == 1,
            'There should be 1 element in indicators array'
        );

        assert(
            data[0] == testIndicatorAddress,
            'First element in indicators should be TestIndicator'
        );

        let firstAddress = await instance.methods.getIndicatorFromIndex(false, 0).call();
        console.log(firstAddress);

        assert(
            firstAddress == testIndicatorAddress,
            'First address should be TestIndicator'
        );

        let result = await instance.methods.checkIfUserPurchasedIndicator(account.address, 0).call();
        console.log(result);

        assert(
            result,
            'Developer should have TestIndicator as purchased indicator'
        );
    });
    
    it('Add non-default comparator from owner', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let txObject = await instance.methods._addNewComparator(false, testComparatorAddress);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();

        let data = await instance.methods.getComparators().call();
        console.log(data);

        assert(
            data.length == 1,
            'There should be 1 element in comparators array'
        );

        assert(
            data[0] == testComparatorAddress,
            'First element in comparators should be TestComparators'
        );

        let firstAddress = await instance.methods.getComparatorFromIndex(false, 0).call();
        console.log(firstAddress);

        assert(
            firstAddress == testComparatorAddress,
            'First address should be TestComparator'
        );

        let result = await instance.methods.checkIfUserPurchasedComparator(account.address, 0).call();
        console.log(result);

        assert(
            result,
            'Developer should have TestComparator as purchased comparator'
        );
    });
    
    it('Buy indicator from developer', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let txObject = await instance.methods.buyIndicator(testIndicatorAddress);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
            let receipt = await tx.waitReceipt()

            let data = await instance.methods.getUserPurchasedIndicators(account.address).call();
            console.log(data);

            assert(
                data.length == 12,
                'There should be 12 purchased indicators'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });
    
    it('Buy comparator from developer', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        try 
        {
            let txObject = await instance.methods.buyComparator(testComparatorAddress);
            let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
            let receipt = await tx.waitReceipt()

            let data = await instance.methods.getUserPurchasedComparator(account.address).call();
            console.log(data);

            assert(
                data.length == 12,
                'There should be 12 purchased comparators'
            );
        }
        catch(err)
        {
            console.log(err);
        }
    });
    
    it('Get user purchased indicators', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let purchasedIndicators = await instance.methods.getUserPurchasedIndicators(account.address).call();
        console.log(purchasedIndicators);

        assert(
            purchasedIndicators.length == 12,
            'There should be 12 purchased indicators'
        );

        assert(
            purchasedIndicators[0] == downAddress,
            'First indicator should be Down'
        );

        assert(
            purchasedIndicators[1] == EMAAddress,
            'Second indicator should be EMA'
        );

        assert(
            purchasedIndicators[2] == highOfLastNPriceUpdatesAddress,
            'Third indicator should be HighOfLastNPriceUpdates'
        );

        assert(
            purchasedIndicators[3] == intervalAddress,
            'Fourth indicator should be Interval'
        );

        assert(
            purchasedIndicators[4] == latestPriceAddress,
            'Fifth indicator should be LatestPrice'
        );

        assert(
            purchasedIndicators[5] == lowOfLastNPriceUpdatesAddress,
            'Sixth indicator should be LowOfLastNPriceUpdates'
        );

        assert(
            purchasedIndicators[6] == NPercentAddress,
            'Seventh indicator should be NPercent'
        );

        assert(
            purchasedIndicators[7] == NthPriceUpdateAddress,
            'Eighth indicator should be NthPriceUpdate'
        );

        assert(
            purchasedIndicators[8] == previousNPriceUpdatesAddress,
            'Ninth indicator should be PreviousNPriceUpdates'
        );

        assert(
            purchasedIndicators[9] == SMAAddress,
            'Tenth indicator should be SMA'
        );

        assert(
            purchasedIndicators[10] == upAddress,
            'Eleventh indicator should be Up'
        );

        assert(
            purchasedIndicators[11] == testIndicatorAddress,
            'Last indicator should be TestIndicator'
        );
    });
    
    it('Get user purchased comparators', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let purchasedComparators = await instance.methods.getUserPurchasedComparators(account.address).call();
        console.log(purchasedComparators);

        assert(
            purchasedComparators.length == 12,
            'There should be 12 purchased comparators'
        );

        assert(
            purchasedComparators[0] == closesAddress,
            'First comparator should be Closes'
        );

        assert(
            purchasedComparators[1] == crossesAboveAddress,
            'Second comparator should be CrossesAbove'
        );

        assert(
            purchasedComparators[2] == crossesBelowAddress,
            'Third comparator should be CrossesBelow'
        );

        assert(
            purchasedComparators[3] == fallByAtLeastAddress,
            'Fourth comparator should be FallByAtLeast'
        );

        assert(
            purchasedComparators[4] == fallByAtMostAddress,
            'Fifth comparator should be FallByAtMost'
        );

        assert(
            purchasedComparators[5] == fallsToAddress,
            'Sixth comparator should be FallsTo'
        );

        assert(
            purchasedComparators[6] == isAboveAddress,
            'Seventh comparator should be IsAbove'
        );

        assert(
            purchasedComparators[7] == isBelowAddress,
            'Eighth comparator should be IsBelow'
        );

        assert(
            purchasedComparators[8] == riseByAtLeastAddress,
            'Ninth comparator should be RiseByAtLeast'
        );

        assert(
            purchasedComparators[9] == riseByAtMostAddress,
            'Tenth comparator should be RiseByAtMost'
        );

        assert(
            purchasedComparators[10] == risesToAddress,
            'Eleventh comparator should be RisesTo'
        );

        assert(
            purchasedComparators[11] == testComparatorAddress,
            'Last comparator should be TestComparator'
        );
    });
    
    it('Buy indicator from non-developer', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let account2 = await getAccount2();
        kit.connection.addAccount(account2.privateKey);
        
        //Transfer TGEN to user to pay for indicator
        let txObject = await tradegenInstance.methods.transfer(account2.address, 100);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();

        let txObject2 = await tradegenInstance.methods.approve(account.address, 10); //TestIndicator price is 10 TGEN
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address }); 
        let receipt2 = await tx2.waitReceipt();

        let txObject3 = await instance.methods.buyIndicator(testIndicatorAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account2.address }); 
        let receipt3 = await tx3.waitReceipt();

        let data = await instance.methods.getUserPurchasedIndicators(account2.address).call();
        console.log(data);

        assert(
            data.length == 12,
            'There should be 12 purchased indicators'
        );
        
        let result = await instance.methods.checkIfUserPurchasedIndicator(account2.address, 0).call();
        console.log(result);

        assert(
            result,
            'User should have TestIndicator as purchased indicator'
        );
    });
    
    it('Buy comparator from non-developer', async () => {
        let account = await getAccount();
        kit.connection.addAccount(account.privateKey);

        let account2 = await getAccount2();
        kit.connection.addAccount(account2.privateKey);

        //Transfer TGEN to user to pay for comparator
        let txObject = await tradegenInstance.methods.transfer(account2.address, 100);
        let tx = await kit.sendTransactionObject(txObject, { from: account.address }); 
        let receipt = await tx.waitReceipt();
        console.log("!!!!!!!!");

        let txObject2 = await tradegenInstance.methods.approve(account.address, 10); //TestComparator price is 10 TGEN
        let tx2 = await kit.sendTransactionObject(txObject2, { from: account.address }); 
        let receipt2 = await tx2.waitReceipt();
        console.log("????????????");

        let txObject3 = await instance.methods.buyComparator(testComparatorAddress);
        let tx3 = await kit.sendTransactionObject(txObject3, { from: account2.address }); 
        let receipt3 = await tx3.waitReceipt();
        console.log("18929487");

        let data = await instance.methods.getUserPurchasedComparators(account2.address).call();
        console.log(data);

        assert(
            data.length == 12,
            'There should be 12 purchased comparators'
        );

        let result = await instance.methods.checkIfUserPurchasedComparator(account2.address, 0).call();
        console.log(result);

        assert(
            result,
            'User should have TestComparator as purchased comparator'
        );
    });
}

initContract();