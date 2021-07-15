pragma solidity >=0.5.0;

interface IFeePool {

    /**
    * @notice Returns the number of fee tokens the user has
    * @param account Address of the user
    * @return uint Number of fee tokens
    */
    function getTokenBalance(address account) external view returns (uint);

    /**
    * @notice Adds fees to user
    * @notice Function gets called by Pool whenever users withdraw for a profit
    * @notice 1 fee token is minted per cUSD
    * @param user Address of the user
    * @param numberOfFeeTokens Number of fee tokens to mint
    */
    function addFees(address user, uint numberOfFeeTokens) external;

    /**
    * @notice Allow a user to claim available fees in the specified currency
    * @param currencyKey Address of the currency to claim 
    * @param amountInUSD Amount of fees to claim in USD
    */
    function claimAvailableFees(address currencyKey, uint amountInUSD) external;

    /**
    * @dev Returns the currency address and balance of each position the pool has, as well as the cumulative value
    * @return (address[], uint[], uint) Currency address and balance of each position the pool has, and the cumulative value of positions
    */
    function getPositionsAndTotal() external view returns (address[] memory, uint[] memory, uint);

    /**
    * @dev Returns the value of the pool in USD
    * @return uint Value of the pool in USD
    */
    function getPoolBalance() external view returns (uint);

    /**
    * @dev Returns the balance of the user in USD
    * @return uint Balance of the user in USD
    */
    function getUSDBalance(address user) external view returns (uint);
}