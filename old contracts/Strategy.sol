pragma solidity >=0.5.0;

import './TradingBot.sol';

//Libraries
import './libraries/SafeMath.sol';

//Interfaces
import './interfaces/IERC20.sol';
import './interfaces/IStrategyToken.sol';
import './interfaces/IAddressResolver.sol';
import './interfaces/ITradingBot.sol';

contract Strategy is IStrategyToken {
    using SafeMath for uint;

    IAddressResolver public ADDRESS_RESOLVER;
    ITradingBot public immutable TRADING_BOT;

    //ERC20 state variables
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint public maxSupply = 1000000 * (10 ** decimals); //1000000 tokens 

    //Strategy variables
    address private tradingBotAddress;
    address public developerAddress;
    uint public publishedOnTimestamp;

    //Custom token state variables
    uint public maxPoolSize;
    uint public override tokenPrice;
    uint public circulatingSupply;

    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;

    constructor(string memory _name,
                string memory _symbol,
                uint _strategyParams,
                uint[] memory _entryRules,
                uint[] memory _exitRules,
                address _developerAddress,
                IAddressResolver addressResolver) public onlyStrategyManager {

        ADDRESS_RESOLVER = addressResolver;

        developerAddress = _developerAddress;
        symbol = _symbol;
        name = _name;

        maxPoolSize = (_strategyParams << 150) >> 206;
        uint maxTradeDuration = (_strategyParams << 200) >> 248;
        uint underlyingAssetSymbol = (_strategyParams << 208) >> 240;
        uint profitTarget = (_strategyParams << 224) >> 240;
        uint stopLoss = (_strategyParams << 240) >> 240;

        maxPoolSize = maxPoolSize.mul(10 ** decimals);
        publishedOnTimestamp = block.timestamp;
        tokenPrice = maxPoolSize.div(maxSupply);

        tradingBotAddress = address(new TradingBot(_entryRules, _exitRules, maxTradeDuration, profitTarget, stopLoss, underlyingAssetSymbol, addressResolver));
        TRADING_BOT = ITradingBot(tradingBotAddress);
        addressResolver.addTradingBotAddress(tradingBotAddress);
    }

    //ERC20 functions

    function _mint(address to, uint value) internal {
        require(circulatingSupply.add(value) <= maxSupply, "Cannot exceed max supply");
        circulatingSupply = circulatingSupply.add(value);
        balanceOf[to] = balanceOf[to].add(value);
    }

    function _burn(address from, uint value) internal {
        balanceOf[from] = balanceOf[from].sub(value);
        circulatingSupply = circulatingSupply.sub(value);
    }

    function _approve(address owner, address spender, uint value) private {
        allowance[owner][spender] = value;
    }

    function _transfer(address from, address to, uint value) internal {
        balanceOf[from] = balanceOf[from].sub(value);
        balanceOf[to] = balanceOf[to].add(value);
    }

    function approve(address spender, uint value) external returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint value) external returns (bool) {
        if (allowance[from][msg.sender] > 0) {
            allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
        }
        _transfer(from, to, value);
        return true;
    }

    //Strategy functions

    /**
    * @dev Returns the details for the strategy
    * @return (string, string, address, uint, uint, uint, uint) The strategy's name, symbol, developer, timestamp, max pool size, token price, and circulating supply
    */
    function _getStrategyDetails() public view override returns (string memory, string memory, address, uint, uint, uint, uint) {
        return (name, symbol, developerAddress, publishedOnTimestamp, maxPoolSize, tokenPrice, circulatingSupply);
    }

    /**
    * @dev Returns the user's position details
    * @param user Address of the user
    * @return (string, string, uint, uint, uint) The strategy's name, symbol, user's balance, circulating supply, and max pool size
    */
    function _getPositionDetails(address user) public view override returns (string memory, string memory, uint, uint, uint) {
        return (name, symbol, balanceOf[user], circulatingSupply, maxPoolSize);
    }

    /**
    * @dev Transfers the LP tokens from seller to buyer
    * @param from Address of the seller
    * @param to Address of the buyer
    * @param numberOfTokens Number of LP tokens of the position
    */
    function buyPosition(address from, address to, uint numberOfTokens) public override onlyStrategyProxy {
        _transfer(from, to, numberOfTokens);
    }

    /**
    * @dev Deposits the given USD amount into the strategy
    * @param user Address of the user
    * @param amount USD value to deposit into the strategy
    */
    function deposit(address user, uint amount) public override onlyStrategyProxy {
        uint numberOfTokens = amount.div(tokenPrice);
        _mint(user, numberOfTokens);
    }

    /**
    * @dev Withdraws the given USD amount from the strategy
    * @param user Address of the user
    * @param amount USD value to withdraw from the strategy
    */
    function withdraw(address user, uint amount) public override onlyStrategyProxy {
        uint numberOfTokens = amount.div(tokenPrice);
        _burn(user, numberOfTokens);

        TRADING_BOT.withdraw(user, amount);
    }

    /**
    * @dev Returns the address of the strategy's trading bot
    * @return address The address of the strategy's trading bot
    */
    function getTradingBotAddress() public view override onlyStrategyProxy returns (address) {
        return tradingBotAddress;
    }

    /**
    * @dev Returns the address of the strategy's developer
    * @return address The address of the strategy's developer
    */
    function getDeveloperAddress() public view override returns (address) {
        return developerAddress;
    }

    /**
    * @dev Given the address of a user, returns the number of LP tokens the user has
    * @param user Address of the user
    * @return uint Number of LP tokens the user has in the strategy
    */
    function getBalanceOf(address user) public view override onlyProxyOrTradingBotRewards returns (uint) {
        return balanceOf[user];
    }

    /**
    * @dev Returns the number of LP tokens the strategy has in circulation
    * @return uint Number of LP tokens in circulation
    */
    function getCirculatingSupply() public view override returns (uint) {
        return circulatingSupply;
    }

    /**
    * @dev Returns whether the trading bot is in a trade
    * @return bool Whether the strategy's trading bot is currently in a trade
    */
    function checkIfBotIsInATrade() public view override returns (bool) {
        return TRADING_BOT.checkIfBotIsInATrade();
    }

    /* ========== MODIFIERS ========== */

    modifier onlyProxyOrTradingBotRewards() {
        address strategyProxyAddress = ADDRESS_RESOLVER.getContractAddress("StrategyProxy");
        address tradingBotRewardsAddress = ADDRESS_RESOLVER.getContractAddress("TradingBotRewards");

        require(msg.sender == strategyProxyAddress || msg.sender == tradingBotRewardsAddress, "Only proxy or trading bot rewards can call this function");
        _;
    }

    modifier onlyStrategyManager() {
        address strategyManagerAddress = ADDRESS_RESOLVER.getContractAddress("StrategyManager");

        require(msg.sender == strategyManagerAddress, "Only StrategyManager contract can call this function");
        _;
    }

    modifier onlyStrategyProxy() {
        address strategyProxyAddress = ADDRESS_RESOLVER.getContractAddress("StrategyProxy");
        
        require(msg.sender == strategyProxyAddress, "Only StrategyProxy contract can call this function");
        _;
    }
}