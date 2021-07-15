pragma solidity >=0.5.0;

interface IStrategyToken {

    /**
    * @dev Returns the details for the strategy
    * @return (string, string, address, uint, uint, uint, uint) The strategy's name, symbol, developer, timestamp, max pool size, token price, and circulating supply
    */
    function _getStrategyDetails() external view returns (string memory, string memory, address, uint, uint, uint, uint);

    /**
    * @dev Returns the user's position details
    * @param user Address of the user
    * @return (string, string, uint, uint, uint) The strategy's name, symbol, user's balance, circulating supply, and max pool size
    */
    function _getPositionDetails(address user) external view returns (string memory, string memory, uint, uint, uint);

    /**
    * @dev Transfers the LP tokens from seller to buyer
    * @param from Address of the seller
    * @param to Address of the buyer
    * @param numberOfTokens Number of LP tokens of the position
    */
    function buyPosition(address from, address to, uint numberOfTokens) external;

    /**
    * @dev Deposits the given USD amount into the strategy
    * @param user Address of the user
    * @param amount USD value to deposit into the strategy
    */
    function deposit(address user, uint amount) external;

    /**
    * @dev Withdraws the given USD amount from the strategy
    * @param user Address of the user
    * @param amount USD value to withdraw from the strategy
    */
    function withdraw(address user, uint amount) external;

    /**
    * @dev Returns the address of the strategy's trading bot
    * @return address The address of the strategy's trading bot
    */
    function getTradingBotAddress() external view returns (address);

    /**
    * @dev Returns the address of the strategy's developer
    * @return address The address of the strategy's developer
    */
    function getDeveloperAddress() external view returns (address);

    /**
    * @dev Given the address of a user, returns the number of LP tokens the user has
    * @param user Address of the user
    * @return uint Number of LP tokens the user has in the strategy
    */
    function getBalanceOf(address user) external view returns (uint);

    /**
    * @dev Returns the number of LP tokens the strategy has in circulation
    * @return uint Number of LP tokens in circulation
    */
    function getCirculatingSupply() external view returns (uint);

    /**
    * @dev Returns whether the trading bot is in a trade
    * @return bool Whether the strategy's trading bot is currently in a trade
    */
    function checkIfBotIsInATrade() external view returns (bool);

    /**
    * @dev Returns the strategy's token price
    * @return uint Strategy's token price
    */
    function tokenPrice() external view returns (uint);
}