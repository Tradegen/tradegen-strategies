pragma solidity >=0.5.0;

//Libraries
import './libraries/SafeMath.sol';

//Inheritance
import './StrategyManager.sol';
import './Marketplace.sol';

//Interfaces
import './interfaces/IStrategyToken.sol';
import './interfaces/IERC20.sol';
import './interfaces/IAddressResolver.sol';
import './interfaces/ITradingBotRewards.sol';
import './interfaces/ISettings.sol';
import './interfaces/IFeePool.sol';

contract StrategyProxy is Marketplace, StrategyManager {
    using SafeMath for uint;

    struct StrategyDetails {
        string name;
        string strategySymbol;
        address developerAddress;
        address strategyAddress;
        uint publishedOnTimestamp;
        uint maxPoolSize;
        uint tokenPrice;
        uint circulatingSupply;
    }

    struct PositionDetails {
        string name;
        string strategySymbol;
        address strategyAddress;
        uint balance;
        uint circulatingSupply;
        uint maxPoolSize;
    }

    constructor(IAddressResolver addressResolver) public StrategyManager(addressResolver) Marketplace(addressResolver) {
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Given the address of a strategy, returns the details for that strategy
    * @param strategyAddress Address of the strategy
    * @return StrategyDetails The name, token symbol, developer, timestamp, max pool size, toke price, and circulating supply of the strategy
    */
    function getStrategyDetails(address strategyAddress) public view returns(StrategyDetails memory) {
        (string memory name,
        string memory symbol,
        address developerAddress,
        uint publishedOnTimestamp,
        uint maxPoolSize,
        uint tokenPrice,
        uint circulatingSupply) = IStrategyToken(strategyAddress)._getStrategyDetails();

        return StrategyDetails(name,
                            symbol,
                            developerAddress,
                            strategyAddress,
                            publishedOnTimestamp,
                            maxPoolSize,
                            tokenPrice,
                            circulatingSupply);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Deposits the given cUSD amount into the strategy and mints LP tokens for the user
    * @param strategyAddress Address of the strategy
    * @param amount Amount of cUSD to deposit
    */
    function depositFundsIntoStrategy(address strategyAddress, uint amount) external isValidStrategyAddress(strategyAddress) noYieldToClaim(msg.sender, strategyAddress) {
        address tradingBotAddress = IStrategyToken(strategyAddress).getTradingBotAddress();
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();
        address feePoolAddress = ADDRESS_RESOLVER.getContractAddress("FeePool");

        uint transactionFee = amount.mul(ISettings(settingsAddress).getParameterValue("TransactionFee")).div(1000);

        //Deposits cUSD into trading bot and sends transaction fee to strategy's developer; call approve() on frontend before sending transaction
        IERC20(stableCoinAddress).transferFrom(msg.sender, tradingBotAddress, amount);
        IERC20(stableCoinAddress).transferFrom(msg.sender, feePoolAddress, transactionFee);
        IFeePool(feePoolAddress).addTransactionFees(msg.sender, transactionFee);

        //Mint LP tokens for the user
        IStrategyToken(strategyAddress).deposit(msg.sender, amount);

        //Add to user's positions if user is investing in this strategy for the first time
        uint strategyIndex = addressToIndex[strategyAddress] - 1;
        bool found = false;
        uint[] memory userPositionIndexes = userToPositions[msg.sender];
        for (uint i = 0; i < userPositionIndexes.length; i++)
        {
            if (userPositionIndexes[i] == strategyIndex)
            {
                found = true;
                break;
            }
        }

        if (!found)
        {
            _addPosition(msg.sender, strategyAddress);
        }

        emit DepositedFundsIntoStrategy(msg.sender, strategyAddress, amount, block.timestamp);
    }

    /**
    * @dev Withdraws the given cUSD amount from the strategy and burns LP tokens for the user
    * @param strategyAddress Address of the strategy
    * @param amount Amount of cUSD to withdraw
    */
    function withdrawFundsFromStrategy(address strategyAddress, uint amount) external noYieldToClaim(msg.sender, strategyAddress) isValidStrategyAddress(strategyAddress) {
        uint tokenBalance = IStrategyToken(strategyAddress).getBalanceOf(msg.sender);
        uint numberOfTokensForSale = userToNumberOfTokensForSale[msg.sender][strategyAddress];
        uint tokenPrice = IStrategyToken(strategyAddress).tokenPrice();
        uint availableToWithdraw = (tokenBalance.sub(numberOfTokensForSale)).mul(tokenPrice);

        require(availableToWithdraw >= amount, "Not enough funds in strategy");
        
        //Check if user has position
        uint strategyIndex = addressToIndex[strategyAddress] - 1;
        bool found = false;
        uint[] memory userPositionIndexes = userToPositions[msg.sender];
        for (uint i = 0; i < userPositionIndexes.length; i++)
        {
            if (userPositionIndexes[i] == strategyIndex)
            {
                found = true;
                break;
            }
        }

        require(found, "No position in this strategy");

        //Burn LP tokens and transfer user's stake in the underlying asset
        IStrategyToken(strategyAddress).withdraw(msg.sender, amount);

        if (IStrategyToken(strategyAddress).getBalanceOf(msg.sender) == 0)
        {
            _removePosition(msg.sender, strategyAddress);
        }

        emit WithdrewFundsFromStrategy(msg.sender, strategyAddress, amount, block.timestamp);
    }

    /**
    * @dev Buys the specified marketplace listing from the seller
    * @param user Address of the seller
    * @param marketplaceListingIndex Index in the user's array of marketplace listings
    */
    function buyPosition(address user, uint marketplaceListingIndex) external {
        (uint advertisedPrice, uint numberOfTokens, address strategyAddress) = getMarketplaceListing(user, marketplaceListingIndex);

        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();
        address feePoolAddress = ADDRESS_RESOLVER.getContractAddress("FeePool");

        uint amount = numberOfTokens.mul(advertisedPrice);
        uint transactionFee = amount.mul(ISettings(settingsAddress).getParameterValue("TransactionFee")).div(1000);
        
        IStrategyToken(strategyAddress).buyPosition(user, msg.sender, numberOfTokens);

        //Transfers cUSD from buyer to seller and sends transaction fee to strategy's developer; call approve() on frontend before sending transaction
        IERC20(stableCoinAddress).transferFrom(msg.sender, user, amount);
        IERC20(stableCoinAddress).transferFrom(msg.sender, feePoolAddress, transactionFee);
        IFeePool(feePoolAddress).addTransactionFees(msg.sender, transactionFee);

        _cancelListing(user, marketplaceListingIndex);

        emit BoughtPosition(msg.sender, strategyAddress, advertisedPrice, numberOfTokens, block.timestamp);
    }

    /**
    * @dev Claims the available debt or yield on behalf of the user
    * @param user Address of the user
    * @param debtOrYield Whether the amount being claimed represents debt or yield
    * @param amount Amount of debt or yield to claim
    */
    function _claim(address user, bool debtOrYield, uint amount) public onlyTradingBot {
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();

        //transfer profit from bot to user
        if (debtOrYield)
        {
            IERC20(stableCoinAddress).transferFrom(msg.sender, user, amount);
        }
        //transfer loss from bot to user
        else
        {
            IERC20(stableCoinAddress).transferFrom(user, msg.sender, amount);
        }
    }

    /* ========== MODIFIERS ========== */

    modifier noYieldToClaim(address user, address tradingBotAddress) {
        address tradingBotRewardsAddress = ADDRESS_RESOLVER.getContractAddress("TradingBotRewards");

        (, uint amount) = ITradingBotRewards(tradingBotRewardsAddress).getUserAvailableYieldForBot(user, tradingBotAddress);
        require(amount == 0, "Need to claim yield first");
        _;
    }

    modifier onlyTradingBot {
        require(ADDRESS_RESOLVER.checkIfTradingBotAddressIsValid(msg.sender), "Only trading bot can call this function");
        _;
    }

    /* ========== EVENTS ========== */

    event DepositedFundsIntoStrategy(address user, address strategyAddress, uint amount, uint timestamp);
    event WithdrewFundsFromStrategy(address user, address strategyAddress, uint amount, uint timestamp);
    event BoughtPosition(address user, address strategyAddress, uint advertisedPrice, uint numberOfTokens, uint timestamp);
}