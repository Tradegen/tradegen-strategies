pragma solidity >=0.5.0;

interface ITradingBotRewards {

    struct State {
        uint88 amount;
        uint160 circulatingSupply;
        bool debtOrYield; //true = yield, false = debt
    }

    /**
    * @dev Given the address of a trading bot, return the direction of the bot's yield and the yield amount
    * @param tradingBotAddress Address of the trading bot
    * @return (bool, uint) Whether the yield is positive or negative, and the yield amount
    */
    function getAllAvailableYieldForBot(address tradingBotAddress) external view returns (bool, uint);

    /**
    * @dev Given the address of a trading bot and a user, return the direction of the user's available yield for that bot and the yield amount
    * @param user Address of the user
    * @param tradingBotAddress Address of the trading bot
    * @return (bool, uint) Whether the yield is positive or negative, and the yield amount
    */
    function getUserAvailableYieldForBot(address user, address tradingBotAddress) external view returns (bool, uint);

    /**
    * @dev Updates the bot's available yield based on the profit/loss of the most recent trade
    * @param profitOrLoss Whether the amount represents profit or loss
    * @param amount The amount of profit/loss in USD
    * @param circulatingSupply Number of LP tokens in circulation for the trading bot's associated strategy
    */
    function updateRewards(bool profitOrLoss, uint amount, uint circulatingSupply) external;

    /**
    * @dev Claims all available yield the user has in the given trading bot
    * @param tradingBotAddress Address of the trading bot
    */
    function claim(address tradingBotAddress) external;
}