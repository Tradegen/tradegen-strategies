pragma solidity >=0.5.0;

// Inheritance
import "./Ownable.sol";

// Internal references
import "./interfaces/IERC20.sol";
import "./interfaces/IAddressResolver.sol";

// Libraires
import "./libraries/SafeMath.sol";

contract DistributeFunds is Ownable {
    using SafeMath for uint;

    IAddressResolver public immutable ADDRESS_RESOLVER;

    struct Recipient {
        uint balance;
        address recipientAddress;
        string name;
    }

    Recipient[] public recipients;
    
    uint public amountDistributed;

    mapping (string => uint) public nameToIndex; //Maps to (index + 1); index 0 represents recipient not found
    mapping (address => uint) public addressToIndex; //Maps to (index + 1); index 0 represents recipient not found

    constructor(IAddressResolver _addressResolver) public Ownable() {
        ADDRESS_RESOLVER = _addressResolver;
    }

    /* ========== VIEW FUNCTIONS ========== */

    /**
    * @dev Returns the name of each recipient 
    * @return string[] The name of each recipient
    */
    function getNames() public view returns (string[] memory) {
        string[] memory names = new string[](recipients.length);

        for (uint i = 0; i < recipients.length; i++)
        {
            names[i] = recipients[i].name;
        }

        return names;
    }

    /**
    * @dev Given a recipient's name, returns the recipient's allocated funds and address
    * @param name The recipient's name
    * @return (uint, address) Recipient's allocated TGEN and address
    */
    function getRecipient(string memory name) public view returns (uint, address) {
        require(nameToIndex[name] > 0, "Recipient not found");

        uint index = nameToIndex[name] - 1;

        return (recipients[index].balance, recipients[index].recipientAddress);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Adds a new recipient
    * @notice Need to call TradegenERC20.approve() before calling this function
    * @param account Address of the recipient
    * @param quantity Amount of TGEN to allocate
    * @param name Name of recipient
    */
    function addRecipient(address account, uint quantity, string memory name) public onlyOwner {
        address baseTradegenAddress = ADDRESS_RESOLVER.getContractAddress("BaseTradegen");

        require(account != address(0), "Invalid address");
        require(nameToIndex[name] == 0, "Name already exists");
        require(addressToIndex[account] == 0, "Address already exists");
        require(quantity > 0, "Quantity must be greater than 0");
        require(amountDistributed.add(quantity) <= IERC20(baseTradegenAddress).totalSupply(), "Not enough TGEN available");

        recipients.push(Recipient(quantity, account, name));
        amountDistributed.add(quantity);
        nameToIndex[name] = recipients.length;
        addressToIndex[account] = recipients.length;

        //Transfer TGEN to recipient
        IERC20(baseTradegenAddress).transferFrom(msg.sender, account, quantity);

        emit AddedRecipient(account, quantity, name);
    }

    /* ========== Events ========== */

    event AddedRecipient(address indexed account, uint quantity, string name);
}