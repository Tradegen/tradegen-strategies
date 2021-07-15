pragma solidity >=0.5.0;

//libraries
import './libraries/SafeMath.sol';

//Interfaces
import './interfaces/IAddressResolver.sol';
import './interfaces/IStrategyToken.sol';

contract Marketplace {
    using SafeMath for uint;

    IAddressResolver private immutable ADDRESS_RESOLVER;

    struct PositionForSale {
        uint88 numberOfTokens;
        uint88 pricePerToken;
        address strategyAddress;
    }

    mapping (address => PositionForSale[]) public userToMarketplaceListings; //stores the marketplace listings for a given user
    mapping (address => mapping (address => uint)) public userToNumberOfTokensForSale; //stores number of tokens for sale for each position a given user has

    constructor(IAddressResolver addressResolver) public {
        ADDRESS_RESOLVER = addressResolver;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Returns the marketplace listing data for each listing the user has
    * @param user Address of the user
    * @return PositionForSale[] The number of tokens, advertised price per token, and strategy address for each marketplace listing the user has
    */
    function getUserPositionsForSale(address user) public view returns (PositionForSale[] memory) {
        return userToMarketplaceListings[user];
    }

    /**
    * @dev Returns the marketplace listing data for the given marketplace listing
    * @param user Address of the user
    * @param marketplaceListingIndex Index of the marketplace listing in the array of marketplace listings
    * @return (uint, uint, address) The number of tokens, advertised price per token, and strategy address for the marketplace listing
    */
    function getMarketplaceListing(address user, uint marketplaceListingIndex) public view marketplaceListingIndexWithinBounds(user, marketplaceListingIndex) returns (uint, uint, address) {
        PositionForSale memory temp = userToMarketplaceListings[user][marketplaceListingIndex];

        return (uint256(temp.numberOfTokens), uint256(temp.pricePerToken), temp.strategyAddress);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Lists LP tokens for sale in the given strategy
    * @param strategyAddress Address of the strategy
    * @param pricePerToken Price per LP token in TGEN
    * @param numberOfTokens Number of LP tokens to sell
    */
    function listPositionForSale(address strategyAddress, uint pricePerToken, uint numberOfTokens) external {
        require(ADDRESS_RESOLVER.checkIfStrategyAddressIsValid(strategyAddress), "Invalid strategy address");
        require(pricePerToken > 0, "Price per token cannot be 0");
        require(numberOfTokens > 0, "Number of tokens cannot be 0");

        //Check how many LP tokens the user has in the strategy
        uint userBalance = IStrategyToken(strategyAddress).getBalanceOf(msg.sender);

        require(userBalance > 0, "No tokens in this strategy");
        require(userBalance - userToNumberOfTokensForSale[msg.sender][strategyAddress] >= numberOfTokens, "Not enough tokens in this strategy");

        userToMarketplaceListings[msg.sender].push(PositionForSale(uint88(numberOfTokens), uint88(pricePerToken), strategyAddress));
        userToNumberOfTokensForSale[msg.sender][strategyAddress] = uint256(userToNumberOfTokensForSale[msg.sender][strategyAddress]).add(numberOfTokens);

        emit ListedPositionForSale(msg.sender, strategyAddress, userToMarketplaceListings[msg.sender].length - 1, pricePerToken, numberOfTokens, block.timestamp);
    }

    /**
    * @dev Edits the price per token for the specified marketplace listing
    * @param marketplaceListingIndex Index of the marketplace listing in the array of marketplace listings
    * @param newPrice New price per token for the marketplace listing (in TGEN)
    */
    function editListing(uint marketplaceListingIndex, uint newPrice) external marketplaceListingIndexWithinBounds(msg.sender, marketplaceListingIndex) {
        require(newPrice > 0, "Price cannot be 0");

        userToMarketplaceListings[msg.sender][marketplaceListingIndex].pricePerToken = uint88(newPrice);

        emit UpdatedListing(msg.sender, userToMarketplaceListings[msg.sender][marketplaceListingIndex].strategyAddress, marketplaceListingIndex, newPrice, block.timestamp);
    }

    /**
    * @dev Wrapper for the internal cancelListing function
    * @param marketplaceListingIndex Index of the marketplace listing in the array of marketplace listings
    */
    function cancelListing(uint marketplaceListingIndex) external {
        _cancelListing(msg.sender, marketplaceListingIndex);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @dev Cancels the given marketplace listing
    * @param user Address of user 
    * @param marketplaceListingIndex Index of the marketplace listing in the array of marketplace listings
    */
    function _cancelListing(address user, uint marketplaceListingIndex) internal marketplaceListingIndexWithinBounds(user, marketplaceListingIndex) {
        uint numberOfTokens = userToMarketplaceListings[user][marketplaceListingIndex].numberOfTokens;
        address strategyAddress = userToMarketplaceListings[user][marketplaceListingIndex].strategyAddress;

        //Reorders user's marketplace listings array
        userToMarketplaceListings[user][marketplaceListingIndex] = userToMarketplaceListings[user][userToMarketplaceListings[user].length - 1];
        userToMarketplaceListings[user].pop();

        userToNumberOfTokensForSale[user][strategyAddress].sub(numberOfTokens);

        //Remove from mapping if user has no more tokens for sale in the strategy
        if (userToNumberOfTokensForSale[user][strategyAddress] == 0)
        {
            delete userToNumberOfTokensForSale[user][strategyAddress];
        }

        emit CancelledListing(user, strategyAddress, marketplaceListingIndex, block.timestamp);
    }

    /* ========== MODIFIERS ========== */

    modifier marketplaceListingIndexWithinBounds(address user, uint marketplaceListingIndex) {
        require(marketplaceListingIndex < userToMarketplaceListings[user].length, "Marketplace listing index out of bounds");
        _;
    }

    /* ========== EVENTS ========== */

    event ListedPositionForSale(address indexed user, address strategyAddress, uint marketplaceListingIndex, uint price, uint numberOfTokens, uint timestamp);
    event UpdatedListing(address indexed user, address strategyAddress, uint marketplaceListingIndex, uint newPrice, uint timestamp);
    event CancelledListing(address indexed user, address strategyAddress, uint marketplaceListingIndex, uint timestamp);
}