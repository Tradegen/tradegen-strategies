pragma solidity >=0.5.0;

interface ITradingBot {

    struct Rule {
        address firstIndicatorAddress;
        address secondIndicatorAddress;
        address comparatorAddress;
        uint8 firstIndicatorIndex;
        uint8 secondIndicatorIndex;
        uint8 comparatorIndex;
    }

    /**
    * @dev Returns the index of each pool the user manages
    * @return (Rule[], Rule[], uint, uint, uint, address) The trading bot's entry rules, exit rules, max trade duration, profit target, stop loss, and underlying asset address
    */
    function getTradingBotParameters() external view returns (Rule[] memory, Rule[] memory, uint, uint, uint, address);

    /**
    * @dev Given the latest price from the bot's underlying asset, updates entry/exit rules and makes a trade depending on entry/exit rules
    * @param latestPrice Latest price from the underlying asset's oracle price feed
    */
    function onPriceFeedUpdate(uint latestPrice) external;

    /**
    * @dev Returns the address of the strategy associated with this bot
    * @return address The address of the strategy this bot belongs to
    */
    function getStrategyAddress() external view returns (address);

    /**
    * @dev Returns whether the bot is in a trade
    * @return bool Whether the bot is currently in a trade
    */
    function checkIfBotIsInATrade() external view returns (bool);

    /**
    * @dev Transfers the user's stake in bot's underlying asset when user withdraws from strategy
    * @param user Address of user to transfer funds to
    * @param amount Amount of funds to transfer
    */
    function withdraw(address user, uint amount) external;
}