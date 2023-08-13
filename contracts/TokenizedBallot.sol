// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

// instead of using interface, we could import as well
// interface is better for loose coupling
interface IMyToken {
    function getPastVotes(address, uint256) external view returns (uint256);
}

contract TokenizedBallot {
    struct Proposal {
        bytes32 name;
        uint voteCount;
    }

    Proposal[] public proposals;
    IMyToken public tokenContract;
    uint256 public targetBlockNumber;
    mapping(address => uint256) public votingPowerSpent;

    constructor(bytes32[] memory proposalNames, address _tokenContract, uint256 _targetBlockNumber) {
        tokenContract = IMyToken(_tokenContract);
        targetBlockNumber = _targetBlockNumber;
        for (uint i = 0; i < proposalNames.length; i++) {
            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }

    function vote(uint proposal, uint amount) external {
        // require the voting power to be higher than amount
        require(
            votingPower(msg.sender) >= amount,
            "TokenizedBallot: trying to vote more than allowed"
        );
        // ...
        votingPowerSpent[msg.sender] += amount;
        // update the proposal vote count
        proposals[proposal].voteCount += amount;
    }

    function votingPower(address account) public view returns (uint256) {
        return tokenContract.getPastVotes(account, targetBlockNumber) - votingPowerSpent[account];
    }

    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

    function winnerName() external view
            returns (bytes32 winnerName_)
    {
        winnerName_ = proposals[winningProposal()].name;
    }
}