pragma solidity >=0.5.0;

import '../interfaces/IIndicator.sol';

contract LowOfLastNPriceUpdates is IIndicator {

    struct State {
        uint8 N;
        uint128 currentValue;
        uint[] history;
    }

    uint public _price;
    address public _developer;

    mapping (address => State) private _tradingBotStates;

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
        return "LowOfLastNPriceUpdates";
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
    function addTradingBot(uint param) public override {
        require(_tradingBotStates[msg.sender].currentValue == 0, "Trading bot already exists");
        require(param > 1 && param <= 200, "Param must be between 2 and 200");

        _tradingBotStates[msg.sender] = State(uint8(param), 0, new uint[](0));
    }

    /**
    * @dev Updates the indicator's state based on the latest price feed update
    * @param latestPrice The latest price from oracle price feed
    */
    function update(uint latestPrice) public override {
        _tradingBotStates[msg.sender].history.push(latestPrice);
        uint length = (_tradingBotStates[msg.sender].history.length >= uint256(_tradingBotStates[msg.sender].N)) ? uint256(_tradingBotStates[msg.sender].N) : 0;

        uint low = (length == 0) ? 0 : _tradingBotStates[msg.sender].history[_tradingBotStates[msg.sender].history.length - 1];

        for (uint i = 0; i < length; i++)
        {
            low = (_tradingBotStates[msg.sender].history[_tradingBotStates[msg.sender].history.length - i - 1] < low) ? _tradingBotStates[msg.sender].history[_tradingBotStates[msg.sender].history.length - i - 1] : low;
        }

        _tradingBotStates[msg.sender].currentValue = uint128(low);
    }   

    /**
    * @dev Given a trading bot address, returns the indicator value for that bot
    * @param tradingBotAddress Address of trading bot
    * @return uint[] Indicator value for the given trading bot
    */
    function getValue(address tradingBotAddress) public view override returns (uint[] memory) {
        require(tradingBotAddress != address(0), "Invalid trading bot address");

        uint[] memory temp = new uint[](1);
        temp[0] = uint256(_tradingBotStates[tradingBotAddress].currentValue);
        return temp;
    }

    /**
    * @dev Given a trading bot address, returns the indicator value history for that bot
    * @param tradingBotAddress Address of trading bot
    * @return uint[] Indicator value history for the given trading bot
    */
    function getHistory(address tradingBotAddress) public view override returns (uint[] memory) {
        require(tradingBotAddress != address(0), "Invalid trading bot address");

        return _tradingBotStates[tradingBotAddress].history;
    }
}