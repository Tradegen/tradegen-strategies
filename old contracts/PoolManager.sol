pragma solidity >=0.5.0;

//Interfaces
import './interfaces/IUserPoolFarm.sol';
import './interfaces/IAddressResolver.sol';
import './interfaces/IPool.sol';
import './interfaces/IStakingRewards.sol';

//Libraries
import './libraries/SafeMath.sol';

//Internal references
import './Pool.sol';

contract PoolManager {
    using SafeMath for uint;

    IAddressResolver public immutable ADDRESS_RESOLVER;

    address[] public pools;
    mapping (address => uint[]) public userToManagedPools;
    mapping (address => uint[]) public userToInvestedPools;
    mapping (address => uint) public addressToIndex; // maps to (index + 1); index 0 represents pool not found

    constructor(IAddressResolver addressResolver) public {
        ADDRESS_RESOLVER = addressResolver;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the address of each available pool
    * @return address[] The address of each available pool
    */
    function _getAvailablePools() internal view returns(address[] memory) {
        return pools;
    }

    /**
    * @dev Returns the index of each pool the user manages
    * @param user Address of the user
    * @return uint[] The index in pools array of each pool the user manages
    */
    function _getUserManagedPools(address user) internal view returns(uint[] memory) {
        require(user != address(0), "Invalid address");

        return userToManagedPools[user];
    }

    /**
    * @dev Returns the index of each pool the user is invested in
    * @param user Address of the user
    * @return uint[] The index in pools array of each pool the user is invested in
    */
    function _getUserInvestedPools(address user) internal view returns(uint[] memory) {
        require(user != address(0), "Invalid address");

        return userToInvestedPools[user];
    }

    /**
    * @dev Returns the index of each pool the user is staked in
    * @param user Address of the user
    * @return uint[] The index in pools array of each pool the user is staked in
    * @return uint Number of pools the user is staked in
    */
    function _getUserStakedPools(address user) internal view returns(uint[] memory, uint) {
        require(user != address(0), "Invalid address");

        uint numberOfStakedPools = 0;
        uint[] memory stakedPoolIndexes = new uint[](userToInvestedPools[user].length);

        for (uint i = 0; i < stakedPoolIndexes.length; i++)
        {
            uint index = userToInvestedPools[user][i] - 1;
            address poolAddress = pools[index];
            address farmAddress = IPool(poolAddress).getFarmAddress();
            uint stakedBalance = (farmAddress != address(0)) ? IStakingRewards(farmAddress).balanceOf(user) : 0;

            if (stakedBalance > 0)
            {
                stakedPoolIndexes[numberOfStakedPools] = i;
                numberOfStakedPools++;
            }
        }

        return (stakedPoolIndexes, numberOfStakedPools);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Adds the index of the given pool to the user's array of invested pools
    * @param user Address of the user
    * @param poolAddress Address of the pool
    */
    function _addPosition(address user, address poolAddress) internal isValidPoolAddress(poolAddress) {
        userToInvestedPools[user].push(addressToIndex[poolAddress] - 1);
    }

    /**
    * @dev Removes the index of the given pool from the user's array of invested pools
    * @param user Address of the user
    * @param poolAddress Address of the pool
    */
    function _removePosition(address user, address poolAddress) internal isValidPoolAddress(poolAddress) {
        uint positionIndex;
        uint poolIndex = addressToIndex[poolAddress];

        //bounded by number of strategies
        for (positionIndex = 0; positionIndex < userToInvestedPools[user].length; positionIndex++)
        {
            if (positionIndex == poolIndex)
            {
                break;
            }
        }

        require (positionIndex < userToInvestedPools[user].length, "Position not found");

        userToInvestedPools[user][positionIndex] = userToInvestedPools[user][userToInvestedPools[user].length - 1];
        delete userToInvestedPools[user][userToInvestedPools[user].length - 1];
    }

    /**
    * @dev Creates a new pool
    * @param poolName Name of the pool
    * @param performanceFee Performance fee of the pool
    * @param manager User who manages the pool
    */
    function _createPool(string memory poolName, uint performanceFee, address manager) internal returns(address) {
        Pool temp = new Pool(poolName, performanceFee, manager, ADDRESS_RESOLVER);

        address poolAddress = address(temp);
        pools.push(poolAddress);
        userToManagedPools[manager].push(pools.length);
        addressToIndex[poolAddress] = pools.length;

        emit CreatedPool(manager, poolAddress, pools.length - 1, block.timestamp);

        return poolAddress;
    }

    /**
    * @dev Deposit cUSD into the given pool
    * @param user Address of the user
    * @param poolAddress Address of the pool
    * @param amount Amount of cUSD to deposit into the pool
    */
    function _deposit(address user, address poolAddress, uint amount) internal isValidPoolAddress(poolAddress) {
        if (IPool(poolAddress).balanceOf(user) == 0)
        {
            uint index = addressToIndex[poolAddress] - 1;
            userToInvestedPools[user].push(index);
        }

        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();
        IERC20(stableCoinAddress).transferFrom(msg.sender, address(this), amount);

        IPool(poolAddress).deposit(user, amount);
    }

    /**
    * @dev Withdraw cUSD from the given pool
    * @param user Address of the user
    * @param poolAddress Address of the pool
    * @param amount Amount of cUSD to withdraw from the pool
    */
    function _withdraw(address user, address poolAddress, uint amount) internal isValidPoolAddress(poolAddress) {
        IPool(poolAddress).withdraw(user, amount);

        if (IPool(poolAddress).balanceOf(user) == 0)
        {
            _removePosition(user, poolAddress);
        }
    }

    /**
    * @dev Places an order to buy/sell the given currency on behalf of the pool
    * @param poolAddress Address of the pool
    * @param currencyKey Address of currency to trade
    * @param buyOrSell Whether the user is buying or selling
    * @param numberOfTokens Number of tokens of the given currency
    */
    function _placeOrder(address poolAddress, address currencyKey, bool buyOrSell, uint numberOfTokens) internal isValidPoolAddress(poolAddress) onlyManager(poolAddress) {
        IPool(poolAddress).placeOrder(currencyKey, buyOrSell, numberOfTokens);
    }

    /* ========== MODIFIERS ========== */

    modifier isValidPoolAddress(address poolAddress) {
        require(ADDRESS_RESOLVER.checkIfPoolAddressIsValid(poolAddress), "Invalid pool address");
        _;
    }

    modifier onlyManager(address poolAddress) {
        address managerAddress = IPool(poolAddress).getManagerAddress();

        require(msg.sender == managerAddress, "Only the pool's manager can call this function");
        _;
    }

    /* ========== EVENTS ========== */

    event CreatedPool(address indexed managerAddress, address indexed poolAddress, uint poolIndex, uint timestamp);
}