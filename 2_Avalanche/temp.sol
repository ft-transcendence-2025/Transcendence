// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleStorage
/// @author Uatilla Viana Almeida
/// @notice This contract manages tournament matches with creation and update functionality
/// @dev Only the contract owner can create or update matches
contract SimpleStorage is Ownable {
    struct Match {
        uint256 tournamentId;
        uint256 matchId;
        address player1;
        address player2;
        uint256 score1;
        uint256 score2;
        address winner;
        uint256 startTime;
        uint256 endTime;
    }

    // Mapping: tournamentId => matchId => Match
    mapping(uint256 => mapping(uint256 => Match)) public matches;
    // Mapping: tournamentId => number of matches
    mapping(uint256 => uint256) public matchCountPerTournament;

    event MatchCreated(
        uint256 indexed tournamentId,
        uint256 indexed matchId,
        address indexed player1,
        address player2,
        uint256 score1,
        uint256 score2,
        address winner,
        uint256 startTime,
        uint256 endTime
    );

    event MatchUpdated(
        uint256 indexed tournamentId,
        uint256 indexed matchId,
        uint256 score1,
        uint256 score2,
        address winner
    );

    constructor() Ownable(msg.sender) {}

    function newMatch(
        uint256 tournamentId,
        address player1,
        address player2,
        uint256 score1,
        uint256 score2,
        address winner,
        uint256 startTime,
        uint256 endTime
    ) external onlyOwner {
        require(player1 != address(0) && player2 != address(0), "Invalid player address");
        require(player1 != player2, "Players must be different");
        require(winner == player1 || winner == player2 || winner == address(0), "Invalid winner");

        uint256 matchId = matchCountPerTournament[tournamentId] + 1;
        matches[tournamentId][matchId] = Match(
            tournamentId,
            matchId,
            player1,
            player2,
            score1,
            score2,
            winner,
            startTime,
            endTime
        );
        matchCountPerTournament[tournamentId] = matchId;

        emit MatchCreated(tournamentId, matchId, player1, player2, score1, score2, winner, startTime, endTime);
    }

    function updateMatch(
        uint256 tournamentId,
        uint256 matchId,
        uint256 score1,
        uint256 score2,
        address winner
    ) external onlyOwner {
        Match storage m = matches[tournamentId][matchId];
        require(m.tournamentId != 0, "Match does not exist");
        require(winner == m.player1 || winner == m.player2 || winner == address(0), "Invalid winner");

        m.score1 = score1;
        m.score2 = score2;
        m.winner = winner;

        emit MatchUpdated(tournamentId, matchId, score1, score2, winner);
    }

    function getMatch(uint256 tournamentId, uint256 matchId) external view returns (Match memory) {
        Match memory m = matches[tournamentId][matchId];
        require(m.tournamentId != 0, "Match does not exist");
        return m;
    }

    function getMatchCount(uint256 tournamentId) external view returns (uint256) {
        return matchCountPerTournament[tournamentId];
    }
}