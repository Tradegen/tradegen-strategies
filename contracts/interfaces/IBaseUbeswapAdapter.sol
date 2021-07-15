pragma solidity >=0.5.0;

import './IUniswapV2Router02.sol';

interface IBaseUbeswapAdapter {
    function MAX_SLIPPAGE_PERCENT() external returns (uint);

    /**
    * @dev Given an input asset address, returns the price of the asset in cUSD
    * @param currencyKey Address of the asset
    * @return uint Price of the asset
    */
    function getPrice(address currencyKey) external view returns (uint);

    /**
    * @dev Given an input asset amount, returns the maximum output amount of the other asset
    * @param numberOfTokens Number of tokens
    * @param currencyKeyIn Address of the asset to be swap from
    * @param currencyKeyOut Address of the asset to be swap to
    * @return uint Amount out of the asset
    */
    function getAmountsOut(uint numberOfTokens, address currencyKeyIn, address currencyKeyOut) external view returns (uint);

    /**
    * @dev Swaps an exact `amountToSwap` of an asset to another; meant to be called from a user pool
    * @param assetToSwapFrom Origin asset
    * @param assetToSwapTo Destination asset
    * @param amountToSwap Exact amount of `assetToSwapFrom` to be swapped
    * @param minAmountOut the min amount of `assetToSwapTo` to be received from the swap
    * @return uint The number of tokens received
    */
    function swapFromPool(address assetToSwapFrom, address assetToSwapTo, uint amountToSwap, uint minAmountOut) external returns (uint);

    /**
    * @dev Swaps an exact `amountToSwap` of an asset to another; meant to be called from a trading bot
    * @param assetToSwapFrom Origin asset
    * @param assetToSwapTo Destination asset
    * @param amountToSwap Exact amount of `assetToSwapFrom` to be swapped
    * @param minAmountOut the min amount of `assetToSwapTo` to be received from the swap
    * @return uint The number of tokens received
    */
    function swapFromBot(address assetToSwapFrom, address assetToSwapTo, uint amountToSwap, uint minAmountOut) external returns (uint);
}