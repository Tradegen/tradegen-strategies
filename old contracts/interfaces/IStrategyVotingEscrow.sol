pragma solidity >=0.5.0;

interface IStrategyVotingEscrow {

    function claimRewards(address user, uint amount) external;
}