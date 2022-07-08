pragma solidity >=0.5.0;

//Libraries
import './libraries/SafeMath.sol';

// Inheritance
import "./Ownable.sol";
import './interfaces/IPoolRewardsEscrow.sol';

// Internal references
import "./interfaces/IERC20.sol";
import "./interfaces/IAddressResolver.sol";

contract PoolRewardsEscrow is Ownable, IPoolRewardsEscrow {
    using SafeMath for uint;

    IAddressResolver public immutable ADDRESS_RESOLVER;

    constructor(IAddressResolver _addressResolver) public Ownable() {
        ADDRESS_RESOLVER = _addressResolver;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function claimPoolRewards(address user, uint amount) public override onlyUserPoolFarm {
        address baseTradegenAddress = ADDRESS_RESOLVER.getContractAddress("BaseTradegen");

        require(amount > 0, "No pool rewards to claim");
        require(IERC20(baseTradegenAddress).balanceOf(address(this)) >= amount, "Not enough TGEN in escrow");

        IERC20(baseTradegenAddress).transfer(user, amount);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyUserPoolFarm() {
        address poolRewardsAddress = ADDRESS_RESOLVER.getContractAddress("UserPoolFarm");

        require(msg.sender == poolRewardsAddress, "Only the UserPoolFarm contract can call this function");
        _;
    }
}