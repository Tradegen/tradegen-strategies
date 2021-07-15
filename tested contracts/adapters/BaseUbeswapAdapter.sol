pragma solidity >=0.5.0;

//Interfaces
import '../interfaces/IUniswapV2Router02.sol';
import '../interfaces/IERC20.sol';
import '../interfaces/ISettings.sol';
import '../interfaces/IAddressResolver.sol';
import './interfaces/IBaseUbeswapAdapter.sol';

//Libraries
import '../libraries/SafeMath.sol';

contract BaseUbeswapAdapter is IBaseUbeswapAdapter {
    using SafeMath for uint;

    // Max slippage percent allowed
    uint public constant override MAX_SLIPPAGE_PERCENT = 10; //10% slippage

    IAddressResolver public immutable ADDRESS_RESOLVER;

    constructor(IAddressResolver addressResolver) public {
        ADDRESS_RESOLVER = addressResolver;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Given an input asset address, returns the price of the asset in cUSD
    * @param currencyKey Address of the asset
    * @return uint Price of the asset
    */
    function getPrice(address currencyKey) public view override returns(uint) {
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address ubeswapRouterAddress = ADDRESS_RESOLVER.getContractAddress("UbeswapRouter");

        require(currencyKey != address(0), "Invalid currency key");
        require(ISettings(settingsAddress).checkIfCurrencyIsAvailable(currencyKey), "Currency is not available");

        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();
        address[] memory path = new address[](2);
        path[0] = currencyKey;
        path[1] = stableCoinAddress;

        uint[] memory amounts = IUniswapV2Router02(ubeswapRouterAddress).getAmountsOut(10 ** _getDecimals(currencyKey), path); // 1 token -> cUSD

        return amounts[1];
    }

    /**
    * @dev Given an input asset amount, returns the maximum output amount of the other asset
    * @notice Assumes numberOfTokens is multiplied by currency's decimals before function call
    * @param numberOfTokens Number of tokens
    * @param currencyKeyIn Address of the asset to be swap from
    * @param currencyKeyOut Address of the asset to be swap to
    * @return uint Amount out of the asset
    */
    function getAmountsOut(uint numberOfTokens, address currencyKeyIn, address currencyKeyOut) public view override returns (uint) {
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");
        address ubeswapRouterAddress = ADDRESS_RESOLVER.getContractAddress("UbeswapRouter");
        address stableCoinAddress = ISettings(settingsAddress).getStableCoinAddress();

        require(currencyKeyIn != address(0), "Invalid currency key in");
        require(currencyKeyOut != address(0), "Invalid currency key out");
        require(ISettings(settingsAddress).checkIfCurrencyIsAvailable(currencyKeyIn) || currencyKeyIn == stableCoinAddress, "Currency is not available");
        require(ISettings(settingsAddress).checkIfCurrencyIsAvailable(currencyKeyOut) || currencyKeyOut == stableCoinAddress, "Currency is not available");
        require(numberOfTokens > 0, "Number of tokens must be greater than 0");

        address[] memory path = new address[](2);
        path[0] = currencyKeyIn;
        path[1] = currencyKeyOut;
        uint[] memory amounts = IUniswapV2Router02(ubeswapRouterAddress).getAmountsOut(numberOfTokens, path);

        return amounts[1];
    }

    /* ========== RESTRICTED FUNCTIONS ========== */

    /**
    * @dev Swaps an exact `amountToSwap` of an asset to another; meant to be called from a user pool
    * @notice Pool needs to transfer assetToSwapFrom to BaseUbeswapAdapter before calling this function
    * @param assetToSwapFrom Origin asset
    * @param assetToSwapTo Destination asset
    * @param amountToSwap Exact amount of `assetToSwapFrom` to be swapped
    * @param minAmountOut the min amount of `assetToSwapTo` to be received from the swap
    * @return the number of tokens received
    */
    function swapFromPool(address assetToSwapFrom, address assetToSwapTo, uint amountToSwap, uint minAmountOut) public override returns (uint) {
        require(ADDRESS_RESOLVER.checkIfPoolAddressIsValid(msg.sender), "Only the pool can call this function");

        return _swapExactTokensForTokens(msg.sender, assetToSwapFrom, assetToSwapTo, amountToSwap, minAmountOut);
    }

    /**
    * @dev Swaps an exact `amountToSwap` of an asset to another; meant to be called from a trading bot
    * @notice Bot needs to transfer assetToSwapFrom to BaseUbeswapAdapter before calling this function
    * @param assetToSwapFrom Origin asset
    * @param assetToSwapTo Destination asset
    * @param amountToSwap Exact amount of `assetToSwapFrom` to be swapped
    * @param minAmountOut the min amount of `assetToSwapTo` to be received from the swap
    * @return the number of tokens received
    */
    function swapFromBot(address assetToSwapFrom, address assetToSwapTo, uint amountToSwap, uint minAmountOut) public override returns (uint) {
        require(ADDRESS_RESOLVER.checkIfTradingBotAddressIsValid(msg.sender), "Only the trading bot can call this function");

        return _swapExactTokensForTokens(msg.sender, assetToSwapFrom, assetToSwapTo, amountToSwap, minAmountOut);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @dev Swaps an exact `amountToSwap` of an asset to another
    * @notice Assumes amountToSwap is multiplied by currency's decimals before function call
    * @param addressToSwapFrom the pool or bot that is making the swap
    * @param assetToSwapFrom Origin asset
    * @param assetToSwapTo Destination asset
    * @param amountToSwap Exact amount of `assetToSwapFrom` to be swapped
    * @param minAmountOut the min amount of `assetToSwapTo` to be received from the swap
    * @return the amount of tokens received
    */
    function _swapExactTokensForTokens(address addressToSwapFrom, address assetToSwapFrom, address assetToSwapTo, uint amountToSwap, uint minAmountOut) internal returns (uint) {
        uint amountOut = getAmountsOut(amountToSwap, assetToSwapFrom, assetToSwapTo);
        uint expectedMinAmountOut = amountOut.mul(100 - MAX_SLIPPAGE_PERCENT).div(100);

        require(expectedMinAmountOut < minAmountOut, 'BaseUbeswapAdapter: minAmountOut exceeds max slippage');

        address ubeswapRouterAddress = ADDRESS_RESOLVER.getContractAddress("UbeswapRouter");

        // Approves the transfer for the swap. Approves for 0 first to comply with tokens that implement the anti frontrunning approval fix.
        IERC20(assetToSwapFrom).approve(ubeswapRouterAddress, 0);
        IERC20(assetToSwapFrom).approve(ubeswapRouterAddress, amountToSwap);

        address[] memory path;
        path = new address[](2);
        path[0] = assetToSwapFrom;
        path[1] = assetToSwapTo;

        uint[] memory amounts = IUniswapV2Router02(ubeswapRouterAddress).swapExactTokensForTokens(amountToSwap, minAmountOut, path, addressToSwapFrom, block.timestamp);

        emit Swapped(assetToSwapFrom, assetToSwapTo, amounts[0], amounts[amounts.length - 1], block.timestamp);

        return amounts[amounts.length - 1];
    }

    /**
    * @dev Get the decimals of an asset
    * @return number of decimals of the asset
    */
    function _getDecimals(address asset) internal view returns (uint) {
        return IERC20(asset).decimals();
    }

    /* ========== EVENTS ========== */

    event Swapped(address fromAsset, address toAsset, uint fromAmount, uint receivedAmount, uint timestamp);
}