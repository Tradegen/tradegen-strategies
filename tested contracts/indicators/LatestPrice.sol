pragma solidity >=0.5.0;

import '../interfaces/IIndicator.sol';

contract LatestPrice is IIndicator {

    uint public _price;
    address public _developer;

    mapping (address => mapping(uint =>uint[])) private _tradingBotStates;

    constructor(uint price) public {
        require(price >= 0, "Price must be greater than 0");

        _price = price;
        _developer = msg.sender;
    }

    /**
    * @dev Returns the name of the indicator
    * @return string Name of the indicator
    */
    function getName() public pure override returns (string memory) {
        return "LatestPrice";
    }

    /**
    * @dev Returns the sale price and the developer of the indicator
    * @return (uint, address) Sale price of the indicator and the indicator's developer
    */
    function getPriceAndDeveloper() public view override returns (uint, address) {
        return (_price, _developer);
    }

    /**
    * @dev Updates the sale price of the indicator; meant to be called by the indicator's developer
    * @param newPrice The new sale price of the indicator
    */
    function editPrice(uint newPrice) external override {
        require(msg.sender == _developer, "Only the developer can edit the price");
        require(newPrice >= 0, "Price must be a positive number");

        _price = newPrice;

        emit UpdatedPrice(address(this), newPrice, block.timestamp);
    }

    /**
    * @dev Initializes the state of the trading bot; meant to be called by a trading bot
    * @param param Value of the indicator's parameter
    */
    function addTradingBot(uint param) public override returns (uint) {
        return 0;
    }

    /**
    * @dev Updates the indicator's state based on the latest price feed update
    * @param index Index in trading bot's entry/exit rule array
    * @param latestPrice The latest price from oracle price feed
    */
    function update(uint index, uint latestPrice) public override {
        require(index >= 0, "Invalid index");

        _tradingBotStates[msg.sender][index].push(latestPrice);
    }   

    /**
    * @dev Given a trading bot address, returns the indicator value for that bot
    * @param tradingBotAddress Address of trading bot
    * @param index Index in trading bot's entry/exit rule array
    * @return uint[] Indicator value for the given trading bot
    */
    function getValue(address tradingBotAddress, uint index) public view override returns (uint[] memory) {
        require(tradingBotAddress != address(0), "Invalid trading bot address");
        require(index >= 0 && index < _tradingBotStates[tradingBotAddress][index].length, "Invalid index");

        uint[] memory temp = new uint[](1);
        temp[0] = _tradingBotStates[tradingBotAddress][index][_tradingBotStates[tradingBotAddress][index].length - 1];

        return temp;
    }

    /**
    * @dev Given a trading bot address, returns the indicator value history for that bot
    * @param tradingBotAddress Address of trading bot
    * @param index Index in trading bot's entry/exit rule array
    * @return uint[] Indicator value history for the given trading bot
    */
    function getHistory(address tradingBotAddress, uint index) public view override returns (uint[] memory) {
        require(tradingBotAddress != address(0), "Invalid trading bot address");
        require(index >= 0 && index < _tradingBotStates[tradingBotAddress][index].length, "Invalid index");

        return _tradingBotStates[tradingBotAddress][index];
    }
}