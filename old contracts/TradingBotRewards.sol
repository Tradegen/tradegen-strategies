pragma solidity >=0.5.0;

//Libraries
import './libraries/SafeMath.sol';

//Interfaces
import './interfaces/IERC20.sol';
import './interfaces/ITradingBot.sol';
import './interfaces/IStrategyToken.sol';
import './interfaces/IAddressResolver.sol';
import './interfaces/ITradingBotRewards.sol';

import './StrategyProxy.sol';

contract TradingBotRewards is ITradingBotRewards{
    using SafeMath for uint;

    IAddressResolver public immutable ADDRESS_RESOLVER;

    mapping(address => mapping (address => uint)) private _userToBotToLastClaimIndex; // maps to (index + 1), with index 0 representing user not having a position in the strategy
    mapping(address => State[]) private _botToStateHistory;

    constructor(IAddressResolver addressResolver) public {
        ADDRESS_RESOLVER = addressResolver;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Given the address of a trading bot, return the direction of the bot's yield and the yield amount
    * @param tradingBotAddress Address of the trading bot
    * @return (bool, uint) Whether the yield is positive or negative, and the yield amount
    */
    function getAllAvailableYieldForBot(address tradingBotAddress) public view override returns (bool, uint) {
        State[] memory history = _botToStateHistory[tradingBotAddress];
        require(history.length > 0, 'Trading bot address not valid');

        return (history[history.length - 1].debtOrYield, history[history.length - 1].amount);
    }

    /**
    * @dev Given the address of a trading bot and a user, return the direction of the user's available yield for that bot and the yield amount
    * @param user Address of the user
    * @param tradingBotAddress Address of the trading bot
    * @return (bool, uint) Whether the yield is positive or negative, and the yield amount
    */
    function getUserAvailableYieldForBot(address user, address tradingBotAddress) public view override tradingBotAddressIsValid(tradingBotAddress) returns (bool, uint) {
        return (_userToBotToLastClaimIndex[user][tradingBotAddress] > 0) ? _calculateDebtOrYield(user, tradingBotAddress) : (true, 0);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @dev Calculates the amount of debt/yield available for the user in the given trading bot
    * @param user Address of the user
    * @param tradingBotAddress Address of the trading bot
    * @return (bool, uint) Whether the yield is positive or negative, and the yield amount
    */
    function _calculateDebtOrYield(address user, address tradingBotAddress) internal view returns (bool, uint) {
        address strategyAddress = ITradingBot(tradingBotAddress).getStrategyAddress();
        uint numberOfTokens = IStrategyToken(strategyAddress).getBalanceOf(user);
        State[] memory history = _botToStateHistory[tradingBotAddress];

        uint userRatio = numberOfTokens.div(uint256(history[history.length - 1].circulatingSupply));
        uint lastClaimIndex = _userToBotToLastClaimIndex[user][tradingBotAddress] - 1;

        //Check for same sign
        if ((history[history.length - 1].debtOrYield && history[lastClaimIndex].debtOrYield) || (!history[history.length - 1].debtOrYield && !history[lastClaimIndex].debtOrYield))
        {
            return (history[history.length - 1].debtOrYield, userRatio.mul((uint256(history[history.length - 1].amount).sub(uint256(history[lastClaimIndex].amount)))));
        }
        //User initially had yield and now has debt
        else if (history[history.length - 1].debtOrYield && !history[lastClaimIndex].debtOrYield)
        {
            return (history[history.length - 1].amount >= history[lastClaimIndex].amount) ? (false, uint256(history[history.length - 1].amount).sub(uint256(history[lastClaimIndex].amount))) : (true, uint256(history[lastClaimIndex].amount).sub(uint256(history[history.length - 1].amount)));
        }
        //User initially had debt and now has yield
        else
        {
            return (history[history.length - 1].amount >= history[lastClaimIndex].amount) ? (true, uint256(history[history.length - 1].amount).sub(uint256(history[lastClaimIndex].amount))) : (false, uint256(history[lastClaimIndex].amount).sub(uint256(history[history.length - 1].amount)));
        }
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Updates the bot's available yield based on the profit/loss of the most recent trade
    * @param profitOrLoss Whether the amount represents profit or loss
    * @param amount The amount of profit/loss in USD
    * @param circulatingSupply Number of LP tokens in circulation for the trading bot's associated strategy
    */
    function updateRewards(bool profitOrLoss, uint amount, uint circulatingSupply) public override onlyTradingBot {
        State[] storage history = _botToStateHistory[msg.sender];

        if (history.length > 0)
        {
            //Check for same sign
            if ((history[history.length - 1].debtOrYield && profitOrLoss) || (!history[history.length - 1].debtOrYield && !profitOrLoss))
            {
                amount = amount.add(uint256(history[history.length - 1].amount));
            }
            //Current yield is positive and bot made losing trade
            else if (history[history.length - 1].debtOrYield && !profitOrLoss)
            {
                (profitOrLoss, amount) = (uint256(history[history.length - 1].amount) >= amount) ? (true, uint256(history[history.length - 1].amount).sub(amount)) : (false, amount.sub(uint256(history[history.length - 1].amount)));
            }
            //Current yield is negative and bot made profitable trade
            else
            {
                (profitOrLoss, amount) = (amount >= uint256(history[history.length - 1].amount)) ? (true, amount.sub(uint256(history[history.length - 1].amount))) : (false, uint256(history[history.length - 1].amount).sub(amount));
            }
        }

        history.push(State(uint80(amount), uint160(circulatingSupply), profitOrLoss));

        emit UpdatedRewards(msg.sender, profitOrLoss, amount, block.timestamp);
    }

    /**
    * @dev Claims all available yield the user has in the given trading bot
    * @param tradingBotAddress Address of the trading bot
    */
    function claim(address tradingBotAddress) public override userHasAPosition(msg.sender, tradingBotAddress) tradingBotAddressIsValid(tradingBotAddress) {
        (bool debtOrYield, uint amount) = _calculateDebtOrYield(msg.sender, tradingBotAddress);
        StrategyProxy(ADDRESS_RESOLVER.getContractAddress("StrategyProxy"))._claim(msg.sender, debtOrYield, amount);
        _userToBotToLastClaimIndex[msg.sender][tradingBotAddress] = _botToStateHistory[tradingBotAddress].length;

        emit Claimed(msg.sender, tradingBotAddress, debtOrYield, amount, block.timestamp);
    }

    /* ========== MODIFIERS ========== */

    modifier userHasAPosition(address user, address tradingBotAddress) {
        require(_userToBotToLastClaimIndex[user][tradingBotAddress] > 0, "Need to have a position to claim yield");
        _;
    }

    modifier userHasNotClaimedYet(address user, address tradingBotAddress) {
        require(_userToBotToLastClaimIndex[user][tradingBotAddress] < _botToStateHistory[tradingBotAddress].length, "Already claimed available yield");
        _;
    }

    modifier tradingBotAddressIsValid(address tradingBotAddress) {
        require(_botToStateHistory[tradingBotAddress].length > 0, "Invalid trading bot address");
        _;
    }

    modifier onlyTradingBot() {
        require(ADDRESS_RESOLVER.checkIfTradingBotAddressIsValid(msg.sender), "Only the trading bot can call this function");
        _;
    }

    /* ========== EVENTS ========== */

    event UpdatedRewards(address indexed tradingBot, bool profitOrLoss, uint amount, uint timestamp);
    event Claimed(address indexed user, address indexed tradingBot, bool debtOrYield, uint amount, uint timestamp);
}