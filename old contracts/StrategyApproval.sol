pragma solidity >=0.5.0;

import './Settings.sol';
import './Components.sol';
import './AddressResolver.sol';
import './StrategyManager.sol';
import './StakingRewards.sol';

//Interfaces
import './interfaces/IERC20.sol';
import './interfaces/ISettings.sol';
import './interfaces/IAddressResolver.sol';
import './interfaces/IComponents.sol';
import './interfaces/IStrategyVotingEscrow.sol';

contract StrategyApproval is AddressResolver, StrategyManager {

    IAddressResolver public immutable ADDRESS_RESOLVER;

    struct UserVote {
        bool decision;
        bool correct;
        uint32 timestamp;
        uint32 strategyID;
    }

    struct StrategyVote {
        address voter;
        uint32 timestamp;
        bool decision;
        bool correct;
    }

    struct SubmittedStrategy {
        bool status; //true = approved, false = rejected
        bool pendingApproval; //true = pending, false = decision made
        address developer;
        uint submittedBacktestResults;
        uint submittedParams;
        string strategyName;
        string strategySymbol;
        uint[] entryRules;
        uint[] exitRules;
        StrategyVote[] votes;
    }

    SubmittedStrategy[] public submittedStrategies;
    mapping (address => UserVote[]) public userVoteHistory;
    mapping (address => uint[]) public userSubmittedStrategies;
    mapping (address => uint) public availableRewards;

    constructor(IAddressResolver addressResolver) StrategyManager(addressResolver) public {
        ADDRESS_RESOLVER = addressResolver;
    }

    /* ========== VIEWS ========== */

    /**
    * @dev Given the address of a user, return the user's vote history
    * @param user Address of the user
    * @return UserVote[] The decision, timestamp, and strategy ID of each vote the user made
    */
    function getUserVoteHistory(address user) public view returns (UserVote[] memory) {
        return userVoteHistory[user];
    }

    /**
    * @dev Given the address of a user, return the index of each strategy the user submitted
    * @param user Address of the user
    * @return uint[] The index of each strategy the user submitted
    */
    function getUserSubmittedStrategies(address user) public view returns (uint[] memory) {
        return userSubmittedStrategies[user];
    }

    /**
    * @dev Given the index of a submitted strategy, return the details of that strategy
    * @param index Index of the submitted strategy in the submittedStrategies array
    * @return SubmittedStrategy The details of the submitted strategy
    */
    function getSubmittedStrategy(uint index) public view indexIsWithinBounds(index) returns (SubmittedStrategy memory) {
        return submittedStrategies[index];
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
    * @dev Submits a strategy for approval, with the given details
    * @param backtestResults Encoded stats for strategy's backtest (performed on centralized server)
    * @param strategyParams Encoded parameters for the strategy
    * @param entryRules Array of encoded entry rules for the strategy
    * @param exitRules Array of encoded exit rules for the strategy
    * @param strategyName Name of the strategy
    * @param strategySymbol Symbol of the strategy's (future) token
    */
    function submitStrategyForApproval(uint backtestResults, uint strategyParams, uint[] memory entryRules, uint[] memory exitRules, string memory strategyName, string memory strategySymbol) external {
        require(_checkIfStrategyMeetsCriteria(backtestResults, strategyParams, entryRules, exitRules, strategyName, strategySymbol), "Strategy does not meet criteria");
        require(_checkIfUserPurchasedComponents(entryRules, exitRules), "Need to purchase indicator/comparator before using");

        submittedStrategies.push(SubmittedStrategy(false, true, msg.sender, backtestResults, strategyParams, strategyName, strategySymbol, entryRules, exitRules, new StrategyVote[](0)));
        userSubmittedStrategies[msg.sender].push(submittedStrategies.length - 1);

        emit SubmittedStrategyForApproval(msg.sender, submittedStrategies.length - 1, block.timestamp);
    }

    /**
    * @dev Vote for the submitted strategy
    * @param index Index of the submitted strategy in the submittedStrategies array
    * @param decision Whether to approve or reject the strategy
    * @param backtestResults Encoded stats for strategy's backtest (performed on centralized server)
    * @param strategyParams Encoded parameters for the strategy
    * @param entryRules Array of encoded entry rules for the strategy
    * @param exitRules Array of encoded exit rules for the strategy
    */
    function voteForStrategy(uint index, bool decision, uint backtestResults, uint strategyParams, uint[] memory entryRules, uint[] memory exitRules) external indexIsWithinBounds(index) strategyIsPendingApproval(index) userHasNotVotedYet(msg.sender, index) {
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");

        require(_checkIfParamsMatch(index, strategyParams, entryRules, exitRules), "Strategy parameters do not match");

        bool meetsCriteria = _checkIfStrategyMeetsCriteria(backtestResults, strategyParams, entryRules, exitRules, submittedStrategies[index].strategyName, submittedStrategies[index].strategySymbol);
        bool correct = false;

        //Reward voter
        if ((decision && meetsCriteria) || (!decision && !meetsCriteria))
        {
            correct = true;
            uint votingReward = ISettings(settingsAddress).getParameterValue("VotingReward");
            availableRewards[msg.sender] = availableRewards[msg.sender].add(votingReward);
        }

        submittedStrategies[index].votes.push(StrategyVote(msg.sender, uint32(block.timestamp), decision, correct));
        userVoteHistory[msg.sender].push(UserVote(decision, correct, uint32(block.timestamp), uint32(index)));

        if (submittedStrategies[index].votes.length == ISettings(settingsAddress).getParameterValue("VoteLimit"))
        {
            _processVotes(index);
        }

        emit VotedForStrategy(msg.sender, index, decision, block.timestamp);
    }

    /**
    * @dev Claims available rewards for the user
    */
    function claimRewards() public {
        require(availableRewards[msg.sender] > 0, "No rewards available");

        uint amount = availableRewards[msg.sender];
        address strategyVotingEscrowAddress = ADDRESS_RESOLVER.getContractAddress("StrategyVotingEscrow");
        availableRewards[msg.sender] = 0;
        IStrategyVotingEscrow(strategyVotingEscrowAddress).claimRewards(msg.sender, amount);

        emit ReceivedReward(msg.sender, amount, block.timestamp);
    }

    /**
    * @dev Checks whether the user purchased each indicator/comparator used in the strategy's entry/exit rules
    * @param entryRules Array of encoded entry rules for the strategy
    * @param exitRules Array of encoded exit rules for the strategy
    * @return bool Whether the user purchased each indicator and comparator used in the entry/exit rules
    */
    function _checkIfUserPurchasedComponents(uint[] memory entryRules, uint[] memory exitRules) public view returns (bool)
    {
        address componentsAddress = ADDRESS_RESOLVER.getContractAddress("Components");

        //Bounded by maximum number of entry rules (in Settings contract)
        for (uint i = 0; i < entryRules.length; i++)
        {
            uint comparator = entryRules[i] >> 96;
            uint firstIndicator = (entryRules[i] << 160) >> 248;
            uint secondIndicator = (entryRules[i] << 168) >> 248;

            if (!IComponents(componentsAddress).checkIfUserPurchasedIndicator(msg.sender, firstIndicator))
            {
                return false;
            }

            if (!IComponents(componentsAddress).checkIfUserPurchasedIndicator(msg.sender, secondIndicator))
            {
                return false;
            }

            if (!IComponents(componentsAddress).checkIfUserPurchasedComparator(msg.sender, comparator))
            {
                return false;
            }
        }

        //Bounded by maximum number of exit rules (in Settings contract)
        for (uint i = 0; i < exitRules.length; i++)
        {
            uint comparator = exitRules[i] >> 96;
            uint firstIndicator = (exitRules[i] << 160) >> 248;
            uint secondIndicator = (exitRules[i] << 168) >> 248;

            if (!IComponents(componentsAddress).checkIfUserPurchasedIndicator(msg.sender, firstIndicator))
            {
                return false;
            }

            if (!IComponents(componentsAddress).checkIfUserPurchasedIndicator(msg.sender, secondIndicator))
            {
                return false;
            }

            if (!IComponents(componentsAddress).checkIfUserPurchasedComparator(msg.sender, comparator))
            {
                return false;
            }
        }

        return true;
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    /**
    * @dev Submits a strategy for approval, with the given details
    * @notice Encoding for backtest results:
    *         bits 0-174: empty
    *         bit 175: Alpha direction (positive or negative)
    *         bits 176-199: Alpha
    *         bits 200-219: accuracy
    *         bits 220-235: number of trades over backtest period
    *         bits 236-255: max drawdown
    * @notice Encoding for strategy params:
    *         bits 100-149: empty
    *         bits 150-199: max pool size
    *         bits 200-207: trade duration (number of oracle rounds)
    *         bits 208-223: underlying symbol index
    *         bits 224-239: profit target
    *         bits 240-255: stop loss
    * @param backtestResults Encoded stats for strategy's backtest (performed on centralized server)
    * @param strategyParams Encoded parameters for the strategy
    * @param entryRules Array of encoded entry rules for the strategy
    * @param exitRules Array of encoded exit rules for the strategy
    * @param strategyName Name of the strategy
    * @param strategySymbol Symbol of the strategy's (future) token
    */
    function _checkIfStrategyMeetsCriteria(uint backtestResults, uint strategyParams, uint[] memory entryRules, uint[] memory exitRules, string memory strategyName, string memory strategySymbol) internal view returns(bool) {
        uint numberOfTrades = (backtestResults << 220) >> 240;
        uint alphaDirection = (backtestResults << 175) >> 255;
        uint maxPoolSize = (strategyParams << 149) >> 206;
        uint maxDuration = (strategyParams << 200) >> 248;
        uint symbol = (strategyParams << 208) >> 240;
        uint profitTarget = (strategyParams << 224) >> 240;
        uint stopLoss = (strategyParams << 240) >> 240;

        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");

        return (ISettings(settingsAddress).getCurrencyKeyFromIndex(symbol) != address(0) && 
                entryRules.length <= SETTINGS.getParameterValue("MaximumNumberOfEntryRules") &&
                exitRules.length <= SETTINGS.getParameterValue("MaximumNumberOfExitRules") &&
                bytes(strategyName).length > 0 &&
                bytes(strategyName).length < 25 &&
                bytes(strategySymbol).length > 0 &&
                bytes(strategySymbol).length < 7 &&
                strategyNameToIndex[strategyName] == 0 && strategySymbolToIndex[strategySymbol] == 0 &&
                entryRules.length > 0 &&
                exitRules.length > 0 &&
                numberOfTrades > 0 &&
                alphaDirection == 1 &&
                maxDuration > 0 &&
                profitTarget > 0 &&
                stopLoss > 0 &&
                maxPoolSize > 0);
    }

    /**
    * @dev Checks whether the given params match those of the submitted strategy (prevents user from spoofing strategy params)
    * @param index Index of the submitted strategy in the submittedStrategies array
    * @param strategyParams Encoded parameters for the strategy
    * @param entryRules Array of encoded entry rules for the strategy
    * @param exitRules Array of encoded exit rules for the strategy
    * @return bool Whether the given params match those of the submitted strategy
    */
    function _checkIfParamsMatch(uint index, uint strategyParams, uint[] memory entryRules, uint[] memory exitRules) internal view indexIsWithinBounds(index) returns(bool) {
        SubmittedStrategy memory strategy = submittedStrategies[index];
        uint[] memory submittedEntryRules = strategy.entryRules;
        uint[] memory submittedExitRules = strategy.exitRules;

        if (entryRules.length != submittedEntryRules.length || exitRules.length != submittedExitRules.length)
        {
            return false;
        }

        for (uint i = 0; i < entryRules.length; i++)
        {
            if (entryRules[i] != submittedEntryRules[i])
            {
                return false;
            }
        }

        for (uint i = 0; i < exitRules.length; i++)
        {
            if (exitRules[i] != submittedExitRules[i])
            {
                return false;
            }
        }

        return (strategyParams == strategy.submittedParams);
    }

    /**
    * @dev Processes the votes for the given strategy; publishes strategy to platform if approval threshold is met
    * @param index Index of the submitted strategy in the submittedStrategies array
    */
    function _processVotes(uint index) internal {
        uint numberOfCorrectVotes;
        SubmittedStrategy memory strategy = submittedStrategies[index];

        //Bounded by vote limit
        for (uint i = 0; i < strategy.votes.length; i++)
        {
            if (strategy.votes[i].correct)
            {
                numberOfCorrectVotes++;
            }
        }

        submittedStrategies[index].pendingApproval = false;
        address settingsAddress = ADDRESS_RESOLVER.getContractAddress("Settings");

        if (numberOfCorrectVotes >= ISettings(settingsAddress).getParameterValue("StrategyApprovalThreshold"))
        {
            submittedStrategies[index].status = true;
            _publishStrategy(strategy.strategyName, strategy.strategySymbol, strategy.submittedParams, strategy.entryRules, strategy.exitRules, strategy.developer);
            emit ApprovedStrategy(index, block.timestamp);
        }
        else
        {
            submittedStrategies[index].status = false;
            emit RejectedStrategy(index, block.timestamp);
        }
    }

    /* ========== MODIFIERS ========== */

    modifier indexIsWithinBounds(uint index) {
        require(index >= 0 && index < submittedStrategies.length, "Index out of bounds");
        _;
    }

    modifier strategyIsPendingApproval(uint index) {
        require(submittedStrategies[index].pendingApproval, "Strategy is not available for voting");
        _;
    }

    modifier userHasNotVotedYet(address user, uint index) {
        SubmittedStrategy memory strategy = submittedStrategies[index]; //indexIsWithinBounds() called before this modifier
        bool found = false;

        //bounded by vote limit
        for (uint i = 0; i < strategy.votes.length; i++)
        {
            if (strategy.votes[i].voter == user)
            {
                found = true;
                break;
            }
        }

        require(!found, "Already voted for this strategy");
        _;
    }

    /* ========== EVENTS ========== */

    event SubmittedStrategyForApproval(address indexed user, uint index, uint timestamp);
    event VotedForStrategy(address indexed user, uint index, bool decision, uint timestamp);
    event ApprovedStrategy(uint index, uint timestamp);
    event RejectedStrategy(uint index, uint timestamp);
    event ReceivedReward(address indexed user, uint amount, uint timestamp);
}