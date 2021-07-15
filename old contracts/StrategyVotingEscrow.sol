pragma solidity >=0.5.0;

//Libraries
import './libraries/SafeMath.sol';

// Inheritance
import "./Ownable.sol";
import './interfaces/IStrategyVotingEscrow.sol';

// Internal references
import "./interfaces/IERC20.sol";
import "./interfaces/IAddressResolver.sol";

contract StrategyVotingEscrow is Ownable, IStrategyVotingEscrow {
    using SafeMath for uint;

    IAddressResolver public immutable ADDRESS_RESOLVER;

    constructor(IAddressResolver _addressResolver) public Ownable() {
        ADDRESS_RESOLVER = _addressResolver;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    function claimRewards(address user, uint amount) public override onlyStrategyApproval {
        address baseTradegenAddress = ADDRESS_RESOLVER.getContractAddress("BaseTradegen");

        require(amount > 0, "No strategy voting rewards to claim");
        require(IERC20(baseTradegenAddress).balanceOf(address(this)) >= amount, "Not enough TGEN in escrow");

        IERC20(baseTradegenAddress).transfer(user, amount);
    }

    /* ========== MODIFIERS ========== */

    modifier onlyStrategyApproval() {
        address strategyVotingAddress = ADDRESS_RESOLVER.getContractAddress("StrategyApproval");
        
        require(msg.sender == strategyVotingAddress, "Only the StrategyApproval contract can call this function");
        _;
    }
}