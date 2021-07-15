pragma solidity >=0.5.0;

import '../interfaces/IIndicator.sol';
import '../interfaces/IComparator.sol';

import '../libraries/SafeMath.sol';

contract FallByAtLeast is IComparator {
    using SafeMath for uint;

    struct State {
        address firstIndicatorAddress;
        address secondIndicatorAddress;
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

        _tradingBotStates[msg.sender].push(State(firstIndicatorAddress, secondIndicatorAddress));

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

        if (firstIndicatorHistory.length == 0)
        {
            emit ConditionStatus(false); //test

            return false;
        }

        //check if indicator rose in value
        if (firstIndicatorHistory[firstIndicatorHistory.length - 1] >= firstIndicatorHistory[0])
        {
            emit ConditionStatus(false); //test

            return false;
        }

        uint percentFall = firstIndicatorHistory[0].sub(firstIndicatorHistory[firstIndicatorHistory.length - 1]);
        percentFall = percentFall.mul(100);
        percentFall = percentFall.div(firstIndicatorHistory[0]);

        emit ConditionStatus(percentFall >= secondIndicatorHistory[0]); //test

        return (percentFall >= secondIndicatorHistory[0]);
    }

    event ConditionStatus(bool status); //test
}