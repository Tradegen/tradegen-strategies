pragma solidity >=0.5.0;

import '../interfaces/IIndicator.sol';
import '../interfaces/IComparator.sol';

contract Closes is IComparator {

    struct State {
        address firstIndicatorAddress;
        address secondIndicatorAddress;
        uint previousPrice;
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

        _tradingBotStates[msg.sender].push(State(firstIndicatorAddress, secondIndicatorAddress, 1));

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

        uint[] memory priceHistory = IIndicator(_tradingBotStates[msg.sender][comparatorIndex].firstIndicatorAddress).getValue(msg.sender, firstIndicatorIndex);
        
        if (keccak256(bytes(IIndicator(_tradingBotStates[msg.sender][comparatorIndex].secondIndicatorAddress).getName())) == keccak256(bytes("Up")))
        {
            if (priceHistory.length == 0)
            {   
                return false;
            }

            if (priceHistory.length > 1)
            {
                for (uint i = 1; i < priceHistory.length; i++)
                {
                    if (priceHistory[i] <= priceHistory[i - 1])
                    {
                        return false;
                    }
                }

                return true;
            }
            else
            {
                bool result = (priceHistory[0] > _tradingBotStates[msg.sender][comparatorIndex].previousPrice);
                _tradingBotStates[msg.sender][comparatorIndex].previousPrice = priceHistory[0];

                return result;
            }
        }
        else if (keccak256(bytes(IIndicator(_tradingBotStates[msg.sender][comparatorIndex].secondIndicatorAddress).getName())) == keccak256(bytes("Down")))
        {
            if (priceHistory.length == 0)
            {
                return false;
            }

            if (priceHistory.length > 1)
            {
                for (uint i = 1; i < priceHistory.length; i++)
                {
                    if (priceHistory[i] >= priceHistory[i - 1])
                    {
                        return false;
                    }
                }

                return true;
            }
            else
            {
                bool result = (priceHistory[0] < _tradingBotStates[msg.sender][comparatorIndex].previousPrice);
                _tradingBotStates[msg.sender][comparatorIndex].previousPrice = priceHistory[0];

                return result;
            }
        }

        return false;
    }
}