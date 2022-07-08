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
    * @dev Returns the address of each recipient 
    * @return address[] The address of each recipient
    */
    function getAddresses() public view returns (address[] memory) {
        address[] memory addresses = new address[](recipients.length);

        for (uint i = 0; i < recipients.length; i++)
        {
            addresses[i] = recipients[i].recipientAddress;
        }

        return addresses;
    }

    /**
    * @dev Given a recipient's name, returns the recipient's allocated funds and address
    * @param name The recipient's name
    * @return (uint, address) Recipient's allocated TGEN and address
    */
    function getRecipientByName(string memory name) public view returns (uint, address) {
        require(nameToIndex[name] > 0, "Recipient not found");

        uint index = nameToIndex[name] - 1;

        return (recipients[index].balance, recipients[index].recipientAddress);
    }

    /**
    * @dev Given a recipient's address, returns the recipient's allocated funds and name
    * @param recipientAddress The recipient's address
    * @return (uint, string) Recipient's allocated TGEN and name
    */
    function getRecipientByAddress(address recipientAddress) public view returns (uint, string memory) {
        require(recipientAddress != address(0), "Invalid address");
        require(addressToIndex[recipientAddress] > 0, "Recipient not found");

        uint index = addressToIndex[recipientAddress] - 1;

        return (recipients[index].balance, recipients[index].name);
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

        require(baseTradegenAddress != address(0), "Invalid base tradegen address");
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