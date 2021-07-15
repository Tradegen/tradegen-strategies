pragma solidity >=0.5.0;

import '../interfaces/IIndicator.sol';
import '../interfaces/IComparator.sol';

import '../libraries/SafeMath.sol';

contract FallsTo is IComparator {
    using SafeMath for uint;

    struct State {
        address firstIndicatorAddress;
        address secondIndicatorAddress;
        uint128 firstIndicatorPreviousValue;
        uint128 secondIndicatorPreviousValue;
    }

    uint public _price;
    address public _developer;

    mapping (address => State[]) private _tradingBotStates;

    constructor(uint price) public {
        require(price >= 0, "Price must be greater than 0");

        _price = price;
        _developer = msg.sender;
    }

    /**
    * @dev Returns the sale price and the developer of the comparator
    * @return (uint, address) Sale price of the comparator and the comparator's developer
    */
    function getPriceAndDeveloper() public view override returns (uint, address) {
        return (_price, _developer);
    }

    /**
    * @dev Updates the sale price of the comparator; meant to be called by the comparator developer
    * @param newPrice The new sale price of the comparator
    */
    function editPrice(uint newPrice) external override {
        require(msg.sender == _developer, "Only the developer can edit the price");
        require(newPrice >= 0, "Price must be a positive number");

        _price = newPrice;

        emit UpdatedPrice(address(this), newPrice, block.timestamp);
    }

    /**
    * @dev Initializes the state of the trading bot; meant to be called by a trading bot
    * @param firstIndicatorAddress Address of the comparator's first indicator
    * @param secondIndicatorAddress Address of the comparator's second indicator
    * @return uint Index of comparator in trading bot instance array
    */
    function addTradingBot(address firstIndicatorAddress, address secondIndicatorAddress) public override returns (uint) {
        require(firstIndicatorAddress != address(0), "Invalid first indicator address");
        require(secondIndicatorAddress != address(0), "Invalid second indicator address");

        _tradingBotStates[msg.sender].push(State(firstIndicatorAddress, secondIndicatorAddress, 0, 0));

        return _tradingBotStates[msg.sender].length - 1;
    }

    /**
    * @dev Returns whether the comparator's conditions are met
    * @param comparatorIndex Index of comparator in trading bot's entry/exit rule array
    * @param firstIndicatorIndex Index of first indicator in trading bot's entry/exit rule array
    * @param secondIndicatorIndex Index of second indicator in trading bot's entry/exit rule array
    * @return bool Whether the comparator's conditions are met after the latest price feed update
    */
    function checkConditions(uint comparatorIndex, uint firstIndicatorIndex, uint secondIndicatorIndex) public override returns (bool) {
        require(comparatorIndex >= 0 && comparatorIndex < _tradingBotStates[msg.sender].length, "Invalid comparator index");
        require(firstIndicatorIndex >= 0, "Invalid first indicator index");
        require(secondIndicatorIndex >= 0, "Invalid second indicator index");

        State memory tradingBotState = _tradingBotStates[msg.sender][comparatorIndex];

        uint[] memory firstIndicatorHistory = IIndicator(tradingBotState.firstIndicatorAddress).getValue(msg.sender, firstIndicatorIndex);
        uint[] memory secondIndicatorHistory = IIndicator(tradingBotState.secondIndicatorAddress).getValue(msg.sender, secondIndicatorIndex);

        if (firstIndicatorHistory.length == 0 || secondIndicatorHistory.length == 0)
        {
            emit ConditionStatus(false); //test

            return false;
        }

        //first indicator can be within +/- 0.1% of second indicator value and still meet conditions
        uint previousUpperErrorBound = uint256(tradingBotState.secondIndicatorPreviousValue).mul(1001).div(1000);
        uint currentLowerErrorBound = secondIndicatorHistory[0].mul(999).div(1000);
        uint currentUpperErrorBound = secondIndicatorHistory[0].mul(1001).div(1000);

        bool result = (tradingBotState.firstIndicatorPreviousValue > previousUpperErrorBound)
                    && (firstIndicatorHistory[0] >= currentLowerErrorBound)
                    && (firstIndicatorHistory[0] <= currentUpperErrorBound);

        _tradingBotStates[msg.sender][comparatorIndex].firstIndicatorPreviousValue = uint128(firstIndicatorHistory[0]);
        _tradingBotStates[msg.sender][comparatorIndex].secondIndicatorPreviousValue = uint128(secondIndicatorHistory[0]);

        emit ConditionStatus(result); //test
        emit Bounds(previousUpperErrorBound, currentLowerErrorBound, currentUpperErrorBound); //test

        return result;
    }

    event ConditionStatus(bool status); //test
    event Bounds(uint previousUpperBound, uint currentLowerBound, uint currentUpperBound); //test
}