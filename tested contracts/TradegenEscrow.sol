pragma solidity >=0.5.0;

// Inheritance
import "./Ownable.sol";
import "./interfaces/ITradegenEscrow.sol";

// Libraires
import "./libraries/SafeMath.sol";

// Internal references
import "./interfaces/IERC20.sol";
import "./interfaces/IAddressResolver.sol";

contract TradegenEscrow is Ownable, ITradegenEscrow {
    using SafeMath for uint;

    IAddressResolver public immutable ADDRESS_RESOLVER;

    /* Lists of (timestamp, quantity) pairs per account, sorted in ascending time order.
     * These are the times at which each given quantity of TGEN vests. */
    mapping(address => uint[2][]) public vestingSchedules;

    /* An account's total vested TGEN balance to save recomputing this */
    mapping(address => uint) public totalVestedAccountBalance;

    /* The total remaining vested balance, for verifying the actual Tradegen balance of this contract against. */
    uint public totalVestedBalance;

    uint public constant TIME_INDEX = 0;
    uint public constant QUANTITY_INDEX = 1;

    /* Limit vesting entries to disallow unbounded iteration over vesting schedules. */
    uint public constant MAX_VESTING_ENTRIES = 48;

    /* ========== CONSTRUCTOR ========== */

    constructor(IAddressResolver _addressResolver) public Ownable() {
        ADDRESS_RESOLVER = _addressResolver;
    }

    /* ========== VIEW FUNCTIONS ========== */

    /**
     * @notice A simple alias to totalVestedAccountBalance: provides ERC20 balance integration.
     */
    function balanceOf(address account) public view override returns (uint) {
        return totalVestedAccountBalance[account];
    }

    /**
     * @notice The number of vesting dates in an account's schedule.
     */
    function numVestingEntries(address account) public view override returns (uint) {
        return vestingSchedules[account].length;
    }

    /**
     * @notice Get a particular schedule entry for an account.
     * @return A pair of uints: (timestamp, TGEN quantity).
     */
    function getVestingScheduleEntry(address account, uint index) public view override returns (uint[2] memory) {
        return vestingSchedules[account][index];
    }

    /**
     * @notice Get the time at which a given schedule entry will vest.
     */
    function getVestingTime(address account, uint index) public view override returns (uint) {
        return getVestingScheduleEntry(account, index)[TIME_INDEX];
    }

    /**
     * @notice Get the quantity of TGEN associated with a given schedule entry.
     */
    function getVestingQuantity(address account, uint index) public view override returns (uint) {
        return getVestingScheduleEntry(account, index)[QUANTITY_INDEX];
    }

    /**
     * @notice Obtain the index of the next schedule entry that will vest for a given user.
     */
    function getNextVestingIndex(address account) public view override returns (uint) {
        uint len = numVestingEntries(account);

        for (uint i = 0; i < len; i++)
        {
            if (getVestingTime(account, i) != 0)
            {
                return i;
            }
        }

        return len;
    }

    /**
     * @notice Obtain the next schedule entry that will vest for a given user.
     * @return A pair of uints: (timestamp, TGEN quantity). */
    function getNextVestingEntry(address account) public view override returns (uint[2] memory) {
        uint index = getNextVestingIndex(account);
        if (index == numVestingEntries(account))
        {
            return [uint(0), 0];
        }

        return getVestingScheduleEntry(account, index);
    }

    /**
     * @notice Obtain the time at which the next schedule entry will vest for a given user.
     */
    function getNextVestingTime(address account) external view override returns (uint) {
        return getNextVestingEntry(account)[TIME_INDEX];
    }

    /**
     * @notice Obtain the quantity which the next schedule entry will vest for a given user.
     */
    function getNextVestingQuantity(address account) external view override returns (uint) {
        return getNextVestingEntry(account)[QUANTITY_INDEX];
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Add a new vesting entry at a given time and quantity to an account's schedule.
     * @param account The account to append a new vesting entry to.
     * @param time The absolute unix timestamp after which the vested quantity may be withdrawn.
     * @param quantity The quantity of TGEN that will vest.
     */
    function appendVestingEntry(address account, uint time, uint quantity) public onlyOwner {
        address baseTradegenAddress = ADDRESS_RESOLVER.getContractAddress("BaseTradegen");

        /* No empty or already-passed vesting entries allowed. */
        require(block.timestamp < time, "Time must be in the future");
        require(quantity != 0, "Quantity cannot be zero");

        /* There must be enough balance in the contract to provide for the vesting entry. */
        totalVestedBalance = totalVestedBalance.add(quantity);
        require(
            totalVestedBalance <= IERC20(baseTradegenAddress).balanceOf(address(this)),
            "Must be enough balance in the contract to provide for the vesting entry"
        );

        /* Disallow arbitrarily long vesting schedules in light of the gas limit. */
        uint scheduleLength = vestingSchedules[account].length;
        require(scheduleLength <= MAX_VESTING_ENTRIES, "Vesting schedule is too long");

        if (scheduleLength == 0)
        {
            totalVestedAccountBalance[account] = quantity;
        }
        else
        {
            /* Disallow adding new vested TGEN earlier than the last one.
             * Since entries are only appended, this means that no vesting date can be repeated. */
            require(
                getVestingTime(account, numVestingEntries(account) - 1) < time,
                "Cannot add new vested entries earlier than the last one"
            );

            totalVestedAccountBalance[account] = totalVestedAccountBalance[account].add(quantity);
        }

        vestingSchedules[account].push([time, quantity]);
    }

    /**
     * @notice Construct a vesting schedule to release a quantities of TGEN
     * over a series of intervals.
     * @dev Assumes that the quantities are nonzero
     * and that the sequence of timestamps is strictly increasing.
     */
    function addCustomVestingSchedule(address account, uint[] calldata times, uint[] calldata quantities) external onlyOwner {
        uint total;
        for (uint i = 0; i < times.length; i++)
        {
            appendVestingEntry(account, times[i], quantities[i]);
            total = total.add(quantities[i]);
        }

        emit AddedVestingSchedule(account, total, block.timestamp);
    }

    /**
     * @notice Construct a vesting schedule to release equal amounts of TGEN
     * over a number of months.
     * @dev Assumes that the quantities are nonzero
     * and that the sequence of timestamps is strictly increasing.
     */
    function addUniformMonthlyVestingSchedule(address account, uint amount, uint numberOfMonths) external onlyOwner {
        require(numberOfMonths <= MAX_VESTING_ENTRIES, "Vesting schedule is too long");

        uint timestamp = block.timestamp;
        for (uint i = 0; i < numberOfMonths; i++)
        {
            uint difference = 30 days;
            timestamp = timestamp.add(difference);
            appendVestingEntry(account, timestamp, amount.div(numberOfMonths));
        }

        emit AddedVestingSchedule(account, amount, block.timestamp);
    }

    /**
     * @notice Allow a user to withdraw any TGEN in their schedule that have vested.
     */
    function vest() external override {
        uint numEntries = numVestingEntries(msg.sender);
        uint total;

        for (uint i = 0; i < numEntries; i++)
        {
            uint time = getVestingTime(msg.sender, i);
            /* The list is sorted; when we reach the first future time, bail out. */
            if (time > block.timestamp)
            {
                break;
            }

            uint qty = getVestingQuantity(msg.sender, i);

            if (qty > 0)
            {
                vestingSchedules[msg.sender][i] = [0, 0];
                total = total.add(qty);
            }
        }

        if (total != 0)
        {
            address baseTradegenAddress = ADDRESS_RESOLVER.getContractAddress("BaseTradegen");
            totalVestedBalance = totalVestedBalance.sub(total);
            totalVestedAccountBalance[msg.sender] = totalVestedAccountBalance[msg.sender].sub(total);
            IERC20(baseTradegenAddress).transfer(msg.sender, total);

            emit Vested(msg.sender, block.timestamp, total);
        }
    }

    /* ========== EVENTS ========== */

    event Vested(address indexed beneficiary, uint time, uint value);
    event AddedVestingSchedule(address indexed beneficiary, uint total, uint timestamp);
}