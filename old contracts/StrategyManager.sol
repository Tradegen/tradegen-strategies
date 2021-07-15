pragma solidity >=0.5.0;

//Libraries
import './libraries/SafeMath.sol';

//Inheritance
import './interfaces/IAddressResolver.sol';

import './Strategy.sol';

contract StrategyManager {
    using SafeMath for uint;

    IAddressResolver public immutable ADDRESS_RESOLVER;

    address[] public strategies; // stores contract address of each published strategy
    mapping (address => uint[]) public userToPublishedStrategies; //stores indexes of user's published strategies
    mapping (address => uint[]) public userToPositions; //stores index of user's positions (strategies);
    mapping (address => uint) public addressToIndex; // maps to (index + 1); index 0 represents strategy not found
    mapping (string => uint) public strategySymbolToIndex; //maps to (index + 1); index 0 represents strategy not found
    mapping (string => uint) public strategyNameToIndex; //maps to (index + 1); index 0 represents strategy not found

    constructor(IAddressResolver addressResolver) public {
        ADDRESS_RESOLVER = addressResolver;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Given the address of a user, returns the index in array of strategies for each of the user's published strategies
    * @param user Address of the user
    * @return uint[] The indexes of user's published strategies
    */
    function getUserPublishedStrategies(address user) external view returns(uint[] memory) {
        require(user != address(0), "Invalid address");

        return userToPublishedStrategies[user];
    }

    /**
    * @dev Given the address of a user, returns the index in array of strategies for each position the user has
    * @param user Address of the user
    * @return uint[] The indexes of strategies the user is invested in
    */
    function getUserPositions(address user) external view returns(uint[] memory) {
        require(user != address(0), "Invalid address");

        return userToPositions[user];
    }

    /**
    * @dev Given the index of a strategy, returns the address of the strategy
    * @param index Index in array of available strategies
    * @return address Address of the strategy
    */
    function getStrategyAddressFromIndex(uint index) external view returns(address) {
        require(index >= 0 && index < strategies.length, "Index out of range");

        return strategies[index];
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @dev Adds the index of the given strategy to the user's array of invested strategies
    * @param user Address of the user
    * @param strategyAddress Address of the strategy
    */
    function _addPosition(address user, address strategyAddress) internal isValidStrategyAddress(strategyAddress) {
        userToPositions[user].push(addressToIndex[strategyAddress] - 1);
    }

    /**
    * @dev Removes the index of the given strategy from the user's array of invested strategies
    * @param user Address of the user
    * @param strategyAddress Address of the strategy
    */
    function _removePosition(address user, address strategyAddress) internal isValidStrategyAddress(strategyAddress) {
        uint positionIndex;
        uint strategyIndex = addressToIndex[strategyAddress];

        //bounded by number of strategies
        for (positionIndex = 0; positionIndex < userToPositions[user].length; positionIndex++)
        {
            if (positionIndex == strategyIndex)
            {
                break;
            }
        }

        require (positionIndex < userToPositions[user].length, "Position not found");

        userToPositions[user][positionIndex] = userToPositions[user][userToPositions[user].length - 1];
        delete userToPositions[user][userToPositions[user].length - 1];
    }

    /**
    * @dev Adds the index of the given strategy to the user's array of invested strategies
    * @param strategyName Name of the strategy
    * @param strategySymbol Symbol for strategy's tokens
    * @param strategyParams Parameters for the strategy
    * @param entryRules Array of encoded entry rules for the strategy
    * @param exitRules Array of encoded exit rules for the strategy
    * @param developerAddress Address of the strategy's developer
    */
    function _publishStrategy(string memory strategyName,
                            string memory strategySymbol,
                            uint strategyParams,
                            uint[] memory entryRules,
                            uint[] memory exitRules,
                            address developerAddress) internal {

        Strategy temp = new Strategy(strategyName,
                                    strategySymbol,
                                    strategyParams,
                                    entryRules,
                                    exitRules,
                                    developerAddress,
                                    ADDRESS_RESOLVER);

        address strategyAddress = address(temp);
        strategies.push(strategyAddress);
        userToPublishedStrategies[developerAddress].push(strategies.length);
        addressToIndex[strategyAddress] = strategies.length;
        strategySymbolToIndex[strategySymbol] = strategies.length;
        strategyNameToIndex[strategyName] = strategies.length;
        ADDRESS_RESOLVER.addStrategyAddress(strategyAddress);

        emit PublishedStrategy(developerAddress, strategyAddress, strategies.length - 1, block.timestamp);
    }

    /* ========== MODIFIERS ========== */

    modifier isValidStrategyAddress(address strategyAddress) {
        require(ADDRESS_RESOLVER.checkIfStrategyAddressIsValid(strategyAddress), "Invalid strategy address");
        _;
    }

    /* ========== EVENTS ========== */

    event PublishedStrategy(address developerAddress, address strategyAddress, uint strategyIndex, uint timestamp);
}