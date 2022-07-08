pragma solidity >=0.5.0;

//Interfaces
import './interfaces/IPool.sol';
import './interfaces/ISettings.sol';
import './interfaces/IAddressResolver.sol';

import './PoolManager.sol';

contract PoolProxy is PoolManager {
    using SafeMath for uint;

    constructor(IAddressResolver addressResolver) PoolManager(addressResolver) public {
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the index of each pool the user manages
    * @param user Address of the user
    * @return uint[] The index in pools array of each pool the user manages
    */
    function getUserManagedPools(address user) public view returns(uint[] memory) {
        return _getUserManagedPools(user);
    }

    /**
    * @dev Returns the index of each pool the user is invested in
    * @param user Address of the user
    * @return uint[] The index in pools array of each pool the user is invested in
    */
    function getUserInvestedPools(address user) public view returns(uint[] memory) {
        return _getUserInvestedPools(user);
    }

    /**
    * @dev Returns the index of each pool the user is staked in
    * @param user Address of the user
    * @return uint[] The index in pools array of each pool the user is staked in
    * @return uint Number of pools the user is staked in
    */
    function getUserStakedPools(address user) public view returns(uint[] memory, uint) {
        return _getUserStakedPools(user);
    }

    /**
    * @dev Returns the address of each available pool
    * @return address[] The address of each available pool
    */
    function getAvailablePools() public view returns(address[] memory) {
        return _getAvailablePools();
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Creates a new pool
    * @param poolName Name of the pool
    * @param performanceFee Performance fee for the pool
    */
    function createPool(string memory poolName, uint performanceFee) external {
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        uint maximumPerformanceFee = ISettings(settingsAddress).getParameterValue("MaximumPerformanceFee");
        uint maximumNumberOfPoolsPerUser = ISettings(settingsAddress).getParameterValue("MaximumNumberOfPoolsPerUser");

        require(bytes(poolName).length < 30, "Pool name must have less than 30 characters");
        require(performanceFee <= maximumPerformanceFee, "Cannot exceed maximum performance fee");
        require(_getUserManagedPools(msg.sender).length < maximumNumberOfPoolsPerUser, "Cannot exceed maximum number of pools per user");

        address poolAddress = _createPool(poolName, performanceFee, msg.sender);

        ADDRESS_RESOLVER.addPoolAddress(poolAddress);
    }

    /**
    * @dev Withdraw cUSD from the given pool
    * @param poolAddress Address of the pool
    * @param amount Amount of cUSD to withdraw from the pool
    */
    function withdraw(address poolAddress, uint amount) external {
        require(amount > 0, "Withdrawal amount must be greater than 0");

        _withdraw(msg.sender, poolAddress, amount);
    }

    /**
    * @dev Deposit cUSD into the given pool
    * @param poolAddress Address of the pool
    * @param amount Amount of cUSD to deposit into the pool
    */
    function deposit(address poolAddress, uint amount) external {
        require(amount > 0, "Deposit amount must be greater than 0");

        _deposit(msg.sender, poolAddress, amount);
    }

    /**
    * @dev Places an order to buy/sell the given currency on behalf of the pool
    * @param poolAddress Address of the pool
    * @param currencyKey Address of currency to trade
    * @param buyOrSell Whether the user is buying or selling
    * @param numberOfTokens Number of tokens of the given currency
    */
    function placeOrder(address poolAddress, address currencyKey, bool buyOrSell, uint numberOfTokens) external {
        require(poolAddress != address(0), "Invalid pool address");
        require(currencyKey != address(0), "Invalid currency key");
        require(numberOfTokens > 0, "Number of tokens must be greater than 0");

        _placeOrder(poolAddress, currencyKey, buyOrSell, numberOfTokens);
    }
}