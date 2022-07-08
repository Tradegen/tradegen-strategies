pragma solidity >=0.5.0;

//Adapters
import './interfaces/IBaseUbeswapAdapter.sol';

//Interfaces
import './interfaces/IERC20.sol';
import './interfaces/IPool.sol';
import './interfaces/ISettings.sol';
import './interfaces/IAddressResolver.sol';
import './interfaces/IFeePool.sol';

//Libraries
import './libraries/SafeMath.sol';

contract Pool is IPool, IERC20 {
    using SafeMath for uint;

    IAddressResolver public ADDRESS_RESOLVER;
   
    string public _name;
    uint public _totalSupply;
    address public _manager;
    uint public _performanceFee; //expressed as %
    address public _farmAddress;
    address public _poolManagerAddress;

    mapping (address => uint) public _balanceOf;
    mapping(address => mapping(address => uint)) public override allowance;

    address[] public _positionKeys;

    constructor(string memory name, uint performanceFee, address manager, IAddressResolver addressResolver) public {
        _name = name;
        _manager = manager;
        _performanceFee = performanceFee;
        ADDRESS_RESOLVER = addressResolver;
        _poolManagerAddress = msg.sender;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the name of the pool
    * @return string The name of the pool
    */
    function name() public view override(IPool, IERC20) returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return "";
    }

    function decimals() public view override returns (uint8) {
        return 18;
    }

    /**
    * @dev Returns the address of the pool's farm
    * @return address Address of the pool's farm
    */
    function getFarmAddress() public view override returns (address) {
        return _farmAddress;
    }

    /**
    * @dev Return the pool manager's address
    * @return address Address of the pool's manager
    */
    function getManagerAddress() public view override returns (address) {
        return _manager;
    }

    /**
    * @dev Returns the currency address and balance of each position the pool has, as well as the cumulative value
    * @return (address[], uint[], uint) Currency address and balance of each position the pool has, and the cumulative value of positions
    */
    function getPositionsAndTotal() public view override returns (address[] memory, uint[] memory, uint) {
        address baseUbeswapAdapterAddress = ADDRESS_RESOLVER.getContractAddress("BaseUbeswapAdapter");
        address[] memory addresses = new address[](_positionKeys.length);
        uint[] memory balances = new uint[](_positionKeys.length);
        uint sum = 0;

        for (uint i = 0; i < _positionKeys.length; i++)
        {
            balances[i] = IERC20(_positionKeys[i]).balanceOf(address(this));
            addresses[i] = _positionKeys[i];

            uint USDperToken = IBaseUbeswapAdapter(baseUbeswapAdapterAddress).getPrice(_positionKeys[i]);
            uint positionBalanceInUSD = USDperToken.mul(balances[i]);
            sum.add(positionBalanceInUSD);
        }

        return (addresses, balances, sum);
    }

    /**
    * @dev Returns the amount of cUSD the pool has to invest
    * @return uint Amount of cUSD the pool has available
    */
    function getAvailableFunds() public view override returns (uint) {
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();

        return IERC20(stableCoinAddress).balanceOf(address(this));
    }

    /**
    * @dev Returns the value of the pool in USD
    * @return uint Value of the pool in USD
    */
    function getPoolBalance() public view override returns (uint) {
        (,, uint positionBalance) = getPositionsAndTotal();
        uint availableFunds = getAvailableFunds();
        
        return availableFunds.add(positionBalance);
    }

    /**
    * @dev Returns the balance of the user in USD
    * @return uint Balance of the user in USD
    */
    function getUSDBalance(address user) public view override returns (uint) {
        require(user != address(0), "Invalid address");

        uint poolBalance = getPoolBalance();

        return poolBalance.mul(_balanceOf[user]).div(_totalSupply);
    }

    /**
    * @dev Returns the number of LP tokens the user has
    * @param user Address of the user
    * @return uint Number of LP tokens the user has
    */
    function balanceOf(address user) public view override(IPool, IERC20) returns (uint) {
        require(user != address(0), "Invalid user address");

        return _balanceOf[user];
    }

    /**
    * @dev Returns the total supply of LP tokens in the pool
    * @return uint Total supply of LP tokens
    */
    function totalSupply() public view override returns (uint) {
        return _totalSupply;
    }

    /**
    * @dev Returns the pool's performance fee
    * @return uint The pool's performance fee
    */
    function getPerformanceFee() public view override returns (uint) {
        return _performanceFee;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function approve(address spender, uint value) public override returns (bool) {
        _approve(msg.sender, spender, value);
        return true;
    }

    function transfer(address to, uint value) public override returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint value) public override returns (bool) {
        if (allowance[from][msg.sender] > 0) {
            allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
        }
        _transfer(from, to, value);
        return true;
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @dev Deposits the given USD amount into the pool
    * @param user Address of the user
    * @param amount Amount of USD to deposit into the pool
    */
    function deposit(address user, uint amount) public override onlyPoolManager {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Deposit must be greater than 0");

        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();

        IERC20(stableCoinAddress).transferFrom(msg.sender, address(this), amount);
        _balanceOf[user].add(amount); //add 1 LP token per cUSD
        _totalSupply.add(amount);

        emit DepositedFundsIntoPool(msg.sender, address(this), amount, block.timestamp);
    }

    /**
    * @dev Withdraws the given USD amount on behalf of the user
    * @notice The withdrawal is done using pool's assets at time of withdrawal. This avoids the exchange fees and slippage from exchanging pool's assets back to cUSD or TGEN.
    * @param user Address of user to withdraw
    * @param amount Amount of USD to withdraw from the pool
    */
    function withdraw(address user, uint amount) public override onlyPoolManager {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Withdrawal must be greater than 0");

        uint USDBalance = getUSDBalance(user);

        require(USDBalance >= amount, "Not enough funds to withdraw");

        uint poolBalance = getPoolBalance();
        uint totalProfit = (USDBalance > _balanceOf[user]) ? USDBalance.sub(_balanceOf[user]) : 0;
        uint profitOnWithdrawalAmount = totalProfit.mul(amount).div(USDBalance); //Multiply by ratio of withdrawal amount to USD balance
        uint fee = profitOnWithdrawalAmount.mul(_performanceFee).div(100);
        uint amountToWithdrawAfterFee = amount.sub(fee);

        //Pay performance fee if user has profit
        if (totalProfit > 0) 
        {
            _payPerformanceFee(user, fee);
        }

        uint numberOfLPTokens = amount.div(poolBalance);
        _balanceOf[user].sub(numberOfLPTokens);
        _totalSupply.sub(numberOfLPTokens);

        //Withdraw user's portion of pool's assets
        for (uint i = 0; i < _positionKeys.length; i++)
        {
            uint positionBalance = IERC20(_positionKeys[i]).balanceOf(address(this)); //Number of asset's tokens
            uint amountToTransfer = positionBalance.mul(amountToWithdrawAfterFee).div(poolBalance); //Multiply by ratio of withdrawal amount after fee to pool's USD balance

            IERC20(_positionKeys[i]).approve(user, amountToTransfer);
            IERC20(_positionKeys[i]).transferFrom(address(this), user, amountToTransfer);

            //Remove position key if pool is liquidated
            if (_totalSupply == 0)
            {
                delete _positionKeys[i];
            }
        }

        emit WithdrewFundsFromPool(msg.sender, address(this), amount, block.timestamp);
    }

    /**
    * @dev Places an order to buy/sell the given currency
    * @param currencyKey Address of currency to trade
    * @param buyOrSell Whether the user is buying or selling
    * @param numberOfTokens Number of tokens of the given currency
    */
    function placeOrder(address currencyKey, bool buyOrSell, uint numberOfTokens) public override onlyPoolManager {
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address baseUbeswapAdapterAddress = ADDRESS_RESOLVER.getContractAddress("BaseUbeswapAdapter");
        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();

        require(numberOfTokens > 0, "Number of tokens must be greater than 0");
        require(currencyKey != address(0), "Invalid currency key");
        require(ISettings(settingsAddress).checkIfCurrencyIsAvailable(currencyKey), "Currency key is not available");

        uint tokenToUSD = IBaseUbeswapAdapter(baseUbeswapAdapterAddress).getPrice(currencyKey);
        uint numberOfTokensReceived;

        //buying
        if (buyOrSell)
        {
            require(getAvailableFunds() >= numberOfTokens.mul(tokenToUSD), "Not enough funds");

            uint amountInUSD = numberOfTokens.div(tokenToUSD);
            uint minAmountOut = numberOfTokens.mul(98).div(100); //max slippage 2%

            numberOfTokensReceived = IBaseUbeswapAdapter(baseUbeswapAdapterAddress).swapFromPool(stableCoinAddress, currencyKey, amountInUSD, minAmountOut);
        }
        //selling
        else
        {
            uint positionIndex;
            for (positionIndex = 0; positionIndex < _positionKeys.length; positionIndex++)
            {
                if (currencyKey == _positionKeys[positionIndex])
                {
                    break;
                }
            }

            require(positionIndex < _positionKeys.length, "Don't have a position in this currency");
            require(IERC20(currencyKey).balanceOf(msg.sender) >= numberOfTokens, "Not enough tokens in this currency");

            uint amountInUSD = numberOfTokens.mul(tokenToUSD);
            uint minAmountOut = amountInUSD.mul(98).div(100); //max slippage 2%

            numberOfTokensReceived = IBaseUbeswapAdapter(baseUbeswapAdapterAddress).swapFromPool(currencyKey, stableCoinAddress, numberOfTokens, minAmountOut);

            //remove position key if no funds left in currency
            if (IERC20(currencyKey).balanceOf(msg.sender) == 0)
            {
                _positionKeys[positionIndex] = _positionKeys[_positionKeys.length - 1];
                _positionKeys.pop();
            }
        }

        emit PlacedOrder(address(this), currencyKey, buyOrSell, numberOfTokens, numberOfTokensReceived, block.timestamp);
    }

    /**
    * @dev Updates the pool's farm address
    * @param farmAddress Address of the pool's farm
    */
    function setFarmAddress(address farmAddress) public override onlyPoolManager {
        require(farmAddress != address(0), "Invalid farm address");

        _farmAddress = farmAddress;

        emit UpdatedFarmAddress(address(this), farmAddress, block.timestamp);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @dev Pay performance fee on the user's profit when the user withdraws from the pool
    * @notice Performance fee is paid in pool's assets at time of withdrawal
    * @param user Address of the user
    * @param fee Amount of cUSD to pay as a fee
    */
    function _payPerformanceFee(address user, uint fee) internal {
        uint poolBalance = getPoolBalance();
        address feePoolAddress = ADDRESS_RESOLVER.getContractAddress("FeePool");

        //Withdraw performance fee proportional to pool's assets
        for (uint i = 0; i < _positionKeys.length; i++)
        {
            uint positionBalance = IERC20(_positionKeys[i]).balanceOf(address(this));
            uint amountToTransfer = positionBalance.mul(fee).div(poolBalance);

            IERC20(_positionKeys[i]).approve(feePoolAddress, amountToTransfer);
            IERC20(_positionKeys[i]).transferFrom(address(this), feePoolAddress, amountToTransfer);
        }

        IFeePool(feePoolAddress).addFees(_manager, fee);

        emit PaidPerformanceFee(user, address(this), fee, block.timestamp);
    }

    function _approve(address owner, address spender, uint value) private {
        allowance[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    function _transfer(address from, address to, uint value) private {
        _balanceOf[from] = _balanceOf[from].sub(value);
        _balanceOf[to] = _balanceOf[to].add(value);
        emit Transfer(from, to, value);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyPoolManager() {
        require(msg.sender == _poolManagerAddress, "Only PoolManager contract can call this function");
        _;
    }

    /* ========== EVENTS ========== */

    event DepositedFundsIntoPool(address indexed user, address indexed poolAddress, uint amount, uint timestamp);
    event WithdrewFundsFromPool(address indexed user, address indexed poolAddress, uint amount, uint timestamp);
    event PaidPerformanceFee(address indexed user, address indexed poolAddress, uint amount, uint timestamp);
    event PlacedOrder(address indexed poolAddress, address indexed currencyKey, bool buyOrSell, uint numberOfTokensSwapped, uint numberOfTokensReceived, uint timestamp);
    event UpdatedFarmAddress(address indexed poolAddress, address farmAddress, uint timestamp);
}